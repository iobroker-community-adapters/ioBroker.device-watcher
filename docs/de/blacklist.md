![Logo](../../admin/device-watcher.png)
# ioBroker.device-watcher

## Blacklist

![addBlacklist](img/add_blacklist.png)

Es ist möglich Geräte anzugeben, die in der Aufzählung und Benachrichtigung ausgeschlossen werden sollen. Da der Adapter ein Hauptdatenpunkt je Adapter nutzt um die Information zu bekommen, ist es wichtig den richtigen Datenpunkt für die Blacklist zu wählen damit diese richtig funktioniert. 


| Adapter            | Datenpunkt                      |
|--------------------|---------------------------------|
| Alexa2             | alexa2.*.online                 |
| Ble                | ble.*.rssi                      |
| Deconz             | deconz.*.reachable              |
| Enocean            | enocean.*.rssi                  |
| ESP Home           | esphome.*._online               |
| FritzDect          | fritzdect.*.present             |
| HM-RPC (Homematic) | hm-rpc.*.UNREACH                |
| Hue                | hue.*.reachable                 |
| Hue Extended       | hue-extended.*.reachable        |
| miHome             | mihome.*.percent                |
| miHome Gateways    | mihome.*.connected              |
| miHome Vacuum      | mihome-vacuum.*.wifi_signal     |
| Nuki Extended      | nuki-extended.*.batteryCritical |
| Ping               | ping.*.alive                    |
| Shelly             | shelly.*.rssi                   |
| Sonoff             | sonoff.*.Uptime                 |
| Sonos              | sonos.*.alive                   |
| Switchbot Ble      | switchbot-ble.*.rssi            |
| Zigbee             | zigbee.*.link_quality           |
| Zwave              | zwave2.*.ready                  |
