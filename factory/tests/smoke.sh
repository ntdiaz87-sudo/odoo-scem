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
echo "$B" | grep -q "Probar demo gratis" && ok "Landing: CTA de demo" || bad "Landing: falta CTA de demo"
echo "$B" | grep -q "se parece a otra" && ok "Landing: sección diseños únicos" || bad "Landing: falta sección diseños únicos"
echo "$B" | grep -q "Planes según tu modelo" && ok "Landing: sección de planes" || bad "Landing: falta sección de planes"
[ "$(code "$BASE/demo")" = 200 ] && ok "Wizard /demo responde" || bad "Wizard /demo no responde"

for T in verdealto nocta; do
  [ "$(code "$PROTO://$T.$HOSTPART/")" = 200 ] && ok "Tienda $T responde" || bad "Tienda $T no responde"
done
body "$PROTO://verdealto.$HOSTPART/" | grep -q "Monstera deliciosa" && ok "Verdealto: catálogo propio" || bad "Verdealto: catálogo no aparece"
body "$PROTO://nocta.$HOSTPART/" | grep -q "Camisa oversize" && ok "NOCTA: catálogo propio" || bad "NOCTA: catálogo no aparece"

# tls-check: candados solo para tiendas reales
[ "$(code "$BASE/api/tls-check?domain=${HOSTPART%%:*}")" = 200 ] && ok "tls-check: dominio raíz autorizado" || bad "tls-check raíz"
[ "$(code "$BASE/api/tls-check?domain=verdealto.${HOSTPART%%:*}")" = 200 ] && ok "tls-check: tienda real autorizada" || bad "tls-check tienda real"
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
