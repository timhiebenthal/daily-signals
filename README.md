# Daily Signals

A small, local-first lifestyle log. Daily Signals runs in your browser, saves events in IndexedDB on that device and makes no automatic uploads. It has no account, analytics, server or wearable integration.

## Run locally

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/. localhost is a secure context for the service worker. Data stored here is separate from data stored on GitHub Pages or another device. There is no build step.

## Publish on GitHub Pages

1. Push the finished files to the `main` branch of your `daily-signals` repository. If this work is on a feature branch, review and merge it first.
2. On GitHub, open the repository **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**. Select **main** and **/ (root)**, then **Save**.
4. Wait for the Pages deployment to finish. Visit `https://<github-username>.github.io/daily-signals/`. Enable **Enforce HTTPS** in Pages settings when available. HTTPS is required for installation and offline support.
5. Load the page successfully while online. The service worker caches the app for subsequent offline use. On later releases, increment the cache version in `service-worker.js` whenever shell files change; the new worker replaces old app caches without touching IndexedDB. Reopen or reload the app to receive the update.

Pages only hosts static files. Do not commit personal backups to the repository.

## Install and use on Android

In Chrome on Android, open the HTTPS Pages URL, then use the browser menu and select **Install app** or **Add to Home screen** (wording varies). Launch Daily Signals from the home screen. After its first successful online load, you can log and edit without a connection. Keep the app installed and confirm offline access on your phone before relying on it.

Choose an event type, enter any details, and save. Scores are deliberately chosen integers from 1 to 10. Caffeine and alcohol quantities describe the item consumed, such as cups or millilitres. Choose **Late meal** explicitly when appropriate. History supports editing and deletion; **Show deleted** reveals deleted entries. Events use local time on screen and UTC timestamps in exports. Editing another field preserves the original event timestamp.

## Backup and restore

**Your records exist only in this browser's site storage.** Losing your phone, clearing browser site data, or uninstalling the PWA may erase them. Export a JSON backup regularly and store it privately, for example in Google Drive using a file manager or the optional Share backup button when supported. Export downloads a file without requiring a cloud account. Backups include deleted events and may contain sensitive personal information.

Use **Import JSON** to restore or merge a backup. Each event has a stable UUID. The later `updated_at` wins; identical versions are skipped, older records cannot overwrite newer ones, and equal-time differences cause the entire import to be rejected. Validation and the merge are atomic. This relies on accurate device clocks. A fresh installation or a different browser has its own separate database; restore a backup to copy data into it.

The JSON document has `schema_version: 1` and an `events` array. Events contain `event_id`, `event_type`, `occurred_at`, `created_at`, `updated_at`, `value`, `unit`, `notes`, `description`, and `deleted_at`; optional fields are null when absent. Deleted events remain as tombstones. Score events use `score_0_10` as the unit, with entry restricted to 1–10. `description` describes an Other event.

## DuckDB example

Install Python DuckDB in your environment (`python3 -m pip install duckdb`) and run:

```sh
python3 scripts/ingest_duckdb.py path/to/backup.json daily-signals.duckdb
```

The script validates the backup and merges it transactionally into an `events` table. It preserves timezone-aware timestamps and tombstones and applies the same update and conflict rules as the app. To exclude deleted records, query `WHERE deleted_at IS NULL`. Back up the database as well as the JSON; keep both private.

## Tests

With Node.js and the Python DuckDB package installed:

```sh
node --test tests/*.test.js
python3 -m unittest discover -s tests -p 'test_*.py'
```

For a browser check under the Pages project path, serve the parent directory with `python3 -m http.server 8000 --directory ..` and open http://localhost:8000/daily-signals/. Test offline use after the service worker has installed. Android installation and device-specific sharing should also be checked on the actual phone.
