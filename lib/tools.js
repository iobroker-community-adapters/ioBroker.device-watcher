const adapterArray = require('./adapterArray');

/**
 *
 * @param adaptr
 * @param unreachDP
 * @param treeDP
 */
async function isDisabledDevice(adaptr, treeDP) {
	let isDisabled = false;

	const device = await adaptr.getForeignObject(treeDP);

	if (!device || !device.common) {
		return isDisabled;
	}

	const desc = device.common.desc ?? '';
	const descStr = typeof desc === 'object' ? JSON.stringify(desc) : String(desc);
	const deviceRemoved = device.native && device.native.deviceRemoved === true;

	if (deviceRemoved || descStr.includes('disabled') || descStr.includes('Deaktiviert')) {
		isDisabled = true;
	}
	return isDisabled;
}

/**
 * @param {object} data - object
 */
function parseData(data) {
	if (!data) {
		return {};
	}
	if (typeof data === 'object') {
		return data;
	}
	if (typeof data === 'string') {
		return JSON.parse(data);
	}
	return {};
}

/**
 * @param adaptr
 * @param {object} obj - State of datapoint
 */
async function getInitValue(adaptr, obj) {
	//state can be null or undefinded
	const foreignState = await adaptr.getForeignStateAsync(obj);
	if (foreignState) {
		return foreignState.val;
	}
}

/**
 * Subscribe to foreign states only once per pattern.
 * ioBroker/js-controller emits an immediate stateChange event for all
 * currently matching states whenever subscribeForeignStates is called
 * (even if the pattern is already subscribed). Since createData() runs
 * on every main() pass (including rescans triggered by pendingRescan),
 * calling subscribeForeignStates unconditionally there caused a burst of
 * stateChange events on every pass, which in turn set pendingRescan again
 * and could loop indefinitely (endless "Pending rescan detected" loop).
 * This helper de-duplicates subscriptions to avoid that feedback loop.
 *
 * @param {object} adaptr - ioBroker Adapter instance
 * @param {string} pattern - state id/pattern to subscribe to
 */
function subscribeForeignStatesOnce(adaptr, pattern) {
	if (!pattern) {
		return;
	}
	if (!adaptr.subscribedStatePatterns) {
		adaptr.subscribedStatePatterns = new Set();
	}
	if (!adaptr.subscribedStatePatterns.has(pattern)) {
		adaptr.subscribedStatePatterns.add(pattern);
		adaptr.subscribeForeignStates(pattern);
	}
}

/**
 * Subscribe to foreign objects only once per pattern (see subscribeForeignStatesOnce).
 *
 * @param {object} adaptr - ioBroker Adapter instance
 * @param {string} pattern - object id/pattern to subscribe to
 */
function subscribeForeignObjectsOnce(adaptr, pattern) {
	if (!pattern) {
		return;
	}
	if (!adaptr.subscribedObjectPatterns) {
		adaptr.subscribedObjectPatterns = new Set();
	}
	if (!adaptr.subscribedObjectPatterns.has(pattern)) {
		adaptr.subscribedObjectPatterns.add(pattern);
		adaptr.subscribeForeignObjects(pattern);
	}
}

/**
 * @param {string} id - id which should be capitalize
 */
function capitalize(id) {
	//make the first letter uppercase
	return id && id[0].toUpperCase() + id.slice(1);
}

/**
 * @param {number} dpValue - get Time of this datapoint
 */
function getTimestamp(dpValue) {
	const time = new Date();
	return (dpValue = Math.round((time.getTime() - dpValue) / 1000));
}

/**
 * @param adaptr
 * @param {string} dp - get Time of this datapoint
 * @param {number} ms - milliseconds
 */
async function getTimestampConnectionDP(adaptr, dp, ms) {
	const time = new Date();
	const dpValue = await adaptr.getForeignStateAsync(dp);
	if (dpValue) {
		if (!dpValue.val) {
			return false;
		}

		const dpLastStateChange = Math.round(time.getTime() - dpValue.lc); // calculate in ms
		if (dpLastStateChange >= ms) {
			return true;
		}
		return false;
	}
}

/**
 * Count devices for each type
 *
 * @param adaptr
 */
async function countDevices(adaptr) {
	// Count how many devices with link Quality
	adaptr.linkQualityCount = adaptr.linkQualityDevices.length;

	// Count how many devcies are offline
	adaptr.offlineDevicesCount = adaptr.offlineDevices.length;

	// Count how many devices are with battery
	adaptr.batteryPoweredCount = adaptr.batteryPowered.length;

	// 3d. Count how many devices are with low battery
	adaptr.lowBatteryPoweredCount = adaptr.batteryLowPowered.length;

	// Count how many devices are exists
	adaptr.deviceCounter = adaptr.listAllDevices.length;

	// Count how many devices has update available
	adaptr.upgradableDevicesCount = adaptr.upgradableList.length;
}

/**
 * when was last contact of device
 *
 * @param adaptr
 */
async function checkLastContact(adaptr) {
	let statusChanged = false;

	for (const [deviceID, deviceData] of adaptr.listAllDevicesRaw.entries()) {
		// with one device per instance the connection itself is the reach state, so a lost connection must still be evaluated
		const reachIsConnection = deviceData.UnreachDP === deviceData.instanceDeviceConnectionDP;
		if (reachIsConnection || (deviceData.instanceDeviceConnected !== false && deviceData.instanceDeviceConnected !== undefined)) {
			deviceData.UnreachState = await getInitValue(adaptr, deviceData.UnreachDP);

			const gefundenerAdapter = Object.values(adapterArray).find((adapter) => adapter.adapterID === deviceData.adapterID);
			if (!gefundenerAdapter) {
				adaptr.log.warn(`[checkLastContact] - adapter not found for adapterID: ${deviceData.adapterID}, skipping device ${deviceID}`);
				continue;
			}
			const silentEnabled = Object.values(adaptr.config.tableDevices).find((adapter) => adapter.adapterKey === gefundenerAdapter.adapterKey);
			if (!silentEnabled) {
				adaptr.log.warn(`[checkLastContact] - device config not found for adapterKey: ${gefundenerAdapter.adapterKey}, skipping device ${deviceID}`);
				continue;
			}

			const oldContactState = deviceData.Status;

			const contactData = await adaptr.getOnlineState(
				deviceData.timeSelector,
				deviceData.adapterID,
				deviceData.UnreachDP,
				deviceData.SignalStrength,
				deviceData.UnreachState,
				deviceData.deviceStateSelectorHMRPC,
				deviceData.rssiPeerSelectorHMRPC,
			);
			if (contactData !== undefined && contactData !== null) {
				deviceData.LastContact = contactData[0];
				deviceData.Status = contactData[1];
				deviceData.linkQuality = contactData[2];
			}

			// Dirty-Flag: NUR Status-Änderung (Online↔Offline) triggert Listenneuaufbau.
			// LastContact ist ein sich jede Minute ändernder Anzeigestring ("5 min", "6 min")
			// und darf NICHT als Änderungskriterium gelten.
			if (deviceData.Status !== oldContactState) {
				statusChanged = true;
			}

			if (adaptr.config.checkSendOfflineMsg && oldContactState !== deviceData.Status && !adaptr.blacklistNotify.includes(deviceData.Path)) {
				if (reachIsConnection || (await getTimestampConnectionDP(adaptr, deviceData.instanceDeviceConnectionDP, 50000))) {
					await adaptr.sendStateNotifications('Devices', 'onlineStateDevice', deviceID, silentEnabled.telegramSilent);
				}
			}
		}
	}

	return statusChanged;
}

module.exports = {
	isDisabledDevice,
	parseData,
	getInitValue,
	subscribeForeignStatesOnce,
	subscribeForeignObjectsOnce,
	capitalize,
	getTimestamp,
	getTimestampConnectionDP,
	countDevices,
	checkLastContact,
};
