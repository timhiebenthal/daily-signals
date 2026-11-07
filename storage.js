'use strict';
const Store = (() => {
  let dbPromise;
  function open() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('daily-signals', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('events', {keyPath:'event_id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('Database upgrade blocked. Close other app tabs.'));
    }).catch(error => { dbPromise = null; throw error; });
    return dbPromise;
  }
  async function all() {
    const db = await open();
    return new Promise((resolve,reject) => { const tx = db.transaction('events','readonly'); const req = tx.objectStore('events').getAll(); tx.oncomplete = () => resolve(req.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || Error('Read aborted')); });
  }
  async function put(event) {
    Model.validateEvent(event); const db = await open();
    return new Promise((resolve,reject) => { const tx = db.transaction('events','readwrite'); tx.objectStore('events').put(event); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || Error('Save aborted')); });
  }
  async function merge(backup) {
    Model.validateBackup(backup); const db = await open();
    return new Promise((resolve,reject) => {
      const tx = db.transaction('events','readwrite'); const store = tx.objectStore('events'); let failure; let inserted = 0, updated = 0, skipped = 0;
      for (const event of backup.events) { const req = store.get(event.event_id); req.onsuccess = () => { try { const old = req.result; const comparison = old ? Model.compareEvents(event,old) : 1; if (comparison > 0) { store.put(event); old ? updated++ : inserted++; } else skipped++; } catch (error) { failure = error; tx.abort(); } }; }
      tx.oncomplete = () => resolve({inserted,updated,skipped}); tx.onabort = () => reject(failure || tx.error || Error('Import aborted')); tx.onerror = () => {};
    });
  }
  return {open,all,put,merge};
})();
