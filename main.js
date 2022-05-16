/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */

'use strict';

const utils = require('@iobroker/adapter-core');
const adapterName = require('./package.json').name.split('.').pop();

class DeviceWatcher extends utils.Adapter {

	constructor(options) {
		super({
			...options,
			name: adapterName,
			useFormatDate: true,
		});

		this.refreshEverythingTimeout = null;

		this.on('ready', this.onReady.bind(this));
		//this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	async onReady() {
		this.log.debug('Adapter Device-Watcher was started');

		try {
			await this.main();
			this.log.debug('all done, exiting');
			this.terminate ? this.terminate('Everything done. Going to terminate till next schedule', 11) : process.exit(0);
		} catch (e) {
			this.log.error('Error while running Device-Watcher. Error Message:' + e);
			this.terminate ? this.terminate(15) : process.exit(15);
		}



	}

	async main() {
		this.log.debug('Function started: ' + this.main.name);

		const arrOfflineDevices         = []; //JSON-Info alle offline-Geräte
		const jsonLinkQualityDevices    = []; //JSON-Info alle mit LinkQuality
		const arrBatteryPowered         = []; //JSON-Info alle batteriebetriebenen Geräte
		const arrListAllDevices         = []; //JSON-Info Gesamtliste mit Info je Gerät


		if (!this.config.zigbeeDevices && !this.config.bleDevices && !this.config.test) {
			this.log.warn('No devices selected. Pleased check the instance configuration');
			return;
		}

		const myArrDev                  = []; //JSON mit Gesamtliste aller Geräte

		if (this.config.test) {
			myArrDev.push({'Selektor':'0_userdata.*.link_quality','theName':'common', 'adapter':'Test'});
			this.log.warn('Teststates wurden ausgewählt. Lade Daten');
		}

		if (this.config.bleDevices) {
			myArrDev.push({'Selektor':'ble.*.rssi','theName':'common', 'adapter':'Ble'});
			this.log.info('Ble Devices wurden ausgewählt (Xiaomi Plant Sensor). Lade Daten');
		}
		if (this.config.zigbeeDevices) {
			myArrDev.push({'Selektor':'zigbee.*.link_quality','theName':'common', 'adapter':'Zigbee'});
			this.log.info('Zigbee Devices wurden ausgewählt. Lade Daten');
		}

		this.log.debug(JSON.stringify(myArrDev));

		for (let i = 0; i < myArrDev.length; i++) {
			const devices = await this.getForeignStatesAsync(myArrDev[i].Selektor);
			const deviceAdapterName = myArrDev[i].adapter;

			this.log.debug(JSON.stringify(devices));

			const myBlacklist 				= this.config.tableBlacklist;
			const myBlacklistArr			= [];

			for(const i in myBlacklist){
				myBlacklistArr.push(myBlacklist[i].device);
				this.log.debug('Found items on the blacklist: ' + myBlacklistArr);
			}

			for(const [id] of Object.entries(devices)) {
				if (!myBlacklistArr.includes(id)) {

					const currDeviceString    = id.slice(0, (id.lastIndexOf('.') + 1) - 1);

					//Device Namen
					const deviceObject = await this.getForeignObjectAsync(currDeviceString);
					let deviceName;

					if (deviceObject && typeof deviceObject === 'object') {
						deviceName = deviceObject.common.name;
					}
					//Raum Namen
					let currRoom;

					//Link Qualität
					const deviceQualityState = await this.getForeignStateAsync(id);
					let linkQuality;

					if (deviceQualityState){
						if (this.config.trueState) {
							linkQuality = deviceQualityState.val;
						} else if ((deviceQualityState.val != null) && (typeof deviceQualityState.val === 'number')) {
							if (deviceQualityState.val < 0) {
								linkQuality = Math.min(Math.max(2 * (deviceQualityState.val + 100), 0), 100) + '%';
							} else if ((deviceQualityState.val) >= 0) {
								linkQuality = parseFloat((100/255 * deviceQualityState.val).toFixed(0)) + '%';
							}
						}
					}

					jsonLinkQualityDevices.push(
						{
							device: deviceName,
							adapter: deviceAdapterName,
							room: currRoom,
							link_quality: linkQuality
						}
					);

					// 2. Wann bestand letzter Kontakt zum Gerät
					if (deviceQualityState) {
						try {
							const time = new Date();
							const lastContact = Math.round((time.getTime() - deviceQualityState.ts) / 1000 / 60);
							// 2b. wenn seit X Minuten kein Kontakt mehr besteht, nimm Gerät in Liste auf
							//Rechne auf Tage um, wenn mehr als 48 Stunden seit letztem Kontakt vergangen sind
							let lastContactString = Math.round(lastContact) + ' Minuten';
							if (Math.round(lastContact) > 100) {
								lastContactString = Math.round(lastContact/60) + ' Stunden';
							}
							if (Math.round(lastContact/60) > 48) {
								lastContactString = Math.round(lastContact/60/24) + ' Tagen';
							}
							if (lastContact > this.config.maxMinutes) {
								arrOfflineDevices.push(
									{
										device: deviceName,
										adapter: deviceAdapterName,
										room: currRoom,
										lastContact: lastContactString
									}
								);
							}
						} catch (e) {
							this.log.error('(03) Error while getting timestate ' + e);
						}
					}

					// 3. Batteriestatus abfragen
					const currDeviceBatteryString = currDeviceString + '.battery';
					const deviceBatteryState = await this.getForeignStateAsync(currDeviceBatteryString);
					let batteryHealth;

					if (!deviceBatteryState) {
						batteryHealth = ' - ';
					} else if (deviceBatteryState) {
						batteryHealth = (deviceBatteryState).val + '%';
						arrBatteryPowered.push(
							{
								device: deviceName,
								adapter: deviceAdapterName,
								room: currRoom,
								battery: batteryHealth
							}
						);
					}

					// 4. Alle Geräte in die Liste eintragen
					arrListAllDevices.push(
						{
							device: deviceName,
							adapter: deviceAdapterName,
							room: currRoom,
							battery: batteryHealth,
							link_quality: linkQuality
						}
					);

					// 1b. Zähle, wie viele Geräte existieren
					//------------------------
					const deviceCounter = jsonLinkQualityDevices.length;

					// 2c. Wie viele Geräte sind offline?
					//------------------------
					const offlineDevicesCount = arrOfflineDevices.length;

					// 3c. Wie viele Geräte sind batteriebetrieben?
					//------------------------
					const batteryPoweredCount = arrBatteryPowered.length;

					// Wenn keine Devices gezählt sind
					//------------------------
					const arrOfflineDevicesZero       = [{Device: '--keine--', Room: '', Last_contact: ''}]; //JSON-Info alle offline-Geräte = 0
					const arrLinkQualityDevicesZero   = [{Device: '--keine--', Room: '', Link_quality: ''}]; //JSON-Info alle mit LinkQuality = 0
					const arrBatteryPoweredZero       = [{Device: '--keine--', Room: '', Battery: ''}]; //JSON-Info alle batteriebetriebenen Geräte
					const arrListAllDevicesZero       = [{Device: '--keine--', Room: '', Battery: '', Last_contact: '', Link_quality: ''}]; //JSON-Info Gesamtliste mit Info je Gerät

					// Datenpunkte beschreiben
					this.log.debug('write the datapoints ' + this.main.name);

					try {
						await this.setStateAsync('offlineCount', {val: offlineDevicesCount, ack: true});
						await this.setStateAsync('countAll', {val: deviceCounter, ack: true});
						await this.setStateAsync('batteryCount', {val: batteryPoweredCount, ack: true});

						if (deviceCounter == 0) {
							await this.setStateAsync('linkQualityList', {val: JSON.stringify(arrLinkQualityDevicesZero), ack: true});
							await this.setStateAsync('ListAll', {val: JSON.stringify(arrListAllDevicesZero), ack: true});
						} else {
							await this.setStateAsync('linkQualityList', {val: JSON.stringify(jsonLinkQualityDevices), ack: true});
							await this.setStateAsync('listAll', {val: JSON.stringify(arrListAllDevices), ack: true});
						}

						if (offlineDevicesCount == 0) {
							await this.setStateAsync('offlineList', {val: JSON.stringify(arrOfflineDevicesZero), ack: true});
						} else {
							await this.setStateAsync('offlineList', {val: JSON.stringify(arrOfflineDevices), ack: true});
						}

						if (batteryPoweredCount == 0) {
							await this.setStateAsync('batteryList', {val: JSON.stringify(arrBatteryPoweredZero), ack: true});
						} else {
							await this.setStateAsync('batteryList', {val: JSON.stringify(arrBatteryPowered), ack: true});
						}

						//Zeitstempel wann die Datenpunkte zuletzt gecheckt wurden
						const lastCheck = this.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + this.formatDate(new Date(), 'hh.mm.ss');
						await this.setStateAsync('lastCheck', lastCheck, true);

						this.log.debug('write the datapoints finished ' + this.main.name);
					}
					catch (e) {
						this.log.error('(05) Error while writing the states ' + e);
					}
					/*
				try {
					//Notifications
					const pushoverInstanz = this.config.instancePushover;
					const msg = 'TestNachricht';
					if (pushoverInstanz) {
						await this.sendToAsync(pushoverInstanz, msg);
					}
				}
				catch (e) {
					this.log.error('(06) Error send notification ' + e);
				}
*/

					this.log.debug('Function finished: ' + this.main.name);
				}
			}
		}
	}

	onUnload(callback) {
		try {
			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new DeviceWatcher(options);
} else {
	// otherwise start the instance directly
	new DeviceWatcher();
}
