#!/usr/bin/env bash
#
# Copia de seguridad de la base de datos y del filestore (adjuntos, imágenes
# de producto, documentos de acreditación). Sin el filestore, un volcado SQL
# restaura una plataforma sin ficheros.
#
# Programar a diario:
#   0 3 * * * /opt/pyxel-trade/scripts/backup.sh >> /var/log/pyxel-backup.log 2>&1

set -euo pipefail

cd "$(dirname "$0")/.."
set -a; source .env; set +a

RETENCION_DIAS=14
DESTINO="./backups"
SELLO=$(date +%Y%m%d-%H%M%S)

mkdir -p "$DESTINO"

echo "[$(date -Is)] Volcando la base $ODOO_DB_NAME"
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$ODOO_DB_NAME" \
    > "$DESTINO/${ODOO_DB_NAME}-${SELLO}.dump"

echo "[$(date -Is)] Empaquetando el filestore"
docker compose exec -T odoo tar czf - -C /var/lib/odoo . \
    > "$DESTINO/filestore-${SELLO}.tar.gz"

echo "[$(date -Is)] Eliminando copias de más de $RETENCION_DIAS días"
find "$DESTINO" -name '*.dump'    -mtime +$RETENCION_DIAS -delete
find "$DESTINO" -name '*.tar.gz'  -mtime +$RETENCION_DIAS -delete

echo "[$(date -Is)] Hecho:"
ls -lh "$DESTINO" | tail -n +2 | awk '{print "    " $9 "  " $5}'

# Recomendación: replicar ./backups fuera del servidor (Hetzner Storage Box
# vía rsync, u otro destino). Una copia que vive sólo en la máquina que
# protege no es una copia de seguridad.
