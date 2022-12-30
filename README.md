![Logo](admin/device-watcher.png)

# ioBroker.device-watcher

[![GitHub license](https://img.shields.io/github/license/ciddi89/ioBroker.device-watcher)](https://github.com/ciddi89/ioBroker.device-watcher/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
![GitHub repo size](https://img.shields.io/github/repo-size/ciddi89/ioBroker.device-watcher)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/device-watcher/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)</br>
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/ciddi89/ioBroker.device-watcher)
![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/ciddi89/ioBroker.device-watcher/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/ciddi89/ioBroker.device-watcher)
![GitHub issues](https://img.shields.io/github/issues/ciddi89/ioBroker.device-watcher)
</br>
**Version:** </br>
[![NPM version](https://img.shields.io/npm/v/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
![Current version in stable repository](https://iobroker.live/badges/device-watcher-stable.svg)
![Number of Installations](https://iobroker.live/badges/device-watcher-installed.svg)
</br>
**Tests:** </br>
![Test and Release](https://github.com/ciddi89/ioBroker.device-watcher/workflows/Test%20and%20Release/badge.svg)
[![CodeQL](https://github.com/ciddi89/ioBroker.device-watcher/actions/workflows/codeql.yml/badge.svg)](https://github.com/ciddi89/ioBroker.device-watcher/actions/workflows/codeql.yml)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/ciddi89/ioBroker.device-watcher)

## Sentry

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Documentation

🇬🇧 [Documentation](/docs/en/README.md)</br>
🇩🇪 [Dokumentation](/docs/de/README.md)

## Discussion and Questions

[ioBroker Forum](https://forum.iobroker.net/topic/55426/test-adapter-device-watcher-v1-x-x-github-latest)</br>
[ioBroker Discord Channel](https://discord.com/channels/743167951875604501/1030196924944486530)

## Device-Watcher adapter for ioBroker

This is a watchdog for devices. The adapter looks for the rssi/link quality and battery states and create JSON & HTML lists of them (devices with battery, devices with low battery, devices with link quality, devices offline and devices all) and count the devices in the same categories. For example you can use the lists and states for Grafana, Jarvis etc.

**Supported adapters:**

| - Alexa2<br>- Ble<br>- Deconz<br>- Enocean<br>- ESPHome<br>- FritzDect<br>- HAM<br>- Harmony<br>- HmiP<br>- Homematic<br>- HS100<br>- Hue<br>- Hue Extended<br>- Jeelink | - Lupusec<br>- MaxCube<br>- Meross<br>- MiHome<br>- MiHome Vacuum<br>- Netatmo<br>- Nuki Extended<br>- NUT<br>- Ping<br>- Roomba<br>- Shelly<br>- Sonoff<br>- Sonos<br>- Switchbot Ble | - Tado<br>- Tradfri<br>- Unifi<br>- WLED<br>- Yeelight<br>- Zigbee<br>- Zigbee2MQTT<br>- Zwave |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |

**If one adapter is missing, feel free to open an [issue](https://github.com/ciddi89/ioBroker.device-watcher/issues/new/choose) with request to add it.**

The adapter has also the option to send notifications if the number of offline devices are changed and to send you a notification if devices has a low battery state (e.g. 30%). You can choose the value for the battery notification and on which days you want the notification for low batteries.

Currently supported notification services are:

-   Telegram (with support of Chat-ID for groupchats)
-   Pushover
-   WhatsApp
-   Email
-   Jarvis
-   Lovelace
-   SynoChat
-   and also an datapoint with the last notification, so you can use it for other services which aren't supported.

If you found a bug or you have an improvement suggestion, feel free to open an issue.

### Blacklist

If you don't want a specifice device in the list, you can add it in the blacklist and the adapter will ignore it.

![add_blacklist.png](admin/images/add_blacklist.png)

### Example images of Pushover notification:

![noti_push.jpeg](admin/images/noti_push.jpeg)
![noti_push2.jpeg](admin/images/noti_push2.jpeg)

### Here are some images how the lists look:

![list1.png](admin/images/list1.png)
![list2.png](admin/images/list2.png)
![list3.png](admin/images/list3.png)

## Changelog

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**

-   (ciddi89) sorting for device selection in the blacklist added
-   (ciddi89) Devices can now also be blacklisted in adapter own list

### 2.2.2 (2022-12-29)

-   (ciddi89) some translation added
-   (ciddi89) datapoints will be written in intervall
-   (ciddi89) improvements of lists
-   (ciddi89) some other small improvements

### 2.2.1 (2022-12-28)

-   (ciddi89) Innogy Smarthome added
-   (ciddi89) Lists for each adapter are working again

### 2.2.0 (2022-12-27)

-   (Scrounger) Yamaha MusicCast adapter added
-   (ciddi89) send update message on state change
-   (Scrounger) datapoints and scheduled notification for updateable devices added
-   (ciddi89) reaction for state changes of battery datapoints added
-   (ciddi89) send message and write lists directly if one device has low battery
-   (ciddi89) send message and write lists directly if on device is going online or offline

### 2.1.0 (2022-12-19)

-   (Scrounger) optionally show adapter name in notification
-   (ciddi89) optionally receive a message when an update for an device is available [#87](https://github.com/ciddi89/ioBroker.device-watcher/issues/87)
-   (Scrounger) update message for shelly adapter added
-   (Scrounger) Yamaha MusicCast adapter added
-   (ciddi89) update message for unifi devices added
-   (ciddi89) fixed devices are not reported in case battery is 0% [#86](https://github.com/ciddi89/ioBroker.device-watcher/issues/86)
-   (ciddi89) SynoChat added [#85](https://github.com/ciddi89/ioBroker.device-watcher/issues/85)
-   (ciddi89) MQTT NukiHub, MQTT-Clien Zigbee2MQTT added ([#82](https://github.com/ciddi89/ioBroker.device-watcher/issues/82))

### 2.0.3 (2022-11-26)

-   fixed issue with localCompare
-   added tapo
-   (Scrounger) added fullyBrowser adapter
-   (Scrounger) added Sure Flap adapter
-   fixed low bat messages

### 2.0.2 (2022-11-12)

-   added status to battery list
-   batt devices which are offline are now still included in the battery list
-   small improvements of translations
-   offline time settings: you can use 0 instead of -1 (it will be the new standard)
-   improvements of adaptername
-   fixed issues [#66](https://github.com/ciddi89/ioBroker.device-watcher/issues/66) & [#67](https://github.com/ciddi89/ioBroker.device-watcher/issues/67)
-   repaired blacklist notifications
-   added handling for blacklist object

### 2.0.1 (2022-11-02)

-   If the device is offline, set signal strength to '0%'
-   If the device is offline, set battery to ' - '
-   repair some small issues in the lists

### 2.0.0 (2022-11-01)

-   added Lupusec, HS100 adapter, Zigbee2MQTT and MaxCube
-   changed name of Homematic to HM-RPC
-   made a completly makeover of the blacklist
-   clean up the code and shorten some

### 1.1.0 (2022-10-03)

-   removed indicatoren for daily sent messages
-   changed selector for shelly devices
-   added Zigbee2MQTT adapter
-   added cron function to use own time for daily overview messages

### 1.0.1 (2022-09-30)

-   added WLED, Ikea Tradfri, Roomba, HmIp, Tado, Netatmo, Yeelight-2, Unifi, Nut and Meross adapter
-   fixed battery message
-   corrected and repaired some issues of last contact time
-   added support for old HM devices
-   some small refactoring of code
-   changed shelly selector from dp rssi to dp online

### 1.0.0 (2022-09-03)

-   ** BREAKING CHANGE ** If you update from version <= 0.3.0, remove the old instance first before you update to >= 1.0.0. After that you can create a new instance.
-   changed mode from shedule to daemon, please take aware from the advice above
-   added Logitech Harmony Hub
-   small bugfixes (own function for blacklist, fix for memory leak etc.)

### 0.3.0 (2022-08-10)

-   removed channelnumber in Homematic devices name
-   added function to create html list
-   added german and english documentation

### 0.2.4 (2022-07-31)

-   many changes of code, comments and error handling

### 0.2.2 (2022-07-28)

-   fixed translations
-   added sentry
-   added nuki battery state

### 0.2.1 (2022-07-27)

-   removed test states

### 0.2.0 (2022-07-24)

-   added function to create data of each adapter

### 0.1.2 (2022-07-22)

-   improved overview of admin ui
-   added option in admin ui to create own folders for each adapter (!!not working yet!!)

### 0.1.1 (2022-07-22)

-   changed wrong type of datapoint lastCheck
-   added possibility to choose own offline time for each adapter
-   added Whatsapp notification services
-   improved sonoff devices
-   added row with online and offline status in table allDevices
-   added alexa2 and esphome devices
-   Added priority for pushover notifications

### 0.0.8 (2022-07-05)

-   added own notes field for blacklist
-   added ping, switchbot ble, mihome, sonos, fritzdect, hue, hue extended and nuki extended
-   some improvements of code

### 0.0.6 (2022-06-10)

-   added Homematic, Deconz, Zwave
-   added Email notification
-   added count and list for low battery devices
-   changes Log state dp to last notification state dp
-   Using available state instead of link quality state for zigbee devices
-   Show the correct time of last contact instead the minutes if the time is under 100minutes
-   small bugfixes

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
