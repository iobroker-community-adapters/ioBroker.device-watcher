'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const adapterArray = require('./lib/adapterArray');
const tools = require('./lib/tools');

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
            tableDevices: Object.values(adapterArray).map(adapter => ({
                adapterKey: adapter.adapterKey,
                maxSecondDevicesOffline: 800,
                telegramSilent: false,
            })),
        },
    });
}

describe('WLED online state', () => {
    let adapter;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: Date.UTC(2026, 9, 15, 12), toFake: ['Date'] });
        adapter = createAdapter();
    });

    afterEach(() => {
        clock.restore();
        sinon.assert.notCalled(adapter.log.error);
    });

    async function evaluate(value, { age = 0, transitionAge = age, timeout = 800, adapterID = 'wled', signal = '82%' } = {}) {
        const definition = Object.values(adapterArray).find(item => item.adapterID === adapterID);
        adapter.config.tableDevices.find(item => item.adapterKey === definition.adapterKey).maxSecondDevicesOffline = timeout;
        adapter.getForeignStateAsync = sinon.stub().resolves({
            val: value,
            ts: Date.now() - age * 1000,
            lc: Date.now() - transitionAge * 1000,
        });
        return adapter.getOnlineState('device.online', adapterID, 'device.online', signal, value);
    }

    it('keeps an unchanged true state online after the configured timeout', async () => {
        const result = await evaluate(true, { age: 86400 });
        expect(result[1]).to.equal('Online');
        expect(result[2]).to.equal('82%');
    });

    it('keeps a true state online when the timeout is zero', async () => {
        expect((await evaluate(true, { age: 86400, timeout: 0 }))[1]).to.equal('Online');
    });

    it('reports a false state immediately when the timeout is zero', async () => {
        const result = await evaluate(false, { timeout: 0 });
        expect(result[1]).to.equal('Offline');
        expect(result[2]).to.equal('0%');
    });

    for (const age of [3, 799, 800]) {
        it(`keeps a false state within the existing grace period online (${age}s)`, async () => {
            const result = await evaluate(false, { age });
            expect(result[1]).to.equal('Online');
            expect(result[2]).to.equal('82%');
        });
    }

    it('reports a false state after the grace period', async () => {
        expect((await evaluate(false, { age: 801 }))[1]).to.equal('Offline');
    });

    it('uses the transition timestamp even when false is repeatedly reported', async () => {
        expect((await evaluate(false, { age: 1, transitionAge: 801 }))[1]).to.equal('Offline');
    });

    it('recognizes recovery to true on the next evaluation', async () => {
        expect((await evaluate(false, { age: 801 }))[1]).to.equal('Offline');
        expect((await evaluate(true))[1]).to.equal('Online');
    });

    it('preserves the missing signal-strength placeholder when offline', async () => {
        expect((await evaluate(false, { age: 801, signal: ' - ' }))[2]).to.equal(' - ');
    });

    it('does not change existing boolean reachability adapters', async () => {
        expect((await evaluate(true, { age: 86400, adapterID: 'hue' }))[1]).to.equal('Online');
        expect((await evaluate(false, { age: 799, adapterID: 'hue' }))[1]).to.equal('Online');
        expect((await evaluate(false, { age: 801, adapterID: 'hue' }))[1]).to.equal('Offline');
    });

    it('does not change timestamp-based devices in the default branch', async () => {
        expect((await evaluate(true, { age: 801, adapterID: 'ble' }))[1]).to.equal('Offline');
    });

    it('updates the normal contact/list path only for sustained outages and recovery', async () => {
        const id = 'wled.0.test._info';
        const onlineId = `${id}._online`;
        let state = { val: true, ts: Date.now() - 86400000, lc: Date.now() - 86400000 };
        adapter.getForeignStateAsync = async key => key === onlineId ? state : {
            val: true, ts: Date.now() - 120000, lc: Date.now() - 120000,
        };
        adapter.config.checkSendOfflineMsg = true;
        adapter.sendStateNotifications = sinon.stub().resolves();
        const device = {
            Path: id, Device: 'WLED fixture', Adapter: 'WLED', adapterID: 'wled',
            timeSelector: onlineId, UnreachDP: onlineId, SignalStrength: '82%',
            instanceDeviceConnected: true, instanceDeviceConnectionDP: 'wled.0.info.connection',
            Status: 'Online',
        };
        adapter.listAllDevicesRaw.set(id, device);
        async function refresh() {
            const changed = await tools.checkLastContact(adapter);
            adapter.listAllDevices = [];
            adapter.listAllDevicesUserRaw = [];
            adapter.offlineDevices = [];
            adapter.linkQualityDevices = [];
            await adapter.theLists(device);
            return changed;
        }
        expect(await refresh()).to.equal(false);
        expect(adapter.offlineDevices).to.have.length(0);
        state = { val: false, ts: Date.now(), lc: Date.now() };
        clock.tick(3000);
        expect(await refresh()).to.equal(false);
        expect(adapter.offlineDevices).to.have.length(0);
        clock.tick(798000);
        expect(await refresh()).to.equal(true);
        expect(adapter.offlineDevices).to.have.length(1);
        expect(await refresh()).to.equal(false);
        sinon.assert.calledOnce(adapter.sendStateNotifications);
        state = { val: true, ts: Date.now(), lc: Date.now() };
        expect(await refresh()).to.equal(true);
        expect(adapter.offlineDevices).to.have.length(0);
        sinon.assert.calledTwice(adapter.sendStateNotifications);
    });
});
