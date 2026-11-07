# Daily Signals tasks

## Phase 1: Persist a first event

- [x] **1. Define event and backup contract**
  - Acceptance: Define event types, fields, UTC timestamps, nullable values, score validation, other descriptions, versioned envelope and deterministic comparison; reject malformed input and duplicate IDs in a backup.
  - Verify: Run focused Node tests for valid/invalid records, timestamp precision and comparison.
  - Dependencies: None. Owner: this task. Likely files: `event-model.js`, `tests/event-model.test.js`.
- [ ] **2. Create and persist a first event**
  - Acceptance: A usable page saves a valid event in IndexedDB with UUID and timestamps, confirms committed writes, survives reload, and reports storage failures.
  - Verify: Run focused tests and exercise a real browser reload and simulated failure where practical.
  - Dependencies: 1. Owner: this task. Likely files: `index.html`, `app.js`, `storage.js`, `tests/storage.test.js`.

### Checkpoint
- [ ] Run current tests and verify creation and reload in a browser.

## Phase 2: Complete logging

- [ ] **3. Add quick event forms**
  - Acceptance: All nine types are accessible; scores require an integer 1–10, quantities use item units, other requires a description, and event time and notes are editable. Controls are touch-friendly.
  - Verify: Run validation tests and manually create representative types, including invalid inputs.
  - Dependencies: 2. Owner: this task. Likely files: `index.html`, `app.js`, `styles.css`, `tests/event-model.test.js`.
- [ ] **4. Add history and correction**
  - Acceptance: Recent events can be edited or soft-deleted; edits retain ID, creation time and unchanged event-time precision; a filter reveals tombstones while normal history hides them.
  - Verify: Run focused edit/delete tests and exercise edit, delete, reload and filter in a browser.
  - Dependencies: 3. Owner: this task. Likely files: `index.html`, `app.js`, `storage.js`, `tests/storage.test.js`.

### Checkpoint
- [ ] Exercise all event types and correction flow with synthetic records; run current tests.

## Phase 3: Data portability

- [ ] **5. Implement atomic backup merge**
  - Acceptance: Validate the whole versioned document, merge by ID and later update, reject equal-time content conflicts and invalid documents without partial writes, and retain tombstones.
  - Verify: Run tests using actual IndexedDB transactions for duplicates, old/new edits, deletions, conflicts and rollback.
  - Dependencies: 4. Owner: this task. Likely files: `storage.js`, `event-model.js`, `tests/storage.test.js`, `tests/event-model.test.js`.
- [ ] **6. Expose backup and restore**
  - Acceptance: Export all events including tombstones as versioned JSON via download and supported file sharing; import reports outcomes/errors and uses atomic merge. Show a backup/data-loss reminder.
  - Verify: Round-trip synthetic events in browser; repeat import and check conflict behavior; test download fallback.
  - Dependencies: 5. Owner: this task. Likely files: `index.html`, `app.js`, `styles.css`, `tests/backup.test.js`.
- [ ] **7. Add DuckDB ingestion example**
  - Acceptance: Python validates the export version and records, parses aware timestamps, creates a table and merges atomically by ID under the same newer/equal-time rules, retaining deleted records and metadata.
  - Verify: Run Python tests against a temporary DuckDB database for repeat imports, older/newer edits, tombstones, conflicts and rollback.
  - Dependencies: 5. Owner: this task. Likely files: `scripts/ingest_duckdb.py`, `tests/test_ingest_duckdb.py`.

### Checkpoint
- [ ] Export, restore and ingest the same synthetic backup twice; verify no duplicates and matching deletion/conflict behavior.

## Phase 4: Offline delivery

- [ ] **8. Make the shell installable**
  - Acceptance: Manifest, 192/512 icons, relative asset paths and scoped service worker support installation at the project subdirectory; app shell loads offline after successful installation.
  - Verify: Serve under `/daily-signals/`, inspect manifest and service-worker scope, then reload offline.
  - Dependencies: 6. Owner: this task. Likely files: `manifest.webmanifest`, `service-worker.js`, `icons/icon-192.png`, `icons/icon-512.png`, `index.html`.
- [ ] **9. Verify offline updates and persistence**
  - Acceptance: Offline create/edit/export work, a new shell version eventually activates, and old cache cleanup leaves IndexedDB untouched. Add focused regression coverage where practical.
  - Verify: Browser test online install, offline operations, deployment update, reload and data retention; run relevant automated tests.
  - Dependencies: 8. Owner: this task. Likely files: `service-worker.js`, `tests/pwa.test.js`.
- [ ] **10. Document and verify delivery**
  - Acceptance: README documents tested commands, Pages `main`/root/HTTPS settings, Android installation, offline use, backup/restore, data-loss risks and DuckDB usage; report access or device limitations.
  - Verify: Run the full test suite and follow local serving and ingestion instructions with synthetic data; inspect the final diff.
  - Dependencies: 7, 9. Owner: this task. Likely files: `README.md`.

### Final checkpoint
- [ ] Run all available tests and browser checks; document results and any unverified Android or GitHub Pages steps.
