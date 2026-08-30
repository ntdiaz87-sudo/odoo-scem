#!/usr/bin/env bash
#
# Prueba de humo contra el DESPLIEGUE REAL, no contra localhost.
#
#   bash scripts/smoke.sh trade.enetradex.com
#
# Que la portada devuelva 200 no dice nada: en este patrón lo que se rompe
# sin avisar son los estáticos, y un 404 de estáticos no impide que la
# página cargue "a medias". Por eso aquí se comprueban los dos.

set -uo pipefail

DOMINIO="${1:-${PYXEL_HOST:-}}"
if [[ -z "$DOMINIO" ]]; then
    echo "Uso: bash scripts/smoke.sh <dominio>" >&2
    exit 2
fi

BASE="https://$DOMINIO"
fallos=0

comprobar() {
    local descripcion="$1" url="$2" esperado="${3:-200}"
    local codigo
    codigo=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo "000")
    if [[ "$codigo" == "$esperado" ]]; then
        printf '  OK    %-38s %s\n' "$descripcion" "$codigo"
    else
        printf '  FALLO %-38s %s (esperado %s)\n' "$descripcion" "$codigo" "$esperado"
        fallos=$((fallos + 1))
    fi
}

echo "Prueba de humo contra $BASE"

comprobar "Salud del proceso"       "$BASE/web/health"
comprobar "Salud con PostgreSQL"    "$BASE/web/health?db_server_status=1"
comprobar "Página de acceso"        "$BASE/web/login"
comprobar "Gestor de bases cerrado" "$BASE/web/database/manager" 404

# ── Estáticos ───────────────────────────────────────────────
# La URL del paquete de assets lleva un hash que cambia en cada
# despliegue, así que se extrae del HTML en vez de fijarla.
echo "  ...  Extrayendo el paquete de estáticos del HTML"
html=$(curl -sS --max-time 20 "$BASE/web/login" || echo "")
css=$(printf '%s' "$html" | grep -oE 'href="(/web/assets/[^"]+\.css)"' | head -1 | sed 's/href="//; s/"$//')

if [[ -z "$css" ]]; then
    echo "  FALLO Sin hoja de estilos en el HTML — Odoo no generó los assets"
    fallos=$((fallos + 1))
else
    codigo=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$css" || echo "000")
    tipo=$(curl -sS -o /dev/null -w '%{content_type}' --max-time 20 "$BASE$css" || echo "")
    if [[ "$codigo" == "200" && "$tipo" == *css* ]]; then
        printf '  OK    %-38s %s\n' "Hoja de estilos" "$codigo"
    else
        printf '  FALLO %-38s %s (%s)\n' "Hoja de estilos" "$codigo" "$tipo"
        fallos=$((fallos + 1))
    fi
fi

# ── Websocket ───────────────────────────────────────────────
# El bus de Odoo vive en el puerto gevent, no en el de web. Si Caddy no
# separa la ruta /websocket, las notificaciones en vivo no funcionan y
# nada más lo delata.
codigo=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
    -H "Connection: Upgrade" -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: eHl6enkxMjM0NTY3OA==" \
    "$BASE/websocket" || echo "000")
case "$codigo" in
    101) printf '  OK    %-38s %s\n' "Websocket" "$codigo (sube)" ;;
    200) printf '  FALLO %-38s %s\n' "Websocket" "$codigo — Caddy no enruta /websocket al 8311"
         fallos=$((fallos + 1)) ;;
    404) printf '  FALLO %-38s %s\n' "Websocket" "$codigo — el proceso de websocket no está levantado"
         fallos=$((fallos + 1)) ;;
    502) printf '  FALLO %-38s %s\n' "Websocket" "$codigo — Caddy enruta, pero nadie escucha en 8311"
         fallos=$((fallos + 1)) ;;
    *)   printf '  AVISO %-38s %s\n' "Websocket" "$codigo — revisar a mano" ;;
esac

echo
if [[ $fallos -eq 0 ]]; then
    echo "Todo correcto."
else
    echo "$fallos comprobación(es) fallida(s)."
    exit 1
fi
