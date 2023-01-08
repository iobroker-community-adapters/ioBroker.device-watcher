/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */

'use strict';

const utils = require('@iobroker/adapter-core');
const adapterName = require('./package.json').name.split('.').pop();
const schedule = require('node-schedule');
const arrApart = require('./lib/arrApart.js'); // list of supported adapters

// Sentry error reporting, disable when testing code!
const enableSendSentry = false;

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
		this.blacklistAdapterLists = [];
		this.blacklistNotify = [];
		this.selAdapter = [];
		this.adapterSelected = [];
		this.upgradableList = [];

		// raw arrays
		this.listAllDevicesRaw = [];
		this.batteryLowPoweredRaw = [];
		this.offlineDevicesRaw = [];
		this.upgradableDevicesRaw = [];

		// counts
		this.offlineDevicesCount = 0;
		this.deviceCounter = 0;
		this.linkQualityCount = 0;
		this.batteryPoweredCount = 0;
		this.lowBatteryPoweredCount = 0;
		this.upgradableDevicesCount = 0;

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

		try {
			this.listOnlyBattery = this.config.listOnlyBattery;
			this.createOwnFolder = this.config.createOwnFolder;
			this.createHtmlList = this.config.createHtmlList;

			this.configSetAdapter = {
				alexa2: this.config.alexa2Devices,
				apcups: this.config.apcupsDevices,
				ble: this.config.bleDevices,
				deconz: this.config.deconzDevices,
				enocean: this.config.enoceanDevices,
				esphome: this.config.esphomeDevices,
				eusec: this.config.eusecDevices,
				fritzdect: this.config.fritzdectDevices,
				fullybrowser: this.config.fullybrowserDevices,
				ham: this.config.hamDevices,
				harmony: this.config.harmonyDevices,
				hmiP: this.config.hmiPDevices,
				hmrpc: this.config.hmrpcDevices,
				homeconnect: this.config.homeconnectDevices,
				hs100: this.config.hs100Devices,
				hue: this.config.hueDevices,
				hueExt: this.config.hueExtDevices,
				innogy: this.config.innogyDevices,
				jeelink: this.config.jeelinkDevices,
				lupusec: this.config.lupusecDevices,
				maxcube: this.config.maxcubeDevices,
				meross: this.config.merossDevices,
				mihome: this.config.mihomeDevices,
				mihomeGW: this.config.mihomeDevices,
				mihomeVacuum: this.config.mihomeVacuumDevices,
				mqttClientZigbee2Mqtt: this.config.mqttClientZigbee2MqttDevices,
				mqttNuki: this.config.mqttNukiDevices,
				musiccast: this.config.musiccastDevices,
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

			this.configMaxMinutes = {
				alexa2: this.config.alexa2MaxMinutes,
				apcups: this.config.apcupsMaxMinutes,
				ble: this.config.bleMaxMinutes,
				deconz: this.config.deconzMaxMinutes,
				enocean: this.config.enoceanMaxMinutes,
				esphome: this.config.esphomeMaxMinutes,
				eusec: this.config.eusecMaxMinutes,
				fritzdect: this.config.fritzdectMaxMinutes,
				fullybrowser: this.config.fullybrowserMaxMinutes,
				ham: this.config.hamMaxMinutes,
				harmony: this.config.harmonyMaxMinutes,
				hmiP: this.config.hmiPMaxMinutes,
				hmrpc: this.config.hmrpcMaxMinutes,
				homeconnect: this.config.homeconnectMaxMinutes,
				hs100: this.config.hs100MaxMinutes,
				hue: this.config.hueMaxMinutes,
				hueExt: this.config.hueextMaxMinutes,
				innogy: this.config.innogyMaxMinutes,
				jeelink: this.config.jeelinkMaxMinutes,
				lupusec: this.config.lupusecMaxMinutes,
				maxcube: this.config.maxcubeMaxMinutes,
				meross: this.config.merossMaxMinutes,
				mihome: this.config.mihomeMaxMinutes,
				mihomeGW: this.config.mihomeMaxMinutes,
				mihomeVacuum: this.config.mihomeVacuumMaxMinutes,
				mqttClientZigbee2Mqtt: this.config.mqttClientZigbee2MqttMaxMinutes,
				mqttNuki: this.config.mqttNukiMaxMinutes,
				musiccast: this.config.musiccastMaxMinutes,
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
				if (this.configSetAdapter[id]) {
					this.selAdapter.push(arrApart[id]);
					this.adapterSelected.push(await this.capitalize(id));
				}
			}

			//Check if an Adapter is selected.
			if (this.adapterSelected.length >= 1) {
				// show list in debug log
				this.log.debug(JSON.stringify(this.selAdapter));

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
			if (this.createOwnFolder) {
				try {
					for (const [id] of Object.entries(arrApart)) {
						if (this.configSetAdapter !== undefined && this.configSetAdapter[id]) {
							await this.createDPsForEachAdapter(id);
							if (this.createHtmlList) await this.createHtmlListDatapoints(id);
							this.log.debug(`Created datapoints for ${this.capitalize(id)}`);
						}
					}
				} catch (error) {
					this.errorReporting('[onReady - create and fill datapoints for each adapter]', error);
				}
			}

			// create HTML list datapoints
			if (this.createHtmlList) await this.createHtmlListDatapoints();

			//read data first at start
			await this.main();

			// update last contact data in interval
			await this.refreshData();

			// send overview for low battery devices
			if (this.config.checkSendBatteryMsgDaily) await this.sendBatteryNotifyShedule();

			// send overview of offline devices
			if (this.config.checkSendOfflineMsgDaily) await this.sendOfflineNotificationsShedule();

			// send overview of upgradeable devices
			if (this.config.checkSendUpgradeMsgDaily) await this.sendUpgradeNotificationsShedule();
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
	async onStateChange(id, state) {
		// Admin JSON for Adapter updates
		if (id && state) {
			this.log.debug(`State changed: ${id} changed ${state.val}`);
			let batteryData;
			let oldLowBatState;
			let contactData;
			let oldStatus;
			let isLowBatValue;

			for (const device of this.listAllDevicesRaw) {
				// On statechange update available datapoint
				switch (id) {
					case device.UpdateDP:
						if (state.val) {
							device.Upgradable = state.val;
							if (!this.blacklistNotify.includes(device.Path)) {
								await this.sendDeviceUpdatesNotification(device.Device, device.Adapter);
							}
						}
						break;

					case device.SignalStrengthDP:
						device.SignalStrength = await this.calculateSignalStrength(state, device.adapterID);
						break;

					case device.batteryDP:
						if (device.isBatteryDevice) {
							oldLowBatState = device.LowBat;
							batteryData = await this.getBatteryData(state.val, oldLowBatState, device.adapterID);

							device.Battery = batteryData[0];
							device.BatteryRaw = batteryData[2];
							if (device.LowBatDP !== 'none') {
								isLowBatValue = await this.getInitValue(device.LowBatDP);
							} else {
								isLowBatValue = undefined;
							}
							device.LowBat = await this.setLowbatIndicator(state.val, isLowBatValue, device.faultReport, device.adapterID);

							if (device.LowBat && oldLowBatState !== device.LowBat) {
								if (this.config.checkSendBatteryMsg && !this.blacklistNotify.includes(device.Path)) {
									await this.sendLowBatNoticiation(device.Device, device.Adapter, device.Battery);
								}
							}
						}
						break;

					case device.LowBatDP:
						if (device.isBatteryDevice) {
							oldLowBatState = device.LowBat;
							batteryData = await this.getBatteryData(device.BatteryRaw, state.val, device.adapterID);
							device.Battery = batteryData[0];
							device.BatteryRaw = batteryData[2];
							device.LowBat = await this.setLowbatIndicator(device.BatteryRaw, state.val, device.faultReport, device.adapterID);

							if (device.LowBat && oldLowBatState !== device.LowBat) {
								if (this.config.checkSendBatteryMsg && !this.blacklistNotify.includes(device.Path)) {
									await this.sendLowBatNoticiation(device.Device, device.Adapter, device.Battery);
								}
							}
						}
						break;

					case device.faultReportDP:
						if (device.isBatteryDevice) {
							oldLowBatState = device.LowBat;
							batteryData = await this.getBatteryData(device.BatteryRaw, oldLowBatState, device.adapterID);

							device.Battery = batteryData[0];
							device.BatteryRaw = batteryData[2];
							device.LowBat = await this.setLowbatIndicator(device.BatteryRaw, undefined, state.val, device.adapterID);

							if (device.LowBat && oldLowBatState !== device.LowBat) {
								if (this.config.checkSendBatteryMsg && !this.blacklistNotify.includes(device.Path)) {
									await this.sendLowBatNoticiation(device.Device, device.Adapter, device.Battery);
								}
							}
						}
						break;

					case device.UnreachDP:
						oldStatus = device.Status;
						device.UnreachState = await this.getInitValue(device.UnreachDP);
						contactData = await this.getOnlineState(
							device.timeSelector,
							device.adapterID,
							device.UnreachDP,
							device.SignalStrength,
							device.UnreachState,
							device.DeviceStateSelectorDP,
							device.rssiPeerSelectorDP,
						);
						if (contactData !== undefined) {
							device.LastContact = contactData[0];
							device.Status = contactData[1];
							device.SignalStrength = contactData[2];
						}

						if (this.config.checkSendOfflineMsg && oldStatus !== device.Status && !this.blacklistNotify.includes(device.Path)) {
							await this.sendOfflineNotifications(device.Device, device.Adapter, device.Status, device.LastContact);
						}
						break;
				}
			}
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
							const label = `${result[element].Adapter}: ${result[element].Device}`;
							const myValueObject = {
								deviceName: result[element].Device,
								adapter: result[element].Adapter,
								path: result[element].Path,
							};
							devices[myCount] = { label: label, value: JSON.stringify(myValueObject) };
							myCount++;
						}
						const sortDevices = devices.slice(0);
						sortDevices.sort(function (a, b) {
							const x = a.label;
							const y = b.label;
							return x < y ? -1 : x > y ? 1 : 0;
						});
						this.sendTo(obj.from, obj.command, sortDevices, obj.callback);
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
	 * main function
	 */
	async main() {
		this.log.debug(`Function started: ${this.main.name}`);

		// fill counts and lists of all selected adapter
		try {
			await this.createDataOfAllAdapter();
			this.log.debug(`Created and filled data for all adapters`);
		} catch (error) {
			this.errorReporting('[main - create data of all adapter]', error);
		}

		// fill datapoints for each adapter if selected
		if (this.createOwnFolder) {
			try {
				for (const [id] of Object.entries(arrApart)) {
					if (this.configSetAdapter !== undefined && this.configSetAdapter[id]) {
						await this.createDataForEachAdapter(id);
						this.log.debug(`Created and filled data for ${this.capitalize(id)}`);
					}
				}
			} catch (error) {
				this.errorReporting('[main - create and fill datapoints for each adapter]', error);
			}
		}

		this.log.debug(`Function finished: ${this.main.name}`);
	} //<--End of main function

	/**
	 * refresh data with interval
	 * is neccessary to refresh lastContact data, especially of devices without state changes
	 */
	async refreshData() {
		const nextTimeout = this.config.updateinterval * 1000;

		await this.checkLastContact();
		await this.createLists();
		await this.writeDatapoints();

		if (this.createOwnFolder) {
			for (const [id] of Object.entries(arrApart)) {
				if (this.configSetAdapter !== undefined && this.configSetAdapter[id]) {
					await this.createLists(id);
					await this.writeDatapoints(id);
					this.log.debug(`Created and filled data for ${this.capitalize(id)}`);
				}
			}
		}

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
	 * create blacklist
	 */
	async createBlacklist() {
		this.log.debug(`Function started: ${this.createBlacklist.name}`);

		const myBlacklist = this.config.tableBlacklist;

		for (const i in myBlacklist) {
			try {
				const blacklistParse = await this.parseData(myBlacklist[i].devices);
				// push devices in list to ignor device in lists
				if (myBlacklist[i].checkIgnorLists) {
					this.blacklistLists.push(blacklistParse.path);
				}
				if (myBlacklist[i].checkIgnorAdapterLists) {
					this.blacklistAdapterLists.push(blacklistParse.path);
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
		if (this.blacklistAdapterLists.length >= 1) this.log.info(`Found items on blacklist for lists: ${this.blacklistAdapterLists}`);
		if (this.blacklistNotify.length >= 1) this.log.info(`Found items on blacklist for notificatioons: ${this.blacklistNotify}`);

		this.log.debug(`Function finished: ${this.createBlacklist.name}`);
	}

	/**
	 * @param {object} i - Device Object
	 */
	async createData(i) {
		const devices = await this.getForeignStatesAsync(this.selAdapter[i].Selektor);
		const adapterID = this.selAdapter[i].adapterID;

		/*----------  Start of loop  ----------*/
		for (const [id] of Object.entries(devices)) {
			/*=============================================
				=              Get device name		          =
				=============================================*/
			const deviceName = await this.getDeviceName(id, i);

			/*=============================================
				=              Get adapter name		          =
				=============================================*/
			const adapter = this.selAdapter[i].adapter;

			/*=============================================
				=            Get path to datapoints	   	      =
				=============================================*/
			const currDeviceString = id.slice(0, id.lastIndexOf('.') + 1 - 1);
			const shortCurrDeviceString = currDeviceString.slice(0, currDeviceString.lastIndexOf('.') + 1 - 1);

			/*=============================================
				=            Get signal strength              =
				=============================================*/
			let deviceQualityDP = currDeviceString + this.selAdapter[i].rssiState;
			let deviceQualityState;

			switch (adapterID) {
				case 'mihomeVacuum':
					deviceQualityDP = shortCurrDeviceString + this.selAdapter[i].rssiState;
					deviceQualityState = await this.getForeignStateAsync(deviceQualityDP);
					break;

				case 'netatmo':
					deviceQualityState = await this.getForeignStateAsync(deviceQualityDP);
					if (!deviceQualityState) {
						deviceQualityDP = currDeviceString + this.selAdapter[i].rfState;
						deviceQualityState = await this.getForeignStateAsync(deviceQualityDP);
					}
					break;

				default:
					deviceQualityState = await this.getForeignStateAsync(deviceQualityDP);
					break;
			}
			//subscribe to states
			this.subscribeForeignStatesAsync(deviceQualityDP);

			let linkQuality = await this.calculateSignalStrength(deviceQualityState, adapterID);

			/*=============================================
				=         	    Get battery data       	      =
				=============================================*/
			let deviceBatteryStateDP;
			let deviceBatteryState;
			let batteryHealth;
			let batteryHealthRaw;
			let lowBatIndicator;
			let isBatteryDevice;
			let isLowBatDP;
			let faultReportingDP;
			let faultReportingState;

			const deviceChargerStateDP = currDeviceString + this.selAdapter[i].charger;
			const deviceChargerState = await this.getInitValue(deviceChargerStateDP);

			if (deviceChargerState === undefined || deviceChargerState === false) {
				// Get battery states
				switch (adapterID) {
					case 'hueExt':
					case 'mihomeVacuum':
					case 'mqttNuki':
						deviceBatteryStateDP = shortCurrDeviceString + this.selAdapter[i].battery;
						deviceBatteryState = await this.getInitValue(deviceBatteryStateDP);
						if (deviceBatteryState === undefined) {
							deviceBatteryStateDP = shortCurrDeviceString + this.selAdapter[i].battery2;
							deviceBatteryState = await this.getInitValue(deviceBatteryStateDP);
						}
						break;
					default:
						deviceBatteryStateDP = currDeviceString + this.selAdapter[i].battery;
						deviceBatteryState = await this.getInitValue(deviceBatteryStateDP);
						if (deviceBatteryState === undefined) {
							deviceBatteryStateDP = currDeviceString + this.selAdapter[i].battery2;
							deviceBatteryState = await this.getInitValue(deviceBatteryStateDP);
						}
						break;
				}

				// Get low bat states
				isLowBatDP = currDeviceString + this.selAdapter[i].isLowBat;
				let deviceLowBatState = await this.getInitValue(isLowBatDP);
				if (deviceLowBatState === undefined) {
					isLowBatDP = currDeviceString + this.selAdapter[i].isLowBat2;
					deviceLowBatState = await this.getInitValue(isLowBatDP);
				}
				if (deviceLowBatState === undefined) isLowBatDP = 'none';

				faultReportingDP = shortCurrDeviceString + this.selAdapter[i].faultReporting;
				faultReportingState = await this.getInitValue(faultReportingDP);

				//subscribe to states
				this.subscribeForeignStatesAsync(deviceBatteryStateDP);
				this.subscribeForeignStatesAsync(isLowBatDP);
				this.subscribeForeignStatesAsync(faultReportingDP);

				const batteryData = await this.getBatteryData(deviceBatteryState, deviceLowBatState, adapterID);
				batteryHealth = batteryData[0];
				batteryHealthRaw = batteryData[2];
				isBatteryDevice = batteryData[1];

				if (isBatteryDevice) {
					lowBatIndicator = await this.setLowbatIndicator(deviceBatteryState, deviceLowBatState, faultReportingState, adapterID);
				}
			}

			/*=============================================
				=          Get last contact of device         =
				=============================================*/
			let unreachDP = currDeviceString + this.selAdapter[i].reach;
			const deviceStateSelectorDP = shortCurrDeviceString + this.selAdapter[i].stateValue;
			const rssiPeerSelectorDP = currDeviceString + this.selAdapter[i].rssiPeerState;
			const timeSelector = currDeviceString + this.selAdapter[i].timeSelector;

			let deviceUnreachState = await this.getInitValue(unreachDP);
			if (deviceUnreachState === undefined) {
				unreachDP = shortCurrDeviceString + this.selAdapter[i].reach;
				deviceUnreachState = await this.getInitValue(shortCurrDeviceString + this.selAdapter[i].reach);
			}

			// subscribe to states
			this.subscribeForeignStatesAsync(timeSelector);
			this.subscribeForeignStatesAsync(unreachDP);
			this.subscribeForeignStatesAsync(deviceStateSelectorDP);
			this.subscribeForeignStatesAsync(rssiPeerSelectorDP);

			const onlineState = await this.getOnlineState(timeSelector, adapterID, unreachDP, linkQuality, deviceUnreachState, deviceStateSelectorDP, rssiPeerSelectorDP);
			let deviceState;
			let lastContactString;

			if (onlineState) {
				lastContactString = onlineState[0];
				deviceState = onlineState[1];
				linkQuality = onlineState[2];
			}

			/*=============================================
				=            Get update data	              =
				=============================================*/
			const deviceUpdateDP = currDeviceString + this.selAdapter[i].upgrade;
			let isUpgradable;

			if (this.config.checkSendDeviceUpgrade) {
				const deviceUpdateSelector = await this.getInitValue(deviceUpdateDP);

				if (deviceUpdateSelector) {
					isUpgradable = true;
				} else if (!deviceUpdateSelector) {
					isUpgradable = false;
				}
				// subscribe to states
				this.subscribeForeignStatesAsync(deviceUpdateDP);
			}

			/*=============================================
				=          		  Fill Raw Lists          	  =
				=============================================*/

			/* Add only devices with battery in the rawlist */
			if (this.listOnlyBattery && isBatteryDevice) {
				this.listAllDevicesRaw.push({
					Path: id,
					Device: deviceName,
					adapterID: adapterID,
					Adapter: adapter,
					timeSelector: timeSelector,
					isBatteryDevice: isBatteryDevice,
					Battery: batteryHealth,
					BatteryRaw: batteryHealthRaw,
					batteryDP: deviceBatteryStateDP,
					LowBat: lowBatIndicator,
					LowBatDP: isLowBatDP,
					faultReport: faultReportingState,
					faultReportDP: faultReportingDP,
					SignalStrengthDP: deviceQualityDP,
					SignalStrength: linkQuality,
					UnreachState: deviceUnreachState,
					UnreachDP: unreachDP,
					DeviceStateSelectorDP: deviceStateSelectorDP,
					rssiPeerSelectorDP: rssiPeerSelectorDP,
					LastContact: lastContactString,
					Status: deviceState,
					UpdateDP: deviceUpdateDP,
					Upgradable: isUpgradable,
				});
			} else {
				/* Add all devices */
				this.listAllDevicesRaw.push({
					Path: id,
					Device: deviceName,
					adapterID: adapterID,
					Adapter: adapter,
					timeSelector: timeSelector,
					isBatteryDevice: isBatteryDevice,
					Battery: batteryHealth,
					BatteryRaw: batteryHealthRaw,
					batteryDP: deviceBatteryStateDP,
					LowBat: lowBatIndicator,
					LowBatDP: isLowBatDP,
					faultReport: faultReportingState,
					faultReportDP: faultReportingDP,
					SignalStrengthDP: deviceQualityDP,
					SignalStrength: linkQuality,
					UnreachState: deviceUnreachState,
					UnreachDP: unreachDP,
					DeviceStateSelectorDP: deviceStateSelectorDP,
					rssiPeerSelectorDP: rssiPeerSelectorDP,
					LastContact: lastContactString,
					Status: deviceState,
					UpdateDP: deviceUpdateDP,
					Upgradable: isUpgradable,
				});
			}
		} // <-- end of loop
	} // <-- end of createData

	/*=============================================
	=            functions to get data            =
	=============================================*/

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
			let folderName;
			let deviceID;

			switch (this.selAdapter[i].adapterID) {
				case 'fullybrowser':
					deviceName = (await this.getInitValue(currDeviceString + this.selAdapter[i].id)) + ' ' + (await this.getInitValue(currDeviceString + this.selAdapter[i].id2));
					break;

				// Get ID with short currDeviceString from objectjson
				case 'hueExt':
				case 'hmrpc':
				case 'nukiExt':
				case 'wled':
				case 'mqttNuki':
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
					folderName = shortCurrDeviceString.slice(shortCurrDeviceString.lastIndexOf('.') + 1);
					deviceID = await this.getInitValue(shortCurrDeviceString + this.selAdapter[i].id);
					deviceName = `I${folderName} ${deviceID}`;
					break;

				//Get ID of foldername
				case 'tado':
					deviceName = currDeviceString.slice(currDeviceString.lastIndexOf('.') + 1);
					break;

				// Format Device name
				case 'sureflap':
					if (deviceObject && typeof deviceObject === 'object') {
						deviceName = deviceObject.common.name
							// @ts-ignore FIXME: fix syntax error
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
					if (this.selAdapter[i].id !== 'none' || this.selAdapter[i].id !== undefined) deviceName = await this.getInitValue(currDeviceString + this.selAdapter[i].id);
					if (deviceName === null || deviceName === undefined) {
						if (deviceObject && typeof deviceObject === 'object') {
							deviceName = deviceObject.common.name;
						}
					}
					break;
			}
			return deviceName;
		} catch (error) {
			this.errorReporting('[getDeviceName]', error);
		}
	}

	/**
	 * calculate Signalstrength
	 * @param {object} deviceQualityState - State value
	 * @param {object} adapterID - adapter name
	 */
	async calculateSignalStrength(deviceQualityState, adapterID) {
		let linkQuality;
		let mqttNukiValue;

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
						case 'mqttNuki':
							linkQuality = deviceQualityState.val;
							mqttNukiValue = parseInt(linkQuality);
							if (this.config.trueState) {
								linkQuality = deviceQualityState.val;
							} else if (mqttNukiValue < 0) {
								linkQuality = Math.min(Math.max(2 * (mqttNukiValue + 100), 0), 100) + '%';
								// If Quality State is an value between 0-255 (zigbee) calculate in percent:
							}
					}
					break;
			}
		} else {
			linkQuality = ' - ';
		}
		return linkQuality;
	}

	/**
	 * get battery data
	 * @param {object} deviceBatteryState - State value
	 * @param {object} deviceLowBatState - State value
	 * @param {object} adapterID - adapter name
	 */
	async getBatteryData(deviceBatteryState, deviceLowBatState, adapterID) {
		let batteryHealthRaw;
		let batteryHealth;
		let isBatteryDevice;

		switch (adapterID) {
			case 'hmrpc':
				if (deviceBatteryState === undefined) {
					if (deviceLowBatState !== undefined) {
						if (deviceLowBatState !== 1) {
							batteryHealth = 'ok';
						} else {
							batteryHealth = 'low';
						}
						isBatteryDevice = true;
					} else {
						batteryHealth = ' - ';
					}
				} else {
					if (deviceBatteryState === 0 || deviceBatteryState >= 6) {
						batteryHealth = ' - ';
					} else {
						batteryHealth = deviceBatteryState + 'V';
						batteryHealthRaw = deviceBatteryState;
						isBatteryDevice = true;
					}
				}
				break;
			default:
				if (deviceBatteryState === undefined) {
					if (deviceLowBatState !== undefined) {
						if (deviceLowBatState !== true || deviceLowBatState === 'NORMAL' || deviceLowBatState === 1) {
							batteryHealth = 'ok';
						} else {
							batteryHealth = 'low';
						}
						isBatteryDevice = true;
					} else {
						batteryHealth = ' - ';
					}
				} else {
					batteryHealth = deviceBatteryState + '%';
					batteryHealthRaw = deviceBatteryState;
					isBatteryDevice = true;
				}
				break;
		}

		return [batteryHealth, isBatteryDevice, batteryHealthRaw];
	}

	/**
	 * set low bat indicator
	 * @param {object} deviceBatteryState
	 * @param {object} deviceLowBatState
	 * @param {object} faultReportState
	 * @param {object} adapterID
	 */

	async setLowbatIndicator(deviceBatteryState, deviceLowBatState, faultReportState, adapterID) {
		let lowBatIndicator = false;
		/*=============================================
			=            Set Lowbat indicator             =
			=============================================*/
		if (deviceLowBatState !== undefined || faultReportState !== undefined) {
			switch (adapterID) {
				case 'hmrpc':
					if (deviceLowBatState === 1 || faultReportState === 6) {
						lowBatIndicator = true;
					}
					break;
				default:
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
					}
			}
		} else {
			if (deviceBatteryState < this.config.minWarnBatterie) {
				lowBatIndicator = true;
			}
		}
		return lowBatIndicator;
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
	 * get online state and time
	 * @param {object} timeSelector - device Timeselector
	 * @param {string} adapterID - ID of Adapter
	 * @param {string} unreachDP - Datapoint of Unreach
	 * @param {object} linkQuality - Linkquality Value
	 * @param {object} deviceUnreachState - State of deviceUnreach datapoint
	 * @param {string} deviceStateSelectorDP - Selector of device state (like .state)
	 * @param {string} rssiPeerSelectorDP - HM RSSI Peer Datapoint
	 */
	async getOnlineState(timeSelector, adapterID, unreachDP, linkQuality, deviceUnreachState, deviceStateSelectorDP, rssiPeerSelectorDP) {
		let lastContactString;
		let deviceState = 'Online';

		try {
			const deviceTimeSelector = await this.getForeignStateAsync(timeSelector);
			if (deviceTimeSelector) {
				const deviceUnreachSelector = await this.getForeignStateAsync(unreachDP);
				const deviceStateSelector = await this.getForeignStateAsync(deviceStateSelectorDP); // for hmrpc devices
				const rssiPeerSelector = await this.getForeignStateAsync(rssiPeerSelectorDP);
				const lastContact = await this.getTimestamp(deviceTimeSelector.ts);
				const lastDeviceUnreachStateChange = deviceUnreachSelector != undefined ? await this.getTimestamp(deviceUnreachSelector.lc) : await this.getTimestamp(timeSelector.ts);
				//  If there is no contact since user sets minutes add device in offline list
				// calculate to days after 48 hours
				switch (unreachDP) {
					case 'none':
						lastContactString = await this.getLastContact(deviceTimeSelector.ts);
						break;

					default:
						//State changed
						if (adapterID === 'hmrpc') {
							if (linkQuality !== ' - ') {
								if (deviceUnreachState === 1) {
									lastContactString = await this.getLastContact(deviceTimeSelector.lc);
								} else {
									lastContactString = await this.getLastContact(deviceTimeSelector.ts);
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
							if (deviceUnreachState === 0) {
								lastContactString = await this.getLastContact(deviceTimeSelector.lc);
							} else {
								lastContactString = await this.getLastContact(deviceTimeSelector.ts);
							}
							break;
						}
				}

				/*=============================================
				=            Set Online Status             =
				=============================================*/
				if (this.configMaxMinutes !== undefined) {
					switch (adapterID) {
						case 'hmrpc':
							if (this.configMaxMinutes[adapterID] <= 0) {
								if (deviceUnreachState === 1) {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							} else if (lastDeviceUnreachStateChange > this.configMaxMinutes[adapterID] && deviceUnreachState === 1) {
								deviceState = 'Offline'; //set online state to offline
								linkQuality = '0%'; // set linkQuality to nothing
							}
							break;
						case 'hmiP':
						case 'maxcube':
							if (this.configMaxMinutes[adapterID] <= 0) {
								if (deviceUnreachState) {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							} else if (lastDeviceUnreachStateChange > this.configMaxMinutes[adapterID] && deviceUnreachState) {
								deviceState = 'Offline'; //set online state to offline
								linkQuality = '0%'; // set linkQuality to nothing
							}
							break;
						case 'apcups':
						case 'hue':
						case 'hueExt':
						case 'ping':
						case 'deconz':
						case 'shelly':
						case 'sonoff':
						case 'unifi':
						case 'zigbee':
						case 'zigbee2MQTT':
							if (this.configMaxMinutes[adapterID] <= 0) {
								if (!deviceUnreachState) {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							} else if (!deviceUnreachState && lastDeviceUnreachStateChange > this.configMaxMinutes[adapterID]) {
								deviceState = 'Offline'; //set online state to offline
								linkQuality = '0%'; // set linkQuality to nothing
							}
							break;
						case 'mqttClientZigbee2Mqtt':
							if (this.configMaxMinutes[adapterID] <= 0) {
								if (deviceUnreachState !== 'online') {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							} else if (deviceUnreachState !== 'online' && lastDeviceUnreachStateChange > this.configMaxMinutes[adapterID]) {
								deviceState = 'Offline'; //set online state to offline
								linkQuality = '0%'; // set linkQuality to nothing
							}
							break;
						case 'mihome':
							if (deviceUnreachState !== undefined) {
								if (this.configMaxMinutes[adapterID] <= 0) {
									if (!deviceUnreachState) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
								} else if (lastContact > this.configMaxMinutes[adapterID]) {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							} else {
								if (this.config.mihomeMaxMinutes <= 0) {
									if (this.configMaxMinutes[adapterID] <= 0) {
										deviceState = 'Offline'; //set online state to offline
										linkQuality = '0%'; // set linkQuality to nothing
									}
								} else if (lastContact > this.configMaxMinutes[adapterID]) {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							}
							break;
						default:
							if (this.configMaxMinutes[adapterID] <= 0) {
								if (!deviceUnreachState) {
									deviceState = 'Offline'; //set online state to offline
									linkQuality = '0%'; // set linkQuality to nothing
								}
							} else if (lastContact > this.configMaxMinutes[adapterID]) {
								deviceState = 'Offline'; //set online state to offline
								linkQuality = '0%'; // set linkQuality to nothing
							}
							break;
					}
				}
			}
			return [lastContactString, deviceState, linkQuality];
		} catch (error) {
			this.errorReporting('[getLastContact]', error);
		}
	}

	/**
	 * when was last contact of device
	 */
	async checkLastContact() {
		for (const device of this.listAllDevicesRaw) {
			const oldContactState = device.Status;
			device.UnreachState = await this.getInitValue(device.UnreachDP);
			const contactData = await this.getOnlineState(
				device.timeSelector,
				device.adapterID,
				device.UnreachDP,
				device.SignalStrength,
				device.UnreachState,
				device.DeviceStateSelectorDP,
				device.rssiPeerSelectorDP,
			);
			if (contactData !== undefined) {
				device.LastContact = contactData[0];
				device.Status = contactData[1];
				device.linkQuality = contactData[2];
			}
			if (this.config.checkSendOfflineMsg && oldContactState !== device.Status && !this.blacklistNotify.includes(device.Path)) {
				await this.sendOfflineNotifications(device.Device, device.Adapter, device.Status, device.LastContact);
			}
		}
	}

	/**
	 * Create Lists
	 */
	async createLists(adptName) {
		this.linkQualityDevices = [];
		this.batteryPowered = [];
		this.batteryLowPowered = [];
		this.listAllDevices = [];
		this.offlineDevices = [];
		this.batteryLowPoweredRaw = [];
		this.offlineDevicesRaw = [];
		this.upgradableDevicesRaw = [];
		this.upgradableList = [];

		if (adptName === undefined) {
			adptName = '';
		}

		for (const device of this.listAllDevicesRaw) {
			/*----------  fill raw lists  ----------*/
			// low bat list
			if (device.LowBat && device.Status !== 'Offline') {
				this.batteryLowPoweredRaw.push({
					Path: device.Path,
					Device: device.Device,
					Adapter: device.Adapter,
					Battery: device.Battery,
				});
			}
			// offline raw list
			if (device.Status === 'Offline') {
				this.offlineDevicesRaw.push({
					Path: device.Path,
					Device: device.Device,
					Adapter: device.Adapter,
					LastContact: device.LastContact,
				});
			}

			// upgradable raw list
			if (device.Upgradable) {
				this.upgradableDevicesRaw.push({
					Path: device.Path,
					Device: device.Device,
					Adapter: device.Adapter,
				});
			}

			if (adptName === '' && !this.blacklistLists.includes(device.Path)) {
				await this.theLists(device);
			}

			if (this.config.createOwnFolder && adptName !== '') {
				if (device.adapterID.includes(adptName)) {
					/*----------  fill user lists for each adapter  ----------*/
					if (!this.blacklistAdapterLists.includes(device.Path)) {
						await this.theLists(device);
					}
				}
			}
		}
		await this.countDevices();
	}

	/**
	 * fill the lists for user
	 * @param {object} device
	 */
	async theLists(device) {
		// List with all devices
		this.listAllDevices.push({
			Device: device.Device,
			Adapter: device.Adapter,
			Battery: device.Battery,
			'Signal strength': device.SignalStrength,
			'Last contact': device.LastContact,
			Status: device.Status,
		});

		// LinkQuality lists
		if (device.SignalStrength != ' - ') {
			this.linkQualityDevices.push({
				Device: device.Device,
				Adapter: device.Adapter,
				'Signal strength': device.SignalStrength,
			});
		}

		// Battery lists
		if (device.isBatteryDevice) {
			this.batteryPowered.push({
				Device: device.Device,
				Adapter: device.Adapter,
				Battery: device.Battery,
				Status: device.Status,
			});
		}

		// Low Bat lists
		if (device.LowBat && device.Status !== 'Offline') {
			this.batteryLowPowered.push({
				Device: device.Device,
				Adapter: device.Adapter,
				Battery: device.Battery,
			});
		}

		// Offline List
		if (device.Status === 'Offline') {
			this.offlineDevices.push({
				Device: device.Device,
				Adapter: device.Adapter,
				'Last contact': device.LastContact,
			});
		}

		// Device update List
		if (device.Upgradable) {
			this.upgradableList.push({
				Device: device.Device,
				Adapter: device.Adapter,
			});
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

		// Count how many devices has update available
		this.upgradableDevicesCount = this.upgradableList.length;
	}

	/**
	 * @param {string} adptName - Adapter name
	 */
	async createDataForEachAdapter(adptName) {
		// create Data for each Adapter in own lists
		this.log.debug(`Function started: ${this.createDataForEachAdapter.name}`);

		try {
			for (const device of this.listAllDevicesRaw) {
				if (device.adapterID.includes(adptName)) {
					// list device only if selected adapter matched with device
					await this.createLists(adptName);
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
			for (let i = 0; i < this.selAdapter.length; i++) {
				await this.createData(i);
				await this.createLists();
			}
			await this.writeDatapoints(); // fill the datapoints
		} catch (error) {
			this.errorReporting('[createDataOfAllAdapter]', error);
		}

		this.log.debug(`Function finished: ${this.createDataOfAllAdapter.name}`);
	} // <-- end of createDataOfAllAdapter

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

			// Write Datapoints for counts
			await this.setStateAsync(`${dpSubFolder}offlineCount`, { val: this.offlineDevicesCount, ack: true });
			await this.setStateAsync(`${dpSubFolder}countAll`, { val: this.deviceCounter, ack: true });
			await this.setStateAsync(`${dpSubFolder}batteryCount`, { val: this.batteryPoweredCount, ack: true });
			await this.setStateAsync(`${dpSubFolder}lowBatteryCount`, { val: this.lowBatteryPoweredCount, ack: true });
			await this.setStateAsync(`${dpSubFolder}upgradableCount`, { val: this.upgradableDevicesCount, ack: true });

			// List all devices
			if (this.deviceCounter === 0) {
				// if no device is count, write the JSON List with default value
				this.listAllDevices = [{ Device: '--none--', Adapter: '', Battery: '', 'Last contact': '', 'Signal strength': '' }];
			}
			await this.setStateAsync(`${dpSubFolder}listAll`, { val: JSON.stringify(this.listAllDevices), ack: true });

			// List link quality
			if (this.linkQualityCount === 0) {
				// if no device is count, write the JSON List with default value
				this.linkQualityDevices = [{ Device: '--none--', Adapter: '', 'Signal strength': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}linkQualityList`, {
				val: JSON.stringify(this.linkQualityDevices),
				ack: true,
			});

			// List offline devices
			if (this.offlineDevicesCount === 0) {
				// if no device is count, write the JSON List with default value
				this.offlineDevices = [{ Device: '--none--', Adapter: '', 'Last contact': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}offlineList`, {
				val: JSON.stringify(this.offlineDevices),
				ack: true,
			});

			// List updatable
			if (this.upgradableDevicesCount === 0) {
				// if no device is count, write the JSON List with default value
				this.upgradableList = [{ Device: '--none--', Adapter: '', 'Last contact': '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}upgradableList`, {
				val: JSON.stringify(this.upgradableList),
				ack: true,
			});

			// List battery powered
			if (this.batteryPoweredCount === 0) {
				// if no device is count, write the JSON List with default value
				this.batteryPowered = [{ Device: '--none--', Adapter: '', Battery: '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}batteryList`, {
				val: JSON.stringify(this.batteryPowered),
				ack: true,
			});

			// list battery low powered
			if (this.lowBatteryPoweredCount === 0) {
				// if no device is count, write the JSON List with default value
				this.batteryLowPowered = [{ Device: '--none--', Adapter: '', Battery: '' }];
			}
			//write JSON list
			await this.setStateAsync(`${dpSubFolder}lowBatteryList`, {
				val: JSON.stringify(this.batteryLowPowered),
				ack: true,
			});

			// set booleans datapoints
			if (this.offlineDevicesCount === 0) {
				await this.setStateAsync(`${dpSubFolder}oneDeviceOffline`, {
					val: false,
					ack: true,
				});
			} else {
				await this.setStateAsync(`${dpSubFolder}oneDeviceOffline`, {
					val: true,
					ack: true,
				});
			}

			if (this.lowBatteryPoweredCount === 0) {
				await this.setStateAsync(`${dpSubFolder}oneDeviceLowBat`, {
					val: false,
					ack: true,
				});
			} else {
				await this.setStateAsync(`${dpSubFolder}oneDeviceLowBat`, {
					val: true,
					ack: true,
				});
			}

			if (this.upgradableDevicesCount === 0) {
				await this.setStateAsync(`${dpSubFolder}oneDeviceUpdatable`, {
					val: false,
					ack: true,
				});
			} else {
				await this.setStateAsync(`${dpSubFolder}oneDeviceUpdatable`, {
					val: true,
					ack: true,
				});
			}

			//write HTML list
			if (this.createHtmlList) {
				await this.setStateAsync(`${dpSubFolder}linkQualityListHTML`, {
					val: await this.creatLinkQualityListHTML(this.linkQualityDevices, this.linkQualityCount),
					ack: true,
				});
				await this.setStateAsync(`${dpSubFolder}offlineListHTML`, {
					val: await this.createOfflineListHTML(this.offlineDevices, this.offlineDevicesCount),
					ack: true,
				});
				await this.setStateAsync(`${dpSubFolder}batteryListHTML`, {
					val: await this.createBatteryListHTML(this.batteryPowered, this.batteryPoweredCount, false),
					ack: true,
				});
				await this.setStateAsync(`${dpSubFolder}lowBatteryListHTML`, {
					val: await this.createBatteryListHTML(this.batteryLowPowered, this.lowBatteryPoweredCount, true),
					ack: true,
				});
			}

			// create timestamp of last run
			const lastCheck = this.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + this.formatDate(new Date(), 'hh:mm:ss');
			await this.setStateAsync('lastCheck', lastCheck, true);
		} catch (error) {
			this.errorReporting('[writeDatapoints]', error);
		}
		this.log.debug(`Function finished: ${this.writeDatapoints.name}`);
	} //<--End  of writing Datapoints

	/*=============================================
	=       functions to send notifications       =
	=============================================*/

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

		// Synochat Notification
		try {
			if (this.config.instanceSynochat) {
				//first check if instance is living
				const synochatAliveState = await this.getInitValue('system.adapter.' + this.config.instanceSynochat + '.alive');

				if (!synochatAliveState) {
					this.log.warn('Synochat instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					if (this.config.channelSynochat !== undefined) {
						await this.setForeignStateAsync(`${this.config.instanceSynochat}.${this.config.channelSynochat}.message`, text);
					} else {
						this.log.warn('Synochat channel is not set. Message could not be sent. Please check your instance configuration.');
					}
				}
			}
		} catch (error) {
			this.errorReporting('[sendNotification Synochat]', error);
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
						if (!this.blacklistNotify.includes(id.Path)) {
							if (!this.config.showAdapterNameinMsg) {
								deviceList = `${deviceList}\n${id.Device} (${id.Battery})`;
							} else {
								// Add adaptername if checkbox is checked true in options by user
								deviceList = `${deviceList}\n${id.Adapter}: ${id.Device} (${id.Battery})`;
							}
						}
					}
					if (deviceList.length > 0) {
						this.log.info(`Niedrige Batteriezustände: ${deviceList}`);
						this.setStateAsync('lastNotification', `Niedrige Batteriezustände: ${deviceList}`, true);

						this.sendNotification(`Niedrige Batteriezustände: ${deviceList}`);
					}
				} catch (error) {
					this.errorReporting('[sendBatteryNotifyShedule]', error);
				}
			});
		}
	} //<--End of battery notification

	/**
	 * check if device updates are available and send notification
	 * @param {string} deviceName
	 * @param {string} adapter
	 * @param {string} battery
	 **/
	async sendLowBatNoticiation(deviceName, adapter, battery) {
		this.log.debug(`Start the function: ${this.sendLowBatNoticiation.name}`);

		try {
			let msg = '';
			let deviceList = '';

			if (!this.config.showAdapterNameinMsg) {
				deviceList = `${deviceList}\n${deviceName} (${battery})`;
			} else {
				deviceList = `${deviceList}\n${adapter}: ${deviceName} (${battery})`;
			}
			msg = `Gerät mit geringer Batterie erkannt: \n`;

			this.log.info(msg + deviceList);
			await this.setStateAsync('lastNotification', msg + deviceList, true);
			await this.sendNotification(msg + deviceList);
		} catch (error) {
			this.errorReporting('[sendLowBatNoticiation]', error);
		}
		this.log.debug(`Finished the function: ${this.sendLowBatNoticiation.name}`);
	}

	/**
	 * send message if an device is offline
	 * @param {string} deviceName
	 * @param {string} adapter
	 * @param {string} status
	 * @param {string} lastContact
	 */
	async sendOfflineNotifications(deviceName, adapter, status, lastContact) {
		this.log.debug(`Start the function: ${this.sendOfflineNotifications.name}`);

		try {
			let msg = '';
			let deviceList = '';

			if (!this.config.showAdapterNameinMsg) {
				deviceList = `${deviceList}\n${deviceName} (${lastContact})`;
			} else {
				deviceList = `${deviceList}\n${adapter}: ${deviceName} (${lastContact})`;
			}

			if (status === 'Online') {
				// make singular if it is only one device
				msg = 'Folgendes Gerät ist wieder erreichbar: \n';
			} else if (status === 'Offline') {
				//make plural if it is more than one device
				msg = `Folgendes Gerät ist seit einiger Zeit nicht erreichbar: \n`;
			}

			this.log.info(msg + deviceList);
			await this.setStateAsync('lastNotification', msg + deviceList, true);
			await this.sendNotification(msg + deviceList);
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
						if (!this.blacklistNotify.includes(id.Path)) {
							if (!this.config.showAdapterNameinMsg) {
								deviceList = `${deviceList}\n${id.Device} (${id.LastContact})`;
							} else {
								deviceList = `${deviceList}\n${id.Adapter}: ${id.Device} (${id.LastContact})`;
							}
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
	 * check if device updates are available and send notification
	 * @param {string} deviceName
	 * @param {string} adapter
	 **/
	async sendDeviceUpdatesNotification(deviceName, adapter) {
		this.log.debug(`Start the function: ${this.sendDeviceUpdatesNotification.name}`);

		try {
			let msg = '';
			let deviceList = '';

			if (!this.config.showAdapterNameinMsg) {
				deviceList = `${deviceList}\n${deviceName}`;
			} else {
				deviceList = `${deviceList}\n${adapter}: ${deviceName}`;
			}

			msg = `Neue Geräte Updates vorhanden: \n`;

			this.log.info(msg + deviceList);
			await this.setStateAsync('lastNotification', msg + deviceList, true);
			await this.sendNotification(msg + deviceList);
		} catch (error) {
			this.errorReporting('[sendDeviceUpdatesNotification]', error);
		}
		this.log.debug(`Finished the function: ${this.sendDeviceUpdatesNotification.name}`);
	}

	/**
	 * send shedule message with offline devices
	 */
	async sendUpgradeNotificationsShedule() {
		const time = this.config.checkSendUpgradeTime.split(':');

		const checkDays = []; // list of selected days

		// push the selected days in list
		if (this.config.checkUpgradeMonday) checkDays.push(1);
		if (this.config.checkUpgradeTuesday) checkDays.push(2);
		if (this.config.checkUpgradeWednesday) checkDays.push(3);
		if (this.config.checkUpgradeThursday) checkDays.push(4);
		if (this.config.checkUpgradeFriday) checkDays.push(5);
		if (this.config.checkUpgradeSaturday) checkDays.push(6);
		if (this.config.checkUpgradeSunday) checkDays.push(0);

		if (checkDays.length >= 1) {
			// check if an day is selected
			this.log.debug(`Number of selected days for daily Upgrade message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);
		} else {
			this.log.warn(`No days selected for daily Upgrade message. Please check the instance configuration!`);
			return; // cancel function if no day is selected
		}

		if (!isUnloaded) {
			const cron = '10 ' + time[1] + ' ' + time[0] + ' * * ' + checkDays;
			schedule.scheduleJob(cron, () => {
				try {
					let deviceList = '';

					for (const id of this.upgradableDevicesRaw) {
						if (!this.blacklistNotify.includes(id.Path)) {
							if (!this.config.showAdapterNameinMsg) {
								deviceList = `${deviceList}\n${id.Device}`;
							} else {
								deviceList = `${deviceList}\n${id.Adapter}: ${id.Device}`;
							}
						}
					}
					if (deviceList.length > 0) {
						this.log.info(`Geräte Upgrade: ${deviceList}`);
						this.setStateAsync('lastNotification', `Geräte Upgrade: ${deviceList}`, true);

						this.sendNotification(`Geräte Upgrade:\n${deviceList}`);
					}
				} catch (error) {
					this.errorReporting('[sendUpgradeNotificationsShedule]', error);
				}
			});
		}
	} //<--End of daily offline notification

	/*=============================================
	=       functions to create html lists        =
	=============================================*/

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
		<b>Offline Devices: <font color=${deviceCount === 0 ? '#3bcf0e' : 'orange'}>${deviceCount}</b><small></small></font>
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
		<b>${isLowBatteryList === true ? 'Schwache ' : ''}Batterie Devices: <font color=${isLowBatteryList === true ? (deviceCount > 0 ? 'orange' : '#3bcf0e') : ''}>${deviceCount}</b></font>
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

	/*=============================================
	=     create datapoints for each adapter      =
	=============================================*/

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

		await this.setObjectNotExistsAsync(`${adptName}.oneDeviceOffline`, {
			type: 'state',
			common: {
				name: {
					en: 'Is one device with offline',
					de: 'Ist ein Gerät mit Offline',
					ru: 'Это одно устройство с offline',
					pt: 'É um dispositivo com offline',
					nl: 'Is een apparaat met offline',
					fr: 'Est un appareil avec hors ligne',
					it: 'È un dispositivo con offline',
					es: 'Es un dispositivo sin conexión',
					pl: 'Jest to jeden urządzenie z offlinem',
					uk: 'Є один пристрій з автономним',
					'zh-cn': '一处有线装置',
				},
				type: 'boolean',
				role: 'state',
				read: true,
				write: false,
				def: false,
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

		await this.setObjectNotExistsAsync(`${adptName}.oneDeviceLowBat`, {
			type: 'state',
			common: {
				name: {
					en: 'Is one device with low battery',
					de: 'Ist ein Gerät mit niedrigem Akku',
					ru: 'Один прибор с низкой батареей',
					pt: 'É um dispositivo com bateria baixa',
					nl: 'Is een apparaat met lage batterijen',
					fr: 'Est un appareil avec batterie basse',
					it: 'È un dispositivo con batteria bassa',
					es: 'Es un dispositivo con batería baja',
					pl: 'Jest to jeden urządzenie z niską baterią',
					uk: 'Є одним пристроєм з низьких акумуляторів',
					'zh-cn': '低电池的装置',
				},
				type: 'boolean',
				role: 'state',
				read: true,
				write: false,
				def: false,
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

		await this.setObjectNotExistsAsync(`${adptName}.upgradableCount`, {
			type: 'state',
			common: {
				name: {
					en: 'Number of devices with available updates ',
					de: 'Anzahl der Geräte mit verfügbaren Updates',
					ru: 'Количество устройств с доступными обновлениями',
					pt: 'Número de dispositivos com atualizações disponíveis',
					nl: 'Nummer van apparatuur met beschikbare updates',
					fr: 'Nombre de dispositifs avec mises à jour disponibles',
					it: 'Numero di dispositivi con aggiornamenti disponibili',
					es: 'Número de dispositivos con actualizaciones disponibles',
					pl: 'Liczba urządzeń z dostępną aktualizacją',
					uk: 'Кількість пристроїв з доступними оновленнями',
					'zh-cn': '现有更新的装置数目',
				},
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.upgradableList`, {
			type: 'state',
			common: {
				name: {
					en: 'JSON List of devices with available updates ',
					de: 'JSON Liste der Geräte mit verfügbaren Updates',
					ru: 'ДЖСОН Список устройств с доступными обновлениями',
					pt: 'J. Lista de dispositivos com atualizações disponíveis',
					nl: 'JSON List van apparatuur met beschikbare updates',
					fr: 'JSON Liste des appareils avec mises à jour disponibles',
					it: 'JSON Elenco dei dispositivi con aggiornamenti disponibili',
					es: 'JSON Lista de dispositivos con actualizaciones disponibles',
					pl: 'JSON Lista urządzeń korzystających z aktualizacji',
					uk: 'Сонце Перелік пристроїв з доступними оновленнями',
					'zh-cn': '附 件 现有最新设备清单',
				},
				type: 'array',
				role: 'json',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`${adptName}.oneDeviceUpdatable`, {
			type: 'state',
			common: {
				name: {
					en: 'Is one device updatable',
					de: 'Ist ein Gerät aufnehmbar',
					ru: 'Одно устройство обновляется',
					pt: 'É um dispositivo updatable',
					nl: 'Is een apparaat updat',
					fr: "Est-ce qu'un appareil est indéfectible",
					it: 'È un dispositivo updatable',
					es: 'Es un dispositivo actualizado',
					pl: 'Jest to jedno urządzenie updatable',
					uk: 'Є одним пристроєм',
					'zh-cn': '一台装置',
				},
				type: 'boolean',
				role: 'state',
				read: true,
				write: false,
				def: false,
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

	/*=============================================
	=            	help functions   	          =
	=============================================*/

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
