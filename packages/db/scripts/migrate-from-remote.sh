#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SRC_DB_CONN_STRING:-}" ]; then
  echo "Error: SRC_DB_CONN_STRING is required"
  echo "Usage: SRC_DB_CONN_STRING=postgres://... pnpm db:seed-by-copying-v1matches"
  exit 1
fi

LOCAL_URL="${POSTGRES_URL:-postgres://rrsb@localhost:5432/scoreboard-db-v3}"

echo "=== Copying v1 Match data ==="
echo "Source: ${SRC_DB_CONN_STRING%%@*}@***"
echo "Target: $LOCAL_URL"
echo ""

# Count source rows
remote_count=$(psql "$SRC_DB_CONN_STRING" -t -A -c 'SELECT COUNT(*) FROM "Match"')
echo "Source Match rows: $remote_count"

# Count local rows before
local_before=$(psql "$LOCAL_URL" -t -A -c 'SELECT COUNT(*) FROM "Match"')
echo "Local Match rows (before): $local_before"

if [ "$local_before" -gt 0 ]; then
  echo ""
  read -p "Local Match table is not empty. Truncate and replace? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
  echo "Truncating local Match table (and FrameAction via cascade)..."
  psql "$LOCAL_URL" -c 'TRUNCATE "Match" CASCADE'
fi

echo ""
echo "Dumping Match data from source..."
pg_dump "$SRC_DB_CONN_STRING" \
  --data-only \
  --table='"Match"' \
  --no-owner \
  --no-acl \
  --file=/tmp/rrsb-match-dump.sql

echo "Loading Match data into local DB..."
psql "$LOCAL_URL" -f /tmp/rrsb-match-dump.sql

rm /tmp/rrsb-match-dump.sql

# Count local rows after
local_after=$(psql "$LOCAL_URL" -t -A -c 'SELECT COUNT(*) FROM "Match"')
echo ""
echo "=== Done ==="
echo "Local Match rows (after): $local_after"
