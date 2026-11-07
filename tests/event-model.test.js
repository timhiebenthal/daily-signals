const {test} = require('node:test');
const assert = require('node:assert/strict');
const m = require('../event-model.js');
const event = {event_id:'123e4567-e89b-42d3-a456-426614174000', event_type:'itch_intensity', occurred_at:'2025-01-01T12:00:00.123Z', created_at:'2025-01-01T12:00:00.123Z', updated_at:'2025-01-01T12:00:00.123Z', value:5, unit:'score_0_10', notes:null, description:null, deleted_at:null};
test('validates score, time and UUID', () => { assert.doesNotThrow(() => m.validateEvent(event)); assert.throws(() => m.validateEvent({...event,value:0})); assert.throws(() => m.validateEvent({...event,occurred_at:'tomorrow'})); });
test('rejects duplicate IDs and compares timestamps by instant', () => { assert.throws(() => m.validateBackup({schema_version:1,events:[event,event]})); assert.equal(m.compareEvents(event,{...event,updated_at:'2025-01-01T13:00:00.123+01:00'}),0); });
test('detects equal-time conflicting data', () => { assert.throws(() => m.compareEvents(event,{...event,value:8})); });
