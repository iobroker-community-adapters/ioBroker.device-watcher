![Logo](admin/device-watcher.png)

# ioBroker.device-watcher

[![GitHub license](https://img.shields.io/github/license/iobroker-community-adapters/ioBroker.device-watcher)](https://github.com/iobroker-community-adapters/ioBroker.device-watcher/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
![GitHub repo size](https://img.shields.io/github/repo-size/iobroker-community-adapters/ioBroker.device-watcher)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/device-watcher/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)</br>
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/iobroker-community-adapters/ioBroker.device-watcher)
![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/iobroker-community-adapters/ioBroker.device-watcher/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/iobroker-community-adapters/ioBroker.device-watcher)
![GitHub issues](https://img.shields.io/github/issues/iobroker-community-adapters/ioBroker.device-watcher)
</br>
**Version:** </br>
[![NPM version](https://img.shields.io/npm/v/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
![Current version in stable repository](https://iobroker.live/badges/device-watcher-stable.svg)
![Number of Installations](https://iobroker.live/badges/device-watcher-installed.svg)
</br>
**Tests:** </br>
![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.device-watcher/workflows/Test%20and%20Release/badge.svg)
[![CodeQL](https://github.com/iobroker-community-adapters/ioBroker.device-watcher/actions/workflows/codeql.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.device-watcher/actions/workflows/codeql.yml)

## Sentry

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Documentation

🇬🇧 [Documentation](/docs/en/README.md)</br>
🇩🇪 [Dokumentation](/docs/de/README.md)

## Discussion and Questions

[ioBroker Forum](https://forum.iobroker.net/topic/55426/test-adapter-device-watcher-v1-x-x-github-latest)</br>
[ioBroker Discord Channel](https://discord.com/channels/743167951875604501/1030196924944486530)

## Device-Watcher adapter for ioBroker

This is a watchdog for devices/services and adapter/instances. The adapter looks for the different information about the datapoints and create JSON & HTML lists of them:

**Devices/Services:**

-   devices with battery,
-   devices with low battery,
-   devices with link quality,
-   updates for devices,
-   devices offline and
-   all devices

**Adapter/Instances:**

-   all instances
-   deactivated instances
-   instances with error
-   available adapter updates

It's also counting them in the same categories. You can use the lists and states for Grafana, Jarvis etc for example.

### Supported adapters:

<table>
  <tr>
    <td>Alexa2</td>
    <td>APC UPS</td> 
    <td>Ble</td>
  </tr>
  <tr>
    <td>Deconz</td>
    <td>Enocean</td>
    <td>ESP Home</td> 
  </tr>
  <tr>
    <td>euSec</td>
    <td>FritzDect</td>
    <td>fullyBrowser</td>
  </tr>
  <tr>
    <td>Harmony</td>
    <td>Ham</td> 
    <td>Home Connect</td>
  </tr>
  <tr>
    <td>Homematic IP</td>
    <td>Homematic RPC</td>
    <td>HS100</td>
  </tr>
  <tr>    
    <td>Philips Hue</td> 
    <td>Philips Hue Extended</td>
    <td>Innogy Smarthome</td>
  </tr>
  <tr>    
    <td>Jeelink</td> 
    <td>Lupusec</td>
    <td>Max! Cube</td>
  </tr>
  <tr>    
    <td>Meross</td> 
    <td>MiHome</td>
    <td>MiHome Vacuum</td>
  </tr>
  <tr> 
    <td>MQTT Client Zigbee2Mqtt</td> 
    <td>MQTT Nuki</td>
    <td>MusicCast</td>
  </tr>
  <tr>    
    <td>Netatmo</td> 
    <td>Nuki Extended</td>
    <td>Nut</td>
  </tr>
  <tr>    
    <td>Ping</td>
    <td>Roomba</td>
    <td>Shelly</td>
  </tr>
  <tr>    
    <td>Smartgarden</td>
    <td>Sonoff</td>
    <td>Sonos</td>
  </tr>
  <tr>    
    <td>Sureflap</td> 
    <td>Switchbot Ble</td>
    <td>Tado</td>
  </tr>
  <tr>    
    <td>Tapo</td>
    <td>Tradfri</td> 
    <td>Unifi</td>
  </tr>
  <tr>    
    <td>Wled</td>
    <td>Yeelight</td> 
    <td>Zigbee</td>
  </tr>
  <tr>    
    <td>Zigbee2MQTT</td> 
    <td>Zwave</td>
    <td>........</td>
  </tr>
 
</table>
**If one adapter is missing, feel free to open an request [issue](https://github.com/iobroker-community-adapters/ioBroker.device-watcher/issues/new/choose) to add it.**

### Notifications:

The adapter has different possibilities to send notifications:

-   A device is no longer reachable or reachable again
-   A device has reached the low battery level or the low bat state is true
-   When an update is available for a device (shelly and unifi)
-   Time based a list of offline devices
-   Time based a list of low batterie devices
-   Time based a list of devices which can be updated

### Currently supported notification services are:

-   Telegram
-   Pushover
-   WhatsApp
-   Email
-   Jarvis
-   Lovelace
-   Signal
-   SynoChat
-   and also an datapoint with the last notification, so you can use it for other services which aren't supported.

### Blacklist

Is it neccessary to ignore a specifice device, you can add it in the blacklist and the device-watcher will ignore it.
It's possible to select:

-   Ignore in notifications
-   Ignore in main list
-   Ignore in adapter own list

### Here are some images how the lists can be look like in Grafana:

![list1.png](admin/images/list1.png)
![list2.png](admin/images/list2.png)
![list3.png](admin/images/list3.png)

## Credits

This adapter would not have been possible without the great work of Christian Behrends <mail@christian-behrends.de> who implemented the initial releases of this adapter.

## Changelog

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### 2.15.0 (2026-01-07)
* (arteck) fixed device array
* (arteck) deleted zwave2mqtt Adapter
* (arteck) added zwavews Adapter
* (arteck) Dependencies have been updated
* (arteck) added zwave2mqtt Adapter
* (arteck) fixed all count devices
* (arteck) corrected finder

### 2.14.1 (2025-11-13)
* (arteck) corr cronparser

### 2.14.0 (2025-11-13)
* (arteck) Dependencies have been fixed
* (arteck) ping adapter have been fixed
* (arteck) optimisations for adapter without info.connection state 
* (arteck) clean code
* (arteck) silent notification for telegram
* (arteck) add matter devices
* (arteck) corr lupusec battery state

### 2.14.5 (2025-11-16)
* (arteck) add homee battery devices (only)
* (arteck) fix battery list

### 2.14.4 (2025-11-13)
* (arteck) fix silent telegram notification
* (arteck) fix offline list

## License

MIT License

Copyright (c) 2025-2026 iobroker-community-adapters <iobroker-community-adapters@gmx.de>  
Copyright (c) 2025 Christian Behrends <mail@christian-behrends.de>

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
