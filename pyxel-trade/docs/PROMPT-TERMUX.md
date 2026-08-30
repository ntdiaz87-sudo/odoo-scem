# Despliegue desde Termux — bloques para copiar y pegar

> Pensado para ejecutarse desde el móvil. Cada bloque se pega entero de una
> vez: en un teclado de teléfono, escribir comando a comando es la principal
> fuente de erratas.

**Regla de oro: haz la FASE 1 y mándame la salida antes de tocar nada más.**
No sigo sin saber si los puertos 8310 y 8311 están libres.

---

## FASE 0 · Preparar Termux

```bash
pkg update -y && pkg install -y openssh tmux
termux-wake-lock
```

`termux-wake-lock` es lo más importante de este bloque. Sin él, Android
duerme el proceso al apagarse la pantalla y **te corta la sesión SSH a
mitad de la instalación de módulos**, dejando la base de datos a medias.

Comprueba que el acceso funciona:

```bash
ssh gex44 'hostname; uptime'
```

Si no reconoce `gex44`, falta el alias en `~/.ssh/config` de Termux:

```bash
mkdir -p ~/.ssh && cat >> ~/.ssh/config <<'EOF'
Host gex44
    HostName 46.4.98.13
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 30
    ServerAliveCountMax 6
EOF
chmod 600 ~/.ssh/config
```

`ServerAliveInterval` mantiene viva la conexión cuando la red móvil se pone
tonta, que es lo normal.

---

## FASE 1 · Reconocimiento — solo lectura, no cambia nada

Un solo bloque. Va todo en línea para no tener que transferir ficheros al
servidor.

```bash
ssh gex44 'bash -s' <<'EOF' 2>&1 | tee ~/pyxel-recon.txt
echo "=== Identidad ==="; hostname; curl -4 -fsS --max-time 10 ifconfig.me; echo
echo; echo "=== Docker ==="; docker --version
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
echo; echo "=== Caddy ==="; systemctl is-active caddy
grep -E '^[a-z0-9*.-]+\.[a-z]+ \{' /etc/caddy/Caddyfile 2>/dev/null
echo; echo "=== Puertos en escucha ==="; ss -ltnp 2>/dev/null | awk 'NR==1 || /LISTEN/'
echo; echo "=== Puertos que necesita PYXEL ==="
for p in 8310 8311; do
  if ss -ltn 2>/dev/null | grep -q ":$p "; then echo "  $p OCUPADO"; else echo "  $p libre"; fi
done
echo; echo "=== Dependencias ==="
for c in docker envsubst python3 git curl tmux; do
  command -v "$c" >/dev/null 2>&1 && echo "  $c presente" || echo "  $c AUSENTE"
done
echo; echo "=== ¿Existe ya el proyecto? ==="
[ -e /opt/pyxel-trade ] && echo "  /opt/pyxel-trade YA EXISTE - PARAR" || echo "  no existe: camino libre"
echo; echo "=== Recursos ==="; df -h / | tail -1; free -h | awk 'NR<=2'
echo; echo "=== /opt ==="; ls -1 /opt
EOF
```

Para mandarme el resultado:

```bash
termux-clipboard-set < ~/pyxel-recon.txt
```

Y pegas en el chat. Si `termux-clipboard-set` no existe, instala el paquete
`termux-api` y la app **Termux:API**; o simplemente `cat ~/pyxel-recon.txt`
y copia de pantalla.

**Para aquí. Mándamelo.** Si 8310 u 8311 salen ocupados hay que cambiar la
configuración antes de desplegar, y si `/opt/pyxel-trade` ya existe es que
alguien empezó antes y no quiero pisarlo.

---

## FASE 2 · Traer el código al servidor

Sólo cuando la fase 1 salga limpia.

El repositorio de trabajo está en GitHub, privado, y sólo hace falta la
carpeta `pyxel-trade/`. Con un token de acceso personal de GitHub con
permiso de lectura sobre `ntdiaz87-sudo/odoo-scem`:

```bash
ssh gex44 'bash -s' <<'EOF'
set -euo pipefail
read -rsp "Token de GitHub: " TOKEN; echo
git clone --depth 1 -b claude/pyxel-solutions-platform-j2c87s \
    "https://x-access-token:${TOKEN}@github.com/ntdiaz87-sudo/odoo-scem.git" /tmp/scem
mv /tmp/scem/pyxel-trade /opt/pyxel-trade
rm -rf /tmp/scem
ls -1 /opt/pyxel-trade
EOF
```

Esto es para arrancar. **El camino definitivo es Gitea**, porque el
despliegue automático depende de él: crear `nilo/pyxel-trade` privado con
rama `develop`, poner ahí el contenido y darle su deploy key de solo
lectura. Eso se hace mejor desde un ordenador; el README lo explica.

---

## FASE 3 · Desplegar, dentro de tmux

**Esta es la parte que no se puede hacer sin tmux desde un móvil.** El tmux
corre **en el servidor**: si el teléfono pierde cobertura o se bloquea, la
instalación sigue sola y vuelves a entrar donde estabas.

```bash
ssh -t gex44 'tmux new -A -s pyxel'
```

Si te desconectas, ese mismo comando te devuelve a la sesión.

Ya dentro de tmux, primero los secretos:

```bash
cd /opt/pyxel-trade
cp .env.example .env && chmod 600 .env
openssl rand -base64 32   # para DB_PASSWORD
openssl rand -base64 32   # para ODOO_ADMIN_PASSWD
nano .env
```

En `nano`: guardar es `Ctrl+O`, `Enter`, y salir `Ctrl+X`. En Termux, la
tecla `Ctrl` está en la fila extra del teclado.

**Antes de arrancar, el DNS.** En Cloudflare, zona `enetradex.com`: registro
`A`, nombre `trade`, contenido `46.4.98.13`, **nube GRIS**. En naranja,
Caddy no consigue certificado. Comprueba desde Termux:

```bash
dig +short trade.enetradex.com
```

Tiene que responder `46.4.98.13`. Si no responde nada, espera y repite.

Ahora el despliegue. Todo queda en un registro, porque el desplazamiento
hacia atrás en un móvil es inservible:

```bash
cd /opt/pyxel-trade
LOG=/opt/pyxel-trade/deploy-$(date +%Y%m%d-%H%M).log
{
  set -x
  bash scripts/render-config.sh
  cd infra
  compose="docker compose --env-file ../.env -f docker-compose.prod.yml"
  $compose up -d db
  sleep 15
  $compose run --rm odoo odoo -d pyxel_trade \
      -i base,pyxel_trade_core,pyxel_trade_marketplace --stop-after-init
  $compose up -d
} 2>&1 | tee "$LOG"
echo "Registro en $LOG"
```

**Espera errores.** Es la primera vez que estos módulos corren en un Odoo 19
real. No intentes arreglarlos: el registro completo es lo que necesito.

Y Caddy, con copia y validación antes de recargar:

```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d-%H%M)
cat /opt/pyxel-trade/infra/caddy-site.conf >> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```

Si `caddy validate` falla, **no recargues**: restaura la copia. Mientras no
se recargue, los demás proyectos siguen sirviéndose con la configuración
buena.

---

## FASE 4 · Verificar y mandarme la salida

```bash
cd /opt/pyxel-trade
bash scripts/smoke.sh trade.enetradex.com  2>&1 | tee -a "$LOG"
bash scripts/measure.sh https://trade.enetradex.com/market 2>&1 | tee -a "$LOG"
```

`measure.sh` es el que decide si el frontend puede quedarse dentro de Odoo o
hay que sacarlo a un cliente propio. Es el número que me falta.

Para sacar el registro del servidor al móvil y mandármelo:

```bash
# salir de tmux sin cerrarlo: Ctrl+B y luego D
scp gex44:/opt/pyxel-trade/deploy-*.log ~/
termux-clipboard-set < ~/deploy-*.log
```

Si el registro es muy largo para el portapapeles, mándame primero esto:

```bash
grep -iE 'error|traceback|critical|warning' ~/deploy-*.log | head -60
```

---

## Marcha atrás

Si algo sale mal y hay que dejar el servidor como estaba:

```bash
cd /opt/pyxel-trade/infra
docker compose --env-file ../.env -f docker-compose.prod.yml down
cp /etc/caddy/Caddyfile.bak.<sello> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```

**`down` sin `-v`.** Con `-v` se borran los volúmenes y con ellos la base de
datos. Y nunca `docker system prune`: se llevaría por delante volúmenes de
Qbaprotic y de la fábrica de tiendas.

---

## Resumen de lo que espero de vuelta

1. Salida de la fase 1 — **esto primero y solo esto**
2. El registro del despliegue, con los tracebacks enteros
3. Salida de `smoke.sh`
4. Tabla de `measure.sh`
