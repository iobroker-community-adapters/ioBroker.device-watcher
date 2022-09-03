![Logo](admin/device-watcher.png)
# ioBroker.device-watcher

[![NPM version](https://img.shields.io/npm/v/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
[![Downloads](https://img.shields.io/npm/dm/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
![Number of Installations](https://iobroker.live/badges/device-watcher-installed.svg)
<!--![Current version in stable repository](https://iobroker.live/badges/device-watcher-stable.svg)-->
[![GitHub license](https://img.shields.io/github/license/ciddi89/ioBroker.device-watcher)](https://github.com/ciddi89/ioBroker.device-watcher/blob/main/LICENSE)
![GitHub repo size](https://img.shields.io/github/repo-size/ciddi89/ioBroker.device-watcher)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/ciddi89/ioBroker.device-watcher)
![GitHub commits since tagged version (branch)](https://img.shields.io/github/commits-since/ciddi89/ioBroker.device-watcher/v1.0.0)
![GitHub last commit](https://img.shields.io/github/last-commit/ciddi89/ioBroker.device-watcher)
![GitHub issues](https://img.shields.io/github/issues/ciddi89/ioBroker.device-watcher)

**Tests:** ![Test and Release](https://github.com/ciddi89/ioBroker.device-watcher/workflows/Test%20and%20Release/badge.svg)

## Sentry
**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Documentation
🇬🇧 [Documentation](/docs/en/README.md)</br>
🇩🇪 [Dokumentation](/docs/de/README.md)

## Device-Watcher adapter for ioBroker

This is a watchdog for wireless devices. The adapter looks every fifteen minutes for the rssi/link quality and battery states and create JSON lists of them (devices with battery, devices with link quality, devices offline and devices all) and count the devices in the same categories. For example you can use the lists and states for Grafana, Jarvis etc.

Supported adapters are:
* Alexa2
* Ble
* Deconz
* Enocean
* ESPHome
* FritzDect
* Harmony
* Homematic
* Hue
* Hue Extended
* Jeelink
* MiHome
* MiHome Vacuum
* Nuki Extended
* Ping (You have to set the option 'Advanced Information / Erweiterte Information' in the instance settings of ping for     each device)
* Shelly
* Sonoff
* Sonos
* Switchbot Ble
* Zigbee
* Zwave

The adapter has also the option to send notifications if the number of offline devices are changed and to send you a notification if devices has a low battery state (e.g. 30%). You can choose the value for the battery notification and on which days you want the notification for low batteries. 

Currently supported notification services are: 
* Telegram (with support of Chat-ID for groupchats)
* Pushover
* WhatsApp
* Email
* Jarvis
* Lovelace
* and also an datapoint with the last notification, so you can use it for other services which aren't supported.

If you found a bug or you have an improvement suggestion, feel free to open an issue.

### Blacklist

 If you don't want a specifice device in the list, you can add it in the blacklist and the adapter will ignore it. Please add the "link_quality" or "rssi" object of this device in the blacklist and it won't be listet and count.

![add_blacklist.png](admin/images/add_blacklist.png)

### Example images of Pushover notification:

![noti_push.jpeg](admin/images/noti_push.jpeg)
![noti_push2.jpeg](admin/images/noti_push2.jpeg)

### Here are some images how the lists look:

![list1.png](admin/images/list1.png)
![list2.png](admin/images/list2.png)
![list3.png](admin/images/list3.png)


### Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### 1.0.0 (2022-09-03)
 - ** BREAKING CHANGE ** If you update from version <= 0.3.0, remove the old instance first before you update to >= 1.0.0. After that you can create a new instance.
 - changed mode from shedule to daemon, please take aware from the advice above
 - added Logitech Harmony Hub
 - small bugfixes (own function for blacklist, fix for memory leak etc.)

### 0.3.0 (2022-08-10)
- removed channelnumber in Homematic devices name
- added function to create html list
- added german and english documentation

### 0.2.4 (2022-07-31)
- many changes of code, comments and error handling

### 0.2.2 (2022-07-28)
- fixed translations
- added sentry
- added nuki battery state

### 0.2.1 (2022-07-27)
- removed test states

### 0.2.0 (2022-07-24)
- added function to create data of each adapter

### 0.1.2 (2022-07-22)

- improved overview of admin ui
- added option in admin ui to create own folders for each adapter (!!not working yet!!)

### 0.1.1 (2022-07-22)

- changed wrong type of datapoint lastCheck
- added possibility to choose own offline time for each adapter
- added Whatsapp notification services
- improved sonoff devices
- added row with online and offline status in table allDevices
- added alexa2 and esphome devices
- Added priority for pushover notifications

### 0.0.8 (2022-07-05)

- added own notes field for blacklist
- added ping, switchbot ble, mihome, sonos, fritzdect, hue, hue extended and nuki extended
- some improvements of code

### 0.0.6 (2022-06-10)

- added Homematic, Deconz, Zwave
- added Email notification
- added count and list for low battery devices
- changes Log state dp to last notification state dp
- Using available state instead of link quality state for zigbee devices
- Show the correct time of last contact instead the minutes if the time is under 100minutes
- small bugfixes

### 0.0.5 (2022-06-05)

-   added admin translations

### 0.0.3 (2022-06-05)

-   added Shelly and Sonoff Devices

### 0.0.2 (2022-06-05)

-   Release for testing

### 0.0.1 (2022-05-01)

-   initial release

## License
MIT License

Copyright (c) 2022 Christian Behrends <mail@christian-behrends.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.