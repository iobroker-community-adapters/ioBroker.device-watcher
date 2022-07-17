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

		this.on('ready', this.onReady.bind(this));
		//this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));

		// arrays
		this.offlineDevices 		= [],
		this.linkQualityDevices 	= [];
		this.batteryPowered 		= [];
		this.batteryLowPowered 		= [];
		this.listAllDevices 		= [];
		this.blacklistArr			= [];
		this.arrDev					= [];
		this.adapterSelected		= [];

		// counts
		this.offlineDevicesCount		= 0;
		this.deviceCounter				= 0;
		this.linkQualityCount			= 0;
		this.batteryPoweredCount 		= 0;
		this.lowBatteryPoweredCount		= 0;

		this.deviceReachable	= '';

		// arrays of supported adapters
		this.arrApart = {
			//**** This Datapoints are only for the dev ****//
			test: 		{'Selektor':'0_userdata.*.UNREACH', 'adapter':'ping', 'rssiState':'.RSSI_DEVICE', 'battery':'.OPERATING_VOLTAGE', 'reach':'.UNREACH'},
			test2: 		{'Selektor':'0_userdata.*.alive', 'adapter':'sonoff',  'rssiState': '.Wifi_RSSI', 'battery':'none', 'reach':'.alive', 'isLowBat':'none'},
			test3: 		{'Selektor':'0_userdata.*.link_quality', 'adapter':'test3', 'battery':'.battery', 'reach':'none', 'isLowBat':'none'},
			//**** End of Dev Datapoints ****//
			ble: 			{
				'Selektor':'ble.*.rssi',
				'adapter':'ble',
				'battery':'.battery',
				'reach':'none',
				'isLowBat':'none'
			},
			zigbee: 		{
				'Selektor':'zigbee.*.link_quality',
				'adapter':'zigbee',
				'battery':'.battery',
				'reach':'none',
				'isLowBat':'none'
			},
			sonoff: 		{
				'Selektor':'sonoff.*.Uptime',
				'adapter':'sonoff',
				'rssiState': '.Wifi_RSSI',
				'battery':'.battery',
				'reach':'.alive',
				'isLowBat':'none'
			},
			shelly: 		{
				'Selektor':'shelly.*.rssi',
				'adapter':'shelly',
				'battery':'.sensor.battery',
				'reach':'.online',
				'isLowBat':'none'
			},
			homematic: 		{
				'Selektor':'hm-rpc.*.UNREACH',
				'adapter':'homematic',
				'rssiState':'.RSSI_DEVICE',
				'battery':'.OPERATING_VOLTAGE',
				'reach':'.UNREACH',
				'isLowBat':'.LOW_BAT',
				'isLowBat2':'.LOWBAT'
			},
			deconz: 		{
				'Selektor':'deconz.*.reachable',
				'adapter':'deconz',
				'battery':'.battery',
				'reach':'.reachable',
				'isLowBat':'none'
			},
			zwave: 			{
				'Selektor':'zwave2.*.ready',
				'adapter':'zwave',
				'battery':'.Battery.level',
				'reach':'.ready',
				'isLowBat':'.Battery.isLow'
			},
			dect: 			{
				'Selektor':'fritzdect.*.present',
				'adapter':'fritzDect',
				'battery':'.battery',
				'reach':'.present',
				'isLowBat':'.batterylow'
			},
			hue: 			{
				'Selektor':'hue.*.reachable',
				'adapter':'hue',
				'battery':'.battery',
				'reach':'.reachable',
				'isLowBat':'none'
			},
			hueExt: 		{
				'Selektor':'hue-extended.*.reachable',
				'adapter':'hue extended',
				'battery':'.config.battery',
				'reach':'.reachable',
				'isLowBat':'none'
			},
			ping: 			{
				'Selektor':'ping.*.alive',
				'adapter':'ping',
				'battery':'none',
				'reach':'.alive',
				'isLowBat':'none'
			},
			switchbotBle: 	{
				'Selektor':'switchbot-ble.*.rssi',
				'adapter':'switchbot ble',
				'battery':'.battery',
				'reach':'none',
				'isLowBat':'none',
				'id':'.id'
			},
			sonos: 			{
				'Selektor':'sonos.*.alive',
				'adapter':'sonos',
				'battery':'none',
				'reach':'.alive',
				'isLowBat':'none'
			},
			mihome: 		{
				'Selektor':'mihome.*.percent',
				'adapter':'miHome',
				'battery':'.percent',
				'reach':'none',
				'isLowBat':'none'
			},
			mihomeGW:		{
				'Selektor':'mihome.*.connected',
				'adapter':'miHome',
				'battery':'none',
				'reach':'.connected',
				'isLowBat':'none'
			}
		};
	}

	async onReady() {
		this.log.debug(`Adapter ${adapterName} was started`);

		try {
			await this.main();
			await this.sendNotifications();
			await this.writeDatapoints();
			this.log.debug('all done, exiting');
			this.terminate ? this.terminate('Everything done. Going to terminate till next schedule', 11) : process.exit(0);
		} catch (e) {
			this.log.error(`Error while running Device-Watcher. Error Message: ${e}`);
			this.terminate ? this.terminate(15) : process.exit(15);
		}
	}

	//Helpfunctions
	async capitalize(sentence)
	{
		return sentence && sentence[0].toUpperCase() + sentence.slice(1);
	}

	async getInitValue(obj) {
		const foreignState = await this.getForeignStateAsync(obj);
		if (foreignState) return foreignState.val;
	}

	async getOwnInitValue(obj) {
		const stateVal = await this.getStateAsync(obj);
		if (stateVal) return stateVal.val;
	}

	async createDPsForEachAdapter(adptName) {
		await this.setObjectNotExistsAsync(`${adptName}.offlineCount`, {
			'type': 'state',
			'common': {
				'name': 'Quantity devices offline',
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
				'def': 0
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.offlineList`, {
			'type': 'state',
			'common': {
				'name': 'List devices offline',
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
				'def': [{Device: '--keine--', Adapter: '', Last_contact: ''}]
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.listAll`, {
			'type': 'state',
			'common': {
				'name': 'List all devices',
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
				'def': [{Device: '--keine--', Adapter: '', Battery: '', Last_contact: '', Link_quality: ''}]
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.linkQualityList`, {
			'type': 'state',
			'common': {
				'name': 'List devices with qualitiy strength',
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
				'def': [{Device: '--keine--', Adapter: '', Link_quality: ''}]
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.countAll`, {
			'type': 'state',
			'common': {
				'name': 'Quantity devices all',
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
				'def': 0
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.batteryList`, {
			'type': 'state',
			'common': {
				'name': 'List devices with battery state',
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
				'def': [{Device: '--keine--', Adapter: '', Battery: ''}]
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.lowBatteryList`, {
			'type': 'state',
			'common': {
				'name': 'List devices with low battery state',
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
				'def': [{Device: '--keine--', Adapter: '', Battery: ''}]
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.lowBatteryCount`, {
			'type': 'state',
			'common': {
				'name': 'Quantity devices with low battery',
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
				'def': 0
			},
			'native': {}
		});
		await this.setObjectNotExistsAsync(`${adptName}.batteryCount`, {
			'type': 'state',
			'common': {
				'name': 'Quantity devices with battery',
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
				'def': 0
			},
			'native': {}
		});
	}

	async mainForAdapter(adptName) {
		for (let i = 0; i < this.arrDev.length; i++) {
			switch (this.arrDev[i].adapter) {
				case adptName:
					await this.setStateAsync(`${adptName}.offlineCount`, {val: 2, ack: true});
					break;
			}
		}
	}

	async main() {
		this.log.debug(`Function started: ${this.main.name}`);

		const supAdapter = {
			zigbee: 		this.config.zigbeeDevices,
			ble: 			this.config.bleDevices,
			sonoff: 		this.config.sonoffDevices,
			shelly: 		this.config.shellyDevices,
			homematic: 		this.config.homematicDevices,
			deconz:			this.config.deconzDevices,
			zwave: 			this.config.zwaveDevices,
			dect: 			this.config.dectDevices,
			hue: 			this.config.hueDevices,
			hueExt: 		this.config.hueExtDevices,
			nukiExt: 		this.config.nukiExtDevices,
			ping: 			this.config.pingDevices,
			switchbotBle: 	this.config.switchbotBleDevices,
			sonos: 			this.config.sonosDevices,
			mihome:			this.config.mihomeDevices,
			mihomeGW:		this.config.mihomeDevices,
			test: 			false, // Only for Developer
			test2: 			false, // Only for Developer
			test3:			false // Only for Developer
		};

		for(const [id] of Object.entries(this.arrApart)) {
			const idAdapter = supAdapter[id];
			if (idAdapter) {
				this.arrDev.push(this.arrApart[id]);
				this.adapterSelected.push(await this.capitalize(id));
				/*try {
					await this.createDPsForEachAdapter(id);
					this.log.debug(`Created datapoints for ${await this.capitalize(id)}`);
					await this.mainForAdapter(id);
				} catch (e) {
					this.log.warn(`Error at creating datapoints for each adapter: ${e}`);
				}*/
			}
		}

		//Check if one Adapter is selected.
		if (this.adapterSelected.length >= 1) {
			this.log.info(`Number of selected adapters: ${this.adapterSelected.length}. Loading data from: ${(this.adapterSelected).join(', ')} ...`);
		} else {
			this.log.warn(`No adapter selected. Please check the instance configuration!`);
		}

		this.log.debug(JSON.stringify(this.arrDev));

		/*=============================================
		=            Start of main loop    		   	  =
		=============================================*/
		for (let i = 0; i < this.arrDev.length; i++) {
			const devices 			= await this.getForeignStatesAsync(this.arrDev[i].Selektor);
			const deviceAdapterName = await this.capitalize(this.arrDev[i].adapter);
			const myBlacklist 		= this.config.tableBlacklist;

			/*----------  Loop for blacklist ----------*/
			for(const i in myBlacklist){
				this.blacklistArr.push(myBlacklist[i].device);
				this.log.debug(`Found items on the blacklist: ${this.blacklistArr}`);
			}

			/*----------  Start of second main loop  ----------*/
			for(const [id] of Object.entries(devices)) {
				if (!this.blacklistArr.includes(id)) {

					const currDeviceString    	= id.slice(0, (id.lastIndexOf('.') + 1) - 1);
					const shortCurrDeviceString = currDeviceString.slice(0, (currDeviceString.lastIndexOf('.') + 1) - 1);

					//Get device name
					const deviceObject = await this.getForeignObjectAsync(currDeviceString);
					const shortDeviceObject = await this.getForeignObjectAsync(shortCurrDeviceString);
					let deviceName;

					if (deviceObject && typeof deviceObject === 'object') {
						deviceName = deviceObject.common.name;
					}

					if  (shortDeviceObject && typeof shortDeviceObject === 'object') {
						if (this.arrDev[i].adapter === 'hue extended') {
							deviceName = shortDeviceObject.common.name;
						}
					}

					//Get ID for Switchbot Devices
					if (this.arrDev[i].adapter === 'switchbot ble') {
						const switchbotID = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].id);
						if (switchbotID) {
							deviceName = switchbotID.val;
						}
					}

					// 1. Get link quality
					let deviceQualityState;
					let linkQuality;

					switch (this.arrDev[i].adapter) {
						case 'homematic':
						case 'sonoff':
							deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiState);
							break;
						default:
							deviceQualityState = await this.getForeignStateAsync(id);
					}

					if ((deviceQualityState) && (typeof deviceQualityState.val === 'number')){
						if (this.config.trueState) {
							linkQuality = deviceQualityState.val;
						} else {
							if (deviceQualityState.val < 0) {
								linkQuality = Math.min(Math.max(2 * (deviceQualityState.val + 100), 0), 100) + '%';
							} else if ((deviceQualityState.val) >= 0) {
								linkQuality = parseFloat((100/255 * deviceQualityState.val).toFixed(0)) + '%';
							}
						}
						this.linkQualityDevices.push(
							{
								Device: deviceName,
								Adapter: deviceAdapterName,
								Link_quality: linkQuality
							}
						);
					} else {
					// no linkQuality available for powered devices
						linkQuality = ' - ';
					}

					// 1b. Count how many devices with link Quality
					this.linkQualityCount = this.linkQualityDevices.length;

					// 2. When was the last contact to the device?
					let lastContactString;
					const deviceMainSelector = await this.getForeignStateAsync(id);
					let deviceState;
					if (deviceMainSelector) {
						try {
							const time = new Date();
							const lastContact = Math.round((time.getTime() - deviceMainSelector.ts) / 1000 / 60);
							const deviceUnreachState = await this.getInitValue(currDeviceString + this.arrDev[i].reach);

							// 2b. wenn seit X Minuten kein Kontakt mehr besteht, nimm Gerät in Liste auf
							//Rechne auf Tage um, wenn mehr als 48 Stunden seit letztem Kontakt vergangen sind
							//lastContactString = Math.round(lastContact) + ' Minuten';
							lastContactString = this.formatDate(new Date((deviceMainSelector.ts)), 'hh:mm') + ' Uhr';
							if (Math.round(lastContact) > 100) {
								lastContactString = Math.round(lastContact/60) + ' Stunden';
							}
							if (Math.round(lastContact/60) > 48) {
								lastContactString = Math.round(lastContact/60/24) + ' Tagen';
							}

							if (deviceUnreachState) {
								deviceState = 'Online';
							} else {
								deviceState = 'Offline';
							}
							/*
							switch (this.arrDev[i].adapter) {
								case 'ping':
									if (this.config.pingMaxMinutes === -1) {
										if (!deviceUnreachState) {
											this.offlineDevices.push(
												{
													Device: deviceName,
													Adapter: deviceAdapterName,
													Last_contact: lastContactString
												}
											);
										}
									} else {
										if (lastContact > this.config.pingMaxMinutes) {
											this.offlineDevices.push(
												{
													Device: deviceName,
													Adapter: deviceAdapterName,
													Last_contact: lastContactString
												}
											);
										}
									}
									break;
							}
*/
							if (this.arrDev[i].reach === 'none') {
								if (lastContact > this.config.maxMinutes) {
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
							} else {
								if ((deviceUnreachState) && (this.arrDev[i].adapter === 'homematic')) {
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								} else if ((!deviceUnreachState) && (this.arrDev[i].adapter !== 'homematic')) {
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
							}
						} catch (e) {
							this.log.error(`(03) Error while getting timestate ${e}`);
						}
					}

					// 2c. Count how many devcies are offline
					this.offlineDevicesCount = this.offlineDevices.length;

					// 3. Get battery states
					const deviceBatteryState		= await this.getInitValue(currDeviceString + this.arrDev[i].battery);
					const shortDeviceBatteryState	= await this.getInitValue(shortCurrDeviceString + this.arrDev[i].battery);
					let batteryHealth;

					if ((!deviceBatteryState) && (!shortDeviceBatteryState)) {
						batteryHealth = ' - ';
					} else {

						switch (this.arrDev[i].adapter) {
							case 'homematic':
								if (deviceBatteryState === 0) {
									batteryHealth = ' - ';
								} else {
									batteryHealth = deviceBatteryState + 'V';
								}

								this.batteryPowered.push(
									{
										Device: deviceName,
										Adapter: deviceAdapterName,
										Battery: batteryHealth
									}
								);
								break;
							case 'hue extended':
								if (shortDeviceBatteryState) {
									batteryHealth = shortDeviceBatteryState + '%';
									this.batteryPowered.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Battery: batteryHealth
										}
									);
								}
								break;
							default:
								batteryHealth = (deviceBatteryState) + '%';
								this.batteryPowered.push(
									{
										Device: deviceName,
										Adapter: deviceAdapterName,
										Battery: batteryHealth
									}
								);
						}
					}

					// 3b. Count how many devices are with battery
					this.batteryPoweredCount = this.batteryPowered.length;

					// 3c. Count how many devices are with low battery
					const batteryWarningMin 		= this.config.minWarnBatterie;
					const deviceLowBatState			= await this.getInitValue(currDeviceString + this.arrDev[i].isLowBat);
					const deviceLowBatStateHM		= await this.getInitValue(currDeviceString + this.arrDev[i].isLowBat2);


					if (this.arrDev[i].isLowBat === 'none') {
						if (deviceBatteryState && (deviceBatteryState < batteryWarningMin)) {
							this.batteryLowPowered.push(
								{
									Device: deviceName,
									Adapter: deviceAdapterName,
									Battery: batteryHealth
								}
							);
						}
					} else {
						if (deviceLowBatState || deviceLowBatStateHM) {
							this.batteryLowPowered.push(
								{
									Device: deviceName,
									Adapter: deviceAdapterName,
									Battery: batteryHealth
								}
							);
						}
					}

					// 3d. Count how many devices are with low battery
					this.lowBatteryPoweredCount = this.batteryLowPowered.length;

					// 4. Add all devices in the list
					if (this.config.listOnlyBattery) {
						if (deviceBatteryState !== null || shortDeviceBatteryState !== null) {
							this.listAllDevices.push(
								{
									Device: deviceName,
									Adapter: deviceAdapterName,
									Battery: batteryHealth,
									Link_quality: linkQuality,
									Last_contact: lastContactString,
									Status: deviceState
								}
							);
						}
					} else if (!this.config.listOnlyBattery) {
						this.listAllDevices.push(
							{
								Device: deviceName,
								Adapter: deviceAdapterName,
								Battery: batteryHealth,
								Link_quality: linkQuality,
								Last_contact: lastContactString,
								Status: deviceState
							}
						);
					}


					// 4a. Count how many devices are exists
					this.deviceCounter = this.listAllDevices.length;
				}
			} //<--End of second loop
		} //<---End of main loop
		this.log.debug(`Function finished: ${this.main.name}`);
	}

	async sendNotifications() {
		/*=============================================
		=         	  	 Notifications 		          =
		=============================================*/
		this.log.debug(`Start the function: ${this.sendNotifications.name}`);

		const pushover = {
			instance: this.config.instancePushover,
			title: this.config.titlePushover,
			device: this.config.devicePushover

		};
		const telegram = {
			instance: this.config.instanceTelegram,
			user: this.config.deviceTelegram,
			chatId: this.config.chatIdTelegram
		};
		const email = {
			instance: this.config.instanceEmail,
			subject: this.config.subjectEmail,
			sendTo: this.config.sendToEmail

		};
		const jarvis = {
			instance: this.config.instanceJarvis,
			title: this.config.titleJarvis

		};
		const lovelace = {
			instance: this.config.instanceLovelace,
			title: this.config.titleLovelace

		};

		const choosedDays = {
			monday: this.config.checkMonday,
			tuesday: this.config.checkTuesday,
			wednesday: this.config.checkWednesday,
			thursday: this.config.checkThursday,
			friday: this.config.checkFriday,
			saturday: this.config.checkSaturday,
			sunday: this.config.checkSunday,
		};

		const sendPushover = async (text) => {
			await this.sendToAsync(pushover.instance, 'send', {
				message: text,
				title: pushover.title,
				device: pushover.device
			});
		};

		const sendTelegram = async (text) => {
			await this.sendToAsync(telegram.instance, 'send', {
				text: text,
				user: telegram.user,
				chatId: telegram.chatId
			});
		};

		const sendEmail = async (text) => {
			await this.sendToAsync(email.instance, 'send', {
				sendTo: email.sendTo,
				text: text,
				subject: email.subject
			});
		};

		const sendJarvis = async (text) => {
			await this.setForeignStateAsync(`${jarvis.instance}.addNotification`, text);
		};

		const sendLovelace = async (text) => {
			await this.setForeignStateAsync(`${lovelace.instance}.notifications.add`, text);
		};

		/*----------  oflline notification ----------*/
		if(this.config.checkSendOfflineMsg) {
			try {
				let msg = '';
				const offlineDevicesCountOld = await this.getOwnInitValue('offlineCount');

				if ((this.offlineDevicesCount != offlineDevicesCountOld) && (this.offlineDevicesCount != 0)) {
					if (this.offlineDevicesCount == 1) {
						msg = 'Folgendes Gerät ist seit einiger Zeit nicht erreichbar: \n';
					} else if (this.offlineDevicesCount >= 2) {
						msg = 'Folgende ' + this.offlineDevicesCount + ' Geräte sind seit einiger Zeit nicht erreichbar: \n';
					}
					for (const id of this.offlineDevices) {
						msg = msg + '\n' + id['Device'] + ' ' + /*id['room'] +*/ ' (' + id['Last_contact'] + ')';
					}
					this.log.info(msg);
					await this.setStateAsync('lastNotification', msg, true);
					if (pushover.instance) {
						try {
							await sendPushover(msg);
						} catch (e) {
							this.log.warn (`Getting error at sending notification ${e}`);
						}
					}
					if (telegram.instance) {
						try {
							await sendTelegram(msg);
						} catch (e) {
							this.log.warn (`Getting error at sending notification ${e}`);
						}
					}
					if (email.instance) {
						try {
							await sendEmail(msg);
						} catch (e) {
							this.log.warn (`Getting error at sending notification ${e}`);
						}
					}
					if (jarvis.instance) {
						try {
							await sendJarvis('{"title":"'+ jarvis.title +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message":" ' + this.offlineDevicesCount + ' Geräte sind nicht erreichbar","display": "drawer"}');
						} catch (e) {
							this.log.warn (`Getting error at sending notification ${e}`);
						}
					}
					if (lovelace.instance) {
						try {
							await sendLovelace('{"message":" ' + this.offlineDevicesCount + ' Geräte sind nicht erreichbar", "title":"'+ lovelace.title +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}');
						} catch (e) {
							this.log.warn (`Getting error at sending notification ${e}`);
						}
					}
				}
			} catch (e) {
				this.log.debug(`Getting error at sending offline notification ${e}`);
			}
		}

		/*----------  Low battery Notification ----------*/
		const now = new Date();
		const today = now.getDay();
		const checkDays = [];
		let checkToday;

		if (choosedDays.monday) checkDays.push(1);
		if (choosedDays.tuesday) checkDays.push(2);
		if (choosedDays.wednesday) checkDays.push(3);
		if (choosedDays.thursday) checkDays.push(4);
		if (choosedDays.friday) checkDays.push(5);
		if (choosedDays.saturday) checkDays.push(6);
		if (choosedDays.sunday) checkDays.push(0);

		if (this.config.checkSendBatteryMsg) this.log.debug(JSON.stringify(checkDays));

		checkDays.forEach(object => {
			if((object >= 0) && today == object){
				checkToday = true;
			}
		});

		if (this.config.checkSendBatteryMsg) {
			try {
				const lastBatteryNotifyIndicator = await this.getOwnInitValue('info.lastBatteryNotification');
				const batteryWarningMin = this.config.minWarnBatterie;

				if (now.getHours() < 11) {await this.setStateAsync('info.lastBatteryNotification', false, true);} //Nur einmal abfragen
				if ((now.getHours() > 11) && (!lastBatteryNotifyIndicator) && (checkToday != undefined)){
					let batteryMinCount = 0;
					let infotext = '';

					for (const id of this.batteryPowered) {
						if (id['Battery']) {
							const batteryValue = parseFloat(id['Battery'].replace('%', ''));
							if ((batteryValue < batteryWarningMin) && (id['Adapter'] != 'Homematic')) {
								infotext = infotext + '\n' + id['Device'] + ' ' + /*id['room'] +*/ ' (' + id['Battery'] + ')'.split(', ');
								++batteryMinCount;
							}
						}
					}
					if (batteryMinCount > 0) {
						this.log.info(`Batteriezustände: ${infotext}`);
						await this.setStateAsync('lastNotification', infotext, true);

						if (pushover.instance) {
							try {
								await sendPushover(`Batteriezustände: ${infotext}`);
							} catch (e) {
								this.log.warn (`Getting error at sending notification ${e}`);
							}
						}
						if (telegram.instance) {
							try {
								await sendTelegram(`Batteriezustände: ${infotext}`);
							} catch (e) {
								this.log.warn (`Getting error at sending notification ${e}`);
							}
						}
						if (email.instance) {
							try {
								await sendEmail(`Batteriezustände: ${infotext}`);
							} catch (e) {
								this.log.warn (`Getting error at sending notification ${e}`);
							}
						}
						if (jarvis.instance) {
							try {
								await sendJarvis('{"title":"'+ jarvis.title +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message":" ' + batteryMinCount + ' Geräte mit schwacher Batterie","display": "drawer"}');
							} catch (e) {
								this.log.warn (`Getting error at sending notification ${e}`);
							}
						}
						if (lovelace.instance) {
							try {
								await sendLovelace('{"message":" ' + batteryMinCount + ' Geräte mit schwacher Batterie", "title":"'+ lovelace.title +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}');
							} catch (e) {
								this.log.warn (`Getting error at sending notification ${e}`);
							}
						}

						await this.setStateAsync('info.lastBatteryNotification', true, true);
					}
				}
			} catch (e) {
				this.log.debug(`Getting error at sending battery notification ${e}`);
			}
		}
		/*=====  End of Section notifications ======*/
		this.log.debug(`Function finished: ${this.sendNotifications.name}`);
	}

	async writeDatapoints() {
		/*=============================================
		=            	Write Datapoints 		      =
		=============================================*/
		this.log.debug(`Start the function: ${this.writeDatapoints.name}`);

		try {
			await this.setStateAsync('offlineCount', {val: this.offlineDevicesCount, ack: true});
			await this.setStateAsync('countAll', {val: this.deviceCounter, ack: true});
			await this.setStateAsync('batteryCount', {val: this.batteryPoweredCount, ack: true});
			await this.setStateAsync('lowBatteryCount', {val: this.lowBatteryPoweredCount, ack: true});

			if (this.deviceCounter == 0) {
				this.listAllDevices       = [{Device: '--keine--', Adapter: '', Battery: '', Last_contact: '', Link_quality: ''}]; //JSON-Info Gesamtliste mit Info je Gerät

				await this.setStateAsync('listAll', {val: JSON.stringify(this.listAllDevices), ack: true});
			} else {
				await this.setStateAsync('listAll', {val: JSON.stringify(this.listAllDevices), ack: true});
			}

			if (this.linkQualityCount == 0) {
				this.linkQualityDevices	= [{Device: '--keine--', Adapter: '', Link_quality: ''}]; //JSON-Info alle mit LinkQuality

				await this.setStateAsync('linkQualityList', {val: JSON.stringify(this.linkQualityDevices), ack: true});
			} else {
				await this.setStateAsync('linkQualityList', {val: JSON.stringify(this.linkQualityDevices), ack: true});
			}


			if (this.offlineDevicesCount == 0) {
				this.offlineDevices	= [{Device: '--keine--', Adapter: '', Last_contact: ''}]; //JSON-Info alle offline-Geräte = 0

				await this.setStateAsync('offlineList', {val: JSON.stringify(this.offlineDevices), ack: true});
			} else {
				await this.setStateAsync('offlineList', {val: JSON.stringify(this.offlineDevices), ack: true});
			}

			if (this.batteryPoweredCount == 0) {
				this.batteryPowered	= [{Device: '--keine--', Adapter: '', Battery: ''}]; //JSON-Info alle batteriebetriebenen Geräte

				await this.setStateAsync('batteryList', {val: JSON.stringify(this.batteryPowered), ack: true});
			} else {
				await this.setStateAsync('batteryList', {val: JSON.stringify(this.batteryPowered), ack: true});
			}

			if (this.lowBatteryPoweredCount == 0) {
				this.batteryLowPowered	= [{Device: '--keine--', Adapter: '', Battery: ''}]; //JSON-Info alle batteriebetriebenen Geräte

				await this.setStateAsync('lowBatteryList', {val: JSON.stringify(this.batteryLowPowered), ack: true});
			} else {
				await this.setStateAsync('lowBatteryList', {val: JSON.stringify(this.batteryLowPowered), ack: true});
			}

			//Zeitstempel wann die Datenpunkte zuletzt gecheckt wurden
			const lastCheck = this.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + this.formatDate(new Date(), 'hh:mm:ss');
			await this.setStateAsync('lastCheck', lastCheck, true);
		}
		catch (e) {
			this.log.error(`(05) Error while writing the states ${e}`);
		}
		/*=====  End of writing Datapoints ======*/
		this.log.debug(`Function finished: ${this.writeDatapoints.name}`);
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
