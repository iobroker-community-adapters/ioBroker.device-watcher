'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const vm = require('node:vm');

// Load the actual adapter with an inert core, without opening controller connections.
function createAdapter() {
    class Adapter extends EventEmitter {
        constructor(options) {
            super();
            this.config = options.config;
            this.log = { debug: sinon.stub(), info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };
        }
    }
    const filename = path.join(__dirname, 'main.js');
    const realRequire = createRequire(filename);
    const sandbox = {
        module: { exports: {} },
        require: id => id === '@iobroker/adapter-core' ? { Adapter } : realRequire(id),
        Date,
    };
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext(sandbox);
    return sandbox.module.exports({
        config: {
            userSelectedLanguage: 'en',
            checkSendAdapterUpdateMsg: false,
        },
    });
}

// Simulates getForeignStatesAsync for a single id or a pattern like admin.*.info.updatesJson
function foreignStates(states) {
    return async pattern => {
        const regex = new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
        return Object.fromEntries(Object.entries(states).filter(([id]) => regex.test(id)).map(([id, val]) => [id, { val }]));
    };
}

const zigbeeUpdate = JSON.stringify({ zigbee: { availableVersion: '3.6.1', installedVersion: '3.5.5' } });
const hueUpdate = JSON.stringify({ hue: { availableVersion: '3.17.0', installedVersion: '3.16.0' } });

describe('Adapter update list refresh', () => {
    let adapter;
    let states;

    beforeEach(async () => {
        adapter = createAdapter();
        states = { 'admin.0.info.updatesJson': zigbeeUpdate };
        adapter.getForeignStatesAsync = sinon.stub().callsFake(pattern => foreignStates(states)(pattern));
        adapter.setStateChangedAsync = sinon.stub().resolves();
        adapter.sendStateNotifications = sinon.stub().resolves();

        // state at adapter start (see getInstanceData)
        adapter.adapterUpdatesJsonRaw = await adapter.getAdapterUpdateData('admin.*.info.updatesJson');
        await adapter.createAdapterUpdateList();
        expect(adapter.countAdapterUpdates).to.equal(1);
    });

    afterEach(() => {
        sinon.assert.notCalled(adapter.log.error);
    });

    it('clears the list when admin reports no updates anymore', async () => {
        states['admin.0.info.updatesJson'] = '{}';
        await adapter.renewAdapterUpdateData();

        expect(adapter.countAdapterUpdates).to.equal(0);
        sinon.assert.calledWith(adapter.setStateChangedAsync, 'adapterAndInstances.countAdapterUpdates', { val: 0, ack: true });
    });

    it('adds updates reported after adapter start', async () => {
        states['admin.0.info.updatesJson'] = JSON.stringify({ ...JSON.parse(zigbeeUpdate), ...JSON.parse(hueUpdate) });
        await adapter.renewAdapterUpdateData();

        expect(adapter.countAdapterUpdates).to.equal(2);
    });

    it('keeps updates of all admin instances when one of them changes', async () => {
        states['admin.1.info.updatesJson'] = hueUpdate;
        await adapter.renewAdapterUpdateData();

        expect(adapter.adapterUpdatesJsonRaw.map(entry => entry.adapter)).to.have.members(['Zigbee', 'Hue']);
        expect(adapter.countAdapterUpdates).to.equal(2);
    });
});
