![Logo](../../admin/device-watcher.png)
# ioBroker.device-watcher

## Blacklist

![addBlacklist](img/add_blacklist.png)

It is possible to specify devices to be excluded in the enumeration and notification. Since the adapter uses one main data point per adapter to get the information, it is important to choose the right data point for the blacklist to work properly. 


| Adapter            | Datapoint                       |
|--------------------|---------------------------------|
| Alexa2             | alexa2.*.online                 |
| Ble                | ble.*.rssi                      |
| Deconz             | deconz.*.reachable              |
| Enocean            | enocean.*.rssi                  |
| ESP Home           | esphome.*._online               |
| FritzDect          | fritzdect.*.present             |
| Harmony            | harmony.*.hubConnected          |
| HMiP               | hmip.*.rssiDeviceValue          |
| HM-RPC (Homematic) | hm-rpc.*.UNREACH                |
| Hue                | hue.*.reachable                 |
| Hue Extended       | hue-extended.*.reachable        |
| Jeelink            | jeelink.*.lowBatt               |
| miHome             | mihome.*.percent                |
| miHome Gateways    | mihome.*.connected              |
| miHome Vacuum      | mihome-vacuum.*.wifi_signal     |
| Nuki Extended      | nuki-extended.*.batteryCritical |
| Ping               | ping.*.alive                    |
| Roomba             | roomba.0.states.signal          |
| Shelly             | shelly.*.rssi                   |
| Sonoff             | sonoff.*.Uptime                 |
| Sonos              | sonos.*.alive                   |
| Switchbot Ble      | switchbot-ble.*.rssi            |
| Tado               | tado.*.batteryState             |
| Tradfri            | tradfri.*.lastSeen              |
| WLED               | wled.*._online                  |
| Zigbee             | zigbee.*.link_quality           |
| Zwave              | zwave2.*.ready                  |