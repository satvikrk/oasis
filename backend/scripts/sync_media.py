#!/usr/bin/env python3
"""
Scan backend/media and insert entries into the Songs table for files
that are not already present. This is a one-off helper script — run it
when you add files to the media folder.

It uses the same DB connection settings as `app.py` (reads from .env).
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / '.env')

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'music_streaming')
MEDIA_DIR = os.getenv('MEDIA_DIR', 'media')

media_path = BASE_DIR / MEDIA_DIR
if not media_path.is_dir():
    print(f"Media path not found: {media_path}")
    sys.exit(1)

# Connect
conn = mysql.connector.connect(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    charset='utf8mb4'
)
cur = conn.cursor()

# Helper to check existing file_url
SELECT_EXISTING = "SELECT COUNT(*) FROM Songs WHERE file_url = %s"
INSERT_SONG = "INSERT INTO Songs (title, file_url, language) VALUES (%s, %s, %s)"

added = 0
for p in media_path.rglob('*'):
    if p.is_file():
        rel = '/' + str(p.relative_to(BASE_DIR)).replace('\\', '/')
        # Use filename (without extension) as title placeholder
        title = p.stem
        cur.execute(SELECT_EXISTING, (rel,))
        (count,) = cur.fetchone()
        if count == 0:
            cur.execute(INSERT_SONG, (title, rel, None))
            added += 1
            print(f"Inserted: {title} -> {rel}")
        else:
            print(f"Already in DB: {rel}")

if added > 0:
    conn.commit()
    print(f"Committed {added} new songs to DB.")
else:
    print("No new files to add.")

cur.close()
conn.close()
