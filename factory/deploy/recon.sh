#!/usr/bin/env bash
# Reconocimiento de SOLO LECTURA del servidor: no instala, no cambia ni borra nada.
# Imprime un informe del estado actual para planificar un despliegue sin conflictos.
set -u

section() { echo; echo "===== $1 ====="; }

section "SISTEMA"
hostname
(lsb_release -ds || cat /etc/os-release | head -2) 2>/dev/null
uname -r
uptime

section "DISCO"
df -h / /opt /var/lib/docker 2>/dev/null | sort -u

section "MEMORIA"
free -h

section "PUERTOS EN ESCUCHA"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | awk 'NR==1 || /LISTEN/' | head -40

section "DOCKER"
if command -v docker >/dev/null 2>&1; then
  docker --version
  echo "--- contenedores ---"
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null
  echo "--- proyectos compose ---"
  docker compose ls 2>/dev/null
  echo "--- redes ---"
  docker network ls 2>/dev/null
else
  echo "docker: NO instalado"
fi

section "SERVICIOS WEB DEL SISTEMA"
for s in nginx apache2 caddy traefik haproxy cloudflared coolify dokploy; do
  st=$(systemctl is-active "$s" 2>/dev/null || echo n/a)
  echo "$s: $st"
done

section "CARPETAS DE PROYECTOS"
ls -d /opt/*/ /srv/*/ /root/*/ /home/*/ 2>/dev/null | head -25

section "IP PUBLICA"
curl -4 -fsSL --max-time 8 https://ifconfig.me 2>/dev/null || hostname -I

echo
echo "===== FIN DEL INFORME (copia todo esto y pégalo en el chat) ====="
