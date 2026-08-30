#!/usr/bin/env bash
#
# Copia de la base y del filestore de PYXEL Trade.
#
# Convención de la casa: los backups del GEX44 viven como /opt/backup_*.sh,
# escriben en /opt/backups/<proyecto>/ y se replican al MinIO. Enlazar tras
# el primer despliegue:
#   ln -s /opt/pyxel-trade/scripts/backup.sh /opt/backup_pyxel_trade.sh
#   crontab -e
#   15 4 * * * /opt/backup_pyxel_trade.sh >> /opt/backup_pyxel_trade.log 2>&1
#
# Sin el filestore, un volcado SQL restaura una plataforma sin imágenes de
# producto ni documentos de acreditación.
#
# El filestore de este stack vive en un volumen de Docker, no en un bind
# mount: hay que sacarlo por el contenedor, no leyendo una carpeta del host
# como hacen los backups de seric o bussiness32.

# Sin -e a propósito: si falla el volcado de la base, todavía interesa
# intentar el filestore y avisar de las dos cosas a la vez.
set -uo pipefail

RAIZ=/opt/pyxel-trade
cd "$RAIZ"
set -a; . ./.env; set +a

DESTINO=/opt/backups/pyxel_trade
RETENCION_DIAS=14
SELLO=$(date +%Y%m%d_%H%M)
DIR="$DESTINO/pyxel_trade_${SELLO}"
COMPOSE="docker compose --env-file $RAIZ/.env -f $RAIZ/infra/docker-compose.prod.yml"

mkdir -p "$DIR"
FALLOS=""

echo "[$(date -Is)] Volcando $ODOO_DB"
if $COMPOSE exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$ODOO_DB" > "$DIR/postgres.dump" 2>"$DIR/postgres.err"; then
    echo "[$(date -Is)] postgres OK ($(stat -c%s "$DIR/postgres.dump") bytes)"
else
    echo "[$(date -Is)] ERROR: el volcado falló: $(cat "$DIR/postgres.err")"
    FALLOS="$FALLOS postgres"
fi

echo "[$(date -Is)] Empaquetando el filestore"
if $COMPOSE exec -T odoo tar czf - -C /var/lib/odoo . > "$DIR/filestore.tar.gz" 2>"$DIR/filestore.err"; then
    echo "[$(date -Is)] filestore OK ($(stat -c%s "$DIR/filestore.tar.gz") bytes)"
else
    echo "[$(date -Is)] ERROR: el filestore falló: $(cat "$DIR/filestore.err")"
    FALLOS="$FALLOS filestore"
fi
rm -f "$DIR"/*.err

# Un volcado de cero bytes es un fallo silencioso: pg_dump puede salir con
# 0 y no haber escrito nada si el contenedor muere a mitad.
for f in "$DIR/postgres.dump" "$DIR/filestore.tar.gz"; do
    if [ ! -s "$f" ]; then
        echo "[$(date -Is)] ERROR: $(basename "$f") quedó vacío"
        FALLOS="$FALLOS $(basename "$f")_vacio"
    fi
done

echo "[$(date -Is)] Purgando copias de más de $RETENCION_DIAS días"
find "$DESTINO" -maxdepth 1 -type d -name 'pyxel_trade_*' -mtime +$RETENCION_DIAS -exec rm -rf {} \;

# Fuera del GEX44. Una copia que sólo vive en la máquina que protege no es
# una copia de seguridad.
if [ -z "$FALLOS" ]; then
    if ! mc cp -r "$DIR" enetradex/enetradex-prod/backups/pyxel_trade/ > /dev/null 2>&1; then
        echo "[$(date -Is)] ERROR: la copia al MinIO falló"
        FALLOS="$FALLOS minio"
    fi
fi

if [ -n "$FALLOS" ]; then
    echo "[$(date -Is)] Backup de PYXEL Trade TERMINADO CON ERRORES en:$FALLOS"
    /opt/notify_telegram.sh "Backup de PYXEL Trade fallo en:$FALLOS" > /dev/null 2>&1
    exit 1
fi

echo "[$(date -Is)] Backup completo: $(du -sh "$DESTINO" | cut -f1) en total"
