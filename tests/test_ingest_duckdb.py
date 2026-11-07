import copy
import tempfile
import unittest
from pathlib import Path
import duckdb
from scripts.ingest_duckdb import ingest

E = dict(event_id='123e4567-e89b-42d3-a456-426614174000',event_type='itch_intensity',occurred_at='2025-01-01T12:00:00.123Z',created_at='2025-01-01T12:00:00.123Z',updated_at='2025-01-01T12:00:00.123Z',value=5,unit='score_0_10',notes=None,description=None,deleted_at=None)
class IngestTest(unittest.TestCase):
    def test_merge_tombstones_conflicts_and_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            db=Path(directory)/'test.db'; backup=lambda events: {'schema_version':1,'events':events}
            self.assertEqual(ingest(backup([E]),db)['inserted'],1)
            self.assertEqual(ingest(backup([E]),db)['skipped'],1)
            deleted={**E,'updated_at':'2025-01-02T12:00:00.123Z','deleted_at':'2025-01-02T12:00:00.123Z'}
            self.assertEqual(ingest(backup([deleted]),db)['updated'],1)
            self.assertEqual(ingest(backup([E]),db)['skipped'],1)
            other={**E,'event_id':'123e4567-e89b-42d3-a456-426614174001'}
            with self.assertRaises(ValueError): ingest(backup([other,{**deleted,'value':9}]),db)
            with duckdb.connect(str(db)) as con:
                self.assertEqual(con.execute('select count(*) from events').fetchone()[0],1)
                self.assertIsNotNone(con.execute('select deleted_at from events').fetchone()[0])
    def test_invalid_document_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError): ingest({'schema_version':1,'events':[E,{**E,'value':11}]},Path(directory)/'test.db')
