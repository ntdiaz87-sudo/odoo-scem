#!/usr/bin/env bash
#
# Reconocimiento de SOLO LECTURA del GEX44. No instala ni cambia nada.
# Ejecutar antes de cualquier despliegue: el mapa de puertos del runbook
# se verificó el 2026-08-28 y el servidor es compartido.
#
#   ssh gex44 'bash -s' < scripts/recon.sh

set -uo pipefail

echo "=== Identidad ============================================"
hostname
curl -4 -fsS --max-time 10 ifconfig.me 2>/dev/null && echo " (IP pública)"

echo
echo "=== Docker ==============================================="
docker --version 2>/dev/null || echo "docker NO disponible"
echo "--- contenedores en marcha ---"
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null

echo
echo "=== Caddy del host ======================================="
systemctl is-active caddy 2>/dev/null || echo "caddy inactivo o ausente"
echo "--- sitios ya declarados ---"
grep -E '^[a-z0-9*.-]+\.[a-z]+ \{' /etc/caddy/Caddyfile 2>/dev/null || echo "(no legible)"

echo
echo "=== Puertos en escucha ==================================="
echo "Comprobar que el puerto elegido esté libre y que nada nuevo"
echo "escuche en 0.0.0.0."
ss -ltnp 2>/dev/null | awk 'NR==1 || /LISTEN/'

echo
echo "=== Ocupación de /opt ===================================="
ls -1 /opt 2>/dev/null

echo
echo "=== Disco y memoria ======================================"
df -h / | tail -1
free -h | awk 'NR<=2'

echo
echo "=== act_runner ==========================================="
tail -n 5 /opt/act_runner.log 2>/dev/null || echo "(sin log accesible)"
