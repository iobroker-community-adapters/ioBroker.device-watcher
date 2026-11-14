'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('mocha');
const { createListHTML, createListHTMLInstances } = require('./crud');

describe('HTML list generation', () => {
	const adapter = {
		config: {
			userSelectedLanguage: 'en',
		},
	};

	const deviceListTypes = ['linkQualityList', 'offlineList', 'batteryList'];
	const instanceListTypes = [
		'allInstancesList',
		'allActiveInstancesList',
		'errorInstanceList',
		'deactivatedInstanceList',
		'updateAdapterList',
	];

	for (const type of deviceListTypes) {
		it(`does not add a horizontal rule to ${type}`, async () => {
			const html = await createListHTML(adapter, type, [], 0, false);

			assert.doesNotMatch(html, /<hr\b/i);
		});
	}

	for (const type of instanceListTypes) {
		it(`does not add a horizontal rule to ${type}`, async () => {
			const instances = type === 'updateAdapterList' ? new Map() : [];
			const html = await createListHTMLInstances(adapter, type, instances, 0);

			assert.doesNotMatch(html, /<hr\b/i);
		});
	}
});

describe('Matter battery discovery', () => {
	const { createData } = require('./crud');
	const { matter } = require('./adapterArray');
	for (const endpoint of ['OnOffLight-1', 'ContactSensor-2', 'PowerSource-3', null]) {
		it(`creates the device with ${endpoint || 'no battery endpoint'}`, async () => {
			const node = 'matter.0.controller.1';
			const states = {
				[`${node}.info.connection`]: { val: true },
				'matter.0.controller.10.PowerSource-0.BATTERY': { val: 5 },
			};
			if (endpoint) {
				states[`${node}.${endpoint}.BATTERY`] = { val: 86 };
				states[`${node}.${endpoint}.LOWBAT`] = { val: false };
			}
			if (endpoint === 'PowerSource-3') {
				states[`${node}.OnOffLight-1.BATTERY`] = { val: 10 };
				states[`${node}.OnOffLight-1.LOWBAT`] = { val: true };
			}
			const errors = [];
			const subscriptions = [];
			const adapter = {
				config: {}, selAdapter: [matter], listAllDevicesRaw: new Map(),
				log: { error: message => errors.push(message) },
				getForeignStatesAsync: async () => ({ [`${node}.info.connection`]: { val: true } }),
				getForeignStateAsync: async id => states[id] || null,
				getObjectViewAsync: async (_design, _search, { startkey, endkey }) => ({
					rows: Object.keys(states).sort().filter(id => id >= startkey && id <= endkey).map(id => ({ id })),
				}),
				subscribeForeignStates: id => subscriptions.push(id),
				subscribeForeignObjects: () => {},
				getDeviceName: async () => 'Light',
				calculateSignalStrength: async () => [],
				getBatteryData: async battery => [battery, battery !== undefined, battery, '%'],
				setLowbatIndicator: async (_battery, lowbat) => lowbat,
				getOnlineState: async () => ['', true],
			};
			await createData(adapter, 0);
			assert.deepEqual(errors, []);
			assert.equal(adapter.listAllDevicesRaw.size, 1);
			const device = adapter.listAllDevicesRaw.get(`${node}.info`);
			assert.equal(device.BatteryRaw, endpoint ? 86 : undefined);
			assert.equal(device.isBatteryDevice, Boolean(endpoint));
			if (endpoint) {
				assert.equal(device.batteryDP, `${node}.${endpoint}.BATTERY`);
				assert.equal(device.LowBatDP, `${node}.${endpoint}.LOWBAT`);
				assert.equal(device.LowBat, false);
				assert.ok(subscriptions.includes(device.batteryDP));
				assert.ok(subscriptions.includes(device.LowBatDP));
			}
			assert.ok(!subscriptions.includes('matter.0.controller.10.PowerSource-0.BATTERY'));
		});
	}
});
