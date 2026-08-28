#!/usr/bin/env bash
# Cambia el dominio raíz del ambiente de pruebas y redespliega.
# Uso: bash deploy/set-domain.sh testfabrica.dyxelsolutions.com
# Requiere que el DNS ya exista: A <host> -> IP del servidor y
# A *.<host> -> IP del servidor (en Cloudflare, modo "solo DNS").
set -euo pipefail

HOST=${1:-}
if [ -z "$HOST" ]; then
  echo "Uso: $0 <dominio>   (p. ej. $0 testfabrica.dyxelsolutions.com)"
  exit 1
fi

cd "$(dirname "$0")/.."
ENVFILE=.env.test
if [ ! -f "$ENVFILE" ]; then
  echo "No existe $ENVFILE: ejecuta primero deploy/apply-test.sh"
  exit 1
fi

sed -i "s/^FACTORY_HOST=.*/FACTORY_HOST=$HOST/" "$ENVFILE"
echo "Dominio raíz cambiado a: $HOST — redesplegando..."
bash deploy/apply-test.sh
