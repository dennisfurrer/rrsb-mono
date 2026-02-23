#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SRC_DB_CONN_STRING:-}" ] || [ -z "${DST_DB_CONN_STRING:-}" ]; then
  echo "Error: Both SRC_DB_CONN_STRING and DST_DB_CONN_STRING are required"
  echo "Usage: SRC_DB_CONN_STRING=postgres://... DST_DB_CONN_STRING=postgres://... pnpm db:seed-by-copying-v1matches"
  exit 1
fi

SRC="$SRC_DB_CONN_STRING"
DST="$DST_DB_CONN_STRING"

echo "=== Copying v1 Match + FrameAction data ==="
echo "Source: ${SRC%%@*}@***"
echo "Target: ${DST%%@*}@***"
echo ""

# Count source rows
src_matches=$(psql "$SRC" -t -A -c 'SELECT COUNT(*) FROM "Match"')
src_actions=$(psql "$SRC" -t -A -c 'SELECT COUNT(*) FROM "FrameAction"' 2>/dev/null || echo "0")
echo "Source Match rows:       $src_matches"
echo "Source FrameAction rows: $src_actions"

# Count destination rows before
dst_matches=$(psql "$DST" -t -A -c 'SELECT COUNT(*) FROM "Match"')
echo "Dest   Match rows:       $dst_matches"

if [ "$dst_matches" -gt 0 ]; then
  echo ""
  read -p "Destination Match table is not empty. Truncate and replace? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
  echo "Truncating destination Match + FrameAction (cascade)..."
  psql "$DST" -c 'TRUNCATE "Match" CASCADE'
fi

# Get source Match columns (these are a subset of dest columns)
src_match_cols=$(psql "$SRC" -t -A -c \
  "SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
   FROM information_schema.columns WHERE table_name = 'Match'")

echo ""
echo "Exporting Match data as CSV..."
psql "$SRC" -c "\copy (SELECT $src_match_cols FROM \"Match\") TO '/tmp/rrsb-match.csv' WITH (FORMAT csv, HEADER)"

echo "Importing Match data into destination..."
psql "$DST" -c "\copy \"Match\"($src_match_cols) FROM '/tmp/rrsb-match.csv' WITH (FORMAT csv, HEADER)"

rm -f /tmp/rrsb-match.csv

# FrameAction
if psql "$SRC" -t -A -c "SELECT 1 FROM information_schema.tables WHERE table_name='FrameAction'" | grep -q 1; then
  if [ "$src_actions" -gt 0 ]; then
    src_action_cols=$(psql "$SRC" -t -A -c \
      "SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
       FROM information_schema.columns WHERE table_name = 'FrameAction'")

    echo "Exporting FrameAction data as CSV..."
    psql "$SRC" -c "\copy (SELECT $src_action_cols FROM \"FrameAction\") TO '/tmp/rrsb-actions.csv' WITH (FORMAT csv, HEADER)"

    echo "Importing FrameAction data into destination..."
    psql "$DST" -c "\copy \"FrameAction\"($src_action_cols) FROM '/tmp/rrsb-actions.csv' WITH (FORMAT csv, HEADER)"

    rm -f /tmp/rrsb-actions.csv
  fi
else
  echo ""
  echo "Source has no FrameAction table — skipping."
fi

# Final counts
dst_matches_after=$(psql "$DST" -t -A -c 'SELECT COUNT(*) FROM "Match"')
dst_actions_after=$(psql "$DST" -t -A -c 'SELECT COUNT(*) FROM "FrameAction"')
echo ""
echo "=== Done ==="
echo "Dest Match rows (after):       $dst_matches_after"
echo "Dest FrameAction rows (after): $dst_actions_after"
