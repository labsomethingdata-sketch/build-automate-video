#!/usr/bin/env python3
"""
Aplica las migraciones SQL de supabase/migrations/ a la base de Supabase.

Uso (en WSL, para que la contraseña NO pase por el chat):

    # 1) instalar el driver (una vez):
    python3 -m pip install --user --break-system-packages psycopg2-binary

    # 2) exportar la connection string (Supabase → Settings → Database →
    #    Connection string → URI). Deja la contraseña en TU terminal:
    export DATABASE_URL='postgresql://postgres:TU_PASSWORD@db.zfozjyjemqxyjkvulpgi.supabase.co:5432/postgres'

    # 3) correr:
    python3 supabase/apply_migrations.py

Cada archivo .sql se aplica en su propia transacción (todo-o-nada).
"""
import glob
import os
import sys

try:
    import psycopg2
except ImportError:
    sys.exit(
        "Falta psycopg2. Instálalo con:\n"
        "  python3 -m pip install --user --break-system-packages psycopg2-binary"
    )

url = os.environ.get("DATABASE_URL")
if not url:
    sys.exit("Falta DATABASE_URL (Supabase → Settings → Database → Connection string → URI).")

here = os.path.dirname(os.path.abspath(__file__))
files = sorted(glob.glob(os.path.join(here, "migrations", "*.sql")))
if not files:
    sys.exit("No encontré archivos en supabase/migrations/.")

conn = psycopg2.connect(url)
try:
    for path in files:
        name = os.path.basename(path)
        with open(path, encoding="utf-8") as fh:
            sql = fh.read()
        with conn:  # commit al terminar, rollback si algo falla
            with conn.cursor() as cur:
                cur.execute(sql)
        print(f"✅ {name}")
    print("\nMigraciones aplicadas correctamente.")
finally:
    conn.close()
