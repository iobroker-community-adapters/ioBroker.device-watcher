// arrays of supported adapters
const arrApart = {
	alexa2: {
		'Selektor': 'alexa2.*.online',
		'adapter': 'alexa2',
		'battery': 'none',
		'reach': '.online',
		'isLowBat': 'none'
	},
	ble: {
		'Selektor': 'ble.*.rssi',
		'adapter': 'ble',
		'battery': '.battery',
		'rssiState': '.rssi',
		'reach': 'none',
		'isLowBat': 'none'
	},
	deconz: {
		'Selektor': 'deconz.*.reachable',
		'adapter': 'deconz',
		'battery': '.battery',
		'reach': '.reachable',
		'isLowBat': 'none'
	},
	enocean: {
		'Selektor': 'enocean.*.rssi',
		'adapter': 'enocean',
		'battery': '.BS',
		'rssiState': '.rssi',
		'reach': 'none',
		'isLowBat': 'none'
	},
	esphome: {
		'Selektor': 'esphome.*._online',
		'adapter': 'esphome',
		'battery': 'none',
		'reach': '._online',
		'isLowBat': 'none',
		'id': '.name'
	},
	fritzdect: {
		'Selektor': 'fritzdect.*.present',
		'adapter': 'fritzDect',
		'battery': '.battery',
		'reach': '.present',
		'isLowBat': '.batterylow'
	},
	harmony: {
		'Selektor': 'harmony.*.hubConnected',
		'adapter': 'harmony',
		'battery': 'none',
		'reach': '.hubConnected',
		'isLowBat': 'none'
	},
	ham: {
		'Selektor': 'ham.*.Battery-Level',
		'adapter': 'ham',
		'battery': '.Battery-Level',
		'reach': 'none',
		'isLowBat': 'none',
		'id': '.Name'
	},
	hmiP: {
		'Selektor': 'hmip.*.rssiDeviceValue',
		'adapter': 'hmiP',
		'rssiState': '.rssiDeviceValue',
		'battery': 'none',
		'reach': '.unreach',
		'isLowBat': '.lowBat',
	},
	hmrpc: {
		'Selektor': '0_userdata.0.hm-rpc.*.UNREACH',
		'adapter': 'hmrpc',
		'rssiState': '.RSSI_DEVICE',
		'rssiPeerState': '.RSSI_PEER',
		'battery': '.OPERATING_VOLTAGE',
		'reach': '.UNREACH',
		'isLowBat': '.LOW_BAT',
		'isLowBat2': '.LOWBAT',
		'stateValue': '.1.STATE'
	},
	hs100: {
		'Selektor': 'hs100.*.last_update',
		'adapter': 'hs100',
		'battery': 'none',
		'reach': 'none',
		'isLowBat': 'none'
	},
	hue: {
		'Selektor': 'hue.*.reachable',
		'adapter': 'hue',
		'battery': '.battery',
		'reach': '.reachable',
		'isLowBat': 'none'
	},
	hueExt: {
		'Selektor': 'hue-extended.*.reachable',
		'adapter': 'hue-extended',
		'battery': '.config.battery',
		'reach': '.reachable',
		'isLowBat': 'none'
	},
	jeelink: {
		'Selektor': 'jeelink.*.lowBatt',
		'adapter': 'jeelink',
		'battery': 'none',
		'reach': 'none',
		'isLowBat': '.lowBatt'
	},
	lupusec: {
		'Selektor': 'lupusec.*.cond_ok',
		'adapter': 'lupusec',
		'battery': 'none',
		'rssiState': '.rssi',
		'reach': '.cond_ok',
		'isLowBat': '.battery_ok',
		'id': 'none'
	},
	maxcube: {
		'Selektor': '0_userdata.0.maxcube.*.link_error',
		'adapter': 'maxcube',
		'battery': 'none',
		'reach': '.error',
		'isLowBat': '.battery_low'
	},
	meross: {
		'Selektor': 'meross.*.online',
		'adapter': 'meross',
		'battery': '.battery',
		'reach': '.online',
		'isLowBat': 'none'
	},
	mihome: {
		'Selektor': 'mihome.*.percent',
		'adapter': 'miHome',
		'battery': '.percent',
		'reach': 'none',
		'isLowBat': 'none'
	},
	mihomeGW: {
		'Selektor': 'mihome.*.connected',
		'adapter': 'miHome',
		'battery': 'none',
		'reach': '.connected',
		'isLowBat': 'none'
	},
	mihomeVacuum: {
		'Selektor': 'mihome-vacuum.*.connection',
		'adapter': 'mihomeVacuum',
		'rssiState': '.deviceInfo.wifi_signal',
		'battery': '.info.battery',
		'battery2': '.control.battary_life',
		'reach': '.info.connection',
		'isLowBat': 'none',
		'id': '.deviceInfo.model'
	},
	netatmo: {
		'Selektor': 'netatmo.*.LastUpdate',
		'adapter': 'netatmo',
		'rssiState': '.WifiStatus',
		'rfState': '.RfStatus',
		'battery': '.BatteryStatus',
		'reach': 'none',
		'isLowBat': 'none'
	},
	nukiExt: {
		'Selektor': 'nuki-extended.*.lastDataUpdate',
		'adapter': 'nuki-extended',
		'rssiState': 'none',
		'battery': '.batteryChargeState',
		'reach': 'none',
		'isLowBat': '.batteryCritical'
	},
	nut: {
		'Selektor': 'nut.*.charge',
		'adapter': 'nut',
		'battery': '.charge',
		'reach': 'none',
		'isLowBat': 'none'
	},
	ping: {
		'Selektor': 'ping.*.alive',
		'adapter': 'ping',
		'battery': 'none',
		'reach': '.alive',
		'isLowBat': 'none'
	},
	roomba: {
		'Selektor': 'roomba.*.signal',
		'adapter': 'roomba',
		'battery': '.battery',
		'reach': '._connected',
		'rssiState': '.signal',
		'isLowBat': 'none',
		'id': '.device.name'
	},
	shelly: {
		'Selektor': 'shelly.*.uptime',
		'adapter': 'shelly',
		'rssiState': '.rssi',
		'battery': '.sensor.battery',
		'reach': '.online',
		'isLowBat': 'none'
	},
	sonoff: {
		'Selektor': 'sonoff.*.alive',
		'adapter': 'sonoff',
		'rssiState': '.Wifi_RSSI',
		'battery': '.battery',
		'reach': '.alive',
		'uptime': '.Uptime',
		'isLowBat': 'none'
	},
	sonos: {
		'Selektor': '0_userdata.0.sonos.*.alive',
		'adapter': 'sonos',
		'battery': 'none',
		'reach': '.alive',
		'isLowBat': 'none'
	},
	switchbotBle: {
		'Selektor': 'switchbot-ble.*.rssi',
		'adapter': 'switchbotBle',
		'battery': '.battery',
		'rssiState': '.rssi',
		'reach': 'none',
		'isLowBat': 'none',
		'id': '.id'
	},
	tado: {
		'Selektor': 'tado.*.batteryState',
		'adapter': 'tado',
		'rssiState': 'none',
		'battery': 'none',
		'reach': '.connectionState.value',
		'isLowBat': '.batteryState',
		'id': 'none'
	},
	tradfri: {
		'Selektor': '0_userdata.0.tradfri.*.lastSeen',
		'adapter': 'tradfri',
		'rssiState': 'none',
		'battery': '.batteryPercentage',
		'reach': '.alive',
		'isLowBat': 'none',
		'id': 'none'
	},
	unifi: {
		'Selektor': 'unifi.*.state',
		'adapter': 'unifi',
		'battery': 'none',
		'reach': '.state',
		'isLowBat': 'none',
		'id': 'none'
	},
	wled: {
		'Selektor': 'wled.*._online',
		'adapter': 'wled',
		'rssiState': '.wifi.rssi',
		'battery': 'none',
		'reach': '._online',
		'isLowBat': 'none',
		'id': 'none'
	},
	yeelight: {
		'Selektor': 'yeelight-2.*.connect',
		'adapter': 'yeelight-2',
		'battery': 'none',
		'reach': '.connect',
		'isLowBat': 'none'
	},
	zigbee: {
		'Selektor': 'zigbee.*.link_quality',
		'adapter': 'zigbee',
		'battery': '.battery',
		'rssiState': 'link_quality',
		'reach': '.available',
		'isLowBat': '.battery_low'
	},
	zigbee2mqtt: {
		'Selektor': '0_userdata.0.zigbee2mqtt.*.link_quality',
		'adapter': 'zigbee2MQTT',
		'battery': '.battery',
		'rssiState': '.link_quality',
		'reach': '.available',
		'isLowBat': '.battery_low'
	},
	zwave: {
		'Selektor': 'zwave2.*.ready',
		'adapter': 'zwave',
		'battery': '.Battery.level',
		'reach': '.ready',
		'isLowBat': '.Battery.isLow'
	}
};

module.exports = arrApart;