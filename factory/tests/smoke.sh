#!/usr/bin/env bash
# Prueba de humo de la fábrica contra un despliegue real (solo curl, corre en
# cualquier máquina, incluido el propio servidor).
#   Producción:  bash tests/smoke.sh https://fabrica.enetradex.com
#   Local:       bash tests/smoke.sh http://localhost:8300 local
# Crea UNA tienda sandbox de prueba (prueba-humo-*); se puede borrar después
# desde el panel (canal + productos).
set -u
BASE=${1:?Uso: smoke.sh <URL base> [local]}
MODE=${2:-prod}
HOSTPART=${BASE#*://}
PROTO=${BASE%%://*}
PASS=0; FAIL=0
ok()   { echo "✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "❌ $1"; FAIL=$((FAIL+1)); }
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 40 "$1" 2>/dev/null; }
body() { curl -s --max-time 40 "$1" 2>/dev/null; }

[ "$(code "$BASE/")" = 200 ] && ok "Landing responde 200" || bad "Landing no responde"
B=$(body "$BASE/")
echo "$B" | grep -q "从这里开始\|empieza aqu" && ok "Landing: titular principal" || bad "Landing: falta el titular principal"
echo "$B" | grep -q "LUMINA" && ok "Landing: galería de plantillas" || bad "Landing: falta la galería de plantillas"
echo "$B" | grep -q "199" && ok "Landing: sección de planes" || bad "Landing: falta sección de planes"
[ "$(code "$BASE/demo")" = 200 ] && ok "Asistente /demo responde" || bad "Asistente /demo no responde"
[ "$(code "$BASE/templates/lumina")" = 200 ] && ok "Previsualización de plantilla responde" || bad "Previsualización no responde"

# --- ESTÁTICOS DEL DESPLIEGUE ---
# La salida "standalone" de Next NO incluye public/: hay que copiarlo aparte en
# el Dockerfile. Si esa línea falta, el sitio arranca igual y todo parece bien
# desde el servidor, pero al visitante le faltan TODAS las imágenes, las
# tipografías y el service worker. Esto es lo que lo caza.
[ "$(code "$BASE/img/lumina-hero.jpg")" = 200 ] && ok "Estáticos: imágenes de plantilla" || bad "Estáticos: FALTAN las imágenes (¿public/ en el Dockerfile?)"
[ "$(code "$BASE/img/agente-xiaomei.png")" = 200 ] && ok "Estáticos: avatares del equipo de IA" || bad "Estáticos: faltan los avatares"
[ "$(code "$BASE/fuentes/inter-latin.woff2")" = 200 ] && ok "Estáticos: tipografías propias" || bad "Estáticos: faltan las tipografías"
[ "$(code "$BASE/sw.js")" = 200 ] && ok "Estáticos: service worker de las tiendas" || bad "Estáticos: falta el service worker"
[ "$(code "$BASE/_next/image?url=%2Fimg%2Flumina-hero.jpg&w=1080&q=75")" = 200 ] && ok "Optimizador de imágenes activo" || bad "Optimizador de imágenes caído (¿sharp?)"

for T in qingzhu noctachina; do
  [ "$(code "$PROTO://$T.$HOSTPART/")" = 200 ] && ok "Tienda $T responde" || bad "Tienda $T no responde"
done
body "$PROTO://qingzhu.$HOSTPART/" | grep -q "龟背竹" && ok "青竹家居: catálogo propio" || bad "青竹家居: catálogo no aparece"
body "$PROTO://noctachina.$HOSTPART/" | grep -q "黑色宽版衬衫" && ok "NOCTA 夜行: catálogo propio" || bad "NOCTA 夜行: catálogo no aparece"

# tls-check: candados solo para tiendas reales
[ "$(code "$BASE/api/tls-check?domain=${HOSTPART%%:*}")" = 200 ] && ok "tls-check: dominio raíz autorizado" || bad "tls-check raíz"
[ "$(code "$BASE/api/tls-check?domain=qingzhu.${HOSTPART%%:*}")" = 200 ] && ok "tls-check: tienda real autorizada" || bad "tls-check tienda real"
[ "$(code "$BASE/api/tls-check?domain=fantasma-xyz.${HOSTPART%%:*}")" = 404 ] && ok "tls-check: subdominio inventado rechazado" || bad "tls-check inventado"

# Subdominio inexistente: en prod el TLS se niega (000, correcto); en HTTP local, página de aviso
GC=$(code "$PROTO://tienda-fantasma-xyz.$HOSTPART/")
if [ "$GC" = 000 ] || body "$PROTO://tienda-fantasma-xyz.$HOSTPART/" | grep -q "Tienda no encontrada"; then
  ok "Subdominio inexistente manejado ($GC)"
else
  bad "Subdominio inexistente devolvió $GC"
fi

# Crear tienda demo end-to-end
NOMBRE="prueba-humo-$RANDOM"
R=$(curl -s --max-time 60 -X POST "$BASE/api/demo" -H 'content-type: application/json' \
  -d "{\"storeName\":\"$NOMBRE\",\"designKey\":\"nocta\",\"ownerEmail\":\"$NOMBRE@humo.local\",\"ownerPassword\":\"humo-clave-123\"}")
URL=$(echo "$R" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
if [ -n "$URL" ]; then
  ok "Demo: tienda creada ($URL)"
  body "$URL/" | grep -q "Tienda demo creada en la fábrica" && ok "Demo: tienda navegable con banner sandbox" || bad "Demo: la tienda creada no carga"
else
  bad "Demo: no se pudo crear tienda ($R)"
fi
# Fase 3: el carrito funciona en la tienda recién creada (rewrite /shop-api + stock)
if [ -n "$URL" ]; then
  SLUGHOST=${URL#*://}; SLUG=${SLUGHOST%%.*}
  VID=$(curl -s --max-time 40 -X POST "$BASE/shop-api" -H 'content-type: application/json' \
    -H "vendure-token: $SLUG" -d '{"query":"{ products { items { variants { id } } } }"}' \
    | grep -o '"id":"[0-9]*"' | head -1 | grep -o '[0-9]*')
  ADD=$(curl -s --max-time 40 -X POST "$BASE/shop-api" -H 'content-type: application/json' \
    -H "vendure-token: $SLUG" \
    -d "{\"query\":\"mutation { addItemToOrder(productVariantId: $VID, quantity: 1) { __typename ... on ErrorResult { message } } }\"}")
  echo "$ADD" | grep -q '"__typename":"Order"' && ok "Fase 3: añadir al carrito funciona" || bad "Fase 3: carrito falló ($ADD)"
fi
# Duplicado: debe crear con sufijo, no fallar
R2=$(curl -s --max-time 60 -X POST "$BASE/api/demo" -H 'content-type: application/json' \
  -d "{\"storeName\":\"$NOMBRE\",\"designKey\":\"hoja-viva\",\"ownerEmail\":\"$NOMBRE-2@humo.local\",\"ownerPassword\":\"humo-clave-123\"}")
echo "$R2" | grep -q '"url"' && ok "Demo: nombre duplicado reintenta con sufijo" || bad "Demo duplicado falló ($R2)"

if [ "$MODE" != "local" ]; then
  [ "$(code "$BASE/dashboard/")" = 200 ] && ok "Panel /dashboard servido" || bad "Panel /dashboard no responde"
fi

echo "----------------------------------------"
echo "$PASS pasaron · $FAIL fallaron"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
