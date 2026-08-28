#!/usr/bin/env bash
# Despliegue (idempotente) del AMBIENTE DE PRUEBAS de la fábrica.
# Se ejecuta desde el propio árbol del proyecto: manualmente o desde el CI de
# Gitea en cada push a develop. No instala Docker ni clona nada (eso lo hace
# bootstrap-test.sh la primera vez).
set -euo pipefail

# Raíz del proyecto fábrica = carpeta que contiene docker-compose.yml,
# tanto si el repo es el monorepo (factory/) como el repo dedicado de Gitea.
cd "$(dirname "$0")/.."

SERVER_IP=$(curl -4 -fsSL --max-time 10 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
ENVFILE=.env.test
if [ ! -f "$ENVFILE" ]; then
  cat > "$ENVFILE" <<EOF
SERVER_IP=$SERVER_IP
# Dominio raíz de la fábrica en test. Por defecto la IP vía nip.io; se puede
# cambiar a un subdominio propio (p. ej. testfabrica.dyxelsolutions.com) con
# deploy/set-domain.sh una vez creado el DNS.
FACTORY_HOST=$SERVER_IP.nip.io
SUPERADMIN_PASSWORD=$(tr -dc a-z0-9 </dev/urandom | head -c 16)
COOKIE_SECRET=$(tr -dc a-zA-Z0-9 </dev/urandom | head -c 32)
EOF
else
  # Mantiene claves y dominio, pero refresca la IP por si cambió.
  sed -i "s/^SERVER_IP=.*/SERVER_IP=$SERVER_IP/" "$ENVFILE"
  grep -q '^FACTORY_HOST=' "$ENVFILE" || echo "FACTORY_HOST=$SERVER_IP.nip.io" >> "$ENVFILE"
fi

echo "== Arranque de contenedores (la primera vez compila: 5–10 min) =="
docker compose -f docker-compose.yml -f docker-compose.test.yml \
  --env-file "$ENVFILE" up -d --build

echo "== Firewall =="
# GEX44 tiene UFW activo con solo 22/80/443. La web de pruebas es pública a
# propósito: se declaran 8300 (web) y 8301 (panel). Nota: los puertos
# publicados por Docker se saltan UFW (regla NAT propia), pero se declaran
# igualmente para que el firewall refleje la realidad.
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 8300/tcp >/dev/null && echo "ufw: abierto 8300/tcp (web fábrica)"
  ufw allow 8301/tcp >/dev/null && echo "ufw: abierto 8301/tcp (panel Vendure)"
else
  echo "ufw: no activo o sin permisos; sin cambios"
fi

SUPERADMIN_PASSWORD=$(grep '^SUPERADMIN_PASSWORD=' "$ENVFILE" | cut -d= -f2)
FACTORY_HOST=$(grep '^FACTORY_HOST=' "$ENVFILE" | cut -d= -f2)
cat <<EOF

==========================================================
  Fábrica de tiendas — ambiente de PRUEBAS desplegado
----------------------------------------------------------
  Web pública:    http://$FACTORY_HOST:8300
  Tienda demo 1:  http://verdealto.$FACTORY_HOST:8300
  Tienda demo 2:  http://nocta.$FACTORY_HOST:8300
  Panel admin:    http://$FACTORY_HOST:8301/dashboard
    usuario: superadmin
    clave:   $SUPERADMIN_PASSWORD
----------------------------------------------------------
  La clave queda guardada en $(pwd)/$ENVFILE
  Ambiente de pruebas sin HTTPS: no usar datos reales.
==========================================================
EOF
