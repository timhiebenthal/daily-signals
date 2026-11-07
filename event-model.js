'use strict';
const Model = (() => {
  const types = ['caffeine','alcohol','meal','late_meal','stress','frustration','itch_intensity','skin_severity','other'];
  const scores = ['stress','frustration','itch_intensity','skin_severity'];
  const fields = ['event_id','event_type','occurred_at','created_at','updated_at','value','unit','notes','description','deleted_at'];
  const timestamp = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s));
  function validateEvent(e) {
    if (!e || typeof e !== 'object' || Array.isArray(e) || Object.keys(e).some(k => !fields.includes(k)) || fields.some(k => !(k in e))) throw Error('Invalid event fields');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.event_id)) throw Error('Invalid event ID');
    if (!types.includes(e.event_type)) throw Error('Unknown event type');
    for (const key of ['occurred_at','created_at','updated_at']) if (!timestamp(e[key])) throw Error(`Invalid ${key}`);
    if (e.deleted_at !== null && !timestamp(e.deleted_at)) throw Error('Invalid deleted_at');
    if (e.value !== null && (typeof e.value !== 'number' || !Number.isFinite(e.value) || e.value < 0)) throw Error('Invalid value');
    for (const key of ['unit','notes','description']) if (e[key] !== null && (typeof e[key] !== 'string' || e[key].length > 2000)) throw Error(`Invalid ${key}`);
    if (scores.includes(e.event_type) && (!Number.isInteger(e.value) || e.value < 1 || e.value > 10 || e.unit !== 'score_0_10')) throw Error('Score must be an integer from 1 to 10');
    if (e.event_type === 'other' && !e.description?.trim()) throw Error('Other requires a description');
    return e;
  }
  function validateBackup(b) {
    if (!b || b.schema_version !== 1 || !Array.isArray(b.events)) throw Error('Invalid or unsupported backup');
    const ids = new Set(); for (const e of b.events) { validateEvent(e); if (ids.has(e.event_id)) throw Error('Duplicate event ID in backup'); ids.add(e.event_id); } return b;
  }
  function compareEvents(incoming, existing) {
    const a = Date.parse(incoming.updated_at), b = Date.parse(existing.updated_at);
    if (a !== b) return a > b ? 1 : -1;
    const same = fields.every(k => ['occurred_at','created_at','updated_at','deleted_at'].includes(k) && incoming[k] !== null && existing[k] !== null ? Date.parse(incoming[k]) === Date.parse(existing[k]) : incoming[k] === existing[k]);
    if (!same) throw Error(`Conflicting versions of event ${incoming.event_id}`);
    return 0;
  }
  return {types,scores,fields,validateEvent,validateBackup,compareEvents};
})();
if (typeof module !== 'undefined') module.exports = Model;
