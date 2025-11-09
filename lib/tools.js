/**
 *
 * @param adaptr
 * @param unreachDP
 */
async function isDisabledDevice(adaptr, unreachDP) {
	let isDisabled = false;

	const device = await adaptr.getForeignObject(unreachDP);

	if (device.native.deviceRemoved == true || device.common.desc.includes('disabled') || device.common.desc.includes('Deaktiviert') || device.common.desc.includes('disabled')) {
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
 * Get previous run of cron job schedule
 * Requires cron-parser!
 * Inspired by https://stackoverflow.com/questions/68134104/
 *
 * @param adaptr
 * @param {string} lastCronRun
 */
function getPreviousCronRun(adaptr, lastCronRun) {
	try {
		const cronParser = require('cron-parser');
		const interval = cronParser.parseExpression(lastCronRun);
		const previous = interval.prev();
		return Math.floor(Date.now() - previous.getTime()); // in ms
	} catch (error) {
		adaptr.log.error(`[getPreviousCronRun] - ${error}`);
	}
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
	for (const [deviceID, deviceData] of adaptr.listAllDevicesRaw.entries()) {
		if (deviceData.instancedeviceConnected !== false) {
			const oldContactState = deviceData.Status;
			deviceData.UnreachState = await this.getInitValue(adaptr, deviceData.UnreachDP);
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
			if (adaptr.config.checkSendOfflineMsg && oldContactState !== deviceData.Status && !adaptr.blacklistNotify.includes(deviceData.Path)) {
				// check if the generally deviceData connected state is for a while true
				if (await this.getTimestampConnectionDP(adaptr, deviceData.instanceDeviceConnectionDP, 50000)) {
					await adaptr.sendStateNotifications('Devices', 'onlineStateDevice', deviceID);
				}
			}
		}
	}
}

module.exports = {
	isDisabledDevice,
	parseData,
	getPreviousCronRun,
	getInitValue,
	capitalize,
	getTimestamp,
	getTimestampConnectionDP,
	countDevices,
	checkLastContact,
};
