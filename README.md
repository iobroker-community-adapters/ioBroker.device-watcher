![Logo](admin/device-watcher.png)
# ioBroker.device-watcher

[![NPM version](https://img.shields.io/npm/v/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
[![Downloads](https://img.shields.io/npm/dm/iobroker.device-watcher.svg)](https://www.npmjs.com/package/iobroker.device-watcher)
![Number of Installations](https://iobroker.live/badges/device-watcher-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/device-watcher-stable.svg)
[![Dependency Status](https://img.shields.io/david/ciddi89/iobroker.device-watcher.svg)](https://david-dm.org/ciddi89/iobroker.device-watcher)

[![NPM](https://nodei.co/npm/iobroker.device-watcher.png?downloads=true)](https://nodei.co/npm/iobroker.device-watcher/)

**Tests:** ![Test and Release](https://github.com/ciddi89/ioBroker.device-watcher/workflows/Test%20and%20Release/badge.svg)

## Device-Watcher adapter for ioBroker

This is a watchdog for wireless devices.It works with the zigbee adapter and ble adapter (mi flora plant sensor). The adapter looks every sixty minutes for the rssi/link quality and battery states and create JSON lists of them. You can use the lists for Grafana, Jarvis etc.

If you like, you can choose that you get a message if one device is no longer reachable and you can choose if you want a notification with devices which have a low battery level.

If you found a bug or if you've an improvement suggestion, feel free to open an issue.


### Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ## **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**

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