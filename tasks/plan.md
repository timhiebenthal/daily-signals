# Implementation plan: Daily Signals

## Approach

Build the static app in working slices: establish the event contract and one persisted logging path, extend it to all event types and history, then add backup/restore and the separate DuckDB consumer. Finish with installability, offline updates and deployment documentation. The repository is currently empty apart from project documents; there is no legacy data to migrate.

Use a versioned JSON envelope with `schema_version` and `events`, stable UUIDs, UTC ISO timestamps and nullable optional fields. Define validation and equality consistently before implementing either importer. An import is a single transaction: validate the whole document, detect equal-time conflicts, then merge; a tombstone is an ordinary newer event with `deleted_at`. Preserve the full record and timestamp precision. Use IndexedDB only for runtime data and scope service-worker cache deletion to this app's caches.

## Order and checkpoints

1. Event creation and storage (tasks 1–2): validate a real event and save it through IndexedDB. Check persistence and error handling.
2. Logging and correction (tasks 3–4): add all event types, editing and tombstone filtering. Check the complete local logging flow.
3. Portability (tasks 5–7): implement atomic restore and export, then DuckDB ingestion. Check round trips, conflicts and idempotency.
4. Delivery (tasks 8–10): add PWA shell and icons, test offline/update behavior under a project subpath, then document deployment and operating instructions. Run the full suite and report device limitations.

Tasks are sequential because the event contract and UI/storage files are shared; no parallel worker assignments are required. Each task owns the files listed in the checklist for its duration. Checkpoints are automated or manual verification steps, not extra approval gates.

## Risks and mitigations

- **Data loss or resurrection:** use atomic IndexedDB transactions, validate before writing, test conflict and tombstone cases, and avoid deleting the database during service-worker updates.
- **Clock skew or equal timestamps:** compare UTC instants; report equal-time differing records instead of choosing. Explain that later timestamps depend on device clocks.
- **Offline installation and updates:** test service-worker scope and cache replacement under `/daily-signals/`, including data persistence across an update; verify on Android if a device is available.
- **Cross-language consistency:** exercise the same representative backups and conflict cases in browser and DuckDB tests; preserve timestamps and metadata.
- **Sensitive data:** use synthetic fixtures only; no automatic network requests carrying events, and document backup exposure and site-data loss.

## Open questions

None blocking. Actual browser test tooling and exact filenames may be adapted to the environment; record working commands in the README. Deploying requires access to the user's GitHub repository settings and an Android device for final installation verification.
