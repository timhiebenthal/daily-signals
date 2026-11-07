# Spec: Daily Signals

## Objective

Build a small, local-first lifestyle logging PWA from scratch for quick Android use. The app collects timestamped events for later independent analysis alongside wearable data; it does not perform that analysis. Host static files on GitHub Pages and keep personal records on the device until the user explicitly exports them.

## Stack and assumptions

- Vanilla HTML, CSS and JavaScript; IndexedDB for runtime event data. No backend, accounts, tracking, or runtime framework.
- Modern Chrome on Android is the primary target. The app also runs in a modern desktop browser for development.
- Static files live at the repository root so Pages can publish `main` from `/`; no build step or Actions workflow is expected.
- File names and testing tools below are proposed conventions; adjust during implementation if needed without changing behavior. Python and DuckDB are needed only for the separate ingestion example.

## Event model and behavior

- Each event has a stable UUID `event_id`, standardized `event_type`, ISO 8601 `occurred_at`, `created_at` and `updated_at`, optional numeric `value`, optional `unit` and optional `notes`. Use nullable `deleted_at` for soft deletion; optional structured metadata may hold the description of an `other` event. Preserve timestamp precision when editing unrelated fields.
- Store timestamps as UTC instants, display and edit event time in the device's local time. The original timezone name or offset is not retained. Automatically fill the event time, allow it to be changed, and distinguish it from record creation time.
- Provide caffeine, alcohol, meal, late meal, stress, frustration, itch intensity, skin condition and other events. Late meal is an explicit choice. Caffeine and alcohol may have a numeric quantity and unit representing the item consumed, such as 1 cup or 500 ml; no stimulant or pure-alcohol conversion is performed.
- Stress, frustration, itch intensity and skin condition use deliberately selected integer scores from 1 to 10. Itch measures perceived itching; skin condition measures visible severity. Their units are `score_0_10` for compatibility with the requested event vocabulary, despite the entry range starting at 1. Use `itch_intensity` and `skin_severity` as their event types.
- An `other` event requires a short description and permits optional quantity, unit and notes. Event types are represented consistently in exports and remain extensible.
- Support creating, viewing recent events, editing and deleting. Editing preserves the ID and creation time and updates `updated_at`. Deleted records retain their fields and a deletion timestamp, are hidden by default, and can be shown with a history filter. Deletion updates `updated_at`.
- Provide touch-friendly controls, sensible defaults, clear save confirmation, input validation and actionable storage errors. Notes are optional. Make backup accessible from the main interface and explain that clearing site data, uninstalling the app or losing the phone can cause data loss; encourage regular backups.

## Backup, import and ingestion

- Export all records including tombstones to a versioned JSON document with an events array. Offer an obvious **Backup / Export JSON** action, file download, and file sharing when the device supports it; no Drive API integration or login.
- Validate the document version and every record before writing. Merge by `event_id`: insert missing events, use the record with the later `updated_at` for a match, and skip identical versions. If timestamps match but contents differ, report the conflict and leave the import unapplied. Apply valid imports atomically; reject malformed data without partial changes. An older record cannot revive a newer tombstone.
- Provide a separate Python example that reads the export, checks its schema version, parses timezone-aware timestamps, creates a DuckDB table if needed and merges by `event_id` with the same newer-update and equal-time conflict rules. Reprocessing a backup creates no duplicates; retain `deleted_at` so queries can exclude deleted events. The example must not silently overwrite a newer database row with an older export.

## PWA and deployment

- Work at `https://<github-username>.github.io/daily-signals/`: use subdirectory-safe relative asset paths, manifest start URL and scope, and service-worker registration/scope. Supply 192×192 and 512×512 icons and an Android-installable manifest.
- After an initial successful online load and service-worker installation, the app shell and event creation, editing, history and export work offline. Cache updates must eventually deliver changed files without permanently pinning stale assets. Service-worker cache cleanup must never delete IndexedDB data.
- README explains local development, exact Pages settings (`main`, `/ (root)`, HTTPS), Android Chrome installation, offline use, backups and restoration, data-loss risks, and DuckDB ingestion. Publishing uses GitHub Pages only.

## Commands and project structure

Proposed commands, to be confirmed and documented as files are created:

```sh
python3 -m http.server 8000
node --test tests/*.test.js
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/ingest_duckdb.py backup.json daily-signals.duckdb
```

Root static HTML, CSS, JavaScript, manifest, service worker and icon assets serve the PWA; `tests/` holds focused tests; `scripts/` holds the standalone ingestion example; `README.md` holds user and deployment instructions. No application build command is required. Document any actual test dependencies and commands rather than leaving proposed commands inaccurate.

## Code style

Use small, readable functions, consistent JavaScript formatting and `snake_case` for exported event fields. Keep UI, storage and validation responsibilities understandable without introducing a framework or unnecessary abstraction. For example:

```js
const event = {
  event_id: crypto.randomUUID(),
  event_type: 'itch_intensity',
  occurred_at: new Date().toISOString(),
};
```

## Testing strategy

Use focused automated tests for validation, event identity and timestamps, edits, tombstones, atomic import and conflict handling, and repeatable DuckDB ingestion. Exercise IndexedDB behavior in a real browser or an appropriate test environment. Verify subdirectory hosting, service-worker installation and update, offline logging and restoration in a browser; document Android installation/offline checks and any device limitations. No arbitrary coverage target or tests that merely mirror implementation.

## Boundaries

- Always validate untrusted imports and form inputs, preserve existing user data across updates, run relevant tests, and document setup and data-loss risks.
- Ask before expanding the agreed scope or introducing a backend, authentication, external services or substantial dependencies.
- Never transmit event data automatically, add analytics or tracking, commit real personal data or secrets, or clear IndexedDB during app updates.

## Success criteria

1. A user can install the app from its Pages project URL on Android, then create, edit, delete and inspect events offline after initial setup. The interface exposes all nine event types and saves valid fields as specified.
2. Reloading or updating the app retains records; changed application files eventually reach installed clients. A user sees storage failures rather than a false success.
3. JSON export and restoration preserve IDs, timestamps, data and tombstones. Repeated imports deduplicate; older records do not overwrite newer ones; equal-time conflicts and malformed imports leave storage unchanged and are reported.
4. The DuckDB example processes the exported format repeatedly without duplicates, preserves timestamps and deletion information, and applies the agreed conflict rules.
5. Relevant automated tests pass, browser offline and subdirectory behavior is checked, and README instructions enable deployment, installation, backup and ingestion. Report any Android-device checks that could not be performed.

## Out of scope

- Analytics, correlations, wearable integration and synchronization endpoints.
- Body areas, flare workflows, treatment tracking, scheduled check-ins and symptom dashboards.
- Notifications, gamification, social features, accounts and third-party tracking.
- CSV support, cloud APIs and automatic uploads.

## Open questions

None blocking. The exact JSON envelope and names for remaining event types will be documented with the implementation; these are implementation details subject to the behavior above.
