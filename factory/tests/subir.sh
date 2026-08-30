#!/usr/bin/env bash
# Subir la fábrica: nada sale de aquí sin pasar por todas las pruebas.
#
#   ./tests/subir.sh "mensaje del commit"
#
# 1) tipos del web y del motor,
# 2) construcción de producción (la que hará el CI),
# 3) las 15 baterías de punta a punta,
# 4) y solo si TODO está verde: commit y push.
#
# Se ejecuta desde factory/.
set -euo pipefail

RAMA="${RAMA:-claude/online-store-factory-9cnbb7}"
MENSAJE="${1:-}"
if [ -z "$MENSAJE" ]; then
  echo "Falta el mensaje del commit: ./tests/subir.sh \"lo que cambió\"" >&2
  exit 2
fi

echo "── 1/4  tipos ─────────────────────────────────────────"
(cd web && npx tsc --noEmit)
(cd vendure && npx tsc -p tsconfig.json)

echo "── 2/4  construcción de producción ────────────────────"
# OJO: `next build` pisa el .next del servidor de desarrollo y lo deja servir
# fragmentos viejos. Por eso se para antes y se relanza limpio después.
pkill -f "next dev" 2>/dev/null || true
sleep 2
(cd web && rm -rf .next && npx next build > /tmp/build.log 2>&1) || { tail -30 /tmp/build.log; exit 1; }
(cd web && rm -rf .next && setsid nohup npx next dev -p 8300 > /tmp/next.log 2>&1 < /dev/null &) 
for i in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8300/ || true)" = "200" ] && break
  sleep 3
done

echo "── 3/4  baterías de punta a punta ─────────────────────"
node tests/todas.mjs

echo "── 4/4  subir ─────────────────────────────────────────"
cd ..
git add -A
git commit -m "$MENSAJE"
for intento in 1 2 3 4; do
  if git push -u origin "$RAMA"; then exit 0; fi
  echo "push falló; reintento $intento"
  sleep $((2 ** intento))
done
exit 1
