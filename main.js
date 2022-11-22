/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */

'use strict';

const utils = require('@iobroker/adapter-core');
const adapterName = require('./package.json').name.split('.').pop();
const schedule = require('node-schedule');
const arrApart = require('./lib/arrApart.js'); // list of supported adapters

// Sentry error reporting, disable when testing code!
const enableSendSentry = true;

// indicator if the adapter is running or not (for intervall/shedule)
let isUnloaded = false;

class DeviceWatcher extends utils.Adapter {
	constructor(options) {
		super({
			...options,
			name: adapterName,
			useFormatDate: true,
		});

		// arrays
		this.offlineDevices = [];
		this.linkQualityDevices = [];
		this.batteryPowered = [];
		this.batteryLowPowered = [];
		this.listAllDevices = [];
		this.blacklistLists = [];
		this.blacklistNotify = [];
		this.arrDev = [];
		this.adapterSelected = [];

		// raw arrays
		this.listAllDevicesRaw = [];
		this.batteryLowPoweredRaw = [];
		this.offlineDevicesRaw = [];

		// raw counts
		this.offlineDevicesCountRaw = 0;
		this.offlineDevicesCountRawOld = 0;
		this.lowBatteryPoweredCountRaw = 0;

		// counts
		this.offlineDevicesCount = 0;
		this.deviceCounter = 0;
		this.linkQualityCount = 0;
		this.batteryPoweredCount = 0;
		this.lowBatteryPoweredCount = 0;

		// Interval timer
		this.refreshDataTimeout = null;

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * onReady
	 */
	async onReady() {
		this.log.debug(`Adapter ${adapterName} was started`);

		isUnloaded = false;

		try {
			this.listOnlyBattery = this.config.listOnlyBattery;

			this.supAdapter = {
				alexa2: this.config.alexa2Devices,
				ble: this.config.bleDevices,
				deconz: this.config.deconzDevices,
				enocean: this.config.enoceanDevices,
				esphome: this.config.esphomeDevices,
				fritzdect: this.config.fritzdectDevices,
				fullybrowser: this.config.fullybrowserDevices,
				ham: this.config.hamDevices,
				harmony: this.config.harmonyDevices,
				hmiP: this.config.hmiPDevices,
				hmrpc: this.config.hmrpcDevices,
				hs100: this.config.hs100Devices,
				hue: this.config.hueDevices,
				hueExt: this.config.hueExtDevices,
				jeelink: this.config.jeelinkDevices,
				lupusec: this.config.lupusecDevices,
				maxcube: this.config.maxcubeDevices,
				meross: this.config.merossDevices,
				mihome: this.config.mihomeDevices,
				mihomeGW: this.config.mihomeDevices,
				mihomeVacuum: this.config.mihomeVacuumDevices,
				netatmo: this.config.netatmoDevices,
				nukiExt: this.config.nukiExtDevices,
				nut: this.config.nutDevices,
				ping: this.config.pingDevices,
				roomba: this.config.roombaDevices,
				shelly: this.config.shellyDevices,
				sonoff: this.config.sonoffDevices,
				sonos: this.config.sonosDevices,
				sureflap: this.config.sureflapDevices,
				switchbotBle: this.config.switchbotBleDevices,
				tado: this.config.tadoDevices,
				tapo: this.config.tapoDevices,
				tradfri: this.config.tradfriDevices,
				unifi: this.config.unifiDevices,
				wled: this.config.wledDevices,
				yeelight: this.config.yeelightDevices,
				zigbee: this.config.zigbeeDevices,
				zigbee2MQTT: this.config.zigbee2mqttDevices,
				zwave: this.config.zwaveDevices,
			};

			this.maxMinutes = {
				alexa2: this.config.alexa2MaxMinutes,
				ble: this.config.bleMaxMinutes,
				deconz: this.config.deconzMaxMinutes,
				enocean: this.config.enoceanMaxMinutes,
				esphome: this.config.esphomeMaxMinutes,
				fritzdect: this.config.fritzdectMaxMinutes,
				fullybrowser: this.config.fullybrowserMaxMinutes,
				ham: this.config.hamMaxMinutes,
				harmony: this.config.harmonyMaxMinutes,
				hmiP: this.config.hmiPMaxMinutes,
				hmrpc: this.config.hmrpcMaxMinutes,
				hs100: this.config.hs100MaxMinutes,
				hue: this.config.hueMaxMinutes,
				hueExt: this.config.hueextMaxMinutes,
				jeelink: this.config.jeelinkMaxMinutes,
				lupusec: this.config.lupusecMaxMinutes,
				maxcube: this.config.maxcubeMaxMinutes,
				meross: this.config.merossMaxMinutes,
				mihome: this.config.mihomeMaxMinutes,
				mihomeGW: this.config.mihomeMaxMinutes,
				mihomeVacuum: this.config.mihomeVacuumMaxMinutes,
				netatmo: this.config.netatmoMaxMinutes,
				nukiExt: this.config.nukiextendMaxMinutes,
				nut: this.config.nutMaxMinutes,
				ping: this.config.pingMaxMinutes,
				roomba: this.config.roombaMaxMinutes,
				shelly: this.config.shellyMaxMinutes,
				sonoff: this.config.sonoffMaxMinutes,
				sonos: this.config.sonosMaxMinutes,
				sureflap: this.config.sureflapMaxMinutes,
				switchbotBle: this.config.switchbotMaxMinutes,
				tado: this.config.tadoMaxMinutes,
				tapo: this.config.tapoMaxMinutes,
				tradfri: this.config.tradfriMaxMinutes,
				unifi: this.config.unifiMaxMinutes,
				wled: this.config.wledMaxMinutes,
				yeelight: this.config.yeelightMaxMinutes,
				zigbee: this.config.zigbeeMaxMinutes,
				zigbee2MQTT: this.config.zigbee2mqttMaxMinutes,
				zwave: this.config.zwaveMaxMinutes,
			};

			for (const [id] of Object.entries(arrApart)) {
				if (!isUnloaded) {
					if (this.supAdapter[id]) {
						this.arrDev.push(arrApart[id]);
						this.adapterSelected.push(await this.capitalize(id));
					}
				} else {
					return; // cancel run if unloaded was called.
				}
			}

			//Check if an Adapter is selected.
			if (this.adapterSelected.length >= 1) {
				// show list in debug log
				this.log.debug(JSON.stringify(this.arrDev));

				this.log.info(`Number of selected adapters: ${this.adapterSelected.length}. Loading data from: ${this.adapterSelected.join(', ')} ...`);
			} else {
				this.log.warn(`No adapter selected. Please check the instance configuration!`);
				return; // cancel run if no adapter is selected
			}

			//create Blacklist
			try {
				await this.createBlacklist();
			} catch (error) {
				this.errorReporting('[onReady - create blacklist]', error);
			}

			//create and fill datapoints for each adapter if selected
			try {
				for (const [id] of Object.entries(arrApart)) {
					if (!isUnloaded) {
						if (this.supAdapter !== undefined && this.supAdapter[id]) {
							if (this.config.createOwnFolder) {
								await this.createDPsForEachAdapter(id);
								if (this.config.createHtmlList) await this.createHtmlListDatapoints(id);
								this.log.debug(`Created datapoints for ${await this.capitalize(id)}`);
							}
						}
					} else {
						return; // cancel run if unloaded was called.
					}
				}
			} catch (error) {
				this.errorReporting('[onReady - create and fill datapoints for each adapter]', error);
			}

			// create HTML list
			if (this.config.createHtmlList) await this.createHtmlListDatapoints();

			// update data in interval
			await this.refreshData();

			// send overview for low battery devices
			if (this.config.checkSendBatteryMsg) await this.sendBatteryNotifyShedule();

			// send overview of offline devices
			if (this.config.checkSendOfflineMsgDaily) await this.sendOfflineNotificationsShedule();
		} catch (error) {
			this.errorReporting('[onReady]', error);
			this.terminate ? this.terminate(15) : process.exit(15);
		}
	} // <-- onReady end

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.warn(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.warn(`state ${id} deleted`);
		}
	}

	/**
	 * @param {ioBroker.Message} obj
	 */
	onMessage(obj) {
		const devices = [];
		let myCount = 0;
		let result;

		switch (obj.command) {
			case 'devicesList':
				if (obj.message) {
					try {
						result = this.listAllDevicesRaw;
						for (const element in result) {
							const label = 'Device: ' + result[element].Device + '  - Adapter: ' + result[element].Adapter;
							const myValueObject = {
								deviceName: result[element].Device,
								adapter: result[element].Adapter,
								path: result[element].Path,
							};
							devices[myCount] = { label: label, value: JSON.stringify(myValueObject) };
							myCount++;
						}
						this.sendTo(obj.from, obj.command, devices, obj.callback);
					} catch (error) {
						this.sendTo(obj.from, obj.command, obj.callback);
					}
				} else {
					this.sendTo(obj.from, obj.command, obj.callback);
				}
				break;
		}
	}

	/**
	 * refresh data with interval
	 */
	async refreshData() {
		const nextTimeout = this.config.updateinterval * 1000;

		await this.main();

		// Clear existing timeout
		if (this.refreshDataTimeout) {
			this.log.debug('clearing old refresh timeout');
			this.clearTimeout(this.refreshDataTimeout);
		}
		if (!isUnloaded) {
			this.refreshDataTimeout = this.setTimeout(() => {
				this.log.debug('Updating Data');

				this.refreshDataTimeout = null;
				this.refreshData();
			}, nextTimeout);
		} else {
			return; // cancel run if unloaded was called.
		}
	} // <-- refreshData end

	/**
	 * main function
	 */
	async main() {
		this.log.debug(`Function started: ${this.main.name}`);

		// fill datapoints for each adapter if selected
		try {
			for (const [id] of Object.entries(arrApart)) {
				if (!isUnloaded) {
					if (this.supAdapter !== undefined && this.supAdapter[id]) {
						if (this.config.createOwnFolder) {
							await this.createDataForEachAdapter(id);
							this.log.debug(`Created and filled data for ${await this.capitalize(id)}`);
						}
					}
				} else {
					this.log.warn('broke up');
					return; // cancel run if unloaded was called.
				}
			}
		} catch (error) {
			this.errorReporting('[main - create and fill datapoints for each adapter]', error);
		}

		// fill counts and lists of all selected adapter
		try {
			await this.createDataOfAllAdapter();
			this.log.debug(`Created and filled data for all adapters`);
		} catch (error) {
			this.errorReporting('[main - create data of all adapter]', error);
		}

		this.log.debug(`Function finished: ${this.main.name}`);
	} //<--End of main function

	/**
	 * @param {string} id - id which should be capitalize
	 */
	capitalize(id) {
		//make the first letter uppercase
		return id && id[0].toUpperCase() + id.slice(1);
	}

	/**
	 * @param {number} dpValue - get Time of this datapoint
	 */
	async getTimestamp(dpValue) {
		const time = new Date();
		return (dpValue = Math.round((time.getTime() - dpValue) / 1000 / 60));
	}

	/**
	 * @param {object} obj - State of datapoint
	 */
	async getInitValue(obj) {
		//state can be null or undefinded
		const foreignState = await this.getForeignStateAsync(obj);
		if (foreignState) return foreignState.val;
	}

	/**
	 * @param {object} obj - State of own datapoint
	 */
	async getOwnInitValue(obj) {
		//state can be null or undefinded for own states
		const stateVal = await this.getStateAsync(obj);
		if (stateVal) return stateVal.val;
	}

	/**
	 * @param {object} data - object
	 */
	async parseData(data) {
		if (!data) return {};
		if (typeof data === 'object') return data;
		if (typeof data === 'string') return JSON.parse(data);
		return {};
	}

	/**
	 * create blacklist
	 */
	async createBlacklist() {
		this.log.debug(`Function started: ${this.createBlacklist.name}`);

		if (!isUnloaded) {
			const myBlacklist = this.config.tableBlacklist;

			for (const i in myBlacklist) {
				try {
					const blacklistParse = await this.parseData(myBlacklist[i].devices);
					// push devices in list to ignor device in lists
					if (myBlacklist[i].checkIgnorLists) {
						this.blacklistLists.push(blacklistParse.path);
					}
					// push devices in list to ignor device in notifications
					if (myBlacklist[i].checkIgnorNotify) {
						this.blacklistNotify.push(blacklistParse.path);
					}
				} catch (error) {
					this.errorReporting('[createBlacklist]', error);
				}
			}

			if (this.blacklistLists.length >= 1) this.log.info(`Found items on blacklist for lists: ${this.blacklistLists}`);
			if (this.blacklistNotify.length >= 1) this.log.info(`Found items on blacklist for notificatioons: ${this.blacklistNotify}`);
		} else {
			return; // cancel run if unloaded was called.
		}

		this.log.debug(`Function finished: ${this.createBlacklist.name}`);
	}

	/**
	 * @param {object} id - deviceID
	 * @param {object} i - each Device
	 */
	async getDeviceName(id, i) {
		const currDeviceString = id.slice(0, id.lastIndexOf('.') + 1 - 1);
		const shortCurrDeviceString = currDeviceString.slice(0, currDeviceString.lastIndexOf('.') + 1 - 1);
		const shortshortCurrDeviceString = shortCurrDeviceString.slice(0, shortCurrDeviceString.lastIndexOf('.') + 1 - 1);

		try {
			// Get device name
			const deviceObject = await this.getForeignObjectAsync(currDeviceString);
			const shortDeviceObject = await this.getForeignObjectAsync(shortCurrDeviceString);
			const shortshortDeviceObject = await this.getForeignObjectAsync(shortshortCurrDeviceString);
			let deviceName;

			// Get ID with currDeviceString from datapoint
			switch (this.arrDev[i].adapterID) {
				// Get ID for Switchbot and ESPHome Devices
				case 'switchbotBle':
				case 'esphome':
				case 'fullybrowser':
					deviceName = await this.getInitValue(currDeviceString + this.arrDev[i].id);
					break;

				// Get ID with short currDeviceString from objectjson
				case 'hueExt':
				case 'hmrpc':
				case 'nukiExt':
				case 'wled':
					if (shortDeviceObject && typeof shortDeviceObject === 'object') {
						deviceName = shortDeviceObject.common.name;
					}
					break;

				// Get ID with short short currDeviceString from objectjson (HMiP Devices)
				case 'hmiP':
					if (shortshortDeviceObject && typeof shortshortDeviceObject === 'object') {
						deviceName = shortshortDeviceObject.common.name;
					}
					break;

				// Get ID with short currDeviceString from datapoint
				case 'mihomeVacuum':
				case 'roomba':
					deviceName = await this.getInitValue(shortCurrDeviceString + this.arrDev[i].id);
					break;

				//Get ID of foldername
				case 'tado':
					deviceName = currDeviceString.slice(currDeviceString.lastIndexOf('.') + 1);
					break;

				// Format Device name
				case 'sureflap':
					if (deviceObject && typeof deviceObject === 'object') {
						deviceName = deviceObject.common.name
							.replace(/'/g, '')
							.replace(/\(\d+\)/g, '')
							.trim()
							.replace('Hub', 'Hub -')
							.replace('Device', 'Device -');
					}
					break;

				//Get ID of foldername
				case 'yeelight':
					deviceName = shortCurrDeviceString.slice(shortCurrDeviceString.lastIndexOf('.') + 1);
					break;

				// Get ID with main selektor from objectjson
				default:
					if (deviceObject && typeof deviceObject === 'object') {
						deviceName = deviceObject.common.name;
					}
					break;
			}
			return deviceName;
		} catch (error) {
			this.errorReporting('[getDeviceName]', error);
		}
	}

	/**
	 * get Last Contact
	 * @param {object} selector - Selector
	 */
	async getLastContact(selector) {
		const lastContact = await this.getTimestamp(selector);
		let lastContactString;

		lastContactString = this.formatDate(new Date(selector), 'hh:mm') + ' Uhr';
		if (Math.round(lastContact) > 100) {
			lastContactString = Math.round(lastContact / 60) + ' Stunden';
		}
		if (Math.round(lastContact / 60) > 48) {
			lastContactString = Math.round(lastContact / 60 / 24) + ' Tagen';
		}
		return lastContactString;
	}

	/**
	 * Create Lists
	 */
	async createLists() {
		this.linkQualityDevices = [];
		this.batteryPowered = [];
		this.batteryLowPowered = [];
		this.listAllDevices = [];
		this.offlineDevices = [];
		this.batteryLowPoweredRaw = [];
		this.offlineDevicesRaw = [];

		for (const device of this.listAllDevicesRaw) {
			/*----------  fill raw lists  ----------*/
			// low bat list
			if (device['LowBat'] && device['Status'] !== 'Offline') {
				this.batteryLowPoweredRaw.push({
					Path: device['Path'],
					Device: device['Device'],
					Adapter: device['Adapter'],
					Battery: device['Battery'],
				});
			}
			// offline raw list
			if (device['Status'] === 'Offline') {
				this.offlineDevicesRaw.push({
					Path: device['Path'],
					Device: device['Device'],
					Adapter: device['Adapter'],
					'Last contact': device['Last contact'],
				});
			}

			/*----------  fill user lists  ----------*/
			if (!this.blacklistLists.includes(device['Path'])) {
				this.listAllDevices.push({
					Device: device['Device'],
					Adapter: device['Adapter'],
					Battery: device['Battery'],
					'Signal strength': device['Signal strength'],
					'Last contact': device['Last contact'],
					Status: device['Status'],
				});
				// LinkQuality lists
				if (device['Signal strength'] != ' - ') {
					this.linkQualityDevices.push({
						Device: device['Device'],
						Adapter: device['Adapter'],
						'Signal strength': device['Signal strength'],
					});
				}
				// Battery lists
				if (device['isBatteryDevice']) {
					this.batteryPowered.push({
						Device: device['Device'],
						Adapter: device['Adapter'],
						Battery: device['Battery'],
						Status: device['Status'],
					});
				}
				// Low Bat lists
				if (device['LowBat'] && device['Status'] !== 'Offline') {
					this.batteryLowPowered.push({
						Device: device['Device'],
						Adapter: device['Adapter'],
						Battery: device['Battery'],
					});
				}

				// Offline List
				if (device['Status'] === 'Offline') {
					this.offlineDevices.push({
						Device: device['Device'],
						Adapter: device['Adapter'],
						'Last contact': device['Last contact'],
					});
				}
			}
		}
	}

	/**
	 * Count devices for each type
	 */
	async countDevices() {
		// Count how many devices with link Quality
		this.linkQualityCount = this.linkQualityDevices.length;

		// Count how many devcies are offline
		this.offlineDevicesCount = this.offlineDevices.length;

		// Count how many devices are with battery
		this.batteryPoweredCount = this.batteryPowered.length;

		// 3d. Count how many devices are with low battery
		this.lowBatteryPoweredCount = this.batteryLowPowered.length;

		// Count how many devices are exists
		this.deviceCounter = this.listAllDevices.length;

		// raws

		// Count how many devcies are offline
		this.offlineDevicesCountRaw = this.offlineDevicesRaw.length;
	}

	/**
	 * @param {object} i - Device Object
	 */
	async createData(i) {
		const devices = await this.getForeignStatesAsync(this.arrDev[i].Selektor);
		const adapterID = this.arrDev[i].adapterID;

		/*----------  Start of loop  ----------*/
		for (const [id] of Object.entries(devices)) {
			if (!isUnloaded) {
				/*=============================================
				=              Get device name		          =
				=============================================*/
				const deviceName = await this.getDeviceName(id, i);

				/*=============================================
				=              Get adapter name		          =
				=============================================*/
				const adapter = this.arrDev[i].adapter;

				/*=============================================
				=            Get path to datapoints	   	      =
				=============================================*/
				const currDeviceString = id.slice(0, id.lastIndexOf('.') + 1 - 1);
				const shortCurrDeviceString = currDeviceString.slice(0, currDeviceString.lastIndexOf('.') + 1 - 1);

				/*=============================================
				=            Get signal strength              =
				=============================================*/
				let deviceQualityState;
				let linkQuality;

				switch (adapterID) {
					case 'mihomeVacuum':
						deviceQualityState = await this.getForeignStateAsync(shortCurrDeviceString + this.arrDev[i].rssiState);
						break;

					case 'netatmo':
						deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiState);
						if (!deviceQualityState) {
							deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rfState);
						}
						break;

					default:
						deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiState);
						break;
				}

				if (deviceQualityState != null) {
					switch (typeof deviceQualityState.val) {
						case 'number':
							if (this.config.trueState) {
								linkQuality = deviceQualityState.val;
							} else {
								switch (adapterID) {
									case 'roomba':
									case 'sonoff':
										linkQuality = deviceQualityState.val + '%'; // If quality state is already an percent value
										break;
									case 'lupusec':
										linkQuality = deviceQualityState.val;
										break;

									default:
										// If quality state is an RSSI value calculate in percent:
										if (deviceQualityState.val == -255) {
											linkQuality = ' - ';
										} else if (deviceQualityState.val < 0) {
											linkQuality = Math.min(Math.max(2 * (deviceQualityState.val + 100), 0), 100) + '%';
											// If Quality State is an value between 0-255 (zigbee) calculate in percent:
										} else if (deviceQualityState.val >= 0) {
											linkQuality = parseFloat(((100 / 255) * deviceQualityState.val).toFixed(0)) + '%';
										}
										break;
								}
							}
							break;

						case 'string':
							switch (adapterID) {
								case 'netatmo':
									// for Netatmo devices
									linkQuality = deviceQualityState.val;
									break;
								case 'nukiExt':
									linkQuality = ' - ';
									break;
							}
							break;
					}
				} else {
					linkQuality = ' - ';
				}

				/*=============================================
				=         	    Get battery data       	      =
				=============================================*/
				let batteryHealth;
				let lowBatIndicator;
				let isBatteryDevice;

				// Get battery states
				let deviceBatteryState = await this.getInitValue(currDeviceString + this.arrDev[i].battery);
				if (deviceBatteryState === undefined) {
					deviceBatteryState = await this.getInitValue(currDeviceString + this.arrDev[i].battery2);
				}

				const shortDeviceBatteryState = await this.getInitValue(shortCurrDeviceString + this.arrDev[i].battery);
				const shortDeviceBatteryState2 = await this.getInitValue(shortCurrDeviceString + this.arrDev[i].battery2);

				// Get low bat states
				let deviceLowBatState = await this.getInitValue(currDeviceString + this.arrDev[i].isLowBat);
				if (deviceLowBatState === undefined) {
					deviceLowBatState = await this.getInitValue(currDeviceString + this.arrDev[i].isLowBat2);
				}

				if (!deviceBatteryState && !shortDeviceBatteryState && !shortDeviceBatteryState2) {
					if (deviceLowBatState !== undefined) {
						switch (this.arrDev[i].isLowBat || this.arrDev[i].isLowBat2) {
							case 'none':
								batteryHealth = ' - ';
								break;
							default:
								if (deviceLowBatState === false || deviceLowBatState === 'NORMAL' || deviceLowBatState === 1) {
									batteryHealth = 'ok';
									isBatteryDevice = true;
								} else {
									batteryHealth = 'low';
									isBatteryDevice = true;
								}
								break;
						}
					} else {
						batteryHealth = ' - ';
					}
				} else {
					switch (adapterID) {
						case 'hmrpc':
							if (deviceBatteryState === 0) {
								batteryHealth = ' - ';
							} else {
								batteryHealth = deviceBatteryState + 'V';
								isBatteryDevice = true;
							}
							break;

						case 'hueExt':
							if (shortDeviceBatteryState) {
								batteryHealth = shortDeviceBatteryState + '%';
								isBatteryDevice = true;
							}
							break;
						case 'mihomeVacuum':
							if (shortDeviceBatteryState) {
								batteryHealth = shortDeviceBatteryState + '%';
								isBatteryDevice = true;
							} else if (shortDeviceBatteryState2) {
								batteryHealth = shortDeviceBatteryState2 + '%';
								isBatteryDevice = true;
							}
							break;
						default:
							batteryHealth = deviceBatteryState + '%';
							isBatteryDevice = true;
					}
				}

				/*=============================================
				=            Set Lowbat indicator             =
				=============================================*/
				switch (typeof deviceLowBatState) {
					case 'number':
						if (deviceLowBatState === 0) {
							lowBatIndicator = true;
						}
						break;

					case 'string':
						if (deviceLowBatState !== 'NORMAL') {
							// Tado devices
							lowBatIndicator = true;
						}
						break;

					case 'boolean':
						if (deviceLowBatState) {
							lowBatIndicator = true;
						}
						break;

					default: // if the battery state is under the set limit
						if (deviceBatteryState && deviceBatteryState < this.config.minWarnBatterie) {
							lowBatIndicator = true;
						}
						break;
				}

				/*=============================================
				=          Get last contact of device         =
				=============================================*/
				let lastContactString;
				let deviceState = 'Online';

				const deviceMainSelector = await this.getForeignStateAsync(id);
				const deviceUnreachSelector = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].reach);
				const deviceStateSelector = await this.getForeignStateAsync(shortCurrDeviceString + this.arrDev[i].stateValue); // for hmrpc devices
				const rssiPeerSelector = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiPeerState);

				if (deviceMainSelector) {
					try {
						const lastContact = await this.getTimestamp(deviceMainSelector.ts);
						const deviceUnreachState = await this.getInitValue(currDeviceString + this.arrDev[i].reach);
						const lastDeviceUnreachStateChange = deviceUnreachSelector != undefined ? await this.getTimestamp(deviceUnreachSelector.lc) : await this.getTimestamp(deviceMainSelector.ts);
						const shortDeviceUnreachState = await this.getForeignStateAsync(shortCurrDeviceString + this.arrDev[i].reach);

						//  If there is no contact since user sets minutes add device in offline list
						// calculate to days after 48 hours
						switch (this.arrDev[i].reach) {
							case 'none':
								lastContactString = await this.getLastContact(deviceMainSelector.ts);
								break;

							default:
								//State changed
								if (adapterID === 'hmrpc') {
									if (linkQuality !== ' - ') {
										if (deviceUnreachState) {
											lastContactString = await this.getLastContact(deviceMainSelector.lc);
										} else {
											lastContactString = await this.getLastContact(deviceMainSelector.ts);
										}
									} else {
										if (deviceStateSelector) {
											// because old hm devices don't send rssi states
											lastContactString = await this.getLastContact(deviceStateSelector.ts);
										} else if (rssiPeerSelector) {
											// because old hm sensors don't send rssi/state values
											lastContactString = await this.getLastContact(rssiPeerSelector.ts);
										}
									}
								} else {
									if (!deviceUnreachState) {
										lastContactString = await this.getLastContact(deviceMainSelector.lc);
									} else {
										lastContactString = await this.getLastContact(deviceMainSelector.ts);
									}
									break;
								}
						}

						/*=============================================
						=            Set Online Status             =
						=============================================*/
						if (this.maxMinutes !== undefined) {
							switch (adapterID) {
								case 'hmrpc':
								case 'hmiP':
								case 'maxcube':
									if (this.maxMinutes[adapterID] <= 0) {
										if (deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else if (lastDeviceUnreachStateChange > this.maxMinutes[adapterID] && deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
									break;
								case 'ping':
								case 'deconz':
									if (this.maxMinutes[adapterID] <= 0) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else if (lastDeviceUnreachStateChange > this.maxMinutes[adapterID] && !deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
									break;
								case 'unifi':
									if (this.maxMinutes[adapterID] <= 0) {
										if (deviceUnreachState === 0) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else if (this.maxMinutes !== undefined && lastContact > this.maxMinutes[adapterID]) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
									break;
								case 'shelly':
								case 'sonoff':
									if (this.maxMinutes[adapterID] <= 0) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else if (!deviceUnreachState && lastDeviceUnreachStateChange > this.maxMinutes[adapterID]) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
									break;
								case 'mihomeVacuum':
									if (this.maxMinutes[adapterID] <= 0) {
										if (!shortDeviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else if (lastContact > this.maxMinutes[adapterID]) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
									break;
								case 'mihome':
									if (this.arrDev[i].battery === 'none') {
										if (this.maxMinutes[adapterID] <= 0) {
											if (!deviceUnreachState) {
												deviceState = 'Offline'; //set online state to offline
												linkQuality = '0%'; // set linkQuality to nothing
											}
										} else if (lastContact > this.maxMinutes[adapterID]) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else {
										if (this.config.mihomeMaxMinutes <= 0) {
											if (this.maxMinutes[adapterID] <= 0) {
												deviceState = 'Offline'; //set online state to offline
												linkQuality = '0%'; // set linkQuality to nothing
											}
										} else if (lastContact > this.maxMinutes[adapterID]) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									}
									break;
								default:
									if (this.maxMinutes[adapterID] <= 0) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											linkQuality = '0%'; // set linkQuality to nothing
										}
									} else if (lastContact > this.maxMinutes[adapterID]) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
									break;
							}
						}
					} catch (error) {
						this.errorReporting('[getLastContact]', error);
					}
				}

				/*=============================================
				=          		  Fill Raw Lists          	  =
				=============================================*/

				/* Add only devices with battery in the rawlist */
				if (this.listOnlyBattery) {
					if (isBatteryDevice) {
						this.listAllDevicesRaw.push({
							Path: id,
							Device: deviceName,
							Adapter: adapter,
							isBatteryDevice: isBatteryDevice,
							Battery: batteryHealth,
							LowBat: lowBatIndicator,
							'Signal strength': linkQuality,
							'Last contact': lastContactString,
							Status: deviceState,
						});
					}
				} else {
					/* Add all devices */
					this.listAllDevicesRaw.push({
						Path: id,
						Device: deviceName,
						Adapter: adapter,
						isBatteryDevice: isBatteryDevice,
						Battery: batteryHealth,
						LowBat: lowBatIndicator,
						'Signal strength': linkQuality,
						'Last contact': lastContactString,
						Status: deviceState,
					});
				}
			} else {
				/* cancel run if unloaded was called. */
				return;
			}
		} // <-- end of loop
		await this.createLists();
		await this.countDevices();
	} // <-- end of createData

	/**
	 * @param {string} adptName - Adapter name
	 */
	async createDataForEachAdapter(adptName) {
		// create Data for each Adapter in own lists
		this.log.debug(`Function started: ${this.createDataForEachAdapter.name}`);

		await this.resetVars(); // reset the arrays and counts

		try {
			for (let i = 0; i < this.arrDev.length; i++) {
				if (this.arrDev[i].adapterID.includes(adptName)) {
					// list device only if selected adapter matched with device
					await this.createData(i);
				}
			}

			await this.writeDatapoints(adptName); // fill the datapoints
		} catch (error) {
			this.errorReporting('[createDataForEachAdapter]', error);
		}

		this.log.debug(`Function finished: ${this.createDataForEachAdapter.name}`);
	} // <-- end of createDataForEachAdapter

	/**
	 * create Data of all selected adapter in one list
	 */
	async createDataOfAllAdapter() {
		this.log.debug(`Function started: ${this.createDataOfAllAdapter.name}`);

		try {
			await this.resetVars(); // reset the arrays and counts

			for (let i = 0; i < this.arrDev.length; i++) {
				if (!isUnloaded) {
					await this.createData(i);
				} else {
					return; // cancel run if unloaded was called.
				}
			}

			// send message if new devices are offline
			if (this.config.checkSendOfflineMsg) await this.sendOfflineNotifications();

			await this.writeDatapoints(); // fill the datapoints
		} catch (error) {
			this.errorReporting('[createDataOfAllAdapter]', error);
		}

		this.log.debug(`Function finished: ${this.createDataOfAllAdapter.name}`);
	} // <-- end of createDataOfAllAdapter

	/**
	 * Notification service
	 * @param {string} text - Text which should be send
	 */
	async sendNotification(text) {
		// Pushover
		try {
			if (this.config.instancePushover) {
				//first check if instance is living
				const pushoverAliveState = await this.getInitValue('system.adapter.' + this.config.instancePushover + '.alive');

				if (!pushoverAliveState) {
					this.log.warn('Pushover instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instancePushover, 'send', {
						message: text,
						title: this.config.titlePushover,
						device: this.config.devicePushover,
						priority: this.config.prioPushover,
					});
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Pushover]', error);
		}

		// Telegram
		try {
			if (this.config.instanceTelegram) {
				//first check if instance is living
				const telegramAliveState = await this.getInitValue('system.adapter.' + this.config.instanceTelegram + '.alive');

				if (!telegramAliveState) {
					this.log.warn('Telegram instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceTelegram, 'send', {
						text: text,
						user: this.config.deviceTelegram,
						chatId: this.config.chatIdTelegram,
					});
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Telegram]', error);
		}

		// Whatsapp
		try {
			if (this.config.instanceWhatsapp) {
				//first check if instance is living
				const whatsappAliveState = await this.getInitValue('system.adapter.' + this.config.instanceWhatsapp + '.alive');

				if (!whatsappAliveState) {
					this.log.warn('Whatsapp instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceWhatsapp, 'send', {
						text: text,
						phone: this.config.phoneWhatsapp,
					});
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Whatsapp]', error);
		}

		// Email
		try {
			if (this.config.instanceEmail) {
				//first check if instance is living
				const eMailAliveState = await this.getInitValue('system.adapter.' + this.config.instanceEmail + '.alive');

				if (!eMailAliveState) {
					this.log.warn('eMail instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceEmail, 'send', {
						sendTo: this.config.sendToEmail,
						text: text,
						subject: this.config.subjectEmail,
					});
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification eMail]', error);
		}

		// Jarvis Notification
		try {
			if (this.config.instanceJarvis) {
				//first check if instance is living
				const jarvisAliveState = await this.getInitValue('system.adapter.' + this.config.instanceJarvis + '.alive');

				if (!jarvisAliveState) {
					this.log.warn('Jarvis instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					const jsonText = JSON.stringify(text);
					await this.setForeignStateAsync(
						`${this.config.instanceJarvis}.addNotification`,
						'{"title":"' + this.config.titleJarvis + ' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message": ' + jsonText + ',"display": "drawer"}',
					);
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Jarvis]', error);
		}

		// Lovelace Notification
		try {
			if (this.config.instanceLovelace) {
				//first check if instance is living
				const lovelaceAliveState = await this.getInitValue('system.adapter.' + this.config.instanceLovelace + '.alive');

				if (!lovelaceAliveState) {
					this.log.warn('Lovelace instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					const jsonText = JSON.stringify(text);
					await this.setForeignStateAsync(
						`${this.config.instanceLovelace}.notifications.add`,
						'{"message":' + jsonText + ', "title":"' + this.config.titleLovelace + ' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}',
					);
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Lovelace]', error);
		}
	} // <-- End of sendNotification function

	/**
	 * send shedule message for low battery devices
	 */
	async sendBatteryNotifyShedule() {
		const time = this.config.checkSendBatteryTime.split(':');

		const checkDays = []; // list of selected days

		// push the selected days in list
		if (this.config.checkMonday) checkDays.push(1);
		if (this.config.checkTuesday) checkDays.push(2);
		if (this.config.checkWednesday) checkDays.push(3);
		if (this.config.checkThursday) checkDays.push(4);
		if (this.config.checkFriday) checkDays.push(5);
		if (this.config.checkSaturday) checkDays.push(6);
		if (this.config.checkSunday) checkDays.push(0);

		if (checkDays.length >= 1) {
			// check if an day is selected
			this.log.debug(`Number of selected days for daily battery message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);
		} else {
			this.log.warn(`No days selected for daily battery message. Please check the instance configuration!`);
			return; // cancel function if no day is selected
		}

		if (!isUnloaded) {
			const cron = '10 ' + time[1] + ' ' + time[0] + ' * * ' + checkDays;
			schedule.scheduleJob(cron, () => {
				try {
					let deviceList = '';

					for (const id of this.batteryLowPoweredRaw) {
						if (!this.blacklistNotify.includes(id['Path'])) {
							deviceList = `${deviceList}\n${id['Device']} (${id['Battery']})`;
						}
					}
					if (deviceList.length > 0) {
						this.log.info(`Niedrige Batteriezustände: ${deviceList}`);
						this.setStateAsync('lastNotification', `Niedrige Batteriezustände: ${deviceList}`, true);

						this.sendNotification(`Niedriege Batteriezustände: ${deviceList}`);
					}
				} catch (error) {
					this.errorReporting('[sendBatteryNotifyShedule]', error);
				}
			});
		}
	} //<--End of battery notification

	/**
	 * send message if an device is offline
	 */
	async sendOfflineNotifications() {
		this.log.debug(`Start the function: ${this.sendOfflineNotifications.name}`);

		try {
			let msg = '';
			let deviceList = '';

			for (const id of this.offlineDevicesRaw) {
				if (!this.blacklistNotify.includes(id['Path'])) {
					deviceList = `${deviceList}\n${id['Device']} (${id['Last contact']})`;
				}
			}
			if (deviceList.length !== this.offlineDevicesCountRawOld) {
				if (deviceList.length == 0) {
					msg = 'Alle Geräte sind Online.';
				} else if (deviceList.length == 1) {
					// make singular if it is only one device
					msg = 'Folgendes Gerät ist seit einiger Zeit nicht erreichbar: \n';
				} else if (deviceList.length >= 2) {
					//make plural if it is more than one device
					msg = `Folgende Geräte sind seit einiger Zeit nicht erreichbar: \n`;
				}

				this.log.info(msg + deviceList);
				this.offlineDevicesCountRawOld = deviceList.length;
				await this.setStateAsync('lastNotification', msg + deviceList, true);
				await this.sendNotification(msg + deviceList);
			}
		} catch (error) {
			this.errorReporting('[sendOfflineMessage]', error);
		}
		this.log.debug(`Finished the function: ${this.sendOfflineNotifications.name}`);
	} //<--End of offline notification

	/**
	 * send shedule message with offline devices
	 */
	async sendOfflineNotificationsShedule() {
		const time = this.config.checkSendOfflineTime.split(':');

		const checkDays = []; // list of selected days

		// push the selected days in list
		if (this.config.checkOfflineMonday) checkDays.push(1);
		if (this.config.checkOfflineTuesday) checkDays.push(2);
		if (this.config.checkOfflineWednesday) checkDays.push(3);
		if (this.config.checkOfflineThursday) checkDays.push(4);
		if (this.config.checkOfflineFriday) checkDays.push(5);
		if (this.config.checkOfflineSaturday) checkDays.push(6);
		if (this.config.checkOfflineSunday) checkDays.push(0);

		if (checkDays.length >= 1) {
			// check if an day is selected
			this.log.debug(`Number of selected days for daily offline message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);
		} else {
			this.log.warn(`No days selected for daily offline message. Please check the instance configuration!`);
			return; // cancel function if no day is selected
		}

		if (!isUnloaded) {
			const cron = '10 ' + time[1] + ' ' + time[0] + ' * * ' + checkDays;
			schedule.scheduleJob(cron, () => {
				try {
					let deviceList = '';

					for (const id of this.offlineDevicesRaw) {
						if (!this.blacklistNotify.includes(id['Path'])) {
							deviceList = `${deviceList}\n${id['Device']} (${id['Last contact']})`;
						}
					}

					if (deviceList.length > 0) {
						this.log.info(`Geräte Offline: ${deviceList}`);
						this.setStateAsync('lastNotification', `Geräte Offline: ${deviceList}`, true);

						this.sendNotification(`Geräte Offline: ${deviceList}`);
					}
				} catch (error) {
					this.errorReporting('[sendOfflineNotificationsShedule]', error);
				}
			});
		}
	} //<--End of daily offline notification

	/**
	 * reset arrays and counts
	 */
	async resetVars() {
		//Reset all arrays and counts
		this.log.debug(`Function started: ${this.resetVars.name}`);

		// arrays
		this.offlineDevices = [];
		this.linkQualityDevices = [];
		this.batteryPowered = [];
		this.batteryLowPowered = [];
		this.listAllDevices = [];
		this.listAllDevicesRaw = [];

		// raws
		this.batteryLowPoweredRaw = [];
		this.offlineDevicesRaw = [];
		this.lowBatteryPoweredCountRaw = 0;
		this.offlineDevicesCountRaw = 0;

		// counts
		this.offlineDevicesCount = 0;
		this.deviceCounter = 0;
		this.linkQualityCount = 0;
		this.batteryPoweredCount = 0;
		this.lowBatteryPoweredCount = 0;

		this.log.debug(`Function finished: ${this.resetVars.name}`);
	} // <-- end of resetVars

	/**
	 * @param {string} [adptName] - Adaptername
	 */
	async writeDatapoints(adptName) {
		// fill the datapoints

		this.log.debug(`Start the function: ${this.writeDatapoints.name}`);

		try {
			let dpSubFolder;
			//write the datapoints in subfolders with the adaptername otherwise write the dP's in the root folder
			if (adptName) {
				dpSubFolder = adptName + '.';
			} else {
				dpSubFolder = '';
			}

			await this.setStateAsync(`${dpSubFolder}offlineCount`, { val: this.offlineDevicesCount, ack: true });
			await this.setStateAsync(`${dpSubFolder}countAll`, { val: this.deviceCounter, ack: true });
			await this.setStateAsync(`${dpSubFolder}batteryCount`, { val: this.batteryPoweredCount, ack: true });
			await this.setStateAsync(`${dpSubFolder}lowBatteryCount`, { val: this.lowBatteryPoweredCount, ack: true });

			if (this.deviceCounter == 0) {
				// if no device is count, write the JSON List with default value
				this.listAllDevices = [{ Device: '--none--', Adapter: '', Battery: '', 'Last contact': '', 'Signal strength': '' }];
			}
			await this.setStateAsync(`${dpSubFolder}listAll`, { val: JSON.stringify(this.listAllDevices), ack: true });

			if (this.linkQualityCount == 0) {
				// if no device is count, write the JSON List with default value
				this.linkQualityDevices = [{ Device: '--none--', Adapter: '', 'Signal strength': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}linkQualityList`, {
				val: JSON.stringify(this.linkQualityDevices),
				ack: true,
			});
			//write HTML list
			if (this.config.createHtmlList)
				await this.setStateAsync(`${dpSubFolder}linkQualityListHTML`, {
					val: await this.creatLinkQualityListHTML(this.linkQualityDevices, this.linkQualityCount),
					ack: true,
				});

			if (this.offlineDevicesCount == 0) {
				// if no device is count, write the JSON List with default value
				this.offlineDevices = [{ Device: '--none--', Adapter: '', 'Last contact': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}offlineList`, {
				val: JSON.stringify(this.offlineDevices),
				ack: true,
			});
			//write HTML list
			if (this.config.createHtmlList)
				await this.setStateAsync(`${dpSubFolder}offlineListHTML`, {
					val: await this.createOfflineListHTML(this.offlineDevices, this.offlineDevicesCount),
					ack: true,
				});

			if (this.batteryPoweredCount == 0) {
				// if no device is count, write the JSON List with default value
				this.batteryPowered = [{ Device: '--none--', Adapter: '', Battery: '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}batteryList`, {
				val: JSON.stringify(this.batteryPowered),
				ack: true,
			});
			//write HTML list
			if (this.config.createHtmlList)
				await this.setStateAsync(`${dpSubFolder}batteryListHTML`, {
					val: await this.createBatteryListHTML(this.batteryPowered, this.batteryPoweredCount, false),
					ack: true,
				});

			if (this.lowBatteryPoweredCount == 0) {
				// if no device is count, write the JSON List with default value
				this.batteryLowPowered = [{ Device: '--none--', Adapter: '', Battery: '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}lowBatteryList`, {
				val: JSON.stringify(this.batteryLowPowered),
				ack: true,
			});
			//write HTML list
			if (this.config.createHtmlList)
				await this.setStateAsync(`${dpSubFolder}lowBatteryListHTML`, {
					val: await this.createBatteryListHTML(this.batteryLowPowered, this.lowBatteryPoweredCount, true),
					ack: true,
				});

			// create timestamp of last run
			const lastCheck = this.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + this.formatDate(new Date(), 'hh:mm:ss');
			await this.setStateAsync('lastCheck', lastCheck, true);
		} catch (error) {
			this.errorReporting('[writeDatapoints]', error);
		}
		this.log.debug(`Function finished: ${this.writeDatapoints.name}`);
	} //<--End  of writing Datapoints

	/**
	 * @param {object} devices - Device
	 * @param {number} deviceCount - Counted devices
	 */
	async creatLinkQualityListHTML(devices, deviceCount) {
		devices = devices.sort((a, b) => {
			a = a.Device || '';
			b = b.Device || '';
			return a.localeCompare(b);
		});
		let html = `<center>
		<b>Link Quality Devices:<font> ${deviceCount}</b><small></small></font>
		<p></p>
		</center>   
		<table width=100%>
		<tr>
		<th align=left>Device</th>
		<th align=center width=120>Adapter</th>
		<th align=right>Link Quality</th>
		</tr>
		<tr>
		<td colspan="5"><hr></td>
		</tr>`;

		for (const device of devices) {
			html += `<tr>
			<td><font>${device.Device}</font></td>
			<td align=center><font>${device.Adapter}</font></td>
			<td align=right><font>${device['Signal strength']}</font></td>
			</tr>`;
		}

		html += '</table>';
		return html;
	}

	/**
	 * @param {object} devices - Device
	 * @param {number} deviceCount - Counted devices
	 */
	async createOfflineListHTML(devices, deviceCount) {
		devices = devices.sort((a, b) => {
			a = a.Device || '';
			b = b.Device || '';
			return a.localeCompare(b);
		});
		let html = `<center>
		<b>Offline Devices: <font color=${deviceCount == 0 ? '#3bcf0e' : 'orange'}>${deviceCount}</b><small></small></font>
		<p></p>
		</center>   
		<table width=100%>
		<tr>
		<th align=left>Device</th>
		<th align=center width=120>Adapter</th>
		<th align=center>Letzter Kontakt</th>
		</tr>
		<tr>
		<td colspan="5"><hr></td>
		</tr>`;

		for (const device of devices) {
			html += `<tr>
			<td><font>${device.Device}</font></td>
			<td align=center><font>${device.Adapter}</font></td>
			<td align=center><font color=orange>${device['Last contact']}</font></td>
			</tr>`;
		}

		html += '</table>';
		return html;
	}

	/**
	 * @param {object} [devices] - Device
	 * @param {object} [deviceCount] - Counted devices
	 * @param {object} [isLowBatteryList] - list Low Battery Devices
	 */
	async createBatteryListHTML(devices, deviceCount, isLowBatteryList) {
		devices = devices.sort((a, b) => {
			a = a.Device || '';
			b = b.Device || '';
			return a.localeCompare(b);
		});
		let html = `<center>
		<b>${isLowBatteryList == true ? 'Schwache ' : ''}Batterie Devices: <font color=${isLowBatteryList == true ? (deviceCount > 0 ? 'orange' : '#3bcf0e') : ''}>${deviceCount}</b></font>
		<p></p>
		</center>   
		<table width=100%>
		<tr>
		<th align=left>Device</th>
		<th align=center width=120>Adapter</th>
		<th align=${isLowBatteryList ? 'center' : 'right'}>Batterie</th>
		</tr>
		<tr>
		<td colspan="5"><hr></td>
		</tr>`;
		for (const device of devices) {
			html += `<tr>
			<td><font>${device.Device}</font></td>
			<td align=center><font>${device.Adapter}</font></td>`;

			if (isLowBatteryList) {
				html += `<td align=center><font color=orange>${device.Battery}</font></td>`;
			} else {
				html += `<td align=right><font color=#3bcf0e>${device.Battery}</font></td>`;
			}
			html += `</tr>`;
		}

		html += '</table>';
		return html;
	}

	// create datapoints for each adapter
	/**
	 * @param {object} adptName - Adaptername of devices
	 */
	async createDPsForEachAdapter(adptName) {
		await this.setObjectNotExistsAsync(`${adptName}`, {
			type: 'channel',
			common: {
				name: adptName,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.offlineCount`, {
			type: 'state',
			common: {
				name: {
					en: 'Number of devices offline',
					de: 'Anzahl der Geräte offline',
					ru: 'Количество устройств offline',
					pt: 'Número de dispositivos offline',
					nl: 'Nummer van apparatuur offline',
					fr: 'Nombre de dispositifs hors ligne',
					it: 'Numero di dispositivi offline',
					es: 'Número de dispositivos sin conexión',
					pl: 'Ilość urządzeń offline',
					'zh-cn': '线内装置数量',
				},
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.offlineList`, {
			type: 'state',
			common: {
				name: {
					en: 'List of offline devices',
					de: 'Liste der Offline-Geräte',
					ru: 'Список оффлайн устройств',
					pt: 'Lista de dispositivos off-line',
					nl: 'List van offline apparatuur',
					fr: 'Liste des dispositifs hors ligne',
					it: 'Elenco dei dispositivi offline',
					es: 'Lista de dispositivos sin conexión',
					pl: 'Lista urządzeń offline',
					'zh-cn': '线装置清单',
				},
				type: 'array',
				role: 'json',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.listAll`, {
			type: 'state',
			common: {
				name: {
					en: 'List of all devices',
					de: 'Liste aller Geräte',
					ru: 'Список всех устройств',
					pt: 'Lista de todos os dispositivos',
					nl: 'List van alle apparaten',
					fr: 'Liste de tous les dispositifs',
					it: 'Elenco di tutti i dispositivi',
					es: 'Lista de todos los dispositivos',
					pl: 'Lista wszystkich urządzeń',
					'zh-cn': '所有装置清单',
				},
				type: 'array',
				role: 'json',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.linkQualityList`, {
			type: 'state',
			common: {
				name: {
					en: 'List of devices with signal strength',
					de: 'Liste der Geräte mit Signalstärke',
					ru: 'Список устройств с силой сигнала',
					pt: 'Lista de dispositivos com força de sinal',
					nl: 'List van apparaten met signaalkracht',
					fr: 'Liste des dispositifs avec force de signal',
					it: 'Elenco dei dispositivi con forza del segnale',
					es: 'Lista de dispositivos con fuerza de señal',
					pl: 'Lista urządzeń z siłą sygnałową',
					'zh-cn': '具有信号实力的装置清单',
				},
				type: 'array',
				role: 'json',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.countAll`, {
			type: 'state',
			common: {
				name: {
					en: 'Number of all devices',
					de: 'Anzahl aller Geräte',
					ru: 'Количество всех устройств',
					pt: 'Número de todos os dispositivos',
					nl: 'Nummer van alle apparaten',
					fr: 'Nombre de tous les appareils',
					it: 'Numero di tutti i dispositivi',
					es: 'Número de todos los dispositivos',
					pl: 'Ilość wszystkich urządzeń',
					'zh-cn': '所有装置的数目',
				},
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.batteryList`, {
			type: 'state',
			common: {
				name: {
					en: 'List of devices with battery state',
					de: 'Liste der Geräte mit Batteriezustand',
					ru: 'Список устройств с состоянием батареи',
					pt: 'Lista de dispositivos com estado da bateria',
					nl: 'List van apparaten met batterij staat',
					fr: 'Liste des appareils avec état de batterie',
					it: 'Elenco dei dispositivi con stato della batteria',
					es: 'Lista de dispositivos con estado de batería',
					pl: 'Lista urządzeń z baterią stanową',
					'zh-cn': '电池国装置清单',
				},
				type: 'array',
				role: 'json',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.lowBatteryList`, {
			type: 'state',
			common: {
				name: {
					en: 'List of devices with low battery state',
					de: 'Liste der Geräte mit niedrigem Batteriezustand',
					ru: 'Список устройств с низким состоянием батареи',
					pt: 'Lista de dispositivos com baixo estado da bateria',
					nl: 'List van apparaten met lage batterij staat',
					fr: 'Liste des appareils à faible état de batterie',
					it: 'Elenco di dispositivi con stato di batteria basso',
					es: 'Lista de dispositivos con estado de batería bajo',
					pl: 'Lista urządzeń o niskim stanie baterii',
					'zh-cn': '低电池国家装置清单',
				},
				type: 'array',
				role: 'json',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.lowBatteryCount`, {
			type: 'state',
			common: {
				name: {
					en: 'Number of devices with low battery',
					de: 'Anzahl der Geräte mit niedriger Batterie',
					ru: 'Количество устройств c низкой батареей',
					pt: 'Número de dispositivos com bateria baixa',
					nl: 'Nummer van apparaten met lage batterij',
					fr: 'Nombre de dispositifs avec batterie basse',
					it: 'Numero di dispositivi con batteria bassa',
					es: 'Número de dispositivos con batería baja',
					pl: 'Liczba urządzeń z niską baterią',
					'zh-cn': '低电池的装置数量',
				},
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.batteryCount`, {
			type: 'state',
			common: {
				name: {
					en: 'Number of devices with battery',
					de: 'Anzahl der Geräte mit Batterie',
					ru: 'Количество устройств c батареей',
					pt: 'Número de dispositivos com bateria',
					nl: 'Nummer van apparaten met batterij',
					fr: 'Nombre de dispositifs avec batterie',
					it: 'Numero di dispositivi con batteria',
					es: 'Número de dispositivos con batería',
					pl: 'Liczba urządzeń z baterią',
					'zh-cn': '电池的装置数量',
				},
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
	}

	/**
	 * @param {object} [adptName] - Adaptername of devices
	 **/
	async createHtmlListDatapoints(adptName) {
		let dpSubFolder;
		//write the datapoints in subfolders with the adaptername otherwise write the dP's in the root folder
		if (adptName) {
			dpSubFolder = `${adptName}.`;
		} else {
			dpSubFolder = '';
		}

		await this.setObjectNotExistsAsync(`${dpSubFolder}offlineListHTML`, {
			type: 'state',
			common: {
				name: {
					en: 'HTML List of offline devices',
					de: 'HTML Liste der Offline-Geräte',
					ru: 'HTML Список оффлайн устройств',
					pt: 'HTML Lista de dispositivos off-line',
					nl: 'HTML List van offline apparatuur',
					fr: 'HTML Liste des dispositifs hors ligne',
					it: 'HTML Elenco dei dispositivi offline',
					es: 'HTML Lista de dispositivos sin conexión',
					pl: 'HTML Lista urządzeń offline',
					'zh-cn': 'HTML 线装置清单',
				},
				type: 'string',
				role: 'html',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${dpSubFolder}linkQualityListHTML`, {
			type: 'state',
			common: {
				name: {
					en: 'HTML List of devices with signal strength',
					de: 'HTML Liste der Geräte mit Signalstärke',
					ru: 'HTML Список устройств с силой сигнала',
					pt: 'HTML Lista de dispositivos com força de sinal',
					nl: 'HTML List van apparaten met signaalkracht',
					fr: 'HTML Liste des dispositifs avec force de signal',
					it: 'HTML Elenco dei dispositivi con forza del segnale',
					es: 'HTML Lista de dispositivos con fuerza de señal',
					pl: 'HTML Lista urządzeń z siłą sygnałową',
					'zh-cn': 'HTML 具有信号实力的装置清单',
				},
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${dpSubFolder}batteryListHTML`, {
			type: 'state',
			common: {
				name: {
					en: 'HTML List of devices with battery state',
					de: 'HTML Liste der Geräte mit Batteriezustand',
					ru: 'HTML Список устройств с состоянием батареи',
					pt: 'HTML Lista de dispositivos com estado da bateria',
					nl: 'HTML List van apparaten met batterij staat',
					fr: 'HTML Liste des appareils avec état de batterie',
					it: 'HTML Elenco dei dispositivi con stato della batteria',
					es: 'HTML Lista de dispositivos con estado de batería',
					pl: 'HTML Lista urządzeń z baterią stanową',
					'zh-cn': 'HTML 电池国装置清单',
				},
				type: 'string',
				role: 'html',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${dpSubFolder}lowBatteryListHTML`, {
			type: 'state',
			common: {
				name: {
					en: 'HTML List of devices with low battery state',
					de: 'HTML Liste der Geräte mit niedrigem Batteriezustand',
					ru: 'HTML Список устройств с низким состоянием батареи',
					pt: 'HTML Lista de dispositivos com baixo estado da bateria',
					nl: 'HTML List van apparaten met lage batterij staat',
					fr: 'HTML Liste des appareils à faible état de batterie',
					it: 'HTML Elenco di dispositivi con stato di batteria basso',
					es: 'HTML Lista de dispositivos con estado de batería bajo',
					pl: 'HTML Lista urządzeń o niskim stanie baterii',
					'zh-cn': 'HTML 低电池国家装置清单',
				},
				type: 'string',
				role: 'html',
				read: true,
				write: false,
			},
			native: {},
		});
	}

	/**
	 * @param {string} codePart - Message Prefix
	 * @param {object} error - Sentry message
	 */
	errorReporting(codePart, error) {
		const msg = `[${codePart}] error: ${error.message}`;
		if (enableSendSentry) {
			if (this.supportsFeature && this.supportsFeature('PLUGINS')) {
				const sentryInstance = this.getPluginInstance('sentry');
				if (sentryInstance) {
					this.log.warn(`Error catched and sent to Sentry, error: ${msg}`);
					sentryInstance.getSentryObject().captureException(msg);
				}
			}
		} else {
			this.log.error(`Sentry disabled, error catched : ${msg}`);
		}
	} // <-- end of errorReporting

	/**
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if (this.refreshDataTimeout) {
				this.log.debug('clearing refresh timeout');
				this.clearTimeout(this.refreshDataTimeout);
			}
			isUnloaded = true;

			this.log.info('cleaned everything up...');

			callback();
		} catch (e) {
			callback();
		}
	}
}

// @ts-ignore parent is a valid property on module
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
