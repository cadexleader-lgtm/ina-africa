#!/usr/bin/env bash
# =====================================================================
# Tests de la base de données sur un Postgres LOCAL et jetable.
#  1. démarre un serveur Postgres temporaire ;
#  2. applique la reproduction minimale de Supabase (supabase-shim.sql) ;
#  3. applique toutes les migrations de supabase/migrations dans l'ordre ;
#  4. joue chaque fichier tests/db/[0-9]*.sql (chacun dans une transaction
#     annulée à la fin) ;
#  5. arrête et efface le serveur.
# Ne touche JAMAIS à un projet Supabase distant.
#
# Usage : npm run test:db
# Variables : PGBIN (dossier des binaires Postgres, ex. /usr/lib/postgresql/16/bin)
# =====================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || echo /usr/lib/postgresql/16/bin/pg_ctl)")}"
PORT="${PGPORT_TEST:-54329}"
WORK="$(mktemp -d)"

# Postgres refuse de tourner en root : on passe par l'utilisateur postgres.
if [ "$(id -u)" = "0" ]; then
  chown postgres "$WORK"
  AS_PG=(runuser -u postgres --)
else
  AS_PG=()
fi

cleanup() {
  "${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "${WORK:?}"
}
trap cleanup EXIT

"${AS_PG[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -l "$WORK/postgres.log" -w \
  -o "-k $WORK -p $PORT -c listen_addresses=''" start >/dev/null

PSQL=("${AS_PG[@]}" "$PGBIN/psql" -h "$WORK" -p "$PORT" -U postgres -X -q -v ON_ERROR_STOP=1)

"${PSQL[@]}" -d postgres -c "create database ina_test" >/dev/null

run_sql() { "${PSQL[@]}" -d ina_test -f "$1"; }

echo "▶ Reproduction minimale de Supabase"
run_sql "$ROOT/tests/db/supabase-shim.sql"

echo "▶ Migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "   $(basename "$f")"
  run_sql "$f"
done

echo "▶ Outils de test"
run_sql "$ROOT/tests/db/helpers.sql"

total=0
for f in "$ROOT"/tests/db/[0-9]*.sql; do
  echo "▶ $(basename "$f")"
  out="$("${PSQL[@]}" -d ina_test -f "$f" 2>&1)" || { echo "$out"; echo "✗ ÉCHEC dans $(basename "$f")"; exit 1; }
  echo "$out" | sed -n 's/^.*NOTICE:  OK    /   ✓ /p'
  n="$(echo "$out" | grep -c 'NOTICE:  OK    ' || true)"
  total=$((total + n))
done

echo "✔ $total vérifications réussies"
