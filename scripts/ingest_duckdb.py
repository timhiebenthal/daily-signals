#!/usr/bin/env python3
"""Import a Daily Signals JSON backup into DuckDB without overwriting newer events."""
import argparse
import json
import math
import re
import uuid
from datetime import datetime
from pathlib import Path

import duckdb

FIELDS = ('event_id','event_type','occurred_at','created_at','updated_at','value','unit','notes','description','deleted_at')
TIMES = ('occurred_at','created_at','updated_at','deleted_at')
TYPES = {'caffeine','alcohol','meal','late_meal','stress','frustration','itch_intensity','skin_severity','other'}
SCORES = {'stress','frustration','itch_intensity','skin_severity'}

def timestamp(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)', value):
        raise ValueError('Invalid timestamp')
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Timestamp must have timezone')
    return result

def validate(data):
    if not isinstance(data, dict) or data.get('schema_version') != 1 or isinstance(data.get('schema_version'), bool) or not isinstance(data.get('events'), list):
        raise ValueError('Invalid or unsupported backup')
    seen = set()
    for event in data['events']:
        if not isinstance(event, dict) or set(event) != set(FIELDS):
            raise ValueError('Invalid event fields')
        try:
            identifier = uuid.UUID(event['event_id'])
            if str(identifier) != event['event_id'].lower() or identifier.variant != uuid.RFC_4122 or identifier.version not in range(1, 9): raise ValueError()
        except (ValueError, TypeError, AttributeError):
            raise ValueError('Invalid event ID') from None
        if event['event_id'] in seen: raise ValueError('Duplicate event ID in backup')
        seen.add(event['event_id'])
        if event['event_type'] not in TYPES: raise ValueError('Unknown event type')
        for key in TIMES:
            if key != 'deleted_at' or event[key] is not None: timestamp(event[key])
        value = event['value']
        if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0): raise ValueError('Invalid value')
        for key in ('unit','notes','description'):
            if event[key] is not None and (not isinstance(event[key], str) or len(event[key]) > 2000): raise ValueError(f'Invalid {key}')
        if event['event_type'] in SCORES and (not isinstance(value, (int, float)) or isinstance(value, bool) or value != int(value) or not 1 <= value <= 10 or event['unit'] != 'score_0_10'): raise ValueError('Invalid score')
        if event['event_type'] == 'other' and not (event['description'] or '').strip(): raise ValueError('Other requires a description')
    return data['events']

def ingest(data, db_path):
    events = validate(data)
    connection = duckdb.connect(str(db_path))
    try:
        connection.execute('BEGIN TRANSACTION')
        connection.execute('CREATE TABLE IF NOT EXISTS events (event_id VARCHAR PRIMARY KEY, event_type VARCHAR NOT NULL, occurred_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, value DOUBLE, unit VARCHAR, notes VARCHAR, description VARCHAR, deleted_at TIMESTAMPTZ)')
        counts = {'inserted': 0, 'updated': 0, 'skipped': 0}
        for event in events:
            values = [timestamp(event[k]) if k in TIMES and event[k] is not None else event[k] for k in FIELDS]
            old = connection.execute('SELECT * FROM events WHERE event_id = ?', [event['event_id']]).fetchone()
            if old is not None:
                if values[4] < old[4]: counts['skipped'] += 1; continue
                if values[4] == old[4]:
                    if tuple(values) != old: raise ValueError(f"Conflicting versions of event {event['event_id']}")
                    counts['skipped'] += 1; continue
                connection.execute('DELETE FROM events WHERE event_id = ?', [event['event_id']])
                counts['updated'] += 1
            else: counts['inserted'] += 1
            connection.execute('INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
        connection.execute('COMMIT')
        return counts
    except Exception:
        connection.execute('ROLLBACK')
        raise
    finally:
        connection.close()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('backup', type=Path)
    parser.add_argument('database', type=Path)
    args = parser.parse_args()
    with args.backup.open(encoding='utf-8') as handle: data = json.load(handle)
    print(ingest(data, args.database))

if __name__ == '__main__': main()
