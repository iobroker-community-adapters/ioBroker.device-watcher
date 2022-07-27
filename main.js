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
			alexa2: 			{
				'Selektor':'alexa2.*.online',
				'adapter':'alexa2',
				'battery':'none',
				'reach':'.online',
				'isLowBat':'none'
			},
			ble: 			{
				'Selektor':'ble.*.rssi',
				'adapter':'ble',
				'battery':'.battery',
				'reach':'none',
				'isLowBat':'none'
			},
			esphome: 			{
				'Selektor':'esphome.*._online',
				'adapter':'esphome',
				'battery':'none',
				'reach':'._online',
				'isLowBat':'none',
				'id':'.name'
			},
			zigbee: 		{
				'Selektor':'zigbee.*.link_quality',
				'adapter':'zigbee',
				'battery':'.battery',
				'reach':'.available',
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
				'adapter':'switchbotBle',
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
			},
			nukiExt:		{
				'Selektor':'nuki-extended.*.batteryCritical',
				'adapter':'nuki_extended',
				'battery':'none',
				'reach':'none',
				'isLowBat':'.batteryCritical'
			}
		};
	}

	async onReady() {
		this.log.debug(`Adapter ${adapterName} was started`);

		try {
			await this.main();
			if (this.config.checkSendOfflineMsg) await this.sendOfflineNotifications();
			if (this.config.checkSendBatteryMsg) await this.sendBatteryNotifications();
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
		//make the first letter uppercase
		return sentence && sentence[0].toUpperCase() + sentence.slice(1);
	}

	async getInitValue(obj) {
		//state can be null or undefinded
		const foreignState = await this.getForeignStateAsync(obj);
		if (foreignState) return foreignState.val;
	}

	async getOwnInitValue(obj) {
		//state can be null or undefinded for own states
		const stateVal = await this.getStateAsync(obj);
		if (stateVal) return stateVal.val;
	}

	//Notification services
	async sendPushover(text) {
		await this.sendToAsync(this.config.instancePushover, 'send', {
			message: text,
			title: this.config.titlePushover,
			device: this.config.devicePushover,
			priority: this.config.prioPushover
		});
	}

	async sendTelegram(text) {
		await this.sendToAsync(this.config.instanceTelegram, 'send', {
			text: text,
			user: this.config.deviceTelegram,
			chatId: this.config.chatIdTelegram
		});
	}

	async sendWhatsapp(text) {
		await this.sendToAsync(this.config.instanceWhatsapp, 'send', {
			text: text,
			phone: this.config.phoneWhatsapp
		});
	}

	async sendEmail(text) {
		await this.sendToAsync(this.config.instanceEmail, 'send', {
			sendTo: this.config.sendToEmail,
			text: text,
			subject: this.config.subjectEmail
		});
	}

	async sendJarvis(text) {
		await this.setForeignStateAsync(`${this.config.instanceJarvis}.addNotification`, text);

	}

	async sendLovelace(text) {
		await this.setForeignStateAsync(`${this.config.instanceLovelace}.notifications.add`, text);

	}

	//create datapoints for each adapter
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
				'def': JSON.stringify([{Device: '--keine--', Adapter: '', Last_contact: ''}])
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
				'def': JSON.stringify([{Device: '--keine--', Adapter: '', Battery: '', Last_contact: '', Link_quality: ''}])
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
				'def': JSON.stringify([{Device: '--keine--', Adapter: '', Link_quality: ''}])
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
				'def': JSON.stringify([{Device: '--keine--', Adapter: '', Battery: ''}])
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
				'def': JSON.stringify([{Device: '--keine--', Adapter: '', Battery: ''}])
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

	async createData(i) {
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

				//Get ID for Switchbot and ESPHome Devices
				switch (this.arrDev[i].adapter) {
					case 'switchbotBle':
					case 'esphome':
						deviceName = await this.getInitValue(currDeviceString + this.arrDev[i].id);
						break;
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
				let deviceState = 'Online';
				if (deviceMainSelector) {
					try {
						const time = new Date();
						const lastContact = Math.round((time.getTime() - deviceMainSelector.ts) / 1000 / 60);
						const lastStateChange = Math.round((time.getTime() - deviceMainSelector.lc) / 1000 / 60);
						const deviceUnreachState = await this.getInitValue(currDeviceString + this.arrDev[i].reach);


						const getLastContact = async () => {
							lastContactString = this.formatDate(new Date((deviceMainSelector.ts)), 'hh:mm') + ' Uhr';
							if (Math.round(lastContact) > 100) {
								lastContactString = Math.round(lastContact/60) + ' Stunden';
							}
							if (Math.round(lastContact/60) > 48) {
								lastContactString = Math.round(lastContact/60/24) + ' Tagen';
							}
							return lastContactString;
						};

						const getLastStateChange = async () => {
							lastContactString = this.formatDate(new Date((deviceMainSelector.lc)), 'hh:mm') + ' Uhr';
							if (Math.round(lastStateChange) > 100) {
								lastContactString = Math.round(lastStateChange/60) + ' Stunden';
							}
							if (Math.round(lastStateChange/60) > 48) {
								lastContactString = Math.round(lastStateChange/60/24) + ' Tagen';
							}
							return lastContactString;
						};

						// 2b. wenn seit X Minuten kein Kontakt mehr besteht, nimm Gerät in Liste auf
						//Rechne auf Tage um, wenn mehr als 48 Stunden seit letztem Kontakt vergangen sind
						//lastContactString = Math.round(lastContact) + ' Minuten';
						switch (this.arrDev[i].adapter) {
							case 'ping':
								//State changed
								if (!deviceUnreachState) {
									await getLastStateChange();
								} else {
									await getLastContact();
								}
								break;

							default:
								await getLastContact();
								break;
						}

						switch (this.arrDev[i].adapter) {
							case 'alexa2':
								if (this.config.alexa2MaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.alexa2MaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'ble':
								if (this.config.bleMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.bleMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'deconz':
								if (this.config.deconzMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.deconzMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'esphome':
								if (this.config.esphomeMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.esphomeMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'fritzDect':
								if (this.config.fritzdectMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.fritzdectMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'homematic':
								if (this.config.homematicMaxMinutes === -1) {
									if (deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.homematicMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'hue':
								if (this.config.hueMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.hueMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'hue extended':
								if (this.config.hueextMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.hueextMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'miHome':
								if (this.config.mihomeMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.mihomeMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'nuki_extended':
								if (this.config.nukiextendMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.nukiextendMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'ping':
								if (this.config.pingMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if ((lastStateChange > this.config.pingMaxMinutes) && (!deviceUnreachState)) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'shelly':
								if (this.config.shellyMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.shellyMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'sonoff':
								if (this.config.sonoffMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.sonoffMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'sonos':
								if (this.config.sonosMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.sonosMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'switchbotBle':
								if (this.config.switchbotMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.switchbotMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'zigbee':
								if (this.config.zigbeeMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.zigbeeMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
							case 'zwave':
								if (this.config.zwaveMaxMinutes === -1) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										this.offlineDevices.push(
											{
												Device: deviceName,
												Adapter: deviceAdapterName,
												Last_contact: lastContactString
											}
										);
									}
								} else if (lastContact > this.config.zwaveMaxMinutes) {
									deviceState = 'Offline'; //set online state to offline
									this.offlineDevices.push(
										{
											Device: deviceName,
											Adapter: deviceAdapterName,
											Last_contact: lastContactString
										}
									);
								}
								break;
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
	}

	async createDataForEachAdpt(adptName) {
		this.log.debug(`Function started: ${this.createDataForEachAdpt.name}`);
		await this.resetVars();

		for (let i = 0; i < this.arrDev.length; i++) {

			if (this.arrDev[i].adapter.includes(adptName)) {
				await this.createData(i);
			}

		}
		await this.writeDatapoints(adptName);

		this.log.debug(`Function finished: ${this.createDataForEachAdpt.name}`);
	}

	async createDataOfAll() {
		this.log.debug(`Function started: ${this.createDataOfAll.name}`);
		await this.resetVars();

		for (let i = 0; i < this.arrDev.length; i++) {

			await this.createData(i);

		}
		await this.writeDatapoints();

		this.log.debug(`Function finished: ${this.createDataOfAll.name}`);
	}

	async resetVars() {
		// arrays
		this.offlineDevices 		= [],
		this.linkQualityDevices 	= [];
		this.batteryPowered 		= [];
		this.batteryLowPowered 		= [];
		this.listAllDevices 		= [];

		// counts
		this.offlineDevicesCount		= 0;
		this.deviceCounter				= 0;
		this.linkQualityCount			= 0;
		this.batteryPoweredCount 		= 0;
		this.lowBatteryPoweredCount		= 0;

		this.deviceReachable	= '';
	}

	async main() {
		this.log.debug(`Function started: ${this.main.name}`);

		this.supAdapter = {
			alexa2:			this.config.alexa2Devices,
			esphome:		this.config.esphomeDevices,
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
		};

		for(const [id] of Object.entries(this.arrApart)) {
			if (this.supAdapter[id]) {
				this.arrDev.push(this.arrApart[id]);
				this.adapterSelected.push(await this.capitalize(id));
				this.log.debug(JSON.stringify(this.arrDev));

				//create and fill datapoints for each adapter if selected
				if (this.config.createOwnFolder) {
					try {
						await this.createDPsForEachAdapter(id);
						this.log.debug(`Created datapoints for ${await this.capitalize(id)}`);
						await this.createDataForEachAdpt(id);
						this.log.debug(`Created and filled data for each adapter`);
					} catch (e) {
						this.log.warn(`Error at creating/filling datapoints for each adapter: ${e}`);
						return;
					}
				}
			}
		}

		//Check if an Adapter is selected.
		if (this.adapterSelected.length >= 1) {
			this.log.info(`Number of selected adapters: ${this.adapterSelected.length}. Loading data from: ${(this.adapterSelected).join(', ')} ...`);
		} else {
			this.log.warn(`No adapter selected. Please check the instance configuration!`);
			return;
		}

		/*=============================================
		=            Start of main loop    		   	  =
		=============================================*/
		try {
			await this.createDataOfAll();
			this.log.debug(`Created and filled data for all adapters`);
		} catch (e) {
			this.log.warn(`Error at creating/filling datapoints for all adapters: ${e}`);
			return;
		}

		this.log.debug(`Function finished: ${this.main.name}`);
	} //<--End of main function


	async sendOfflineNotifications() {
		/*=============================================
		=        	send offline notification		  =
		=============================================*/

		this.log.debug(`Start the function: ${this.sendOfflineNotifications.name}`);

		try {
			let msg = '';
			const offlineDevicesCountOld = await this.getOwnInitValue('offlineCount');

			if ((this.offlineDevicesCount != offlineDevicesCountOld)) {
				if (this.offlineDevicesCount == 1) {	// make singular if it is only one device
					msg = 'Folgendes Gerät ist seit einiger Zeit nicht erreichbar: \n';
				} else if (this.offlineDevicesCount >= 2) {		//make plural if it is more than one device
					msg = `Folgende ${this.offlineDevicesCount} Geräte sind seit einiger Zeit nicht erreichbar: \n`;
				}

				for (const id of this.offlineDevices) {
					msg = `${msg} \n ${id['Device']} (${id['Last_contact']})`;
				}
				this.log.info(msg);
				await this.setStateAsync('lastNotification', msg, true);
				if (this.config.instancePushover) {
					try {
						await this.sendPushover(msg);
					} catch (e) {
						this.log.warn (`Getting error at sending pushover notification ${e}`);
					}
				}
				if (this.config.instanceTelegram) {
					try {
						await this.sendTelegram(msg);
					} catch (e) {
						this.log.warn (`Getting error at sending telegram notification ${e}`);
					}
				}
				if (this.config.instanceWhatsapp) {
					try {
						await this.sendWhatsapp(msg);
					} catch (e) {
						this.log.warn (`Getting error at sending whatsapp notification ${e}`);
					}
				}
				if (this.config.instanceEmail) {
					try {
						await this.sendEmail(msg);
					} catch (e) {
						this.log.warn (`Getting error at sending email notification ${e}`);
					}
				}
				if (this.config.instanceJarvis) {
					try {
						await this.sendJarvis('{"title":"'+ this.config.titleJarvis +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message":" ' + this.offlineDevicesCount + ' Geräte sind nicht erreichbar","display": "drawer"}');
					} catch (e) {
						this.log.warn (`Getting error at sending jarvis notification ${e}`);
					}
				}
				if (this.config.instanceLovelace) {
					try {
						await this.sendLovelace('{"message":" ' + this.offlineDevicesCount + ' Geräte sind nicht erreichbar", "title":"'+ this.config.titleLovelace +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}');
					} catch (e) {
						this.log.warn (`Getting error at sending lovelace notification ${e}`);
					}
				}
			}
		} catch (e) {
			this.log.debug(`Getting error at sending offline notification ${e}`);
		}
		this.log.debug(`Finished the function: ${this.sendOfflineNotifications.name}`);
	}//<--End of offline notification


	async sendBatteryNotifications() {
		/*=============================================
		=        send low battery notification		  =
		=============================================*/

		this.log.debug(`Start the function: ${this.sendBatteryNotifications.name}`);
		const now = new Date();
		const today = now.getDay();
		const checkDays = [];
		let checkToday;

		const choosedDays = {
			monday: this.config.checkMonday,
			tuesday: this.config.checkTuesday,
			wednesday: this.config.checkWednesday,
			thursday: this.config.checkThursday,
			friday: this.config.checkFriday,
			saturday: this.config.checkSaturday,
			sunday: this.config.checkSunday,
		};

		if (choosedDays.monday) checkDays.push(1);
		if (choosedDays.tuesday) checkDays.push(2);
		if (choosedDays.wednesday) checkDays.push(3);
		if (choosedDays.thursday) checkDays.push(4);
		if (choosedDays.friday) checkDays.push(5);
		if (choosedDays.saturday) checkDays.push(6);
		if (choosedDays.sunday) checkDays.push(0);

		//Check if the message should be send today
		checkDays.forEach(object => {
			if((object >= 0) && today == object){
				checkToday = true;
			}
		});

		//Check first if a day is selected
		if (checkDays.length >= 1) {
			this.log.debug(`Number of selected days: ${checkDays.length}. Send Message on: ${(checkDays).join(', ')} ...`);
		} else {
			this.log.warn(`No days selected. Please check the instance configuration!`);
			return;
		}

		try {

			//Check if the message for low battery was already sent today
			const lastBatteryNotifyIndicator = await this.getOwnInitValue('info.lastBatteryNotification');

			if (now.getHours() < 11) {await this.setStateAsync('info.lastBatteryNotification', false, true);} //set indicator for send message first to 'false' later after sending to 'true'
			if ((now.getHours() > 11) && (!lastBatteryNotifyIndicator) && (checkToday != undefined)){
				let infotext = '';

				for (const id of this.batteryLowPowered) {
					infotext = infotext + '\n' + id['Device'] + ' (' + id['Battery'] + ')'.split(', ');
				}

				if (this.lowBatteryPoweredCount > 0) {
					this.log.info(`Niedrige Batteriezustände: ${infotext}`);
					await this.setStateAsync('lastNotification', infotext, true);

					if (this.config.instancePushover) {
						try {
							await this.sendPushover(`Niedrige Batteriezustände: ${infotext}`);
						} catch (e) {
							this.log.warn (`Getting error at sending pushover notification ${e}`);
						}
					}
					if (this.config.instanceTelegram) {
						try {
							await this.sendTelegram(`Niedrige Batteriezustände: ${infotext}`);
						} catch (e) {
							this.log.warn (`Getting error at sending telegram notification ${e}`);
						}
					}
					if (this.config.instanceWhatsapp) {
						try {
							await this.sendWhatsapp(`Niedrige Batteriezustände: ${infotext}`);
						} catch (e) {
							this.log.warn (`Getting error at sending whatsapp notification ${e}`);
						}
					}
					if (this.config.instanceEmail) {
						try {
							await this.sendEmail(`Niedrige Batteriezustände: ${infotext}`);
						} catch (e) {
							this.log.warn (`Getting error at sending email notification ${e}`);
						}
					}
					if (this.config.instanceJarvis) {
						try {
							await this.sendJarvis('{"title":"'+ this.config.titleJarvis +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message":" ' + this.lowBatteryPoweredCount + ' Geräte mit schwacher Batterie","display": "drawer"}');
						} catch (e) {
							this.log.warn (`Getting error at sending jarvis notification ${e}`);
						}
					}
					if (this.config.instanceLovelace) {
						try {
							await this.sendLovelace('{"message":" ' + this.lowBatteryPoweredCount + ' Geräte mit schwacher Batterie", "title":"'+ this.config.titleLovelace +' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}');
						} catch (e) {
							this.log.warn (`Getting error at sending lovelace notification ${e}`);
						}
					}

					await this.setStateAsync('info.lastBatteryNotification', true, true);
				}
			}
		} catch (e) {
			this.log.debug(`Getting error at sending battery notification ${e}`);
		}
		this.log.debug(`Finished the function: ${this.sendBatteryNotifications.name}`);
	}//<--End of battery notification

	async writeDatapoints(adptName) {
		/*=============================================
		=            	Write Datapoints 		      =
		=============================================*/

		this.log.debug(`Start the function: ${this.writeDatapoints.name}`);

		try {

			let dpSubFolder;
			if (adptName) { //write the datapoints in subfolders with the adaptername otherwise write the dP's in the root folder
				dpSubFolder = adptName + '.';
			} else {
				dpSubFolder = '';}

			await this.setStateAsync(`${dpSubFolder}offlineCount`, {val: this.offlineDevicesCount, ack: true});
			await this.setStateAsync(`${dpSubFolder}countAll`, {val: this.deviceCounter, ack: true});
			await this.setStateAsync(`${dpSubFolder}batteryCount`, {val: this.batteryPoweredCount, ack: true});
			await this.setStateAsync(`${dpSubFolder}lowBatteryCount`, {val: this.lowBatteryPoweredCount, ack: true});

			if (this.deviceCounter == 0) {
				this.listAllDevices       = [{Device: '--keine--', Adapter: '', Battery: '', Last_contact: '', Link_quality: ''}]; //JSON-Info Gesamtliste mit Info je Gerät

				await this.setStateAsync(`${dpSubFolder}listAll`, {val: JSON.stringify(this.listAllDevices), ack: true});
			} else {
				await this.setStateAsync(`${dpSubFolder}listAll`, {val: JSON.stringify(this.listAllDevices), ack: true});
			}

			if (this.linkQualityCount == 0) {
				this.linkQualityDevices	= [{Device: '--keine--', Adapter: '', Link_quality: ''}]; //JSON-Info alle mit LinkQuality

				await this.setStateAsync(`${dpSubFolder}linkQualityList`, {val: JSON.stringify(this.linkQualityDevices), ack: true});
			} else {
				await this.setStateAsync(`${dpSubFolder}linkQualityList`, {val: JSON.stringify(this.linkQualityDevices), ack: true});
			}


			if (this.offlineDevicesCount == 0) {
				this.offlineDevices	= [{Device: '--keine--', Adapter: '', Last_contact: ''}]; //JSON-Info alle offline-Geräte = 0

				await this.setStateAsync(`${dpSubFolder}offlineList`, {val: JSON.stringify(this.offlineDevices), ack: true});
			} else {
				await this.setStateAsync(`${dpSubFolder}offlineList`, {val: JSON.stringify(this.offlineDevices), ack: true});
			}

			if (this.batteryPoweredCount == 0) {
				this.batteryPowered	= [{Device: '--keine--', Adapter: '', Battery: ''}]; //JSON-Info alle batteriebetriebenen Geräte

				await this.setStateAsync(`${dpSubFolder}batteryList`, {val: JSON.stringify(this.batteryPowered), ack: true});
			} else {
				await this.setStateAsync(`${dpSubFolder}batteryList`, {val: JSON.stringify(this.batteryPowered), ack: true});
			}

			if (this.lowBatteryPoweredCount == 0) {
				this.batteryLowPowered	= [{Device: '--keine--', Adapter: '', Battery: ''}]; //JSON-Info alle batteriebetriebenen Geräte

				await this.setStateAsync(`${dpSubFolder}lowBatteryList`, {val: JSON.stringify(this.batteryLowPowered), ack: true});
			} else {
				await this.setStateAsync(`${dpSubFolder}lowBatteryList`, {val: JSON.stringify(this.batteryLowPowered), ack: true});
			}

			//Zeitstempel wann die Datenpunkte zuletzt gecheckt wurden
			const lastCheck = this.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + this.formatDate(new Date(), 'hh:mm:ss');
			await this.setStateAsync('lastCheck', lastCheck, true);
		}
		catch (e) {
			this.log.error(`(05) Error while writing the states ${e}`);
		}
		this.log.debug(`Function finished: ${this.writeDatapoints.name}`);
	}//<--End  of writing Datapoints



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
