# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### Device-Watcher Adapter Specific Context

The **device-watcher** adapter is a specialized monitoring and watchdog system for ioBroker that:

- **Primary Function**: Monitors device status, battery levels, signal quality, and availability across multiple adapter types
- **Supported Platforms**: Over 50 different adapter types including Zigbee, Z-Wave, Homematic, Shelly, Philips Hue, Xiaomi, Tasmota, and many more
- **Key Features**:
  - Battery level monitoring with configurable warnings
  - Device offline detection with customizable timeouts
  - Signal strength (RSSI/LinkQuality) tracking
  - Instance monitoring and error detection
  - Automated notifications via multiple channels (Pushover, Telegram, Email, etc.)
  - HTML list generation for integration with visualization systems
  - Adapter update monitoring
  - Device firmware update tracking

- **Architecture**: 
  - Uses scheduled tasks via `node-schedule` and `cron-parser`
  - Creates structured data points for different device categories
  - Supports custom user-defined device monitoring rules
  - Implements blacklist functionality for filtering unwanted devices

- **Data Structure**: Creates hierarchical state objects under `devices.*`, `adapterAndInstances.*`, and `notifications.*`
- **Configuration**: Extensive native configuration for each supported adapter type with individual timeout settings
- **Multi-language Support**: Full internationalization with translations for 12+ languages

When working with this adapter, focus on:
- Device monitoring patterns and state management
- Error handling for offline devices and communication failures
- Efficient data collection from multiple adapter instances
- User notification systems and message formatting
- Performance optimization for large device collections

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Get all states created by adapter
                        const stateIds = await harness.dbConnection.getStateIDs('your-adapter.0.*');
                        
                        console.log(`📊 Found ${stateIds.length} states`);

                        if (stateIds.length > 0) {
                            console.log('✅ Adapter successfully created states');
                            
                            // Show sample of created states
                            const allStates = await new Promise((res, rej) => {
                                harness.states.getStates(stateIds, (err, states) => {
                                    if (err) return rej(err);
                                    res(states);
                                });
                            });

                            // Log some example states for debugging
                            Object.keys(allStates).slice(0, 5).forEach(id => {
                                console.log(`State: ${id} = ${JSON.stringify(allStates[id])}`);
                            });
                            
                            resolve();
                        } else {
                            reject(new Error('No states were created by the adapter'));
                        }
                    } catch (error) {
                        console.error('❌ Test failed:', error);
                        reject(error);
                    }
                });
            });
        });
    }
});
```

#### Testing Framework Guidelines

1. **Always use `tests.integration()`** - This is the official ioBroker testing method
2. **Never use manual database setup** - The framework handles this automatically
3. **Use `defineAdditionalTests`** for custom test scenarios
4. **Test timeout**: Set reasonable timeouts for integration tests (default: 30 seconds)
5. **Clean state verification**: Always verify that expected states are created
6. **Error scenarios**: Test both success and failure cases

#### Example Test Files Structure
```
test/
├── integration.js    # Uses tests.integration() only
├── unit.js          # Uses tests.unit() only  
└── package.js       # Uses tests.packageFiles() only
```

Each test file should be focused and use only ONE testing method from the framework.

## Core ioBroker Adapter Patterns

### Adapter Base Class Structure
```javascript
class AdapterName extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'adaptername',
        });
        
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        // Adapter startup logic
        this.setState('info.connection', true, true);
    }

    onStateChange(id, state) {
        if (state) {
            // Handle state changes
        }
    }

    onUnload(callback) {
        // Clean shutdown
        this.setState('info.connection', false, true);
        callback();
    }
}
```

### State and Object Management

#### Creating States
```javascript
// Create state with full definition
await this.setObjectNotExistsAsync('devices.count', {
    type: 'state',
    common: {
        name: 'Device Count',
        type: 'number',
        role: 'value',
        read: true,
        write: false,
    },
    native: {},
});

// Set state value
await this.setStateAsync('devices.count', 42, true);
```

#### Multi-language Support
```javascript
const name = {
    en: 'Device Count',
    de: 'Geräteanzahl',
    ru: 'Количество устройств',
    // ... other languages
};

await this.setObjectNotExistsAsync('devices.count', {
    type: 'state',
    common: {
        name: name,
        type: 'number',
        role: 'value',
        read: true,
        write: false,
    },
    native: {},
});
```

### Device-Watcher Specific Patterns

#### Device Monitoring Structure
```javascript
// Device data collection pattern
async collectDeviceData(adapterName) {
    const devices = [];
    const states = await this.getForeignStatesAsync(`${adapterName}.*`);
    
    for (const [id, state] of Object.entries(states)) {
        if (this.isDeviceRelevant(id, state)) {
            devices.push({
                id: id,
                name: await this.getDeviceName(id),
                battery: await this.getBatteryLevel(id),
                lastSeen: state.ts,
                online: this.isDeviceOnline(state.ts)
            });
        }
    }
    
    return devices;
}
```

#### Notification System Pattern
```javascript
// Multi-channel notification
async sendNotification(message, type = 'info') {
    const config = this.config;
    
    if (config.instancePushover && config.userPushover) {
        await this.sendToAsync(config.instancePushover, 'send', {
            message: message,
            title: config.titlePushover || 'Device-Watcher',
            priority: config.prioPushover || 0,
            device: config.devicePushover,
            user: config.userPushover
        });
    }
    
    if (config.instanceTelegram && config.chatIdTelegram) {
        await this.sendToAsync(config.instanceTelegram, 'send', {
            text: message,
            chatId: config.chatIdTelegram
        });
    }
    
    // Update last notification state
    await this.setStateAsync('lastNotification', {
        val: message,
        ts: Date.now(),
        ack: true
    });
}
```

### Configuration Management

#### Native Configuration Access
```javascript
// Access adapter configuration
const updateInterval = this.config.updateinterval || 10;
const batteryWarningLevel = this.config.minWarnBatterie || 35;
const enabledAdapters = Object.keys(this.config)
    .filter(key => key.endsWith('Devices') && this.config[key])
    .map(key => key.replace('Devices', ''));
```

#### Blacklist Management
```javascript
// Device blacklist checking
isDeviceBlacklisted(deviceId) {
    const blacklist = this.config.tableBlacklist || [];
    return blacklist.some(item => 
        deviceId.includes(item.name) || 
        deviceId.match(new RegExp(item.pattern))
    );
}
```

### Error Handling and Logging

#### Structured Error Handling
```javascript
async processAdapter(adapterName) {
    try {
        this.log.debug(`Processing adapter: ${adapterName}`);
        
        const devices = await this.collectDeviceData(adapterName);
        await this.updateDeviceStates(devices);
        
        this.log.info(`Successfully processed ${devices.length} devices from ${adapterName}`);
        
    } catch (error) {
        this.log.error(`Failed to process adapter ${adapterName}: ${error.message}`);
        
        // Optional: Send error notification
        if (this.config.notifyOnErrors) {
            await this.sendNotification(`Error processing ${adapterName}: ${error.message}`, 'error');
        }
    }
}
```

#### Logging Best Practices
```javascript
// Use appropriate log levels
this.log.error('Critical failures that stop functionality');
this.log.warn('Important issues that don\'t stop functionality');
this.log.info('General operational information');
this.log.debug('Detailed information for troubleshooting');

// Include context in log messages
this.log.info(`Monitoring ${deviceCount} devices across ${adapterCount} adapters`);
this.log.debug(`Device ${deviceId} battery level: ${batteryLevel}%`);
```

### Scheduled Tasks and Timers

#### Node-Schedule Integration
```javascript
const schedule = require('node-schedule');

class DeviceWatcher extends utils.Adapter {
    constructor(options = {}) {
        super(options);
        this.scheduledJobs = [];
    }

    async onReady() {
        // Schedule periodic device checks
        const updateJob = schedule.scheduleJob(`*/${this.config.updateinterval} * * * *`, () => {
            this.checkAllDevices();
        });
        this.scheduledJobs.push(updateJob);

        // Schedule daily notifications
        if (this.config.checkSendBatteryMsgDaily) {
            const notifyJob = schedule.scheduleJob(this.config.checkSendBatteryTime, () => {
                this.sendBatteryReport();
            });
            this.scheduledJobs.push(notifyJob);
        }
    }

    onUnload(callback) {
        // Clean up scheduled jobs
        this.scheduledJobs.forEach(job => {
            if (job) job.cancel();
        });
        this.scheduledJobs = [];
        callback();
    }
}
```

### Data Processing and State Updates

#### Efficient State Management
```javascript
// Batch state updates
async updateDeviceStates(devices) {
    const stateUpdates = {};
    
    // Prepare all state updates
    stateUpdates['devices.countAll'] = devices.length;
    stateUpdates['devices.listAll'] = JSON.stringify(devices);
    
    const offlineDevices = devices.filter(d => !d.online);
    stateUpdates['devices.offlineCount'] = offlineDevices.length;
    stateUpdates['devices.offlineList'] = JSON.stringify(offlineDevices);
    
    const lowBatteryDevices = devices.filter(d => d.battery && d.battery < this.config.minWarnBatterie);
    stateUpdates['devices.lowBatteryCount'] = lowBatteryDevices.length;
    stateUpdates['devices.lowBatteryList'] = JSON.stringify(lowBatteryDevices);

    // Execute all updates
    for (const [id, value] of Object.entries(stateUpdates)) {
        await this.setStateAsync(id, value, true);
    }
}
```

## File and Module Organization

### Standard File Structure
```
project/
├── main.js              # Main adapter entry point
├── lib/                 # Helper libraries
│   ├── tools.js         # Utility functions
│   ├── crud.js          # State/object creation
│   ├── translations.js  # Language translations
│   └── arrApart.js      # Array processing utilities
├── admin/               # Admin interface
│   ├── index.html
│   ├── words.js
│   └── i18n/           # Translation files
├── test/               # Test files
│   ├── integration.js
│   ├── unit.js
│   └── package.js
└── docs/               # Documentation
    ├── en/
    └── de/
```

### Module Import Patterns
```javascript
// Standard ioBroker utils
const utils = require('@iobroker/adapter-core');

// Helper modules
const tools = require('./lib/tools');
const { createDPsForInstances } = require('./lib/crud');
const translations = require('./lib/translations');

// Third-party dependencies
const schedule = require('node-schedule');
const parser = require('cron-parser');
```

## Admin Interface Integration

### Configuration Schema
```javascript
// In admin/words.js - define configuration options
const words = {
    'Update interval (minutes)': {
        'en': 'Update interval (minutes)',
        'de': 'Aktualisierungsintervall (Minuten)',
        'ru': 'Интервал обновления (минуты)',
        // ... other languages
    }
};
```

### Message Box Communication
```javascript
// Handle admin messages
if (obj && obj.message) {
    switch (obj.command) {
        case 'getAdapterList':
            this.sendTo(obj.from, obj.command, this.getInstalledAdapters(), obj.callback);
            break;
        case 'testNotification':
            await this.sendNotification('Test message from Device-Watcher');
            this.sendTo(obj.from, obj.command, { result: 'sent' }, obj.callback);
            break;
    }
}
```

## Performance and Best Practices

### Memory Management
```javascript
// Avoid memory leaks with large datasets
async processLargeDeviceList() {
    const batchSize = 100;
    const allDevices = await this.getAllDevices();
    
    for (let i = 0; i < allDevices.length; i += batchSize) {
        const batch = allDevices.slice(i, i + batchSize);
        await this.processBatch(batch);
        
        // Allow garbage collection
        if (i % (batchSize * 10) === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }
    }
}
```

### Error Recovery
```javascript
// Implement retry logic for critical operations
async withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            this.log.warn(`Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }
}
```

This document provides comprehensive guidance for developing the device-watcher adapter and following ioBroker best practices. Focus on robust error handling, efficient state management, and user-friendly notifications when working with this monitoring system.