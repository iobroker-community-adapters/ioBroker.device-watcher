'use strict';

const utils = require('@iobroker/adapter-core');
const adapterName = require('./package.json').name.split('.').pop();
const schedule = require('node-schedule');
const cronParserLib = require('cron-parser');
const adapterArray = require('./lib/adapterArray.js'); // list of supported adapters
const translations = require('./lib/translations.js');
const tools = require('./lib/tools.js');
const crud = require('./lib/crud.js');

// indicator if the adapter is running (for intervall/shedule)
let isUnloaded = false;
const adapterUpdateListDP = 'admin.*.info.updatesJson';

class DeviceWatcher extends utils.Adapter {
	constructor(options) {
		super({
			...options,
			name: adapterName,
			useFormatDate: true,
		});

		// instances and adapters
		// raw arrays
		this.listInstanceRaw = new Map();
		this.adapterUpdatesJsonRaw = [];
		this.listErrorInstanceRaw = [];

		// user arrays
		this.listAllInstances = [];
		this.listAllActiveInstances = [];
		this.listDeactivatedInstances = [];
		this.listAdapterUpdates = [];
		this.listErrorInstance = [];

		//counts
		this.countAllInstances = 0;
		this.countAllActiveInstances = 0;
		this.countDeactivatedInstances = 0;
		this.countAdapterUpdates = 0;
		this.countErrorInstance = 0;

		// devices
		// raw arrays
		this.listAllDevicesRaw = new Map();
		this.batteryLowPoweredRaw = [];
		this.offlineDevicesRaw = [];
		this.upgradableDevicesRaw = [];

		// arrays
		this.listAllDevicesUserRaw = [];
		this.listAllDevices = [];
		this.offlineDevices = [];
		this.linkQualityDevices = [];
		this.batteryPowered = [];
		this.batteryLowPowered = [];
		this.selAdapter = [];
		this.adapterSelected = [];
		this.upgradableList = [];

		// counts
		this.offlineDevicesCount = 0;
		this.deviceCounter = 0;
		this.linkQualityCount = 0;
		this.batteryPoweredCount = 0;
		this.lowBatteryPoweredCount = 0;
		this.upgradableDevicesCount = 0;

		// Blacklist
		// Instances
		this.blacklistInstancesLists = [];
		this.blacklistInstancesNotify = [];

		// Devices
		this.blacklistLists = [];
		this.blacklistAdapterLists = [];
		this.blacklistNotify = [];

		// Timelist instances
		this.userTimeInstancesList = new Map();

		// Interval timer
		this.refreshDataTimeout = null;

		// Check if main function is running
		this.mainRunning = false;

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * onReady
	 */
	async onReady() {
		this.log.debug(`Adapter ${adapterName} was started`);

		// set user language
		if (this.config.userSelectedLanguage === '') {
			if (this.language !== undefined && this.language !== null) {
				this.config.userSelectedLanguage = this.language;
			} else {
				this.config.userSelectedLanguage = 'de';
			}
		}
		this.log.debug(`Set language to ${this.config.userSelectedLanguage}`);

		this.configCreateInstanceList = this.config.checkAdapterInstances;
		this.configListOnlyBattery = this.config.listOnlyBattery;
		this.configCreateOwnFolder = this.config.createOwnFolder;
		this.configCreateHtmlList = this.config.createHtmlList;

		try {
			// create list with enabled adapters for monitor devices
			for (const device of Object.values(this.config.tableDevices)) {
				if (device.enabled) {
					for (const [adapterName, adapter] of Object.entries(adapterArray)) {
						if (String(adapter.adapterKey).toLowerCase() === String(device.adapterKey).toLowerCase()) {
							this.selAdapter.push(adapter);
							this.adapterSelected.push(adapter.adapterKey);
							break;
						}
					}
				}
			}

			// Check if an adapter to monitor devices is selected.
			if (this.adapterSelected.length >= 1) {
				this.log.debug(JSON.stringify(this.selAdapter));
				this.log.info(`Number of selected adapters to monitor devices: ${this.adapterSelected.length}. Loading data from: ${this.adapterSelected.join(', ')} ...`);
			} else {
				this.log.info(`No adapters selected to monitor devices.`);
			}

			// create Blacklist
			await crud.createBlacklist(this);

			// create user defined list with time of error for instances
			await crud.createTimeListInstances(this);

			//create datapoints for each adapter if selected
			for (const [id] of Object.entries(adapterArray)) {
				try {
					if (!this.configCreateOwnFolder) {
						await crud.deleteDPsForEachAdapter(this, id);
						await crud.deleteHtmlListDatapoints(this, id);
					} else {
						const adapter = adapterArray[id];

						if (this.adapterSelected.includes(adapter.adapterKey)) {
							await crud.createDPsForEachAdapter(this, id);
							// create HTML list datapoints
							if (!this.configCreateHtmlList) {
								await crud.deleteHtmlListDatapoints(this, id);
							} else {
								await crud.createHtmlListDatapoints(this, id);
							}
							this.log.debug(`Created datapoints for ${tools.capitalize(id)}`);
						}
					}
				} catch (error) {
					this.log.error(`[onReady - create and fill datapoints for each adapter] - ${error}`);
				}
			}

			// create HTML list datapoints
			if (!this.configCreateHtmlList) {
				await crud.deleteHtmlListDatapoints(this);
				await crud.deleteHtmlListDatapointsInstances(this);
			} else {
				await crud.createHtmlListDatapoints(this);
				if (this.config.checkAdapterInstances) {
					await crud.createHtmlListDatapointsInstances(this);
				}
			}
			if (!this.config.checkAdapterInstances) {
				await crud.deleteHtmlListDatapointsInstances(this);
			}

			// instances and adapters
			if (this.configCreateInstanceList) {
				// instances
				await crud.createDPsForInstances(this);
				await this.getAllInstanceData();
				// adapter updates
				await crud.createAdapterUpdateData(this, adapterUpdateListDP);
			} else {
				await crud.deleteDPsForInstances(this);
			}

			await this.main();

			// update last contact data in interval
			await this.refreshData();

			// send overview for low battery devices
			if (this.config.checkSendBatteryMsgDaily) {
				await this.sendScheduleNotifications('lowBatteryDevices');
			}

			// send overview of offline devices
			if (this.config.checkSendOfflineMsgDaily) {
				await this.sendScheduleNotifications('offlineDevices');
			}

			// send overview of upgradeable devices
			if (this.config.checkSendUpgradeMsgDaily) {
				await this.sendScheduleNotifications('updateDevices');
			}

			// send overview of updatable adapters
			if (this.config.checkSendAdapterUpdateMsgDaily) {
				await this.sendScheduleNotifications('updateAdapter');
			}

			// send overview of deactivated instances
			if (this.config.checkSendInstanceDeactivatedDaily) {
				await this.sendScheduleNotifications('deactivatedInstance');
			}

			// send overview of instances with error
			if (this.config.checkSendInstanceFailedDaily) {
				await this.sendScheduleNotifications('errorInstance');
			}
		} catch (error) {
			this.log.error(`[onReady] - ${error}`);
			this.terminate ? this.terminate(15) : process.exit(15);
		}
	} // <-- onReady end

	/**
	 * main function
	 */
	async main() {
		this.log.debug(`Function started main`);
		this.mainRunning = true;

		// cancel run if no adapter is selected
		if (this.adapterSelected.length === 0) {
			return;
		}

		// fill counts and lists of all selected adapter
		try {
			for (let i = 0; i < this.selAdapter.length; i++) {
				await crud.createData(this, i);
				await crud.createLists(this);
			}
			await crud.writeDatapoints(this); // fill the datapoints
			this.log.debug(`Created and filled data for all adapters`);
		} catch (error) {
			this.log.error(`[main - create data of all adapter] - ${error}`);
		}

		// fill datapoints for each adapter if selected
		if (this.configCreateOwnFolder) {
			try {
				for (const [id] of Object.entries(adapterArray)) {
					const adapter = adapterArray[id];

					if (this.adapterSelected.includes(adapter.adapterKey)) {
						for (const deviceData of this.listAllDevicesRaw.values()) {
							// list device only if selected adapter matched with device
							if (!deviceData.adapterID.includes(id)) {
								continue;
							}
							await crud.createLists(this, id);
						}
						await crud.writeDatapoints(this, id); // fill the datapoints
						this.log.debug(`Created and filled data for ${tools.capitalize(id)}`);
					}
				}
			} catch (error) {
				this.log.error(`[main - create and fill datapoints for each adapter] - ${error}`);
			}
		}
		this.mainRunning = false;
		this.log.debug(`Function finished: ${this.main.name}`);
	} //<--End of main function

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	//

	async onObjectChange(id, obj) {
		if (obj) {
			try {
				// The object was changed
				//this.log.debug(`object ${id} changed: ${JSON.stringify(obj)}`);

				if (this.config.checkAdapterInstances && id.startsWith('system.adapter.')) {
					//read new instance data and add it to the lists
					await this.getInstanceData(id);
				} else {
					if (Array.from(this.listAllDevicesRaw.values()).some((obj) => obj.mainSelector === id)) {
						if (!this.mainRunning) {
							await this.main();
						} else {
							return;
						}
					} else {
						return;
					}
				}
			} catch (error) {
				this.log.error(`Issue at object change: ${error}`);
			}
		} else {
			try {
				// The object was deleted
				this.log.debug(`object ${id} deleted`);

				// delete instance data in map
				if (this.listInstanceRaw.has(id)) {
					this.listInstanceRaw.delete(id);
				}

				// delete device data in map
				if (this.listAllDevicesRaw.has(id)) {
					this.listAllDevicesRaw.delete(id);
				}

				//unsubscribe of Objects and states
				this.unsubscribeForeignObjects(id);
				this.unsubscribeForeignStates(id);
			} catch (error) {
				this.log.error(`Issue at object deletion: ${error}`);
			}
		}
	}

	async onStateChange(id, state) {
		if (state) {
			// this.log.debug(`State changed: ${id} changed ${state.val}`);
			try {
				/*=============================================
				=        	Instances / Adapter     	     =
				=============================================*/
				if (this.config.checkAdapterInstances) {
					// Adapter Update data
					if (id.endsWith('updatesJson')) {
						await this.renewAdapterUpdateData(id);
					}
					// Instanz data
					if (Array.from(this.listInstanceRaw.values()).some((obj) => Object.values(obj).includes(id))) {
						await this.renewInstanceData(id, state);
					}
				}

				/*=============================================
				=          		  Devices     			      =
				=============================================*/
				if (Array.from(this.listAllDevicesRaw.values()).some((obj) => Object.values(obj).includes(id))) {
					await this.renewDeviceData(id, state);
				}
			} catch (error) {
				this.log.error(`Issue at state change: ${id}`);
			}
		} else {
			// The state was deleted
			this.log.debug(`state ${id} deleted`);
		}
	}

	onMessage(obj) {
		const devices = [];
		const instances = [];
		const instancesTime = [];
		let countDevices = 0;
		let countInstances = 0;

		switch (obj.command) {
			case 'devicesList':
				if (obj.message) {
					try {
						for (const deviceData of this.listAllDevicesRaw.values()) {
							const label = `${deviceData.Adapter}: ${deviceData.Device}`;
							const valueObjectDevices = {
								deviceName: deviceData.Device,
								adapter: deviceData.Adapter,
								path: deviceData.Path,
							};
							devices[countDevices] = { label: label, value: JSON.stringify(valueObjectDevices) };
							countDevices++;
						}
						const sortDevices = devices.slice(0);
						sortDevices.sort(function (a, b) {
							const x = a.label;
							const y = b.label;
							return x < y ? -1 : x > y ? 1 : 0;
						});
						this.sendTo(obj.from, obj.command, sortDevices, obj.callback);
					} catch (error) {
						this.log.error(`[onMessage - deviceList for blacklisttable] - ${error}`);
					}
				}
				break;

			case 'instancesList':
				if (obj.message) {
					try {
						for (const [instance, instanceData] of this.listInstanceRaw) {
							const label = `${instanceData.Adapter}: ${instance}`;
							const valueObjectInstances = {
								adapter: instanceData.Adapter,
								instanceID: instance,
							};
							instances[countInstances] = { label: label, value: JSON.stringify(valueObjectInstances) };
							countInstances++;
						}
						const sortInstances = instances.slice(0);
						sortInstances.sort(function (a, b) {
							const x = a.label;
							const y = b.label;
							return x < y ? -1 : x > y ? 1 : 0;
						});
						this.sendTo(obj.from, obj.command, sortInstances, obj.callback);
					} catch (error) {
						this.log.error(`[onMessage - instanceList] - ${error}`);
					}
				}
				break;
			case 'instancesListTime':
				if (obj.message) {
					try {
						for (const [instance, instanceData] of this.listInstanceRaw) {
							const label = `${instanceData.Adapter}: ${instance}`;
							const valueObjectInstances = {
								adapter: instanceData.Adapter,
								instanceName: instance,
							};
							instancesTime[countInstances] = { label: label, value: JSON.stringify(valueObjectInstances) };
							countInstances++;
						}
						const sortInstances = instancesTime.slice(0);
						sortInstances.sort(function (a, b) {
							const x = a.label;
							const y = b.label;
							return x < y ? -1 : x > y ? 1 : 0;
						});
						this.sendTo(obj.from, obj.command, sortInstances, obj.callback);
					} catch (error) {
						this.log.error(`[onMessage - instanceList] - ${error}`);
					}
				}
				break;
		}
	}

	/**
	 * refresh data with interval
	 * is neccessary to refresh lastContact data, especially of devices without state changes
	 */
	async refreshData() {
		if (isUnloaded) {
			return;
		} // cancel run if unloaded was called.
		const nextTimeout = this.config.updateinterval * 1000;

		// devices data
		await tools.checkLastContact(this);
		await crud.createLists(this);
		await crud.writeDatapoints(this);

		// devices data in own adapter folder
		if (this.configCreateOwnFolder) {
			for (const [id] of Object.entries(adapterArray)) {
				const adapter = adapterArray[id];

				if (this.adapterSelected.includes(adapter.adapterKey)) {
					await crud.createLists(this, id);
					await crud.writeDatapoints(this, id);
					this.log.debug(`Created and filled data for ${tools.capitalize(id)}`);
				}
			}
		}

		// instance and adapter data
		if (this.configCreateInstanceList) {
			await this.createInstanceList();
			await this.writeInstanceDPs();
		}

		// Clear existing timeout
		if (this.refreshDataTimeout) {
			this.clearTimeout(this.refreshDataTimeout);
			this.refreshDataTimeout = null;
		}

		this.refreshDataTimeout = this.setTimeout(async () => {
			this.log.debug('Updating Data');
			await this.refreshData();
		}, nextTimeout);
	} // <-- refreshData end

	/*=============================================
	=            functions to get data            =
	=============================================*/

	/**
	 * @param {object} id - deviceID
	 * @param {object} i - each Device
	 */
	async getDeviceName(id, i) {
		try {
			//id = id.replace(/[\]\\[.*,;'"`<>\\\s?]/g, '-');

			const currDeviceString = id.slice(0, id.lastIndexOf('.') + 1 - 1);
			const shortCurrDeviceString = currDeviceString.slice(0, currDeviceString.lastIndexOf('.') + 1 - 1);
			const shortshortCurrDeviceString = shortCurrDeviceString.slice(0, shortCurrDeviceString.lastIndexOf('.') + 1 - 1);

			// Get device name
			const deviceObject = await this.getForeignObjectAsync(currDeviceString);
			const shortDeviceObject = await this.getForeignObjectAsync(shortCurrDeviceString);
			const shortshortDeviceObject = await this.getForeignObjectAsync(shortshortCurrDeviceString);
			let deviceName;
			let folderName;
			let deviceID;

			switch (this.selAdapter[i].adapterID) {
				case 'fullybrowser':
					deviceName = `${await tools.getInitValue(this, currDeviceString + this.selAdapter[i].id)} ${await tools.getInitValue(this, currDeviceString + this.selAdapter[i].id2)}`;
					break;

				// Get ID with short currDeviceString from objectjson
				case 'hueExt':
				case 'hmrpc':
				case 'nukiExt':
				case 'wled':
				case 'mqttNuki':
				case 'loqedSmartLock':
				case 'viessmann':
				case 'homekitController':
				case 'ring':
					if (shortDeviceObject && typeof shortDeviceObject === 'object' && shortDeviceObject.common) {
						deviceName = shortDeviceObject.common.name;
					}
					break;

				// Get ID with short short currDeviceString from objectjson (HMiP Devices)
				case 'hmiP':
					if (shortshortDeviceObject && typeof shortshortDeviceObject === 'object' && shortshortDeviceObject.common) {
						deviceName = shortshortDeviceObject.common.name;
					}
					break;

				// Get ID with short currDeviceString from datapoint
				case 'mihomeVacuum':
				case 'roomba':
					folderName = shortCurrDeviceString.slice(shortCurrDeviceString.lastIndexOf('.') + 1);
					deviceID = await tools.getInitValue(this, shortCurrDeviceString + this.selAdapter[i].id);
					deviceName = `I${folderName} ${deviceID}`;
					break;

				//Get ID of foldername
				case 'tado':
				case 'wifilight':
				case 'fullybrowserV3':
				case 'sonoff':
					deviceName = currDeviceString.slice(currDeviceString.lastIndexOf('.') + 1);
					break;

				// Format Device name
				case 'sureflap':
					if (deviceObject && typeof deviceObject === 'object' && deviceObject.common) {
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
					if (this.selAdapter[i].id !== 'none' || this.selAdapter[i].id !== undefined) {
						deviceName = await tools.getInitValue(this, currDeviceString + this.selAdapter[i].id);
					}
					if (deviceName === null || deviceName === undefined) {
						if (deviceObject && typeof deviceObject === 'object' && deviceObject.common) {
							deviceName = deviceObject.common.name;
						}
					}
					break;
			}
			return deviceName;
		} catch (error) {
			this.log.error(`[getDeviceName] - ${error}`);
		}
	}

	/**
	 * calculate Signalstrength
	 *
	 * @param {object} deviceQualityState - State value
	 * @param {object} adapterID - adapter name
	 */
	async calculateSignalStrength(deviceQualityState, adapterID) {
		let linkQuality;
		let linkQualityRaw;
		let mqttNukiValue;

		if (deviceQualityState != null) {
			const { val } = deviceQualityState;

			if (typeof val === 'number') {
				if (this.config.trueState) {
					linkQuality = val;
				} else {
					switch (adapterID) {
						case 'roomba':
						case 'sonoff':
						case 'smartgarden':
							linkQuality = `${val}%`;
							linkQualityRaw = val;
							break;
						case 'lupusec':
						case 'fullybrowserV3':
							linkQuality = val;
							break;
						default:
							if (val <= -255) {
								linkQuality = ' - ';
							} else if (val < 0) {
								linkQualityRaw = Math.min(Math.max(2 * (val + 100), 0), 100);
								linkQuality = `${linkQualityRaw}%`;
							} else if (val >= 0) {
								linkQualityRaw = parseFloat(((100 / 255) * val).toFixed(0));
								linkQuality = `${linkQualityRaw}%`;
							}
							break;
					}
				}
			} else if (typeof val === 'string') {
				switch (adapterID) {
					case 'netatmo':
						linkQuality = val;
						break;
					case 'nukiExt':
						linkQuality = ' - ';
						break;
					case 'mqttNuki':
						linkQuality = val;
						mqttNukiValue = parseInt(linkQuality);
						if (this.config.trueState) {
							linkQuality = val;
						} else if (mqttNukiValue < 0) {
							linkQualityRaw = Math.min(Math.max(2 * (mqttNukiValue + 100), 0), 100);
							linkQuality = `${linkQualityRaw}%`;
						}
						break;
				}
			}
		} else {
			linkQuality = ' - ';
		}
		return [linkQuality, linkQualityRaw];
	}

	/**
	 * get battery data
	 *
	 * @param {object} deviceBatteryState - State value
	 * @param {object} deviceLowBatState - State value
	 * @param {object} faultReportingState - State value
	 * @param {object} adapterID - adapter name
	 */
	async getBatteryData(deviceBatteryState, deviceLowBatState, faultReportingState, adapterID) {
		let batteryHealth = '-';
		let isBatteryDevice = false;
		let batteryHealthRaw;
		let batteryHealthUnitRaw;

		switch (adapterID) {
			case 'lupusec':
				if (deviceBatteryState === undefined) {
					if (deviceLowBatState === 1) {
						batteryHealth = 'ok';
						isBatteryDevice = true;
					} else {
						batteryHealth = 'low';
						isBatteryDevice = true;
					}
				}
				break;
			case 'hmrpc':
				if (deviceBatteryState === undefined) {
					if (faultReportingState !== undefined && faultReportingState !== 6) {
						batteryHealth = 'ok';
						isBatteryDevice = true;
					} else if (deviceLowBatState !== undefined && deviceLowBatState !== 1) {
						batteryHealth = 'ok';
						isBatteryDevice = true;
					} else if (deviceLowBatState !== undefined) {
						batteryHealth = 'low';
						isBatteryDevice = true;
					}
				} else if (deviceBatteryState !== 0 && deviceBatteryState < 6) {
					batteryHealth = `${deviceBatteryState}V`;
					batteryHealthRaw = deviceBatteryState;
					batteryHealthUnitRaw = 'V';
					isBatteryDevice = true;
				}
				break;
			case 'xsense':
				if (deviceBatteryState === undefined) {
					// do nothin brdge has no battery
					isBatteryDevice = false;
				} else if (deviceBatteryState >= 0) {
					batteryHealthRaw = deviceBatteryState;
					batteryHealthUnitRaw = '';
					isBatteryDevice = true;
					switch (batteryHealthRaw) {
						case 1:
							batteryHealth = 'low';
							break;
						case 2:
							batteryHealth = 'medium';
							break;
						case 3:
							batteryHealth = 'ok';
							break;
						default:
							batteryHealth = 'error';
					}
				}
				break;
			default:
				if (deviceBatteryState === undefined) {
					if (deviceLowBatState !== undefined) {
						if (deviceLowBatState !== true && deviceLowBatState !== 'NORMAL' && deviceLowBatState !== 1) {
							batteryHealth = 'ok';
							isBatteryDevice = true;
						} else if (deviceLowBatState !== true) {
							batteryHealth = 'low';
							isBatteryDevice = true;
						}
					}
				} else {
					if (typeof deviceBatteryState === 'string') {
						if (deviceBatteryState === 'high' || deviceBatteryState === 'medium') {
							batteryHealth = 'ok';
							isBatteryDevice = true;
						} else if (deviceBatteryState === 'low') {
							batteryHealth = 'low';
							isBatteryDevice = true;
						}
					} else {
						batteryHealth = `${deviceBatteryState}%`;
						batteryHealthRaw = deviceBatteryState;
						batteryHealthUnitRaw = '%';
						isBatteryDevice = true;
					}
				}
				break;
		}

		return [batteryHealth, isBatteryDevice, batteryHealthRaw, batteryHealthUnitRaw];
	}

	/**
	 * set low bat indicator
	 *
	 * @param {object} deviceBatteryState
	 * @param {object} deviceLowBatState
	 * @param {object} faultReportState
	 * @param {object} adapterID
	 */

	async setLowbatIndicator(deviceBatteryState, deviceLowBatState, faultReportState, adapterID) {
		let lowBatIndicator = false;

		if (deviceLowBatState !== undefined || faultReportState !== undefined) {
			switch (adapterID) {
				case 'hmrpc':
					if (deviceLowBatState === 1 || deviceLowBatState === true || faultReportState === 6) {
						lowBatIndicator = true;
					}
					break;
				default:
					if (typeof deviceLowBatState === 'number' && deviceLowBatState === 0) {
						lowBatIndicator = true;
					} else if (typeof deviceLowBatState === 'string' && deviceLowBatState !== 'NORMAL') {
						lowBatIndicator = true;
					} else if (typeof deviceLowBatState === 'boolean' && deviceLowBatState) {
						lowBatIndicator = true;
					}
			}
		} else if (typeof deviceBatteryState === 'number' && deviceBatteryState < this.config.minWarnBatterie) {
			lowBatIndicator = true;
		} else if (typeof deviceBatteryState === 'string' && deviceBatteryState === 'low') {
			lowBatIndicator = true;
		}

		return lowBatIndicator;
	}

	/**
	 * get Last Contact
	 *
	 * @param {object} selector - Selector
	 */
	async getLastContact(selector) {
		const lastContact = tools.getTimestamp(selector); // z. B. Differenz in Sekunden?

		let lastContactString = `${this.formatDate(new Date(selector), 'hh:mm:ss')}`;

		// Falls du die vergangene Zeit in Sekunden anzeigen willst:
		if (Math.round(lastContact) >= 0) {
			lastContactString = `${Math.round(lastContact)} ${translations.secs[this.config.userSelectedLanguage]}`;
		}

		// Optional: Wenn du ab einem bestimmten Wert lieber Minuten oder Stunden willst
		if (lastContact >= 3600) {
			lastContactString = `${(lastContact / 3600).toFixed(1)} ${translations.hours[this.config.userSelectedLanguage]}`;
		} else {
			lastContactString = `${Math.round(lastContact / 60)} ${translations.minits[this.config.userSelectedLanguage]}`;
		}

		return lastContactString;
	}

	async getOnlineState(timeSelector, adapterID, treeDP, linkQuality, deviceUnreachState, deviceStateSelectorHMRPC, rssiPeerSelectorHMRPC) {
		let lastContactString;
		let lastContact;
		let deviceState = 'Online';
		let linkQualitySet = linkQuality ?? '0%';

		try {
			const deviceTimeSelector = await this.getForeignStateAsync(timeSelector);
			const deviceUnreachSelector = await this.getForeignStateAsync(treeDP);

			const lastDeviceUnreachStateChange = deviceUnreachSelector != undefined ? tools.getTimestamp(deviceUnreachSelector.lc) : tools.getTimestamp(timeSelector.ts);

			// ignore disabled device from zigbee2MQTT
			if (adapterID === 'zigbee2MQTT') {
				const is_device_disabled = await tools.isDisabledDevice(this, treeDP.substring(0, treeDP.lastIndexOf('.')));

				if (is_device_disabled) {
					return [null, 'disabled', ' - '];
				}
			}

			if (adapterID === 'hmrpc') {
				const deviceState = await this.getForeignStateAsync(deviceStateSelectorHMRPC);
				const rssiPeer = await this.getForeignStateAsync(rssiPeerSelectorHMRPC);

				if (linkQuality !== ' - ' && deviceTimeSelector) {
					const ts = deviceUnreachState === 1 ? deviceTimeSelector.lc : deviceTimeSelector.ts;
					lastContactString = await this.getLastContact(ts);
				} else if (deviceState) {
					lastContactString = await this.getLastContact(deviceState.ts);
				} else if (rssiPeer) {
					lastContactString = await this.getLastContact(rssiPeer.ts);
				}
			} else if (deviceTimeSelector) {
				const ts = !deviceUnreachState ? deviceTimeSelector.lc : deviceTimeSelector.ts;
				lastContactString = await this.getLastContact(ts);
			}

			if (deviceTimeSelector) {
				lastContact = tools.getTimestamp(deviceTimeSelector.ts);
			}

			const gefundenerAdapter = Object.values(adapterArray).find((adapter) => adapter.adapterID === adapterID);
			const device = Object.values(this.config.tableDevices).find((adapter) => adapter.adapterKey === gefundenerAdapter.adapterKey);
			const maxSecondDevicesOffline = device.maxSecondDevicesOffline;

			switch (adapterID) {
				case 'hmrpc': {
					if (maxSecondDevicesOffline <= 0) {
						if (deviceUnreachState === 1) {
							deviceState = 'Offline'; //set online state to offline
							if (linkQuality !== ' - ') {
								linkQualitySet = '0%';
							} // set linkQuality to nothing
						}
					} else if (lastDeviceUnreachStateChange > maxSecondDevicesOffline && deviceUnreachState === 1) {
						deviceState = 'Offline'; //set online state to offline
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						} // set linkQuality to nothing
					}
					break;
				}
				case 'proxmox': {
					if (maxSecondDevicesOffline <= 0) {
						if (deviceUnreachState !== 'running' && deviceUnreachState !== 'online') {
							deviceState = 'Offline'; //set online state to offline
							if (linkQuality !== ' - ') {
								linkQualitySet = '0%';
							} // set linkQuality to nothing
						}
					} else if (lastDeviceUnreachStateChange > maxSecondDevicesOffline && deviceUnreachState !== 'running' && deviceUnreachState !== 'online') {
						deviceState = 'Offline'; //set online state to offline
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						} // set linkQuality to nothing
					}
					break;
				}
				case 'hmiP':
				case 'maxcube': {
					if (maxSecondDevicesOffline <= 0) {
						if (deviceUnreachState) {
							deviceState = 'Offline'; //set online state to offline
							if (linkQuality !== ' - ') {
								linkQualitySet = '0%';
							} // set linkQuality to nothing
						}
					} else if (lastDeviceUnreachStateChange > maxSecondDevicesOffline && deviceUnreachState) {
						deviceState = 'Offline'; //set online state to offline
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						} // set linkQuality to nothing
					}
					break;
				}
				case 'apcups':
				case 'hue':
				case 'hueExt':
				case 'ping':
				case 'deconz':
				case 'shelly':
				case 'sonoff':
				case 'tradfri':
				case 'unifi':
				case 'zigbee':
				case 'zigbee2MQTT': {
					if (maxSecondDevicesOffline <= 0) {
						if (!deviceUnreachState) {
							deviceState = 'Offline'; //set online state to offline
							if (linkQuality !== ' - ') {
								linkQualitySet = '0%';
							} // set linkQuality to nothing
						}
					} else if (!deviceUnreachState && lastDeviceUnreachStateChange > maxSecondDevicesOffline) {
						deviceState = 'Offline'; //set online state to offline
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						} // set linkQuality to nothing
					}
					break;
				}
				case 'mqttClientZigbee2Mqtt': {
					if (maxSecondDevicesOffline <= 0) {
						if (deviceUnreachState !== 'online') {
							deviceState = 'Offline'; //set online state to offline
							if (linkQuality !== ' - ') {
								linkQualitySet = '0%';
							} // set linkQuality to nothing
						}
					} else if (deviceUnreachState !== 'online' && lastDeviceUnreachStateChange > maxSecondDevicesOffline) {
						deviceState = 'Offline'; //set online state to offline
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						}
					}
					break;
				}
				case 'mihome': {
					const offlineByTime = maxSecondDevicesOffline <= 0 || (lastContact && lastContact > maxSecondDevicesOffline);
					const offlineByState = deviceUnreachState !== undefined ? !deviceUnreachState && offlineByTime : offlineByTime;

					if (offlineByState) {
						deviceState = 'Offline';
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						}
					}
					break;
				}
				case 'smartgarden': {
					if (maxSecondDevicesOffline <= 0) {
						if (deviceUnreachState === 'OFFLINE') {
							deviceState = 'Offline'; //set online state to offline
							if (linkQuality !== ' - ') {
								linkQualitySet = '0%';
							} // set linkQuality to nothing
						}
					} else if (deviceUnreachState === 'OFFLINE' && lastDeviceUnreachStateChange > maxSecondDevicesOffline) {
						deviceState = 'Offline'; //set online state to offline
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						} // set linkQuality to nothing
					}
					break;
				}
				default: {
					// Gerät gilt als offline, wenn es unerreichbar ist und keine Wartezeit definiert ist, oder wenn der letzte Kontakt zu lange her ist als Wartezeit
					let shouldBeOffline = false;

					if (maxSecondDevicesOffline <= 0) {
						if (!deviceUnreachState) {
							shouldBeOffline = true;
						}
					} else if (lastContact && lastContact > maxSecondDevicesOffline) {
						shouldBeOffline = true;
					}

					if (shouldBeOffline) {
						deviceState = 'Offline'; // Gerät auf offline setzen
						if (linkQuality !== ' - ') {
							linkQualitySet = '0%';
						}
					}
				}
			}

			return [lastContactString, deviceState, linkQualitySet];
		} catch (error) {
			this.log.error(`[getLastContact] - ${error}`);
		}
	}

	/**
	 * @param {any} adapterID
	 * @param {string | number | boolean | null} deviceUpdateSelector
	 */
	async checkDeviceUpdate(adapterID, deviceUpdateSelector) {
		let isUpgradable = false;

		switch (adapterID) {
			case 'hmiP':
				isUpgradable = deviceUpdateSelector === 'UPDATE_AVAILABLE';
				break;

			case 'ring':
				isUpgradable = deviceUpdateSelector !== 'Up to Date';
				break;

			default:
				if (typeof deviceUpdateSelector === 'boolean') {
					isUpgradable = deviceUpdateSelector;
				}
				break;
		}

		return isUpgradable;
	}

	/**
	 * fill the lists for user
	 *
	 * @param {object} device
	 */
	async theLists(device) {
		// Raw List with all devices for user
		if (device.Status !== 'disabled') {
			this.listAllDevicesUserRaw.push({
				Device: device.Device,
				Adapter: device.Adapter,
				Instance: device.instance,
				'Instance connected': device.instanceDeviceConnected,
				isBatteryDevice: device.isBatteryDevice,
				Battery: device.Battery,
				BatteryRaw: device.BatteryRaw,
				BatteryUnitRaw: device.BatteryUnitRaw,
				isLowBat: device.LowBat,
				'Signal strength': device.SignalStrength,
				'Signal strength Raw': device.SignalStrengthRaw,
				'Last contact': device.LastContact,
				'Update Available': device.Upgradable,
				Status: device.Status,
			});

			// List with all devices
			this.listAllDevices.push({
				[translations.Device[this.config.userSelectedLanguage]]: device.Device,
				[translations.Adapter[this.config.userSelectedLanguage]]: device.Adapter,
				[translations.Battery[this.config.userSelectedLanguage]]: device.Battery,
				[translations.Signal_strength[this.config.userSelectedLanguage]]: device.SignalStrength,
				[translations.Last_Contact[this.config.userSelectedLanguage]]: device.LastContact,
				[translations.Status[this.config.userSelectedLanguage]]: device.Status,
			});

			// LinkQuality lists
			if (device.SignalStrength != ' - ') {
				this.linkQualityDevices.push({
					[translations.Device[this.config.userSelectedLanguage]]: device.Device,
					[translations.Adapter[this.config.userSelectedLanguage]]: device.Adapter,
					[translations.Signal_strength[this.config.userSelectedLanguage]]: device.SignalStrength,
				});
			}

			// Battery lists
			if (device.isBatteryDevice) {
				this.batteryPowered.push({
					[translations.Device[this.config.userSelectedLanguage]]: device.Device,
					[translations.Adapter[this.config.userSelectedLanguage]]: device.Adapter,
					[translations.Battery[this.config.userSelectedLanguage]]: device.Battery,
					[translations.Status[this.config.userSelectedLanguage]]: device.Status,
				});
			}

			// Low Bat lists
			if (device.LowBat && device.Status !== 'Offline') {
				this.batteryLowPowered.push({
					[translations.Device[this.config.userSelectedLanguage]]: device.Device,
					[translations.Adapter[this.config.userSelectedLanguage]]: device.Adapter,
					[translations.Battery[this.config.userSelectedLanguage]]: device.Battery,
				});
			}

			// Offline List
			if (device.Status === 'Offline') {
				this.offlineDevices.push({
					[translations.Device[this.config.userSelectedLanguage]]: device.Device,
					[translations.Adapter[this.config.userSelectedLanguage]]: device.Adapter,
					[translations.Last_Contact[this.config.userSelectedLanguage]]: device.LastContact,
				});
			}

			// Device update List
			if (device.Upgradable === true || device.Upgradable === 1) {
				this.upgradableList.push({
					[translations.Device[this.config.userSelectedLanguage]]: device.Device,
					[translations.Adapter[this.config.userSelectedLanguage]]: device.Adapter,
				});
			}
		}
	}

	/**
	 * @param {string | string[]} id
	 * @param {ioBroker.State} state
	 */
	async renewDeviceData(id, state) {
		const regex = /^([^.]+\.\d+\.[^.]+)/;
		let batteryData;
		let signalData;
		let oldLowBatState;
		let contactData;
		let oldStatus;
		let isLowBatValue;

		const deviceID = id.match(regex)[1];
		const deviceData = this.listAllDevicesRaw.get(deviceID);

		this.log.debug(`[renewDeviceData] - ${id}`);

		if (deviceData) {
			const gefundenerAdapter = Object.values(adapterArray).find((adapter) => adapter.adapterID === deviceData.adapterID);
			const silentEnabled = Object.values(this.config.tableDevices).find((adapter) => adapter.adapterKey === gefundenerAdapter.adapterKey);

			// On statechange update available datapoint
			switch (id) {
				// device connection
				case deviceData.instanceDeviceConnectionDP:
					if (state.val !== deviceData.instanceDeviceConnected) {
						deviceData.instanceDeviceConnected = state.val;
					}
					break;

				// device updates
				case deviceData.UpdateDP:
					if (state.val !== deviceData.Upgradable) {
						deviceData.Upgradable = await this.checkDeviceUpdate(deviceData.adapterID, state.val);
						if (deviceData.Upgradable === true) {
							if (this.config.checkSendDeviceUpgrade && !this.blacklistNotify.includes(deviceData.Path)) {
								await this.sendStateNotifications('Devices', 'updateDevice', deviceID, silentEnabled.telegramSilent);
							}
						}
					}
					break;

				// device signal
				case deviceData.SignalStrengthDP:
					signalData = await this.calculateSignalStrength(state, deviceData.adapterID);
					deviceData.SignalStrength = signalData[0];

					break;

				// device battery
				case deviceData.batteryDP:
					if (deviceData.isBatteryDevice) {
						oldLowBatState = deviceData.LowBat;
						if (state.val === 0 && deviceData.BatteryRaw >= 5) {
							return;
						}
						batteryData = await this.getBatteryData(state.val, oldLowBatState, deviceData.faultReport, deviceData.adapterID);

						deviceData.Battery = batteryData[0];
						deviceData.BatteryRaw = batteryData[2];
						deviceData.BatteryUnitRaw = batteryData[3];
						if (deviceData.LowBatDP !== 'none') {
							isLowBatValue = await tools.getInitValue(this, deviceData.LowBatDP);
						} else {
							isLowBatValue = undefined;
						}
						deviceData.LowBat = await this.setLowbatIndicator(state.val, isLowBatValue, deviceData.faultReport, deviceData.adapterID);

						if (deviceData.LowBat && oldLowBatState !== deviceData.LowBat) {
							if (this.config.checkSendBatteryMsg && !this.blacklistNotify.includes(deviceData.Path)) {
								await this.sendStateNotifications('Devices', 'lowBatDevice', deviceID, silentEnabled.telegramSilent);
							}
						}
					}
					break;

				// device low bat
				case deviceData.LowBatDP:
					if (deviceData.isBatteryDevice) {
						oldLowBatState = deviceData.LowBat;
						batteryData = await this.getBatteryData(deviceData.BatteryRaw, state.val, deviceData.faultReport, deviceData.adapterID);
						deviceData.Battery = batteryData[0];
						deviceData.BatteryRaw = batteryData[2];
						deviceData.BatteryUnitRaw = batteryData[3];
						deviceData.LowBat = await this.setLowbatIndicator(deviceData.BatteryRaw, state.val, deviceData.faultReport, deviceData.adapterID);

						if (deviceData.LowBat && oldLowBatState !== deviceData.LowBat) {
							if (this.config.checkSendBatteryMsg && !this.blacklistNotify.includes(deviceData.Path)) {
								await this.sendStateNotifications('Devices', 'lowBatDevice', deviceID, silentEnabled.telegramSilent);
							}
						}
					}
					break;

				//device error / fault reports
				case deviceData.faultReportDP:
					if (deviceData.isBatteryDevice) {
						oldLowBatState = deviceData.LowBat;
						batteryData = await this.getBatteryData(deviceData.BatteryRaw, oldLowBatState, state.val, deviceData.adapterID);

						deviceData.Battery = batteryData[0];
						deviceData.BatteryRaw = batteryData[2];
						deviceData.BatteryUnitRaw = batteryData[3];
						deviceData.LowBat = await this.setLowbatIndicator(deviceData.BatteryRaw, undefined, state.val, deviceData.adapterID);

						if (deviceData.LowBat && oldLowBatState !== deviceData.LowBat) {
							if (this.config.checkSendBatteryMsg && !this.blacklistNotify.includes(deviceData.Path)) {
								await this.sendStateNotifications('Devices', 'lowBatDevice', deviceID, silentEnabled.telegramSilent);
							}
						}
					}
					break;

				// device unreach
				case deviceData.UnreachDP:
					if (deviceData.instanceDeviceConnected !== undefined) {
						if (deviceData.UnreachState !== state.val) {
							oldStatus = deviceData.Status;
							deviceData.UnreachState = state.val;

							contactData = await this.getOnlineState(
								deviceData.timeSelector,
								deviceData.adapterID,
								deviceData.UnreachDP,
								deviceData.SignalStrength,
								deviceData.UnreachState,
								deviceData.deviceStateSelectorHMRPC,
								deviceData.rssiPeerSelectorHMRPC,
							);

							if (contactData !== undefined || contactData !== null) {
								deviceData.LastContact = contactData[0];
								deviceData.Status = contactData[1];
								deviceData.SignalStrength = contactData[2];
							}

							if (this.config.checkSendOfflineMsg && oldStatus !== deviceData.Status && !this.blacklistNotify.includes(deviceData.Path)) {
								// check if the generally deviceData connected state is for a while true
								if (await tools.getTimestampConnectionDP(this, deviceData.instanceDeviceConnectionDP, 50000)) {
									await this.sendStateNotifications('Devices', 'onlineStateDevice', deviceID, silentEnabled.telegramSilent);
								}
							}
						}
					}
			}
		}
	}

	/**
	 * get all Instances at start
	 */
	async getAllInstanceData() {
		try {
			const allInstances = `system.adapter.*`;
			await this.getInstanceData(allInstances);
		} catch (error) {
			this.log.error(`[getInstance] - ${error}`);
		}
	}

	/**
	 * get instance data
	 *
	 *@param {string} instanceObject
	 */
	async getInstanceData(instanceObject) {
		try {
			const instanceAliveDP = await this.getForeignStatesAsync(`${instanceObject}.alive`);

			this.adapterUpdatesJsonRaw = await this.getAdapterUpdateData(adapterUpdateListDP);

			for (const [id] of Object.entries(instanceAliveDP)) {
				if (!(typeof id === 'string' && id.startsWith(`system.adapter.`))) {
					continue;
				}

				// get instance name
				const instanceID = await this.getInstanceName(id);

				// get instance connected to host data
				const instanceConnectedHostDP = `system.adapter.${instanceID}.connected`;
				const instanceConnectedHostVal = await tools.getInitValue(this, instanceConnectedHostDP);

				// get instance connected to device data
				const instanceConnectedDeviceDP = `${instanceID}.info.connection`;
				let instanceConnectedDeviceVal;
				if (instanceConnectedDeviceDP !== undefined && typeof instanceConnectedDeviceDP === 'boolean') {
					instanceConnectedDeviceVal = await tools.getInitValue(this, instanceConnectedDeviceDP);
				} else {
					instanceConnectedDeviceVal = 'N/A';
				}

				// get adapter version
				const instanceObjectPath = `system.adapter.${instanceID}`;
				let adapterName;
				let adapterVersion;
				let adapterAvailableUpdate = '';
				let instanceMode;
				let scheduleTime = 'N/A';
				const instanceObjectData = await this.getForeignObjectAsync(instanceObjectPath);
				if (instanceObjectData) {
					adapterName = tools.capitalize(instanceObjectData.common.name);
					adapterVersion = instanceObjectData.common.version;
					instanceMode = instanceObjectData.common.mode;

					if (instanceMode === 'schedule') {
						scheduleTime = instanceObjectData.common.schedule;
					}
				}

				const updateEntry = this.adapterUpdatesJsonRaw.find((entry) => entry.adapter.toLowerCase() === adapterName.toLowerCase());

				if (updateEntry) {
					adapterAvailableUpdate = updateEntry.newVersion;
				} else {
					adapterAvailableUpdate = ' - ';
				}

				let isAlive;
				let isHealthy;
				let instanceStatus;
				if (instanceMode === 'schedule') {
					const instanceStatusRaw = await this.checkScheduleisHealty(instanceID, scheduleTime);
					isAlive = instanceStatusRaw[0];
					isHealthy = instanceStatusRaw[1];
					instanceStatus = instanceStatusRaw[2];
				} else if (instanceMode === 'daemon') {
					const instanceStatusRaw = await this.checkDaemonIsHealthy(instanceID);
					isAlive = instanceStatusRaw[0];
					isHealthy = instanceStatusRaw[1];
					instanceStatus = instanceStatusRaw[2];
				}

				//subscribe to statechanges
				this.subscribeForeignStates(id);
				this.subscribeForeignStates(instanceConnectedHostDP);
				this.subscribeForeignStates(instanceConnectedDeviceDP);
				this.subscribeForeignObjects(`system.adapter.*`);
				// this.subscribeForeignStates('*');
				// this.subscribeForeignObjects('*');

				// create raw list
				this.listInstanceRaw.set(instanceID, {
					Adapter: adapterName,
					instanceObjectPath: instanceObjectPath,
					instanceMode: instanceMode,
					schedule: scheduleTime,
					adapterVersion: adapterVersion,
					updateAvailable: adapterAvailableUpdate,
					isAlive: isAlive,
					isHealthy: isHealthy,
					isConnectedHost: instanceConnectedHostVal,
					isConnectedDevice: instanceConnectedDeviceVal,
					status: instanceStatus,
					aliveDP: `system.adapter.${instanceID}.alive`,
					hostConnectionDP: instanceConnectedHostDP,
					deviceConnectionDP: instanceConnectedDeviceDP,
				});
			}
			await this.createInstanceList();
			await this.writeInstanceDPs();
		} catch (error) {
			this.log.error(`[getInstanceData] - ${error}`);
		}
	}

	/**
	 * get Instances
	 *
	 * @param {string} id - Path of alive datapoint
	 */
	async getInstanceName(id) {
		let instance = id;
		instance = instance.slice(15); // remove "system.adapter."
		instance = instance.slice(0, instance.lastIndexOf('.') + 1 - 1); // remove ".alive"
		return instance;
	}

	/**
	 * Check if instance is alive and ok
	 *
	 * @param {string} instanceID
	 */
	async checkDaemonIsHealthy(instanceID) {
		const connectedHostState = await tools.getInitValue(this, `system.adapter.${instanceID}.connected`);
		const isAlive = await tools.getInitValue(this, `system.adapter.${instanceID}.alive`);
		let connectedDeviceState = await tools.getInitValue(this, `${instanceID}.info.connection`);
		if (connectedDeviceState === undefined) {
			connectedDeviceState = true;
		}

		let isHealthy = false;
		let instanceStatusString = translations.instance_deactivated[this.config.userSelectedLanguage];

		if (isAlive) {
			if (connectedHostState && connectedDeviceState) {
				isHealthy = true;
				instanceStatusString = translations.instance_okay[this.config.userSelectedLanguage];
			} else if (!connectedHostState) {
				instanceStatusString = translations.not_connected_host[this.config.userSelectedLanguage];
			} else if (!connectedDeviceState) {
				instanceStatusString = translations.not_connected_device[this.config.userSelectedLanguage];
			}
		}

		return [Boolean(isAlive), Boolean(isHealthy), String(instanceStatusString), Boolean(connectedHostState), Boolean(connectedDeviceState)];
	}

	/**
	 * Check if instance is alive and ok
	 *
	 * @param {string} instanceID
	 * @param {number} instanceDeactivationTime
	 */
	async checkDaemonIsAlive(instanceID, instanceDeactivationTime) {
		let isAlive = await tools.getInitValue(this, `system.adapter.${instanceID}.alive`);
		let daemonIsAlive;
		let isHealthy = false;
		let instanceStatusString = isAlive ? translations.instance_activated[this.config.userSelectedLanguage] : translations.instance_deactivated[this.config.userSelectedLanguage];

		if (isAlive) {
			daemonIsAlive = await this.checkDaemonIsHealthy(instanceID);
		} else {
			await this.delay(instanceDeactivationTime);
			daemonIsAlive = await this.checkDaemonIsHealthy(instanceID);
			if (!daemonIsAlive[0]) {
				await this.delay(instanceDeactivationTime);
				daemonIsAlive = await this.checkDaemonIsHealthy(instanceID);
			}
		}

		isAlive = Boolean(daemonIsAlive[0]);
		isHealthy = Boolean(daemonIsAlive[1]);
		instanceStatusString = String(daemonIsAlive[2]);
		const connectedToHost = Boolean(daemonIsAlive[3]);
		const connectedToDevice = Boolean(daemonIsAlive[4]);

		return [isAlive, isHealthy, instanceStatusString, connectedToHost, connectedToDevice];
	}

	async checkScheduleisHealty(instanceID, scheduleTime) {
		let lastUpdate;
		let previousCronRun = null;
		let lastCronRun;
		let diff;
		let isAlive = false;
		let isHealthy = false;
		let instanceStatusString = translations.instance_deactivated[this.config.userSelectedLanguage];
		const isAliveSchedule = await this.getForeignStateAsync(`system.adapter.${instanceID}.alive`);

		if (isAliveSchedule) {
			lastUpdate = Math.round((Date.now() - isAliveSchedule.lc) / 1000); // Last state change in seconds
			previousCronRun = this.getPreviousCronRun(scheduleTime); // When was the last cron run
			if (previousCronRun) {
				lastCronRun = Math.round(previousCronRun / 1000); // change distance to last run in seconds
				diff = lastCronRun - lastUpdate;
				if (diff > -300) {
					// if 5 minutes difference exceeded, instance is not alive
					isAlive = true;
					isHealthy = true;
					instanceStatusString = translations.instance_okay[this.config.userSelectedLanguage];
				}
			}
		}

		return [isAlive, isHealthy, instanceStatusString];
	}

	/**
	 * set status for instance
	 *
	 * @param {string} instanceMode
	 * @param {string} scheduleTime
	 * @param {any} instanceID
	 */
	async setInstanceStatus(instanceMode, scheduleTime, instanceID) {
		let instanceDeactivationTime = (this.config.offlineTimeInstances * 1000) / 2;
		let instanceErrorTime = (this.config.errorTimeInstances * 1000) / 2;
		let isAlive;
		let isHealthy;
		let instanceStatusString;
		let daemonIsAlive;
		let daemonIsNotAlive;
		let scheduleIsAlive;
		let connectedToHost;
		let connectedToDevice;

		switch (instanceMode) {
			case 'schedule':
				scheduleIsAlive = await this.checkScheduleisHealty(instanceID, scheduleTime);
				isAlive = Boolean(scheduleIsAlive[0]);
				isHealthy = Boolean(scheduleIsAlive[1]);
				instanceStatusString = String(scheduleIsAlive[2]);
				break;
			case 'daemon':
				// check with time the user did define for error and deactivation
				if (this.userTimeInstancesList.has(instanceID)) {
					const userTimeInstances = this.userTimeInstancesList.get(instanceID);
					instanceDeactivationTime = (userTimeInstances.deactivationTime * 1000) / 2;
					instanceErrorTime = (userTimeInstances.errorTime * 1000) / 2;
				}
				daemonIsAlive = await this.checkDaemonIsHealthy(instanceID);
				if (daemonIsAlive[0] && !daemonIsAlive[1]) {
					await this.delay(instanceErrorTime);
					const daemonIsAliveAfterDelay = await this.checkDaemonIsHealthy(instanceID);

					if (daemonIsAliveAfterDelay[0] && !daemonIsAliveAfterDelay[1]) {
						await this.delay(instanceErrorTime);
						const daemonIsAliveAfterSecondDelay = await this.checkDaemonIsHealthy(instanceID);

						if (daemonIsAliveAfterSecondDelay[0] && !daemonIsAliveAfterSecondDelay[1]) {
							isAlive = Boolean(daemonIsAliveAfterSecondDelay[0]);
							isHealthy = Boolean(daemonIsAliveAfterSecondDelay[1]);
							instanceStatusString = String(daemonIsAliveAfterSecondDelay[2]);
							connectedToHost = Boolean(daemonIsAliveAfterSecondDelay[3]);
							connectedToDevice = Boolean(daemonIsAliveAfterSecondDelay[4]);
						}
					}
				} else {
					daemonIsNotAlive = await this.checkDaemonIsAlive(instanceID, instanceDeactivationTime);
					isAlive = Boolean(daemonIsNotAlive[0]);
					isHealthy = Boolean(daemonIsNotAlive[1]);
					instanceStatusString = String(daemonIsNotAlive[2]);
					connectedToHost = Boolean(daemonIsNotAlive[3]);
					connectedToDevice = Boolean(daemonIsNotAlive[4]);
				}

				break;
		}

		return [isAlive, isHealthy, instanceStatusString, connectedToHost, connectedToDevice];
	}

	/**
	 * create adapter update raw lists
	 *
	 * @param {string} adapterUpdateListDP
	 */
	async getAdapterUpdateData(adapterUpdateListDP) {
		// Clear the existing adapter updates data
		let adapterUpdatesJsonRaw = [];
		let adapterJsonList;

		// Fetch the adapter updates list
		const adapterUpdatesListVal = await this.getForeignStatesAsync(adapterUpdateListDP);

		// Extract adapter data from the list
		for (const [id, value] of Object.entries(adapterUpdatesListVal)) {
			adapterJsonList = tools.parseData(value.val);
		}

		// Populate the adapter updates data
		for (const [id, adapterData] of Object.entries(adapterJsonList)) {
			adapterUpdatesJsonRaw.push({
				adapter: tools.capitalize(id),
				newVersion: adapterData.availableVersion,
				oldVersion: adapterData.installedVersion,
			});
		}

		return adapterUpdatesJsonRaw;
	}

	/**
	 * create instanceList
	 */
	async createAdapterUpdateList() {
		this.listAdapterUpdates = [];
		this.countAdapterUpdates = 0;

		for (const updateData of this.adapterUpdatesJsonRaw) {
			this.listAdapterUpdates.push({
				[translations.Adapter[this.config.userSelectedLanguage]]: updateData.adapter,
				[translations.Available_Version[this.config.userSelectedLanguage]]: updateData.newVersion,
				[translations.Installed_Version[this.config.userSelectedLanguage]]: updateData.oldVersion,
			});
		}

		this.countAdapterUpdates = this.listAdapterUpdates.length;
		await this.writeAdapterUpdatesDPs();
	}

	/**
	 * write datapoints for adapter with updates
	 */
	async writeAdapterUpdatesDPs() {
		// Write Datapoints for counts
		await this.setStateChangedAsync(`adapterAndInstances.countAdapterUpdates`, { val: this.countAdapterUpdates, ack: true });

		if (this.countAdapterUpdates === 0) {
			this.listAdapterUpdates = [
				{
					[translations.Adapter[this.config.userSelectedLanguage]]: '--no updates--',
					[translations.Available_Version[this.config.userSelectedLanguage]]: '',
					[translations.Installed_Version[this.config.userSelectedLanguage]]: '',
				},
			];
		}
		await this.setStateChangedAsync(`adapterAndInstances.listAdapterUpdates`, { val: JSON.stringify(this.listAdapterUpdates), ack: true });
	}

	/**
	 * create instanceList
	 */
	async createInstanceList() {
		this.listAllInstances = [];
		this.listAllActiveInstances = [];
		this.listDeactivatedInstances = [];
		this.listErrorInstanceRaw = [];
		this.listErrorInstance = [];

		for (const [instance, instanceData] of this.listInstanceRaw) {
			// fill raw list
			if (instanceData.isAlive && !instanceData.isHealthy) {
				this.listErrorInstanceRaw.push({
					Adapter: instanceData.Adapter,
					Instance: instance,
					Mode: instanceData.instanceMode,
					Status: instanceData.status,
				});
			}

			if (this.blacklistInstancesLists.includes(instance)) {
				continue;
			}
			// all instances
			this.listAllInstances.push({
				[translations.Adapter[this.config.userSelectedLanguage]]: instanceData.Adapter,
				[translations.Instance[this.config.userSelectedLanguage]]: instance,
				[translations.Mode[this.config.userSelectedLanguage]]: instanceData.instanceMode,
				[translations.Schedule[this.config.userSelectedLanguage]]: instanceData.schedule,
				[translations.Version[this.config.userSelectedLanguage]]: instanceData.adapterVersion,
				[translations.Updateable[this.config.userSelectedLanguage]]: instanceData.updateAvailable,
				[translations.Status[this.config.userSelectedLanguage]]: instanceData.status,
			});

			if (!instanceData.isAlive) {
				// list with deactivated instances
				this.listDeactivatedInstances.push({
					[translations.Adapter[this.config.userSelectedLanguage]]: instanceData.Adapter,
					[translations.Instance[this.config.userSelectedLanguage]]: instance,
					[translations.Status[this.config.userSelectedLanguage]]: instanceData.status,
				});
			} else {
				// list with active instances
				this.listAllActiveInstances.push({
					[translations.Adapter[this.config.userSelectedLanguage]]: instanceData.Adapter,
					[translations.Instance[this.config.userSelectedLanguage]]: instance,
					[translations.Mode[this.config.userSelectedLanguage]]: instanceData.instanceMode,
					[translations.Schedule[this.config.userSelectedLanguage]]: instanceData.schedule,
					[translations.Status[this.config.userSelectedLanguage]]: instanceData.status,
				});
			}

			// list with error instances
			if (instanceData.isAlive && !instanceData.isHealthy) {
				this.listErrorInstance.push({
					[translations.Adapter[this.config.userSelectedLanguage]]: instanceData.Adapter,
					[translations.Instance[this.config.userSelectedLanguage]]: instance,
					[translations.Mode[this.config.userSelectedLanguage]]: instanceData.instanceMode,
					[translations.Status[this.config.userSelectedLanguage]]: instanceData.status,
				});
			}
		}
		await this.countInstances();
	}

	/**
	 * count instanceList
	 */
	async countInstances() {
		this.countAllInstances = 0;
		this.countAllActiveInstances = 0;
		this.countDeactivatedInstances = 0;
		this.countErrorInstance = 0;

		this.countAllInstances = this.listAllInstances.length;
		this.countAllActiveInstances = this.listAllActiveInstances.length;
		this.countDeactivatedInstances = this.listDeactivatedInstances.length;
		this.countErrorInstance = this.listErrorInstance.length;
	}

	/**
	 * write datapoints for instances list and counts
	 */
	async writeInstanceDPs() {
		// List all instances
		await this.setStateChangedAsync(`adapterAndInstances.listAllInstances`, { val: JSON.stringify(this.listAllInstances), ack: true });
		await this.setStateChangedAsync(`adapterAndInstances.countAllInstances`, { val: this.countAllInstances, ack: true });

		// List all active instances
		await this.setStateChangedAsync(`adapterAndInstances.listAllActiveInstances`, { val: JSON.stringify(this.listAllActiveInstances), ack: true });
		await this.setStateChangedAsync(`adapterAndInstances.countAllActiveInstances`, { val: this.countAllActiveInstances, ack: true });

		// list deactivated instances
		if (this.countDeactivatedInstances === 0) {
			this.listDeactivatedInstances = [
				{
					[translations.Adapter[this.config.userSelectedLanguage]]: '--none--',
					[translations.Instance[this.config.userSelectedLanguage]]: '',
					[translations.Version[this.config.userSelectedLanguage]]: '',
					[translations.Status[this.config.userSelectedLanguage]]: '',
				},
			];
		}
		await this.setStateChangedAsync(`adapterAndInstances.listDeactivatedInstances`, { val: JSON.stringify(this.listDeactivatedInstances), ack: true });
		await this.setStateChangedAsync(`adapterAndInstances.countDeactivatedInstances`, { val: this.countDeactivatedInstances, ack: true });

		// list error instances
		if (this.countErrorInstance === 0) {
			this.listErrorInstance = [
				{
					[translations.Adapter[this.config.userSelectedLanguage]]: '--none--',
					[translations.Instance[this.config.userSelectedLanguage]]: '',
					[translations.Mode[this.config.userSelectedLanguage]]: '',
					[translations.Status[this.config.userSelectedLanguage]]: '',
				},
			];
		}
		await this.setStateChangedAsync(`adapterAndInstances.listInstancesError`, { val: JSON.stringify(this.listErrorInstance), ack: true });
		await this.setStateChangedAsync(`adapterAndInstances.countInstancesError`, { val: this.countErrorInstance, ack: true });
	}

	/**
	 * @param {string} id
	 */
	async renewAdapterUpdateData(id) {
		const previousAdapterUpdatesCount = this.countAdapterUpdates;

		// Fetch and process adapter update data
		await this.getAdapterUpdateData(id);
		await this.createAdapterUpdateList();

		// Check and send update notification if required
		if (this.config.checkSendAdapterUpdateMsg && this.countAdapterUpdates > previousAdapterUpdatesCount) {
			await this.sendStateNotifications('AdapterUpdates', 'updateAdapter', null);
		}

		// Update instances with available adapter updates
		for (const instance of this.listInstanceRaw.values()) {
			const adapterUpdate = this.adapterUpdatesJsonRaw.find((entry) => entry.adapter.toLowerCase() === instance.Adapter.toLowerCase());

			if (adapterUpdate) {
				instance.updateAvailable = adapterUpdate.newVersion;
			} else {
				instance.updateAvailable = ' - ';
			}
		}
	}
	/**
	 * call function on state change, renew data and send messages
	 *
	 * @param {string} id
	 * @param {ioBroker.State} state
	 */
	async renewInstanceData(id, state) {
		const instanceID = await this.getInstanceName(id);
		const instanceData = this.listInstanceRaw.get(instanceID);
		if (instanceData) {
			let instanceStatusRaw;

			const checkInstance = async (instanceID, instanceData) => {
				instanceStatusRaw = await this.setInstanceStatus(instanceData.instanceMode, instanceData.schedule, instanceID);
				instanceData.isAlive = instanceStatusRaw[0];
				instanceData.isHealthy = instanceStatusRaw[1];
				instanceData.status = instanceStatusRaw[2];
				instanceData.isConnectedHost = instanceStatusRaw[3];
				instanceData.isConnectedDevice = instanceStatusRaw[4];
				return;
			};

			switch (id) {
				case `system.adapter.${instanceID}.alive`:
					if (state.val !== instanceData.isAlive) {
						await checkInstance(instanceID, instanceData);
						// send message when instance was deactivated
						if (this.config.checkSendInstanceDeactivatedMsg && !instanceData.isAlive) {
							if (this.blacklistInstancesNotify.includes(instanceID)) {
								return;
							}
							await this.sendStateNotifications('Instances', 'deactivatedInstance', instanceID);
						}
					}
					break;

				case `system.adapter.${instanceID}.connected`:
					if (state.val !== instanceData.isConnectedHost && instanceData.isAlive) {
						await checkInstance(instanceID, instanceData);
						// send message when instance has an error
						if (this.config.checkSendInstanceFailedMsg && !instanceData.isHealthy && instanceData.isAlive) {
							if (this.blacklistInstancesNotify.includes(instanceID)) {
								return;
							}
							await this.sendStateNotifications('Instances', 'errorInstance', instanceID);
						}
					}
					break;

				case `${instanceID}.info.connection`:
					if (state.val !== instanceData.isConnectedDevice && instanceData.isAlive) {
						await checkInstance(instanceID, instanceData);
						// send message when instance has an error
						if (this.config.checkSendInstanceFailedMsg && !instanceData.isHealthy && instanceData.isAlive) {
							if (this.blacklistInstancesNotify.includes(instanceID)) {
								return;
							}
							await this.sendStateNotifications('Instances', 'errorInstance', instanceID);
						}
					}
					break;
			}
		}
	}

	/*=============================================
	=       functions to send notifications       =
	=============================================*/

	/**
	 * Notification service
	 *
	 * @param {string} text - Text which should be send
	 * @param silent
	 */
	async sendNotification(text, silent = false) {
		// Pushover
		if (this.config.instancePushover) {
			try {
				//first check if instance is living
				const pushoverAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instancePushover}.alive`);

				if (!pushoverAliveState) {
					this.log.warn('Pushover instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instancePushover, 'send', {
						message: text,
						title: this.config.titlePushover,
						device: this.config.devicePushover,
						user: this.config.userPushover,
						priority: this.config.prioPushover,
					});
				}
			} catch (error) {
				this.log.error(`[sendNotification Pushover] - ${error}`);
			}
		}

		// Telegram
		if (this.config.instanceTelegram) {
			try {
				//first check if instance is living
				const telegramAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceTelegram}.alive`);

				if (!telegramAliveState) {
					this.log.warn('Telegram instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceTelegram, 'send', {
						text: text,
						user: this.config.deviceTelegram,
						chatId: this.config.chatIdTelegram,
						disable_notification: silent,
					});
				}
			} catch (error) {
				this.log.error(`[sendNotification Telegram] - ${error}`);
			}
		}

		// Whatsapp
		if (this.config.instanceWhatsapp) {
			try {
				//first check if instance is living
				const whatsappAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceWhatsapp}.alive`);

				if (!whatsappAliveState) {
					this.log.warn('Whatsapp instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceWhatsapp, 'send', {
						text: text,
						phone: this.config.phoneWhatsapp,
					});
				}
			} catch (error) {
				this.log.error(`[sendNotification Whatsapp] - ${error}`);
			}
		}

		// Matrix
		if (this.config.instanceMatrix) {
			try {
				//first check if instance is living
				const matrixAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceMatrix}.alive`);

				if (!matrixAliveState) {
					this.log.warn('Matrix instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceMatrix, 'send', {
						html: `<h1>${this.config.titleMatrix}</h1>`,
						text: text,
					});
				}
			} catch (error) {
				this.log.error(`[sendNotification Matrix] - ${error}`);
			}
		}

		// Signal
		if (this.config.instanceSignal) {
			try {
				//first check if instance is living
				const signalAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceSignal}.alive`);

				if (!signalAliveState) {
					this.log.warn('Signal instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceSignal, 'send', {
						text: text,
						phone: this.config.phoneSignal,
					});
				}
			} catch (error) {
				this.log.error(`[sendNotification Signal] - ${error}`);
			}
		}

		// Email
		if (this.config.instanceEmail) {
			try {
				//first check if instance is living
				const eMailAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceEmail}.alive`);

				if (!eMailAliveState) {
					this.log.warn('eMail instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceEmail, 'send', {
						sendTo: this.config.sendToEmail,
						text: text,
						subject: this.config.subjectEmail,
					});
				}
			} catch (error) {
				this.log.error(`[sendNotification eMail] - ${error}`);
			}
		}

		// Jarvis Notification
		if (this.config.instanceJarvis) {
			try {
				//first check if instance is living
				const jarvisAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceJarvis}.alive`);

				if (!jarvisAliveState) {
					this.log.warn('Jarvis instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					const jsonText = JSON.stringify(text);
					await this.setForeignStateAsync(
						`${this.config.instanceJarvis}.addNotification`,
						`{"title":"${this.config.titleJarvis} (${this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss')})","message": ${jsonText},"display": "drawer"}`,
					);
				}
			} catch (error) {
				this.log.error(`[sendNotification Jarvis] - ${error}`);
			}
		}

		// Lovelace Notification
		if (this.config.instanceLovelace) {
			try {
				//first check if instance is living
				const lovelaceAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceLovelace}.alive`);

				if (!lovelaceAliveState) {
					this.log.warn('Lovelace instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					const jsonText = JSON.stringify(text);
					await this.setForeignStateAsync(
						`${this.config.instanceLovelace}.notifications.add`,
						`{"message":${jsonText}, "title":"${this.config.titleLovelace} (${this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss')})"}`,
					);
				}
			} catch (error) {
				this.log.error(`[sendNotification Lovelace] - ${error}`);
			}
		}

		// Synochat Notification
		if (this.config.instanceSynochat) {
			try {
				//first check if instance is living
				const synochatAliveState = await tools.getInitValue(this, `system.adapter.${this.config.instanceSynochat}.alive`);

				if (!synochatAliveState) {
					this.log.warn('Synochat instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					if (this.config.channelSynochat !== undefined) {
						await this.setForeignStateAsync(`${this.config.instanceSynochat}.${this.config.channelSynochat}.message`, text);
					} else {
						this.log.warn('Synochat channel is not set. Message could not be sent. Please check your instance configuration.');
					}
				}
			} catch (error) {
				this.log.error(`[sendNotification Synochat] - ${error}`);
			}
		}
	} // <-- End of sendNotification function

	/*---------- Notifications ----------*/
	/**
	 * Notifications on state changes
	 *
	 * @param {string} mainType
	 * @param {string} type
	 * @param {object} id
	 * @param silent
	 */
	async sendStateNotifications(mainType, type, id, silent = false) {
		if (isUnloaded) {
			return;
		}
		let objectData;
		let adapterName;
		let list = '';
		let message = '';

		if (id !== null) {
			if (mainType === 'Devices') {
				objectData = this.listAllDevicesRaw.get(id);
				adapterName = this.config.showAdapterNameinMsg ? `${objectData.Adapter}: ` : '';
			} else if (mainType === 'Instances') {
				objectData = this.listInstanceRaw.get(id);
			}
		}

		const setMessage = async (message) => {
			this.log.info(message);
			await this.setStateAsync('lastNotification', message, true);
			await this.sendNotification(message, silent);
		};

		switch (type) {
			case 'lowBatDevice':
				message = `${translations.Device_low_bat_detected[this.config.userSelectedLanguage]}: \n${adapterName} ${objectData.Device} (${objectData.Battery})`;
				await setMessage(message);
				break;

			case 'onlineStateDevice':
				switch (objectData.Status) {
					case 'Online':
						message = `${translations.Device_available_again[this.config.userSelectedLanguage]}: \n${adapterName} ${objectData.Device} (${objectData.LastContact})`;
						break;

					case 'Offline':
						message = `${translations.Device_not_reachable[this.config.userSelectedLanguage]}: \n${adapterName} ${objectData.Device} (${objectData.LastContact})`;
						break;
				}
				await setMessage(message);
				break;

			case 'updateDevice':
				message = `${translations.Device_new_updates[this.config.userSelectedLanguage]}: \n${adapterName} ${objectData.Device}`;
				await setMessage(message);
				break;

			case 'updateAdapter':
				if (this.countAdapterUpdates === 0) {
					return;
				}

				objectData = this.listAdapterUpdates;
				list = '';

				for (const id of objectData) {
					list = `${list}\n${id[translations.Adapter[this.config.userSelectedLanguage]]}: v${id[translations.Available_Version[this.config.userSelectedLanguage]]}`;
				}

				message = `${translations.Adapter_new_updates[this.config.userSelectedLanguage]}: ${list}`;
				await setMessage(message);
				break;

			case 'errorInstance':
			case 'deactivatedInstance':
				message = `${translations.Instance_Watchdog[this.config.userSelectedLanguage]}:\n${id}: ${objectData.status}`;
				await setMessage(message);
				break;
		}
	}

	/**
	 * Notifications per user defined schedule
	 *
	 * @param {string} type
	 * @param silent
	 */
	async sendScheduleNotifications(type, silent = false) {
		if (isUnloaded) {
			return;
		}

		const checkDays = [];
		const dayConfigKeys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		let list = '';
		let message = '';

		const setMessage = async (message) => {
			this.log.info(message);
			await this.setStateAsync('lastNotification', message, true);
			if (!message.includes('no updates')) {
				await this.sendNotification(message, silent);
			}
		};

		const processDeviceList = (deviceList, property1, property2) => {
			list = '';
			for (const id of deviceList) {
				if (this.blacklistNotify.includes(id.Path)) {
					continue;
				}
				list += `\n${!this.config.showAdapterNameinMsg ? '' : `${id.Adapter}: `}${id[property1]}${property2 ? ` (${id[property2]})` : ''}`;
			}
		};

		const processInstanceList = (instanceList, property) => {
			list = '';
			for (const id of instanceList) {
				if (this.blacklistInstancesNotify.includes(id[translations['Instance'][this.config.userSelectedLanguage]])) {
					continue;
				}
				list += `\n${id[translations['Instance'][this.config.userSelectedLanguage]]}${property ? `: ${id[property]}` : ''}`;
			}
		};

		const processNotification = async (list, messageType) => {
			if (list.length === 0) {
				return;
			}

			switch (checkDays.length) {
				case 1:
					message = `${translations.Weekly_overview[this.config.userSelectedLanguage]} ${translations[messageType][this.config.userSelectedLanguage]}: ${list}`;
					break;
				case 7:
					message = `${translations.Daily_overview[this.config.userSelectedLanguage]} ${translations[messageType][this.config.userSelectedLanguage]}: ${list}`;
					break;
				default:
					message = `${translations.Overview_of[this.config.userSelectedLanguage]} ${translations[messageType][this.config.userSelectedLanguage]}: ${list}`;
					break;
			}

			await setMessage(message);
		};

		switch (type) {
			case 'lowBatteryDevices':
				checkDays.push(...dayConfigKeys.map((day, index) => (this.config[`check${day}`] ? index : null)).filter((day) => day !== null));

				if (checkDays.length === 0) {
					this.log.warn(`No days selected for daily low battery devices message. Please check the instance configuration!`);
					return;
				}
				this.log.debug(`Number of selected days for daily low battery devices message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);

				schedule.scheduleJob(`1 ${this.config.checkSendBatteryTime.split(':').reverse().join(' ')} * * ${checkDays.join(',')}`, async () => {
					processDeviceList(this.batteryLowPoweredRaw, 'Device', 'Battery');

					await processNotification(list, 'devices_low_bat');
				});
				break;

			case 'offlineDevices':
				checkDays.push(...dayConfigKeys.map((day, index) => (this.config[`checkOffline${day}`] ? index : null)).filter((day) => day !== null));

				if (checkDays.length === 0) {
					this.log.warn(`No days selected for daily offline devices message. Please check the instance configuration!`);
					return;
				}
				this.log.debug(`Number of selected days for daily offline devices message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);

				schedule.scheduleJob(`2 ${this.config.checkSendOfflineTime.split(':').reverse().join(' ')} * * ${checkDays.join(',')}`, async () => {
					processDeviceList(this.offlineDevicesRaw, `Device`, 'LastContact');

					await processNotification(list, 'offline_devices');
				});
				break;

			case 'updateDevices':
				checkDays.push(...dayConfigKeys.map((day, index) => (this.config[`checkUpgrade${day}`] ? index : null)).filter((day) => day !== null));

				if (checkDays.length === 0) {
					this.log.warn(`No days selected for daily updatable devices message. Please check the instance configuration!`);
					return;
				}
				this.log.debug(`Number of selected days for daily updatable devices message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);

				schedule.scheduleJob(`3 ${this.config.checkSendUpgradeTime.split(':').reverse().join(' ')} * * ${checkDays.join(',')}`, async () => {
					processDeviceList(this.upgradableDevicesRaw, 'Device');

					await processNotification(list, 'available_updatable_devices');
				});
				break;

			case 'updateAdapter':
				checkDays.push(...dayConfigKeys.map((day, index) => (this.config[`checkAdapterUpdate${day}`] ? index : null)).filter((day) => day !== null));

				if (checkDays.length === 0) {
					this.log.warn(`No days selected for daily adapter update message. Please check the instance configuration!`);
					return;
				}
				this.log.debug(`Number of selected days for daily adapter update message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);

				schedule.scheduleJob(`4 ${this.config.checkSendAdapterUpdateTime.split(':').reverse().join(' ')} * * ${checkDays.join(',')}`, async () => {
					list = '';
					for (const id of this.listAdapterUpdates) {
						list = `${list}\n${id[translations.Adapter[this.config.userSelectedLanguage]]}: v${id[translations.Available_Version[this.config.userSelectedLanguage]]}`;
					}
					await processNotification(list, 'available_adapter_updates');
				});
				break;

			case 'errorInstance':
				checkDays.push(...dayConfigKeys.map((day, index) => (this.config[`checkFailedInstances${day}`] ? index : null)).filter((day) => day !== null));

				if (checkDays.length === 0) {
					this.log.warn(`No days selected for daily instance error message. Please check the instance configuration!`);
					return;
				}
				this.log.debug(`Number of selected days for daily instance error message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);

				schedule.scheduleJob(`5 ${this.config.checkSendInstanceFailedTime.split(':').reverse().join(' ')} * * ${checkDays.join(',')}`, async () => {
					processInstanceList(this.listErrorInstanceRaw, 'Status');

					await processNotification(list, 'error_instances_msg');
				});
				break;

			case 'deactivatedInstance':
				checkDays.push(...dayConfigKeys.map((day, index) => (this.config[`checkInstanceDeactivated${day}`] ? index : null)).filter((day) => day !== null));

				if (checkDays.length === 0) {
					this.log.warn(`No days selected for daily instance deactivated message. Please check the instance configuration!`);
					return;
				}
				this.log.debug(`Number of selected days for daily instance deactivated message: ${checkDays.length}. Send Message on: ${checkDays.join(', ')} ...`);

				schedule.scheduleJob(`5 ${this.config.checkSendInstanceDeactivatedTime.split(':').reverse().join(' ')} * * ${checkDays.join(',')}`, async () => {
					processInstanceList(this.listDeactivatedInstances);

					await processNotification(list, 'deactivated_instances_msg');
				});
				break;
		}
	}
	async getPreviousCronRun(lastCronRun) {
		try {
			const cronParser = cronParserLib.parseExpression
				? cronParserLib // klassischer Import
				: cronParserLib.default; // ESM-Fallback

			const interval = cronParser.parseExpression(lastCronRun);
			const previous = interval.prev();
			return Math.floor(Date.now() - previous.getTime()); // in ms
		} catch (error) {
			this.log.error(`[getPreviousCronRun] - ${error}`);
		}
	}

	/**
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.debug('clearing timeouts');

			isUnloaded = true;

			if (this.refreshDataTimeout) {
				this.clearTimeout(this.refreshDataTimeout);
				this.refreshDataTimeout = null;
			}

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
	 * @param {Partial<utils.AdapterOptions>} [options]
	 */
	module.exports = (options) => new DeviceWatcher(options);
} else {
	// otherwise start the instance directly
	new DeviceWatcher();
}
