#!/usr/bin/env bash
#
# Mide lo que pesa una página EN LA RED, que es lo que paga el usuario.
#
#   bash scripts/measure.sh https://trade.enetradex.com/market
#
# En Cuba el giga del paquete adicional cuesta 1.120 CUP frente a los 60
# CUP/GB del plan base: 18,7 veces más. Por eso el peso del cliente es un
# requisito, no una optimización, y por eso se mide.
#
# Se piden los recursos con Accept-Encoding para contar bytes comprimidos
# tal y como viajan, no el tamaño ya descomprimido.

set -uo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
    echo "Uso: bash scripts/measure.sh <url>" >&2
    exit 2
fi

BASE=$(printf '%s' "$URL" | sed -E 's#(https?://[^/]+).*#\1#')
CABECERAS=(-H 'Accept-Encoding: gzip, deflate, br' -H 'User-Agent: Mozilla/5.0')

bytes() {
    curl -sS "${CABECERAS[@]}" -o /dev/null -w '%{size_download}' --max-time 30 "$1" 2>/dev/null || echo 0
}

humano() {
    awk -v b="$1" 'BEGIN {
        if (b >= 1048576) printf "%.2f MB", b/1048576;
        else if (b >= 1024) printf "%.1f KB", b/1024;
        else printf "%d B", b;
    }'
}

echo "Midiendo $URL"
echo

html_bytes=$(bytes "$URL")
html=$(curl -sS "${CABECERAS[@]}" --compressed --max-time 30 "$URL" 2>/dev/null)

# Recursos referenciados desde el HTML. Se normalizan a URL absoluta.
recursos=$(printf '%s' "$html" \
    | grep -oE '(href|src)="(/[^"]+\.(css|js)(\?[^"]*)?)"' \
    | sed -E 's/^(href|src)="//; s/"$//' \
    | sort -u)

css_total=0; js_total=0; n_css=0; n_js=0

printf '%-72s %10s\n' "RECURSO" "EN RED"
printf '%-72s %10s\n' "$(printf '%.0s-' {1..72})" "----------"
printf '%-72s %10s\n' "(documento HTML)" "$(humano "$html_bytes")"

while IFS= read -r ruta; do
    [[ -z "$ruta" ]] && continue
    b=$(bytes "${BASE}${ruta}")
    corta="$ruta"
    [[ ${#corta} -gt 70 ]] && corta="...${corta: -67}"
    printf '%-72s %10s\n' "$corta" "$(humano "$b")"
    if [[ "$ruta" == *.css* ]]; then
        css_total=$((css_total + b)); n_css=$((n_css + 1))
    else
        js_total=$((js_total + b)); n_js=$((n_js + 1))
    fi
done <<< "$recursos"

total=$((html_bytes + css_total + js_total))

echo
echo "RESUMEN (sin imágenes; se miden aparte)"
printf '  HTML                     %s\n' "$(humano "$html_bytes")"
printf '  CSS   (%2d ficheros)      %s\n' "$n_css" "$(humano "$css_total")"
printf '  JS    (%2d ficheros)      %s\n' "$n_js"  "$(humano "$js_total")"
printf '  ── TOTAL                 %s\n' "$(humano "$total")"

echo
echo "CONTRA EL PRESUPUESTO (docs/02-arquitectura-frontend-movil.md)"
veredicto() {
    local etiqueta="$1" valor="$2" limite="$3"
    if [[ "$valor" -le "$limite" ]]; then
        printf '  CUMPLE   %-28s %s (límite %s)\n' "$etiqueta" "$(humano "$valor")" "$(humano "$limite")"
    else
        printf '  EXCEDE   %-28s %s (límite %s)\n' "$etiqueta" "$(humano "$valor")" "$(humano "$limite")"
    fi
}
veredicto "JS del primer render" "$js_total" $((150 * 1024))
veredicto "Primera visita completa" "$total" $((500 * 1024))

echo
echo "Nota: una segunda visita debería bajar de 50 KB, porque CSS y JS de"
echo "Odoo llevan hash en la URL y se cachean. Vuelve a lanzarlo con el"
echo "navegador para confirmarlo, o revisa las cabeceras Cache-Control."
