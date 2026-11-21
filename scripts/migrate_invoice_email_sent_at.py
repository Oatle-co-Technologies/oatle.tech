"""Apply the additive invoice email marker using the deployment DATABASE_URL."""
import os
from pathlib import Path
import re
import sys

import psycopg


ROOT = Path(__file__).resolve().parents[1]

if "--apply" not in sys.argv:
    print("Pass --apply to add the invoice email delivery marker.")
    sys.exit(2)

try:
    connection = psycopg.connect(
        re.sub(r"^postgres(?:ql)?\+\w+://", "postgresql://", os.environ["DATABASE_URL"]),
        connect_timeout=20,
    )
except Exception as error:
    print("Database connection failed:", type(error).__name__)
    sys.exit(1)

try:
    with connection:
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL lock_timeout='15s'")
            cursor.execute("SELECT pg_advisory_xact_lock(2026110201)")
            cursor.execute("LOCK TABLE public.invoices IN SHARE ROW EXCLUSIVE MODE")
            sql = (ROOT / "sql/006_invoice_email_sent_at.sql").read_text(encoding="utf-8")
            cursor.execute(sql.replace("BEGIN;", "", 1).rsplit("COMMIT;", 1)[0])
            cursor.execute(
                "SELECT data_type FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name='invoices' "
                "AND column_name='invoice_email_sent_at'"
            )
            if cursor.fetchone() != ("timestamp without time zone",):
                raise RuntimeError("Unexpected invoice email marker column")
            cursor.execute(
                "SELECT count(*) FROM public.invoices "
                "WHERE status <> 'draft' AND invoice_email_sent_at IS NULL"
            )
            if cursor.fetchone()[0]:
                raise RuntimeError("Previously non-draft invoices were not marked")
    print("COMMITTED: invoice email marker added; existing non-draft invoices are protected from accidental duplicate sends.")
except Exception as error:
    print("Migration rolled back:", type(error).__name__)
    sys.exit(1)
finally:
    connection.close()
