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
		this.listAllDevicesPath = [];
		this.blacklistLists = [];
		this.blacklistNotify = [];
		this.arrDev = [];
		this.adapterSelected = [];

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
				ham: this.config.hamDevices,
				harmony: this.config.harmonyDevices,
				hmiP : this.config.hmiPDevices,
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
				switchbotBle: this.config.switchbotBleDevices,
				tado: this.config.tadoDevices,
				tradfri: this.config.tradfriDevices,
				unifi: this.config.unifiDevices,
				wled: this.config.wledDevices,
				yeelight: this.config.yeelightDevices,
				zigbee: this.config.zigbeeDevices,
				zigbee2mqtt: this.config.zigbee2mqttDevices,
				zwave: this.config.zwaveDevices,
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

				this.log.info(`Number of selected adapters: ${this.adapterSelected.length}. Loading data from: ${(this.adapterSelected).join(', ')} ...`);
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
						if ((this.supAdapter !== undefined) && (this.supAdapter[id])) {

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
				if(obj.message){
					try{
						result = this.listAllDevicesPath;
						for(const element in result){
							const label = result[element].Device + '  - Adapter: ' + result[element].Adapter;
							const myValueObject = {deviceName: result[element].Device, adapter: result[element].Adapter, path: result[element].Path};
							devices[myCount] = {label: label,value: JSON.stringify(myValueObject)};
							myCount ++;
						}
						this.sendTo(obj.from, obj.command, devices, obj.callback);
					}
					catch(error){
						this.sendTo(obj.from, obj.command, obj.callback);
					}
				}
				else{
					this.sendTo(obj.from, obj.command, obj.callback);
				}
				break;
		}
	}

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

	async main() {
		this.log.debug(`Function started: ${this.main.name}`);

		try {
			// fill datapoints for each adapter if selected
			try {
				for (const [id] of Object.entries(arrApart)) {
					if (!isUnloaded) {
						if ((this.supAdapter !== undefined) && (this.supAdapter[id])) {
							if (this.config.createOwnFolder) {
								await this.createDataForEachAdapter(id);
								this.log.debug(`Created and filled data for each adapter`);
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

		} catch (error) {
			this.errorReporting('[main]', error);
		}

		this.log.debug(`Function finished: ${this.main.name}`);
	} //<--End of main function


	/**
	 * @param {string} sentence - Word which should be capitalize
	 */
	async capitalize(sentence) {
		//make the first letter uppercase
		return sentence && sentence[0].toUpperCase() + sentence.slice(1);
	}

	/**
	 * @param {number} dpValue - get Time of this datapoint
	 */
	async getTimestamp(dpValue) {
		const time = new Date();
		return dpValue = Math.round((time.getTime() - dpValue) / 1000 / 60);
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

	async createBlacklist() {
		this.log.debug(`Function started: ${this.createBlacklist.name}`);

		if (!isUnloaded) {
			const myBlacklist = this.config.tableBlacklist;

			for (const i in myBlacklist) {
				const blacklistParse = JSON.parse(myBlacklist[i].devices);
				// push devices in list to ignor device in lists
				if (myBlacklist[i].checkIgnorLists) {
					this.blacklistLists.push(blacklistParse.path);
				}
				// push devices in list to ignor device in notifications
				if (myBlacklist[i].checkIgnorNotify) {
					this.blacklistNotify.push(blacklistParse.deviceName);
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
		const currDeviceString = id.slice(0, (id.lastIndexOf('.') + 1) - 1);
		const shortCurrDeviceString = currDeviceString.slice(0, (currDeviceString.lastIndexOf('.') + 1) - 1);
		const shortshortCurrDeviceString = shortCurrDeviceString.slice(0, (shortCurrDeviceString.lastIndexOf('.') + 1) - 1);

		// Get device name
		const deviceObject = await this.getForeignObjectAsync(currDeviceString);
		const shortDeviceObject = await this.getForeignObjectAsync(shortCurrDeviceString);
		const shortshortDeviceObject = await this.getForeignObjectAsync(shortshortCurrDeviceString);
		let deviceName;

		// Get ID with currDeviceString from datapoint
		switch (this.arrDev[i].adapter) {
			// Get ID for Switchbot and ESPHome Devices
			case 'switchbotBle':
			case 'esphome':
				deviceName = await this.getInitValue(currDeviceString + this.arrDev[i].id);
				break;

			// Get ID with short currDeviceString from objectjson
			case 'hue-extended':
			case 'hmrpc':
			case 'nuki-extended':
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

			//Get ID of foldername
			case 'yeelight-2':
				deviceName = shortCurrDeviceString.slice(shortCurrDeviceString.lastIndexOf('.') + 1);
				break;

			// Get ID with main selektor from objectjson
			default:
				if (deviceObject && typeof deviceObject === 'object') {
					if (deviceObject.common.name['de'] != undefined) {
						deviceName = deviceObject.common.name['de'];
					} else if (deviceObject.common.name['en'] != undefined) {
						deviceName = deviceObject.common.name['en'];
					} else {
						deviceName = deviceObject.common.name;
					}
				}
				break;
		}
		return deviceName;
	}

	/**
	 * Create Lists
	 */
	async createLists() {
		// LinkQuality Lists
		this.linkQualityDevices = [];
		for (const device of this.listAllDevices) {
			if (device['Signal strength'] != ' - ') {
				this.linkQualityDevices.push(
					{
						'Device': device['Device'],
						'Adapter': device['Adapter'],
						'Signal strength': device['Signal strength']
					}
				);
			}
		}
		// this.log.warn(JSON.stringify(i['Signal strength']));

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
	}

	/**
	 * @param {object} i - Device Object
	 */
	async createData(i) {
		const devices = await this.getForeignStatesAsync(this.arrDev[i].Selektor);
		const deviceAdapterName = await this.capitalize(this.arrDev[i].adapter);

		/*----------  Start of second main loop  ----------*/
		for (const [id] of Object.entries(devices)) {
			if (!isUnloaded) {

				if (!this.blacklistLists.includes(id)) {

					const deviceName = await this.getDeviceName(id, i);

					const currDeviceString = id.slice(0, (id.lastIndexOf('.') + 1) - 1);
					const shortCurrDeviceString = currDeviceString.slice(0, (currDeviceString.lastIndexOf('.') + 1) - 1);

					// Get battery states
					const deviceBatteryState = await this.getInitValue(currDeviceString + this.arrDev[i].battery);
					const shortDeviceBatteryState = await this.getInitValue(shortCurrDeviceString + this.arrDev[i].battery);
					const shortDeviceBatteryState2 = await this.getInitValue(shortCurrDeviceString + this.arrDev[i].battery2);


					//this.devices[deviceName] = currDeviceString + this.arrDev[i].reach;

					/*for (const [value] of Object.entries(this.devices)) {
						this.log.warn(`${value}`);
						this.subscribeForeignStatesAsync(value);
					}*/
					//this.subscribeForeignStatesAsync(currDeviceString + this.arrDev[i].reach);
					// <--- END TEST

					// Get link quality
					let deviceQualityState;
					let linkQuality;

					switch (this.arrDev[i].adapter) {
						case 'sonoff':
						case 'hmiP':
						case 'hmrpc':
						case 'wled':
						case 'shelly':
						case 'lupusec':
							deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiState);
							break;

						case 'mihomeVacuum':
							deviceQualityState = await this.getForeignStateAsync(shortCurrDeviceString + this.arrDev[i].rssiState);
							break;

						case 'tradfri':
						case 'ham':
						case 'meross':
						case 'nut':
						case 'miHome':
						case 'unifi':
						case 'hs100':
						case 'maxcube':
							deviceQualityState;
							break;

						case 'netatmo':
							deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiState);
							if (!deviceQualityState) {
								deviceQualityState = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rfState);
							}
							break;

						default:
							deviceQualityState = await this.getForeignStateAsync(id);
							break;
					}

					if (deviceQualityState) {
						switch (typeof deviceQualityState.val) {
							case 'number':
								if (this.config.trueState) {
									linkQuality = deviceQualityState.val;
								} else {
									switch (this.arrDev[i].adapter) {
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
											} else if ((deviceQualityState.val) >= 0) {
												linkQuality = parseFloat((100 / 255 * deviceQualityState.val).toFixed(0)) + '%';
											}
											break;
									}
								}
								break;

							case 'string':
								switch (this.arrDev[i].adapter) {
									case 'netatmo':
									// for Netatmo devices
										linkQuality = deviceQualityState.val;
										break;
									case 'nuki-extended':
										linkQuality = ' - ';
										break;
								}
								break;
							case 'undefined':
								linkQuality = ' - ';
								break;
							default:
								linkQuality = ' - ';
						}
					}

					// When was the last contact to the device?
					let lastContactString;
					let deviceState = 'Online';
					let lastDeviceUnreachStateChange;

					const deviceMainSelector = await this.getForeignStateAsync(id);
					const deviceStateSelector = await this.getForeignStateAsync(shortCurrDeviceString + this.arrDev[i].stateValue); // for hmrpc devices
					const rssiPeerSelector = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].rssiPeerState);

					if (deviceMainSelector) {
						try {
							const lastContact = await this.getTimestamp(deviceMainSelector.ts);
							const lastStateChange = await this.getTimestamp(deviceMainSelector.lc);
							const deviceUnreachState = await this.getInitValue(currDeviceString + this.arrDev[i].reach);
							const deviceUnreachSelector = await this.getForeignStateAsync(currDeviceString + this.arrDev[i].reach);
							if (deviceUnreachSelector) {lastDeviceUnreachStateChange = await this.getTimestamp(deviceUnreachSelector.lc);}
							const shortDeviceUnreachState = await this.getForeignStateAsync(shortCurrDeviceString + this.arrDev[i].reach);

							const getLastContact = async () => {
								lastContactString = this.formatDate(new Date((deviceMainSelector.ts)), 'hh:mm') + ' Uhr';
								if (Math.round(lastContact) > 100) {
									lastContactString = Math.round(lastContact / 60) + ' Stunden';
								}
								if (Math.round(lastContact / 60) > 48) {
									lastContactString = Math.round(lastContact / 60 / 24) + ' Tagen';
								}
								return lastContactString;
							};

							const getLastStateChange = async () => {
								lastContactString = this.formatDate(new Date((deviceMainSelector.lc)), 'hh:mm') + ' Uhr';
								if (Math.round(lastStateChange) > 100) {
									lastContactString = Math.round(lastStateChange / 60) + ' Stunden';
								}
								if (Math.round(lastStateChange / 60) > 48) {
									lastContactString = Math.round(lastStateChange / 60 / 24) + ' Tagen';
								}
								return lastContactString;
							};

							//  If there is no contact since user sets minutes add device in offline list
							// calculate to days after 48 hours
							switch (this.arrDev[i].reach) {
								case 'none':
									await getLastContact();
									break;

								default:
								//State changed
									if  (this.arrDev[i].adapter === 'hmrpc') {
										if (linkQuality != ' - ') {
											if (deviceUnreachState) {
												await getLastStateChange();
											} else {
												await getLastContact();
											}
										} else {
											if (deviceStateSelector) { // because old hm devices don't send rssi states
												const lastContactOfState = await this.getTimestamp(deviceStateSelector.ts);
												const getLastContactOfState = async () => {
													lastContactString = this.formatDate(new Date((deviceStateSelector.ts)), 'hh:mm') + ' Uhr';
													if (Math.round(lastContactOfState) > 100) {
														lastContactString = Math.round(lastContactOfState / 60) + ' Stunden';
													}
													if (Math.round(lastContactOfState / 60) > 48) {
														lastContactString = Math.round(lastContactOfState / 60 / 24) + ' Tagen';
													}
													return lastContactString;
												};
												await getLastContactOfState();
											} else if (rssiPeerSelector) { // because old hm sensors don't send rssi/state values
												const lastContactOfState = await this.getTimestamp(rssiPeerSelector.ts);
												const getLastContactOfState = async () => {
													lastContactString = this.formatDate(new Date((rssiPeerSelector.ts)), 'hh:mm') + ' Uhr';
													if (Math.round(lastContactOfState) > 100) {
														lastContactString = Math.round(lastContactOfState / 60) + ' Stunden';
													}
													if (Math.round(lastContactOfState / 60) > 48) {
														lastContactString = Math.round(lastContactOfState / 60 / 24) + ' Tagen';
													}
													return lastContactString;
												};
												await getLastContactOfState();
											}
										}

									} else {
										if (!deviceUnreachState) {
											await getLastStateChange();
										} else {
											await getLastContact();
										}
										break;
									}
							}

							const pushOfflineDevice = async () => {
								if (this.listOnlyBattery) {	//if checked, list only battery devices
									if (deviceBatteryState || shortDeviceBatteryState) {
										this.offlineDevices.push(
											{
												'Device': deviceName,
												'Adapter': deviceAdapterName,
												'Last contact': lastContactString
											}
										);
									}
								} else {
									this.offlineDevices.push( 	//else push all devices
										{
											'Device': deviceName,
											'Adapter': deviceAdapterName,
											'Last contact': lastContactString
										}
									);
								}
							};

							switch (this.arrDev[i].adapter) {
								case 'alexa2':
									if (this.config.alexa2MaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.alexa2MaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'ble':
									if (this.config.bleMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.bleMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'deconz':
									if (this.config.deconzMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.deconzMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'enocean':
									if (this.config.enoceanMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.enoceanMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'esphome':
									if (this.config.esphomeMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.esphomeMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'fritzDect':
									if (this.config.fritzdectMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.fritzdectMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'harmony':
									if (this.config.harmonyMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.harmonyMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'ham':
									if (this.config.hamMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.hamMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'hmiP':
									if (this.config.hmiPMaxMinutes === -1) {
										if (deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.hmiPMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'hmrpc':
									if (this.config.hmrpcMaxMinutes === -1) {
										if (deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.hmrpcMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'hs100':
									if (this.config.hs100MaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.hs100MaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'hue':
									if (this.config.hueMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.hueMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'hue-extended':
									if (this.config.hueextMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.hueextMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'jeelink':
									if (this.config.jeelinkMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.jeelinkMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'lupusec':
									if (this.config.lupusecMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.lupusecMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'maxcube':
									if (this.config.maxcubeMaxMinutes === -1) {
										if (deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.maxcubeMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'meross':
									if (this.config.merossMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.merossMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'miHome':
									if (this.arrDev[i].battery === 'none') {
										if (this.config.mihomeGWMaxMinutes === -1) {
											if (!deviceUnreachState) {
												deviceState = 'Offline'; //set online state to offline
												await pushOfflineDevice();
											}
										} else if (lastContact > this.config.mihomeGWMaxMinutes) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else {
										if (this.config.mihomeMaxMinutes === -1) {
											if (!deviceUnreachState) {
												deviceState = 'Offline'; //set online state to offline
												await pushOfflineDevice();
											}
										} else if (lastContact > this.config.mihomeMaxMinutes) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									}
									break;
								case 'mihomeVacuum':
									if (this.config.mihomeVacuumMaxMinutes === -1) {
										if (!shortDeviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.mihomeVacuumMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'netatmo':
									if (this.config.netatmoMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.netatmoMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'nuki-extended':
									if (this.config.nukiextendMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.nukiextendMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'nut':
									if (this.config.nutMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.nutMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'ping':
									if (this.config.pingMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if ((lastStateChange > this.config.pingMaxMinutes) && (!deviceUnreachState)) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'roomba':
									if (this.config.roombaMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.roombaMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'shelly':
									if (this.config.shellyMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if ((!deviceUnreachState) && (typeof lastDeviceUnreachStateChange !== 'undefined') && (lastDeviceUnreachStateChange > this.config.shellyMaxMinutes)) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'sonoff':
									if (this.config.sonoffMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if ((!deviceUnreachState) && (typeof lastDeviceUnreachStateChange !== 'undefined') && (lastDeviceUnreachStateChange > this.config.sonoffMaxMinutes)) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'sonos':
									if (this.config.sonosMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.sonosMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'switchbotBle':
									if (this.config.switchbotMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.switchbotMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'tado':
									if (this.config.tadoMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.tadoMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'tradfri':
									if (this.config.tradfriMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.tradfriMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'unifi':
									if (this.config.unifiMaxMinutes === -1) {
										if (deviceUnreachState === 0) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.unifiMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'wled':
									if (this.config.wledMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.wledMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'yeelight-2':
									if (this.config.yeelightMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.yeelightMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'zigbee':
									if (this.config.zigbeeMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.zigbeeMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'zigbee2MQTT':
									if (this.config.zigbee2mqttMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.zigbee2mqttMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
								case 'zwave':
									if (this.config.zwaveMaxMinutes === -1) {
										if (!deviceUnreachState) {
											deviceState = 'Offline'; //set online state to offline
											await pushOfflineDevice();
										}
									} else if (lastContact > this.config.zwaveMaxMinutes) {
										deviceState = 'Offline'; //set online state to offline
										await pushOfflineDevice();
									}
									break;
							}
						} catch (error) {
							this.errorReporting('[getLastContact]', error);
						}
					}

					// Get battery states
					let batteryHealth;
					let deviceLowBatState = await this.getInitValue(currDeviceString + this.arrDev[i].isLowBat);
					if (deviceLowBatState === undefined) {
						deviceLowBatState = await this.getInitValue(currDeviceString + this.arrDev[i].isLowBat2);
					}

					if ((!deviceBatteryState) && (!shortDeviceBatteryState) && (!shortDeviceBatteryState2)) {
						if (deviceLowBatState !== undefined) {
							switch (this.arrDev[i].isLowBat || this.arrDev[i].isLowBat2) {
								case 'none':
									batteryHealth = ' - ';
									break;
								default:
									if ((deviceLowBatState === false) || (deviceLowBatState === 'NORMAL') || (deviceLowBatState === 1)) {
										batteryHealth = 'ok';
									} else {
										batteryHealth = 'low';
									}
									break;
							}
							this.batteryPowered.push(
								{
									'Device': deviceName,
									'Adapter': deviceAdapterName,
									'Battery': batteryHealth
								}
							);
						} else {
							batteryHealth = ' - ';
						}
					} else {
						switch (this.arrDev[i].adapter) {
							case 'hmrpc':
								if (deviceBatteryState === 0) {
									batteryHealth = ' - ';
								} else {
									batteryHealth = deviceBatteryState + 'V';
								}

								this.batteryPowered.push(
									{
										'Device': deviceName,
										'Adapter': deviceAdapterName,
										'Battery': batteryHealth
									}
								);
								break;

							case 'hue-extended':
								if (shortDeviceBatteryState) {
									batteryHealth = shortDeviceBatteryState + '%';
									this.batteryPowered.push(
										{
											'Device': deviceName,
											'Adapter': deviceAdapterName,
											'Battery': batteryHealth
										}
									);
								}
								break;
							case 'mihomeVacuum':
								if (shortDeviceBatteryState) {
									batteryHealth = shortDeviceBatteryState + '%';
									this.batteryPowered.push(
										{
											'Device': deviceName,
											'Adapter': deviceAdapterName,
											'Battery': batteryHealth
										}
									);
								} else if (shortDeviceBatteryState2) {
									batteryHealth = shortDeviceBatteryState2 + '%';
									this.batteryPowered.push(
										{
											'Device': deviceName,
											'Adapter': deviceAdapterName,
											'Battery': batteryHealth
										}
									);
								}
								break;
							default:
								batteryHealth = (deviceBatteryState) + '%';
								this.batteryPowered.push(
									{
										'Device': deviceName,
										'Adapter': deviceAdapterName,
										'Battery': batteryHealth
									}
								);
						}
					}

					// fill list with low battery devices
					switch (this.arrDev[i].adapter) {
						case 'hmrpc': // there are differnt low bat states between hm and hmIp devices
							if (deviceLowBatState) {
								this.batteryLowPowered.push(
									{
										'Device': deviceName,
										'Adapter': deviceAdapterName,
										'Battery': batteryHealth
									}
								);
							}
							break;
						case 'tado': // there is an string as indicator
							if (deviceLowBatState != 'NORMAL') {
								this.batteryLowPowered.push(
									{
										'Device': deviceName,
										'Adapter': deviceAdapterName,
										'Battery': batteryHealth
									}
								);
							}
							break;

						default: // for all other devices with low bat states
							if ((deviceLowBatState === true) || (deviceLowBatState === 0)) {
								this.batteryLowPowered.push(
									{
										'Device': deviceName,
										'Adapter': deviceAdapterName,
										'Battery': batteryHealth
									}
								);
							} else if (deviceBatteryState && (deviceBatteryState < this.config.minWarnBatterie)) { // if the battery state is under the set limit
								this.batteryLowPowered.push(
									{
										'Device': deviceName,
										'Adapter': deviceAdapterName,
										'Battery': batteryHealth
									}
								);
							}
					}

					if (this.listOnlyBattery) {   // 4. Add only devices with battery in the list
						if (deviceBatteryState || shortDeviceBatteryState) {
							this.listAllDevices.push(
								{
									'Device': deviceName,
									'Adapter': deviceAdapterName,
									'Battery': batteryHealth,
									'Signal strength': linkQuality,
									'Last contact': lastContactString,
									'Status': deviceState
								}
							);
							this.listAllDevicesPath.push(
								{
									'Device': deviceName,
									'Adapter': deviceAdapterName,
									'Path': id
								}
							);
						}
					} else if (!this.listOnlyBattery) { // 4. Add all devices
						this.listAllDevices.push(
							{
								'Device': deviceName,
								'Adapter': deviceAdapterName,
								'Battery': batteryHealth,
								'Signal strength': linkQuality,
								'Last contact': lastContactString,
								'Status': deviceState
							}
						);
						this.listAllDevicesPath.push(
							{
								'Device': deviceName,
								'Adapter': deviceAdapterName,
								'Path': id
							}
						);
					}
				}
			} else {
				return; // cancel run if unloaded was called.
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

		try {
			await this.resetVars(); // reset the arrays and counts

			for (let i = 0; i < this.arrDev.length; i++) {

				if (this.arrDev[i].adapter.includes(adptName)) { // list device only if selected adapter matched with device
					await this.createData(i);
				}
			}
			await this.writeDatapoints(adptName); // fill the datapoints
		} catch (error) {
			this.errorReporting('[createDataForEachAdapter]', error);
		}

		this.log.debug(`Function finished: ${this.createDataForEachAdapter.name}`);
	} // <-- end of createDataForEachAdapter

	async createDataOfAllAdapter() {
		// create Data of all selected adapter in one list
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

			// fill the datapoints
			await this.writeDatapoints();
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
						priority: this.config.prioPushover
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
						chatId: this.config.chatIdTelegram
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
						phone: this.config.phoneWhatsapp
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
						subject: this.config.subjectEmail
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
					await this.setForeignStateAsync(`${this.config.instanceJarvis}.addNotification`, '{"title":"' + this.config.titleJarvis + ' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message": ' + jsonText + ',"display": "drawer"}');
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
					await this.setForeignStateAsync(`${this.config.instanceLovelace}.notifications.add`, '{"message":' + jsonText + ', "title":"' + this.config.titleLovelace + ' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}');
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Lovelace]', error);
		}
	} // <-- End of sendNotification function

	async sendBatteryNotifyShedule() {
		// send message for low battery devices

		const time = (this.config.checkSendBatteryTime).split(':');

		const checkDays = []; // list of selected days

		// push the selected days in list
		if (this.config.checkMonday) checkDays.push(1);
		if (this.config.checkTuesday) checkDays.push(2);
		if (this.config.checkWednesday) checkDays.push(3);
		if (this.config.checkThursday) checkDays.push(4);
		if (this.config.checkFriday) checkDays.push(5);
		if (this.config.checkSaturday) checkDays.push(6);
		if (this.config.checkSunday) checkDays.push(0);

		if (checkDays.length >= 1) { // check if an day is selected
			this.log.debug(`Number of selected days for daily battery message: ${checkDays.length}. Send Message on: ${(checkDays).join(', ')} ...`);
		} else {
			this.log.warn(`No days selected for daily battery message. Please check the instance configuration!`);
			return; // cancel function if no day is selected
		}

		if (!isUnloaded) {
			const cron = '10 ' + time[1] + ' ' + time[0] + ' * * ' + checkDays;
			schedule.scheduleJob(cron, () => {
				try {
					let deviceList = '';

					for (const id of this.batteryLowPowered) {
						if (!this.blacklistNotify.includes(id['Device'])) {
							deviceList = `${deviceList}\n${id['Device']} (${id['Battery']})`;
						}
					}

					if ((this.lowBatteryPoweredCount > 0) && (deviceList.length > 0)) {
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

	async sendOfflineNotifications() {
		// send message if an device is offline

		this.log.debug(`Start the function: ${this.sendOfflineNotifications.name}`);

		try {
			let msg = '';
			let deviceList = '';
			const offlineDevicesCountOld = await this.getOwnInitValue('offlineCount');

			if ((this.offlineDevicesCount !== offlineDevicesCountOld)) {

				for (const id of this.offlineDevices) {
					if (!this.blacklistNotify.includes(id['Device'])) {
						deviceList = `${deviceList}\n${id['Device']} (${id['Last contact']})`;
					}
				}
				if (deviceList.length > 0) {
					if (deviceList.length == 0) {
						msg = 'Alle Geräte sind Online.';
					} else if (deviceList.length == 1) {	// make singular if it is only one device
						msg = 'Folgendes Gerät ist seit einiger Zeit nicht erreichbar: \n';
					} else if (deviceList.length >= 2) {		//make plural if it is more than one device
						msg = `Folgende Geräte sind seit einiger Zeit nicht erreichbar: \n`;
					}

					this.log.info(msg + deviceList);
					await this.setStateAsync('lastNotification', msg + deviceList, true);
					await this.sendNotification(msg + deviceList);
				}

			}
		} catch (error) {
			this.errorReporting('[sendOfflineMessage]', error);
		}
		this.log.debug(`Finished the function: ${this.sendOfflineNotifications.name}`);
	}//<--End of offline notification

	async sendOfflineNotificationsShedule() {
		// send daily an overview with offline devices

		const time = (this.config.checkSendOfflineTime).split(':');

		const checkDays = []; // list of selected days

		// push the selected days in list
		if (this.config.checkOfflineMonday) checkDays.push(1);
		if (this.config.checkOfflineTuesday) checkDays.push(2);
		if (this.config.checkOfflineWednesday) checkDays.push(3);
		if (this.config.checkOfflineThursday) checkDays.push(4);
		if (this.config.checkOfflineFriday) checkDays.push(5);
		if (this.config.checkOfflineSaturday) checkDays.push(6);
		if (this.config.checkOfflineSunday) checkDays.push(0);

		if (checkDays.length >= 1) { // check if an day is selected
			this.log.debug(`Number of selected days for daily offline message: ${checkDays.length}. Send Message on: ${(checkDays).join(', ')} ...`);
		} else {
			this.log.warn(`No days selected for daily offline message. Please check the instance configuration!`);
			return; // cancel function if no day is selected
		}

		if (!isUnloaded) {
			const cron = '10 ' + time[1] + ' ' + time[0] + ' * * ' + checkDays;
			schedule.scheduleJob(cron, () => {
				try {
					let deviceList = '';

					for (const id of this.offlineDevices) {
						if (!this.blacklistNotify.includes(id['Device'])) {
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
	}//<--End of daily offline notification

	async resetVars() {
		//Reset all arrays and counts
		this.log.debug(`Function started: ${this.resetVars.name}`);

		// arrays
		this.offlineDevices = [];
		this.linkQualityDevices = [];
		this.batteryPowered = [];
		this.batteryLowPowered = [];
		this.listAllDevices = [];
		this.listAllDevicesPath = [];
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
				this.listAllDevices = [{ 'Device': '--none--', 'Adapter': '', 'Battery': '', 'Last contact': '', 'Signal strength': '' }];
			}
			await this.setStateAsync(`${dpSubFolder}listAll`, { val: JSON.stringify(this.listAllDevices), ack: true });

			if (this.linkQualityCount == 0) {
				// if no device is count, write the JSON List with default value
				this.linkQualityDevices = [{ 'Device': '--none--', 'Adapter': '', 'Signal strength': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}linkQualityList`, { val: JSON.stringify(this.linkQualityDevices), ack: true });
			//write HTML list
			if (this.config.createHtmlList) await this.setStateAsync(`${dpSubFolder}linkQualityListHTML`, { val: await this.creatLinkQualityListHTML(this.linkQualityDevices, this.linkQualityCount), ack: true });

			if (this.offlineDevicesCount == 0) {
				// if no device is count, write the JSON List with default value
				this.offlineDevices = [{ 'Device': '--none--', 'Adapter': '', 'Last contact': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}offlineList`, { val: JSON.stringify(this.offlineDevices), ack: true });
			//write HTML list
			if (this.config.createHtmlList) await this.setStateAsync(`${dpSubFolder}offlineListHTML`, { val: await this.createOfflineListHTML(this.offlineDevices, this.offlineDevicesCount), ack: true });

			if (this.batteryPoweredCount == 0) {
				// if no device is count, write the JSON List with default value
				this.batteryPowered = [{ 'Device': '--none--', 'Adapter': '', 'Battery': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}batteryList`, { val: JSON.stringify(this.batteryPowered), ack: true });
			//write HTML list
			if (this.config.createHtmlList) await this.setStateAsync(`${dpSubFolder}batteryListHTML`, { val: await this.createBatteryListHTML(this.batteryPowered, this.batteryPoweredCount, false), ack: true });

			if (this.lowBatteryPoweredCount == 0) {
				// if no device is count, write the JSON List with default value
				this.batteryLowPowered = [{ 'Device': '--none--', 'Adapter': '', 'Battery': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}lowBatteryList`, { val: JSON.stringify(this.batteryLowPowered), ack: true });
			//write HTML list
			if (this.config.createHtmlList) await this.setStateAsync(`${dpSubFolder}lowBatteryListHTML`, { val: await this.createBatteryListHTML(this.batteryLowPowered, this.lowBatteryPoweredCount, true), ack: true });

			// create timestamp of last run
			const lastCheck = this.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + this.formatDate(new Date(), 'hh:mm:ss');
			await this.setStateAsync('lastCheck', lastCheck, true);
		}
		catch (error) {
			this.errorReporting('[writeDatapoints]', error);
		}
		this.log.debug(`Function finished: ${this.writeDatapoints.name}`);
	}//<--End  of writing Datapoints

	/**
	 * @param {object} devices - Device
	 * @param {number} deviceCount - Counted devices
	 */
	async creatLinkQualityListHTML(devices, deviceCount) {
		devices = devices.sort((a, b) => { return a.Device.localeCompare(b.Device); });
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
		devices = devices.sort((a, b) => { return a.Device.localeCompare(b.Device); });
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
		devices = devices.sort((a, b) => { return a.Device.localeCompare(b.Device); });
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
			'type': 'state',
			'common': {
				'name': {
					'en': 'Number of devices offline',
					'de': 'Anzahl der Geräte offline',
					'ru': 'Количество устройств offline',
					'pt': 'Número de dispositivos offline',
					'nl': 'Nummer van apparatuur offline',
					'fr': 'Nombre de dispositifs hors ligne',
					'it': 'Numero di dispositivi offline',
					'es': 'Número de dispositivos sin conexión',
					'pl': 'Ilość urządzeń offline',
					'zh-cn': '线内装置数量'
				},
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.offlineList`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'List of offline devices',
					'de': 'Liste der Offline-Geräte',
					'ru': 'Список оффлайн устройств',
					'pt': 'Lista de dispositivos off-line',
					'nl': 'List van offline apparatuur',
					'fr': 'Liste des dispositifs hors ligne',
					'it': 'Elenco dei dispositivi offline',
					'es': 'Lista de dispositivos sin conexión',
					'pl': 'Lista urządzeń offline',
					'zh-cn': '线装置清单'
				},
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.listAll`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'List of all devices',
					'de': 'Liste aller Geräte',
					'ru': 'Список всех устройств',
					'pt': 'Lista de todos os dispositivos',
					'nl': 'List van alle apparaten',
					'fr': 'Liste de tous les dispositifs',
					'it': 'Elenco di tutti i dispositivi',
					'es': 'Lista de todos los dispositivos',
					'pl': 'Lista wszystkich urządzeń',
					'zh-cn': '所有装置清单'
				},
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.linkQualityList`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'List of devices with signal strength',
					'de': 'Liste der Geräte mit Signalstärke',
					'ru': 'Список устройств с силой сигнала',
					'pt': 'Lista de dispositivos com força de sinal',
					'nl': 'List van apparaten met signaalkracht',
					'fr': 'Liste des dispositifs avec force de signal',
					'it': 'Elenco dei dispositivi con forza del segnale',
					'es': 'Lista de dispositivos con fuerza de señal',
					'pl': 'Lista urządzeń z siłą sygnałową',
					'zh-cn': '具有信号实力的装置清单'
				},
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.countAll`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'Number of all devices',
					'de': 'Anzahl aller Geräte',
					'ru': 'Количество всех устройств',
					'pt': 'Número de todos os dispositivos',
					'nl': 'Nummer van alle apparaten',
					'fr': 'Nombre de tous les appareils',
					'it': 'Numero di tutti i dispositivi',
					'es': 'Número de todos los dispositivos',
					'pl': 'Ilość wszystkich urządzeń',
					'zh-cn': '所有装置的数目'
				},
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.batteryList`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'List of devices with battery state',
					'de': 'Liste der Geräte mit Batteriezustand',
					'ru': 'Список устройств с состоянием батареи',
					'pt': 'Lista de dispositivos com estado da bateria',
					'nl': 'List van apparaten met batterij staat',
					'fr': 'Liste des appareils avec état de batterie',
					'it': 'Elenco dei dispositivi con stato della batteria',
					'es': 'Lista de dispositivos con estado de batería',
					'pl': 'Lista urządzeń z baterią stanową',
					'zh-cn': '电池国装置清单'
				},
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.lowBatteryList`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'List of devices with low battery state',
					'de': 'Liste der Geräte mit niedrigem Batteriezustand',
					'ru': 'Список устройств с низким состоянием батареи',
					'pt': 'Lista de dispositivos com baixo estado da bateria',
					'nl': 'List van apparaten met lage batterij staat',
					'fr': 'Liste des appareils à faible état de batterie',
					'it': 'Elenco di dispositivi con stato di batteria basso',
					'es': 'Lista de dispositivos con estado de batería bajo',
					'pl': 'Lista urządzeń o niskim stanie baterii',
					'zh-cn': '低电池国家装置清单'
				},
				'type': 'array',
				'role': 'json',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.lowBatteryCount`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'Number of devices with low battery',
					'de': 'Anzahl der Geräte mit niedriger Batterie',
					'ru': 'Количество устройств c низкой батареей',
					'pt': 'Número de dispositivos com bateria baixa',
					'nl': 'Nummer van apparaten met lage batterij',
					'fr': 'Nombre de dispositifs avec batterie basse',
					'it': 'Numero di dispositivi con batteria bassa',
					'es': 'Número de dispositivos con batería baja',
					'pl': 'Liczba urządzeń z niską baterią',
					'zh-cn': '低电池的装置数量'
				},
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${adptName}.batteryCount`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'Number of devices with battery',
					'de': 'Anzahl der Geräte mit Batterie',
					'ru': 'Количество устройств c батареей',
					'pt': 'Número de dispositivos com bateria',
					'nl': 'Nummer van apparaten met batterij',
					'fr': 'Nombre de dispositifs avec batterie',
					'it': 'Numero di dispositivi con batteria',
					'es': 'Número de dispositivos con batería',
					'pl': 'Liczba urządzeń z baterią',
					'zh-cn': '电池的装置数量'
				},
				'type': 'number',
				'role': 'value',
				'read': true,
				'write': false,
			},
			'native': {}
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
			'type': 'state',
			'common': {
				'name': {
					'en': 'HTML List of offline devices',
					'de': 'HTML Liste der Offline-Geräte',
					'ru': 'HTML Список оффлайн устройств',
					'pt': 'HTML Lista de dispositivos off-line',
					'nl': 'HTML List van offline apparatuur',
					'fr': 'HTML Liste des dispositifs hors ligne',
					'it': 'HTML Elenco dei dispositivi offline',
					'es': 'HTML Lista de dispositivos sin conexión',
					'pl': 'HTML Lista urządzeń offline',
					'zh-cn': 'HTML 线装置清单'
				},
				'type': 'string',
				'role': 'html',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${dpSubFolder}linkQualityListHTML`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'HTML List of devices with signal strength',
					'de': 'HTML Liste der Geräte mit Signalstärke',
					'ru': 'HTML Список устройств с силой сигнала',
					'pt': 'HTML Lista de dispositivos com força de sinal',
					'nl': 'HTML List van apparaten met signaalkracht',
					'fr': 'HTML Liste des dispositifs avec force de signal',
					'it': 'HTML Elenco dei dispositivi con forza del segnale',
					'es': 'HTML Lista de dispositivos con fuerza de señal',
					'pl': 'HTML Lista urządzeń z siłą sygnałową',
					'zh-cn': 'HTML 具有信号实力的装置清单'
				},
				'type': 'string',
				'role': 'value',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${dpSubFolder}batteryListHTML`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'HTML List of devices with battery state',
					'de': 'HTML Liste der Geräte mit Batteriezustand',
					'ru': 'HTML Список устройств с состоянием батареи',
					'pt': 'HTML Lista de dispositivos com estado da bateria',
					'nl': 'HTML List van apparaten met batterij staat',
					'fr': 'HTML Liste des appareils avec état de batterie',
					'it': 'HTML Elenco dei dispositivi con stato della batteria',
					'es': 'HTML Lista de dispositivos con estado de batería',
					'pl': 'HTML Lista urządzeń z baterią stanową',
					'zh-cn': 'HTML 电池国装置清单'
				},
				'type': 'string',
				'role': 'html',
				'read': true,
				'write': false,
			},
			'native': {}
		});

		await this.setObjectNotExistsAsync(`${dpSubFolder}lowBatteryListHTML`, {
			'type': 'state',
			'common': {
				'name': {
					'en': 'HTML List of devices with low battery state',
					'de': 'HTML Liste der Geräte mit niedrigem Batteriezustand',
					'ru': 'HTML Список устройств с низким состоянием батареи',
					'pt': 'HTML Lista de dispositivos com baixo estado da bateria',
					'nl': 'HTML List van apparaten met lage batterij staat',
					'fr': 'HTML Liste des appareils à faible état de batterie',
					'it': 'HTML Elenco di dispositivi con stato di batteria basso',
					'es': 'HTML Lista de dispositivos con estado de batería bajo',
					'pl': 'HTML Lista urządzeń o niskim stanie baterii',
					'zh-cn': 'HTML 低电池国家装置清单'
				},
				'type': 'string',
				'role': 'html',
				'read': true,
				'write': false,
			},
			'native': {}
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
