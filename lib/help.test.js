'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('mocha');
const { COMMANDS, HELP } = require('./help');

/**
 * The commands of the switch in `onMessage` of main.js
 */
function commandsOfMain() {
	const source = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
	const start = source.indexOf('    onMessage(obj) {');
	const end = source.indexOf('     * refresh data with interval');
	assert.ok(start > 0 && end > start, 'onMessage found');
	return [...source.slice(start, end).matchAll(/case '([^']+)':/g)].map(m => m[1]);
}

describe('Message help', () => {
	it('lists exactly the commands onMessage answers, each once', () => {
		const names = COMMANDS.map(c => c.command);
		assert.equal(new Set(names).size, names.length);
		assert.deepEqual([...names].sort(), commandsOfMain().sort());
	});

	it('no command changes anything', () => {
		for (const { command, write } of COMMANDS) {
			assert.equal(write, false, command);
		}
	});

	it('names every command and the lists', () => {
		for (const { command } of COMMANDS.filter(c => c.command !== 'help')) {
			assert.ok(HELP.includes(command), command);
		}
		for (const state of ['offlineList', 'lowBatteryList', 'listInstancesError', 'listAdapterUpdates']) {
			assert.ok(HELP.includes(state), state);
		}
		assert.ok(HELP.includes('sendTo device-watcher.0'));
	});

	it('keeps the lines short', () => {
		for (const line of HELP.split('\n')) {
			assert.ok(line.length <= 120, line);
		}
	});
});
