"""Apply the additive fixed-discount column without exporting credentials or invoice data."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys

import psycopg

try:
    connection = psycopg.connect(
        re.sub(r'^postgres(?:ql)?\+\w+://', 'postgresql://', os.environ['DATABASE_URL']),
        connect_timeout=20,
    )
except Exception as error:
    print('Database connection failed:', type(error).__name__)
    sys.exit(1)

try:
    with connection:
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL lock_timeout='15s'")
            cursor.execute('SELECT pg_advisory_xact_lock(2026102002)')
            # Lock financial tables briefly so a concurrent payment cannot invalidate the comparison.
            cursor.execute('LOCK TABLE public.invoices, public.invoice_payments IN SHARE ROW EXCLUSIVE MODE')
            columns = {}
            def fingerprint():
                result = {}
                for table in ['invoices', 'invoice_payments']:
                    if table not in columns:
                        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=%s ORDER BY ordinal_position", (table,))
                        columns[table] = [row[0] for row in cursor.fetchall()]
                    cursor.execute('SELECT ' + ','.join('"' + name + '"' for name in columns[table]) + ' FROM public.' + table + ' ORDER BY id')
                    records = cursor.fetchall()
                    result[table] = (len(records), hashlib.sha256(json.dumps(records, default=str).encode()).hexdigest())
                return result
            before = fingerprint()
            sql = (Path(__file__).resolve().parents[1] / 'sql/005_fixed_invoice_discounts.sql').read_text()
            cursor.execute(sql.replace('BEGIN;', '', 1).rsplit('COMMIT;', 1)[0])
            if fingerprint() != before:
                raise RuntimeError('Historical financial records changed')
            cursor.execute("SELECT data_type, numeric_scale FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='discount_fixed'")
            if cursor.fetchone() != ('numeric', 2):
                raise RuntimeError('Unexpected discount column definition')
    print('COMMITTED: fixed rand discount column verified; every existing invoice and payment is unchanged.')
except Exception as error:
    print('Migration rolled back:', type(error).__name__)
    sys.exit(1)
