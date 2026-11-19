'use strict';

/**
 * The answer of the message `help`: what the instance answers, written for an AI agent (e.g. ioBroker.pi-agent, or
 * the MCP server with `send_to`) and for script authors. Keep it in sync with `onMessage` in main.js and the README.
 */

/** The commands `onMessage` answers; `write` = it changes something */
const COMMANDS = [
	{ command: 'help', write: false },
	{ command: 'devicesList', write: false },
	{ command: 'instancesList', write: false },
	{ command: 'instancesListTime', write: false },
];

const HELP = `ioBroker.device-watcher: watches the devices of many adapters (zigbee, homematic, shelly, ...) and the ioBroker
instances. It finds offline devices, low batteries, weak signals and available updates, writes them as lists and
counters into states and sends notifications (telegram, email, ...). An agent reads the states below to answer
"which devices are offline", "which batteries are low", "which instances have errors" or "which adapters can be
updated". Only the adapters selected in the settings are watched; blacklisted devices and instances are left out.

Commands (sendTo device-watcher.0):
- devicesList, instancesList, instancesListTime: for the settings (the blacklists), not for agents.

States (device-watcher.0.*), all read-only, refreshed by the adapter:
- devices.offlineList, lowBatteryList, batteryList, linkQualityList, upgradableList, listAll: JSON arrays of the
  devices with the keys in the language of the settings (English: Device, Adapter, Battery, Signal strength,
  Last Contact, Status); an empty list is one entry with Device "--none--". Last Contact is the age as a text
  (e.g. "5 min"), Status is Online or Offline.
- devices.listAllRawJSON: all devices with fixed English keys: Device, Adapter, Instance, Instance connected,
  isBatteryDevice, Battery, BatteryRaw, isLowBat, Signal strength, Last contact, Update Available, Status.
- devices.offlineCount, lowBatteryCount, batteryCount, upgradableCount, countAll; devices.oneDeviceOffline,
  oneDeviceLowBat, oneDeviceUpdatable: true if there is at least one.
- devices.<adapter>.* (e.g. devices.zigbee.offlineList): the same per adapter, only with the option to create a
  folder per adapter. devices.*HTML and adapterAndInstances.HTML_Lists.*: the same lists as HTML tables.
- adapterAndInstances.listAllInstances, listAllActiveInstances, listDeactivatedInstances, listInstancesError
  (JSON, keys in the language of the settings: Adapter, Instance, Mode, Schedule, Version, Updateable, Status),
  listAdapterUpdates (Adapter, Available Version, Installed Version) and countAllInstances,
  countAllActiveInstances, countDeactivatedInstances, countInstancesError, countAdapterUpdates; only with the
  option to watch the instances.
- lastCheck: date and time of the last check; lastNotification: the text of the last notification.

How to talk to the user:
- Read the list that answers the question (offlineList, lowBatteryList, listInstancesError, listAdapterUpdates),
  not listAll; leave out the "--none--" entry and say there are none.
- Name each device with its adapter, give the last contact as the age; a device missing from the lists may be
  blacklisted or its adapter not selected in the settings.`;

module.exports = {
	COMMANDS,
	HELP,
};
