#!/usr/bin/env bash
#
# PYXEL Cuba Trade OS — primer despliegue en el GEX44.
#
# El GEX44 es COMPARTIDO y tiene proyectos en produccion. Este script esta
# escrito para no poder romperlos: comprueba antes de actuar, aborta a la
# primera senal rara, y lo unico que toca fuera de /opt/pyxel-trade es
# anadir un bloque al final del Caddyfile, con copia previa y validacion.
#
# NUNCA hace: docker system prune, down -v, ufw, reiniciar el servidor,
# tocar un bloque ajeno de Caddy, ni recargar Caddy sin validar antes.

set -euo pipefail

RAIZ=/opt/pyxel-trade
DOMINIO=trade.enetradex.com
IP_ESPERADA=46.4.98.13
PUERTO_WEB=8310
PUERTO_WS=8311
RAMA=claude/pyxel-solutions-platform-j2c87s
REPO=github.com/ntdiaz87-sudo/odoo-scem.git
LOG=/root/pyxel-deploy-$(date +%Y%m%d-%H%M).log

exec > >(tee -a "$LOG") 2>&1
echo "Registro en $LOG"

paso() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
abortar() { printf '\n\033[31mABORTADO: %s\033[0m\n' "$1" >&2; exit 1; }

# ═══ 1. Guardas ══════════════════════════════════════════════════
paso "1/8 · Comprobaciones previas"

ip_real=$(curl -4 -fsS --max-time 10 ifconfig.me || echo "")
[ "$ip_real" = "$IP_ESPERADA" ] || abortar "esto no es el GEX44 (IP $ip_real)"
echo "  servidor correcto ($ip_real)"

# Dos caminos validos: el codigo ya copiado con scp desde el portatil, o
# clonarlo aqui con un token. Cualquier otra cosa en $RAIZ es que alguien
# empezo antes, y eso no se pisa.
if [ -f "$RAIZ/infra/docker-compose.prod.yml" ]; then
    CODIGO_YA_ESTA=1
    echo "  el codigo ya esta en $RAIZ, no se clona"
elif [ -e "$RAIZ" ]; then
    abortar "$RAIZ existe pero no tiene el proyecto dentro; reviselo a mano"
else
    CODIGO_YA_ESTA=0
    echo "  $RAIZ libre"
fi

for p in "$PUERTO_WEB" "$PUERTO_WS"; do
    ss -ltn | grep -q ":$p " && abortar "el puerto $p esta ocupado"
done
echo "  puertos $PUERTO_WEB y $PUERTO_WS libres"

for c in docker git curl openssl; do
    command -v "$c" >/dev/null || abortar "falta $c"
done
command -v envsubst >/dev/null || command -v python3 >/dev/null \
    || abortar "hace falta envsubst o python3"
echo "  dependencias presentes"

# El DNS tiene que estar propagado ANTES de tocar Caddy: si no, el
# certificado falla y ademas queda un bloque muerto en el fichero comun.
dns=$(getent ahostsv4 "$DOMINIO" | awk 'NR==1{print $1}' || echo "")
[ "$dns" = "$IP_ESPERADA" ] || abortar \
    "$DOMINIO resuelve a '${dns:-nada}' y no a $IP_ESPERADA.
   Crea en Cloudflare el registro A '$DOMINIO' -> $IP_ESPERADA, EN GRIS,
   espera a que propague y vuelve a lanzar esto."
echo "  $DOMINIO resuelve correctamente"

# ═══ 2. Codigo ═══════════════════════════════════════════════════
paso "2/8 · Traer el codigo"
if [ "$CODIGO_YA_ESTA" = "1" ]; then
    echo "  omitido: el codigo ya estaba"
else
echo "Pega un token de GitHub con permiso de lectura sobre el repositorio."
echo "(no se ve al escribir, y no queda guardado en ningun sitio)"
read -rsp "Token: " TOKEN; echo
[ -n "$TOKEN" ] || abortar "token vacio"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git clone --depth 1 --branch "$RAMA" \
    "https://x-access-token:${TOKEN}@${REPO}" "$TMP/repo" --quiet
unset TOKEN
[ -d "$TMP/repo/pyxel-trade" ] || abortar "el repositorio no trae pyxel-trade/"
cp -a "$TMP/repo/pyxel-trade" "$RAIZ"
echo "  codigo en $RAIZ"
fi
# Nota: en este primer despliegue $RAIZ NO es un repositorio git. El
# despliegue automatico llega cuando el proyecto viva en Gitea; entonces
# se reclona ahi y el workflow ya podra hacer fetch.

# ═══ 3. Secretos ═════════════════════════════════════════════════
paso "3/8 · Entorno"
cd "$RAIZ"
[ -f .env ] && abortar "ya hay un .env; no lo sobrescribo"
cp .env.example .env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|^ODOO_ADMIN_PASSWD=.*|ODOO_ADMIN_PASSWD=$(openssl rand -base64 32)|" .env
sed -i "s|^PYXEL_HOST=.*|PYXEL_HOST=$DOMINIO|" .env
chmod 600 .env
echo "  .env creado con contrasenas generadas (chmod 600)"

bash scripts/render-config.sh

# ═══ 4. Lint ═════════════════════════════════════════════════════
# Antes de tocar la base: si el codigo tiene un fallo conocido, mejor
# saberlo ahora que a mitad de la instalacion de modulos.
paso "4/8 · Comprobaciones del codigo"
bash infra/ci.sh || abortar "el lint fallo; no se sigue"

# ═══ 5. Base de datos ════════════════════════════════════════════
paso "5/8 · PostgreSQL"
set -a; . ./.env; set +a
COMPOSE="docker compose --env-file $RAIZ/.env -f $RAIZ/infra/docker-compose.prod.yml"

$COMPOSE up -d db
echo "  esperando a PostgreSQL..."
for _ in $(seq 1 30); do
    $COMPOSE exec -T db pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1 && break
    sleep 2
done
$COMPOSE exec -T db pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1 \
    || abortar "PostgreSQL no arranco"
echo "  PostgreSQL listo"

# ═══ 6. Modulos ══════════════════════════════════════════════════
paso "6/8 · Instalar Odoo y los modulos"
echo "  ES LA PRIMERA VEZ QUE ESTOS MODULOS CORREN EN UN ODOO 19 REAL."
echo "  Si falla, el traceback completo queda en $LOG."
$COMPOSE run --rm odoo odoo -d "$ODOO_DB" \
    -i base,pyxel_trade_core,pyxel_trade_marketplace,pyxel_trade_supplier,pyxel_trade_container \
    --stop-after-init || abortar "la instalacion de modulos fallo; mira $LOG"
$COMPOSE up -d
echo "  stack en marcha"

# ═══ 7. Caddy ════════════════════════════════════════════════════
paso "7/8 · Caddy del host"
SELLO=$(date +%Y%m%d-%H%M%S)
cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$SELLO"
echo "  copia en /etc/caddy/Caddyfile.bak.$SELLO"

if grep -q "^$DOMINIO" /etc/caddy/Caddyfile; then
    echo "  el bloque ya existe, no se duplica"
else
    cat "$RAIZ/infra/caddy-site.conf" >> /etc/caddy/Caddyfile
    echo "  bloque anadido"
fi

if caddy validate --config /etc/caddy/Caddyfile; then
    systemctl reload caddy
    echo "  Caddy recargado"
else
    cp "/etc/caddy/Caddyfile.bak.$SELLO" /etc/caddy/Caddyfile
    abortar "el Caddyfile no valida. Restaurada la copia y NO se recargo:
   los demas proyectos siguen sirviendose con la configuracion buena."
fi

# ═══ 8. Verificacion ═════════════════════════════════════════════
paso "8/8 · Verificacion"
echo "  esperando a que Odoo genere los assets..."
for _ in $(seq 1 45); do
    cod=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMINIO/web/health" || true)
    [ "$cod" = "200" ] && break
    sleep 4
done
if [ "${cod:-000}" != "200" ]; then
    echo "  /web/health devolvio ${cod:-000}. Registros:"
    $COMPOSE logs --tail 60 odoo || true
    abortar "Odoo no responde; mira $LOG"
fi
echo "  Odoo responde"

bash scripts/smoke.sh "$DOMINIO" || true
echo
echo "  Nada de este stack debe escuchar fuera de loopback:"
ss -ltn | grep -v 127.0.0.1 | grep -E ':83[0-9][0-9] ' && \
    echo "  AVISO: hay algo en 0.0.0.0" || echo "  correcto, vacio"

paso "Peso de la pagina"
bash scripts/measure.sh "https://$DOMINIO/market" || true

printf '\n\033[32mListo: https://%s/market\033[0m\n' "$DOMINIO"
echo "Registro completo en $LOG"
echo
echo "Pendiente, y no se hace solo:"
echo "  - Poner web.base.url a https://$DOMINIO en Ajustes > Tecnico"
echo "  - ln -s $RAIZ/scripts/backup.sh /opt/backup_pyxel_trade.sh  y su cron"
echo "  - Mover el proyecto a Gitea para tener despliegue automatico"
