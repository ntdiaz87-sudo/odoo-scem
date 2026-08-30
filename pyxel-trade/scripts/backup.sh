#!/usr/bin/env bash
#
# Copia de la base y del filestore de PYXEL Trade.
#
# Convención de la casa: los backups del GEX44 viven como /opt/backup_*.sh.
# Enlazar tras el primer despliegue:
#   ln -s /opt/pyxel-trade/scripts/backup.sh /opt/backup_pyxel_trade.sh
#   crontab -e
#   15 3 * * * /opt/backup_pyxel_trade.sh >> /var/log/backup_pyxel_trade.log 2>&1
#
# Sin el filestore, un volcado SQL restaura una plataforma sin imágenes de
# producto ni documentos de acreditación.

set -euo pipefail

RAIZ=/opt/pyxel-trade
cd "$RAIZ"
set -a; . ./.env; set +a

DESTINO="$RAIZ/backups"
RETENCION_DIAS=14
SELLO=$(date +%Y%m%d-%H%M%S)
COMPOSE="docker compose --env-file $RAIZ/.env -f $RAIZ/infra/docker-compose.prod.yml"

mkdir -p "$DESTINO"

echo "[$(date -Is)] Volcando $ODOO_DB"
$COMPOSE exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$ODOO_DB" \
    > "$DESTINO/${ODOO_DB}-${SELLO}.dump"

echo "[$(date -Is)] Empaquetando el filestore"
$COMPOSE exec -T odoo tar czf - -C /var/lib/odoo . \
    > "$DESTINO/filestore-${SELLO}.tar.gz"

echo "[$(date -Is)] Purgando copias de más de $RETENCION_DIAS días"
find "$DESTINO" -name '*.dump'   -mtime +$RETENCION_DIAS -delete
find "$DESTINO" -name '*.tar.gz' -mtime +$RETENCION_DIAS -delete

echo "[$(date -Is)] Estado:"
ls -1sh "$DESTINO" | tail -n +2 | sed 's/^/    /'

# Pendiente: replicar $DESTINO fuera del GEX44 (Storage Box de Hetzner por
# rsync, u otro destino). Una copia que sólo vive en la máquina que protege
# no es una copia de seguridad.
