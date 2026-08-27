#!/usr/bin/env bash
# Fábrica de tiendas — despliegue del AMBIENTE DE PRUEBAS en un servidor limpio
# (Ubuntu/Debian con acceso root). Uso:
#   curl -fsSL https://raw.githubusercontent.com/ntdiaz87-sudo/odoo-scem/claude/online-store-factory-9cnbb7/factory/deploy/bootstrap-test.sh | bash
# Idempotente: se puede volver a ejecutar para actualizar a la última versión.
set -euo pipefail

REPO=https://github.com/ntdiaz87-sudo/odoo-scem.git
BRANCH=claude/online-store-factory-9cnbb7
DIR=/opt/fabrica

echo "== [1/4] Docker =="
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
if ! command -v git >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y git
fi

echo "== [2/4] Código (rama $BRANCH) =="
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$DIR"
fi

echo "== [3/4] Configuración =="
SERVER_IP=$(curl -4 -fsSL https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
cd "$DIR/factory"
ENVFILE=.env.test
if [ ! -f "$ENVFILE" ]; then
  cat > "$ENVFILE" <<EOF
SERVER_IP=$SERVER_IP
SUPERADMIN_PASSWORD=$(tr -dc a-z0-9 </dev/urandom | head -c 16)
COOKIE_SECRET=$(tr -dc a-zA-Z0-9 </dev/urandom | head -c 32)
EOF
else
  # Mantiene la clave existente pero refresca la IP por si cambió.
  sed -i "s/^SERVER_IP=.*/SERVER_IP=$SERVER_IP/" "$ENVFILE"
fi

echo "== [4/4] Arranque (la primera vez compila las imágenes: 5–10 min) =="
docker compose -f docker-compose.yml -f docker-compose.test.yml \
  --env-file "$ENVFILE" up -d --build

SUPERADMIN_PASSWORD=$(grep '^SUPERADMIN_PASSWORD=' "$ENVFILE" | cut -d= -f2)
cat <<EOF

==========================================================
  Fábrica de tiendas — ambiente de PRUEBAS levantado
----------------------------------------------------------
  Web pública:    http://$SERVER_IP.nip.io
  Tienda demo 1:  http://verdealto.$SERVER_IP.nip.io
  Tienda demo 2:  http://nocta.$SERVER_IP.nip.io
  Panel admin:    http://$SERVER_IP.nip.io:8301/dashboard
    usuario: superadmin
    clave:   $SUPERADMIN_PASSWORD
----------------------------------------------------------
  La clave queda guardada en $DIR/factory/$ENVFILE
  Ambiente de pruebas sin HTTPS: no usar datos reales.
==========================================================
EOF
