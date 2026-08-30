#!/usr/bin/env bash
#
# Prepara un servidor limpio de Hetzner (Debian 12 / Ubuntu 24.04) y levanta
# PYXEL Cuba Trade OS. Pensado para ejecutarse UNA vez, como root.
#
#   scp -r pyxel-trade root@<IP>:/opt/
#   ssh root@<IP>
#   cd /opt/pyxel-trade
#   cp .env.example .env && nano .env      # rellenar antes de continuar
#   bash scripts/bootstrap-hetzner.sh
#
# El script es idempotente: se puede volver a lanzar sin romper nada.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $EUID -ne 0 ]]; then
    echo "Este script debe ejecutarse como root." >&2
    exit 1
fi

if [[ ! -f .env ]]; then
    echo "Falta el fichero .env. Copia .env.example a .env y rellénalo." >&2
    exit 1
fi

set -a; source .env; set +a

for var in PYXEL_DOMAIN PYXEL_ACME_EMAIL POSTGRES_PASSWORD ODOO_ADMIN_PASSWD ODOO_DB_NAME; do
    if [[ -z "${!var:-}" ]]; then
        echo "La variable $var está vacía en .env." >&2
        exit 1
    fi
done

echo "==> 1/6  Paquetes base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gettext-base ufw fail2ban

echo "==> 2/6  Docker"
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
else
    echo "    Docker ya instalado, se omite."
fi
systemctl enable --now docker

echo "==> 3/6  Cortafuegos (SSH, HTTP, HTTPS)"
ufw allow 22/tcp   >/dev/null
ufw allow 80/tcp   >/dev/null
ufw allow 443/tcp  >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban
echo "    PostgreSQL no se expone: sólo es visible en la red interna de Docker."

echo "==> 4/6  Espacio de intercambio"
# Odoo con varios workers agradece swap si la máquina tiene poca RAM.
if ! swapon --show | grep -q .; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "    Creados 4 GB de swap."
else
    echo "    Ya hay swap activo, se omite."
fi

echo "==> 5/6  Configuración de Odoo"
# La plantilla se renderiza aquí para que los secretos vivan sólo en el
# servidor y nunca en el repositorio.
envsubst < config/odoo.conf.template > config/odoo.conf
chmod 640 config/odoo.conf
echo "    Generado config/odoo.conf"

echo "==> 6/6  Arranque"
echo "    Comprobando que $PYXEL_DOMAIN resuelve a este servidor..."
server_ip=$(curl -fsS --max-time 10 https://ipv4.icanhazip.com || echo "")
domain_ip=$(getent ahostsv4 "$PYXEL_DOMAIN" | awk 'NR==1{print $1}' || echo "")
if [[ -n "$server_ip" && -n "$domain_ip" && "$server_ip" != "$domain_ip" ]]; then
    echo ""
    echo "    AVISO: $PYXEL_DOMAIN apunta a $domain_ip pero este servidor es $server_ip."
    echo "    Caddy no podrá emitir el certificado TLS hasta que el DNS sea correcto."
    echo "    Corrige el registro A y vuelve a lanzar este script."
    exit 1
fi

docker compose up -d db
echo "    Esperando a PostgreSQL..."
until docker compose exec -T db pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do sleep 2; done

# Crear la base sólo si no existe. Con list_db=False no se puede crear desde
# la web, así que se hace aquí, una única vez.
if ! docker compose exec -T db psql -U "$POSTGRES_USER" -lqt | cut -d'|' -f1 | grep -qw "$ODOO_DB_NAME"; then
    echo "    Creando la base $ODOO_DB_NAME e instalando módulos base..."
    docker compose run --rm odoo odoo -d "$ODOO_DB_NAME" -i base --stop-after-init
else
    echo "    La base $ODOO_DB_NAME ya existe, se omite."
fi

docker compose up -d

echo ""
echo "Listo. https://$PYXEL_DOMAIN"
echo "El primer certificado TLS puede tardar un minuto en emitirse."
echo "Registro:  docker compose logs -f odoo"
