# PYXEL Cuba Trade OS — reconocimiento y despliegue en el GEX44

Runbook ejecutable para desplegar **Odoo 19 en Docker** en el Hetzner GEX44,
que es un servidor **compartido con proyectos en producción de terceros**.

Cómo se usa: se ejecuta desde una ventana con acceso `ssh gex44`, parte por
parte, y se devuelve la salida **literal y sin resumir** de las tres partes.

> **Alcance de este documento.** Los scripts, el bloque de Caddy y los pasos
> están escritos desde el patrón ya verificado en este mismo servidor (el
> despliegue de la fábrica de tiendas) y de la forma real de un Odoo de este
> proyecto. Lo que manda sobre cualquier detalle concreto —nombres de módulos,
> contenido exacto del compose y de la plantilla de `odoo.conf`— es el
> **README de `pyxel-trade/`**. Donde este documento y ese README no coincidan,
> gana el README: **para y repórtalo** antes de improvisar.

---

## 0. Lo que puede salir mal

En el GEX44 corren ya, al menos, **Qbaprotic** y la **fábrica de tiendas**. Un
error tumba sitios de terceros. Estas reglas no se negocian:

1. **No instales nada** sin comprobar antes que no está. Docker ya está. Caddy
   ya está, **como servicio del host**, no en contenedor.
2. **No toques ningún bloque ajeno** de `/etc/caddy/Caddyfile`. Solo se **añade**
   un bloque al final.
3. **`caddy validate` SIEMPRE antes de `systemctl reload`.** Un Caddyfile roto
   deja sin servicio a todos los proyectos del servidor.
4. **Ningún puerto en `0.0.0.0`.** El único proceso que ve Internet es Caddy.
   Los contenedores publican en `127.0.0.1`.
5. **No ejecutes `ufw`, `iptables` ni `docker system prune`.** El cortafuegos ya
   está configurado y `prune` borraría volúmenes de otros proyectos.
6. **Si algo no cuadra con lo que dice este documento, para y repórtalo.** No
   improvises sobre un servidor de producción ajeno.

### Contexto

| Cosa | Valor |
|---|---|
| Servidor | Hetzner **GEX44**, `46.4.98.13` |
| Acceso | `ssh gex44` |
| Git privado | Gitea, `https://git.enetradex.com` |
| DNS | Cloudflare, zona `enetradex.com` |
| Proyecto | **PYXEL Cuba Trade OS** — Odoo 19 en Docker |
| Dominio | `trade.enetradex.com` |
| Puertos previstos | **8310** (web) y **8311** (websocket), ambos en loopback |

**Mapa de puertos conocido** (verificado 2026-08-28, **hay que reverificarlo**):
`8250` seric — *expuesto en 0.0.0.0*; `8260` y `8261` la fábrica; `8300`
ocupado.

---

# PARTE 1 — Reconocimiento (solo lectura, obligatoria)

Crea el script y ejecútalo. **No modifica nada.**

```bash
cat > /tmp/recon.sh <<'EOF'
#!/usr/bin/env bash
# Reconocimiento de SOLO LECTURA. No instala, no cambia, no borra.
set -u
section() { echo; echo "===== $1 ====="; }

section "SISTEMA"
hostname
(lsb_release -ds || head -2 /etc/os-release) 2>/dev/null
uname -r
uptime

section "DISCO"
df -h / /opt /var/lib/docker 2>/dev/null | sort -u

section "MEMORIA"
free -h
echo "--- swap ---"
swapon --show 2>/dev/null || echo "sin swap"

section "PUERTOS EN ESCUCHA"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | awk 'NR==1 || /LISTEN/'

section "PUERTOS 8310 y 8311 (los que quiere este proyecto)"
for p in 8310 8311; do
  if ss -ltn 2>/dev/null | grep -q ":$p "; then echo "$p: OCUPADO"; else echo "$p: libre"; fi
done

section "PUERTOS LIBRES POR ENCIMA DE 8300 (por si hay que mudarse)"
for p in $(seq 8301 8399); do
  ss -ltn 2>/dev/null | grep -q ":$p " || printf '%s ' "$p"
done; echo

section "ESCUCHANDO EN 0.0.0.0 (deberia salir SOLO seric en 8250)"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) \
  | grep -E '0\.0\.0\.0|\[::\]' || echo "nada en 0.0.0.0"

section "DOCKER"
if command -v docker >/dev/null 2>&1; then
  docker --version
  echo "--- contenedores ---"
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
  echo "--- proyectos compose ---"
  docker compose ls 2>/dev/null
  echo "--- volumenes (NO tocar los ajenos) ---"
  docker volume ls
else
  echo "docker: NO instalado"
fi

section "CADDY"
echo "activo: $(systemctl is-active caddy 2>/dev/null || echo n/a)"
echo "del host (no contenedor): $(systemctl cat caddy >/dev/null 2>&1 && echo si || echo NO)"
caddy version 2>/dev/null || echo "binario caddy no encontrado en PATH"
echo "--- bloques de sitio ya definidos ---"
grep -nE '^[a-z0-9*.,: -]+\{' /etc/caddy/Caddyfile 2>/dev/null || echo "no se pudo leer el Caddyfile"

section "OTROS SERVICIOS WEB"
for s in nginx apache2 traefik haproxy cloudflared coolify dokploy; do
  echo "$s: $(systemctl is-active "$s" 2>/dev/null || echo n/a)"
done

section "/opt/pyxel-trade — ¿empezo alguien antes?"
if [ -e /opt/pyxel-trade ]; then
  echo "EXISTE. PARAR."
  ls -la /opt/pyxel-trade | head -20
else
  echo "no existe: via libre"
fi

section "CARPETAS DE PROYECTOS"
ls -d /opt/*/ 2>/dev/null

section "IP PUBLICA"
curl -4 -fsSL --max-time 8 https://ifconfig.me 2>/dev/null || hostname -I

echo; echo "===== FIN DEL INFORME ====="
EOF
chmod +x /tmp/recon.sh && bash /tmp/recon.sh 2>&1 | tee /tmp/recon-salida.txt
```

## Responde explícitamente a estas cinco

1. **¿Están libres 8310 y 8311?** Si no, di **dos puertos libres por encima de
   8300** (los da la sección correspondiente) y **no continúes**.
2. **¿Hay algo escuchando en `0.0.0.0`** además del seric conocido en 8250?
3. **¿Está `caddy` activo y es del host?**
4. **¿Cuánto disco libre y cuánta RAM hay?** Odoo 19 con 5 workers más
   PostgreSQL necesita margen y el servidor es compartido.
5. **¿Existe ya `/opt/pyxel-trade`?** Si existe, **para**.

> Si algo de lo anterior falla, **termina aquí y repórtalo**. No pases a la
> parte 2.

**Cifras mínimas para seguir** (si no se cumplen, para y repórtalo):

| Recurso | Mínimo | Por qué |
|---|---|---|
| Disco libre en `/` | ≥ 20 GB | Imagen de Odoo + filestore + base + margen |
| RAM disponible | ≥ 4 GB | 5 workers de Odoo ≈ 2–3 GB, más PostgreSQL, **más lo que ya corre** |
| Swap | conviene | Odoo pica en los picos de instalación de módulos |

---

# PARTE 2 — Despliegue

Ocho pasos. **El README de `pyxel-trade/` es la autoridad**; esto es su
traducción a comandos concretos sobre este servidor.

## Paso 1 — Repositorio en Gitea

En `https://git.enetradex.com`: crear `nilo/pyxel-trade`, **privado**, rama por
defecto **`develop`**.

Desde la laptop (no desde el servidor), con el monorepo clonado:

```bash
git subtree split --prefix=pyxel-trade -b pyxel-trade-solo
git remote add gitea git@git.enetradex.com:nilo/pyxel-trade.git
git push gitea pyxel-trade-solo:develop
```

## Paso 2 — Deploy key de solo lectura

```bash
ssh gex44
ssh-keygen -t ed25519 -f /opt/pyxel-trade_deploy_key -N "" -C "pyxel-trade@gex44"
cat /opt/pyxel-trade_deploy_key.pub
#   → Gitea: repo pyxel-trade → Settings → Deploy Keys → pegar, SIN escritura
```

## Paso 3 — Clonar

```bash
GIT_SSH_COMMAND="ssh -i /opt/pyxel-trade_deploy_key" \
  git clone --branch develop git@git.enetradex.com:nilo/pyxel-trade.git /opt/pyxel-trade
git -C /opt/pyxel-trade config core.sshCommand "ssh -i /opt/pyxel-trade_deploy_key"

# LEE EL README ANTES DE SEGUIR: manda sobre este documento
cat /opt/pyxel-trade/README.md
```

## Paso 4 — DNS en Cloudflare

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `trade` | `46.4.98.13` | 🔘 **GRIS — DNS only** |

> **En naranja, Caddy no consigue certificado.** Es el fallo más repetido de
> este patrón: la nube naranja rompe el desafío HTTP-01.

Comprobar la propagación antes de tocar Caddy:

```bash
dig +short trade.enetradex.com     # debe devolver 46.4.98.13 y nada más
```

## Paso 5 — Secretos

```bash
cd /opt/pyxel-trade
cp .env.example .env
chmod 600 .env

# Dos contraseñas DISTINTAS. No reutilizar entre sí ni con otro proyecto.
echo "DB_PASSWORD=$(openssl rand -base64 32)"        >> .env
echo "ODOO_ADMIN_PASSWD=$(openssl rand -base64 32)"  >> .env

$EDITOR .env   # revisar: dominio, puertos 8310/8311, nombre de la base
grep -vE 'PASSWORD|PASSWD' .env    # ver el resto SIN enseñar los secretos
```

Referencia del `.env` (los nombres exactos, en el `.env.example` del proyecto):

```dotenv
STACK=pyxel-trade
APP_HOST=trade.enetradex.com
DB_NAME=trade
WEB_PORT=8310
WS_PORT=8311
DB_PASSWORD=            # openssl rand -base64 32
ODOO_ADMIN_PASSWD=      # openssl rand -base64 32   (DISTINTA)
WORKERS=5
```

## Paso 6 — Renderizar `config/odoo.conf`

La plantilla lleva los secretos como variables; se sustituyen al vuelo para que
**el fichero con secretos no viva nunca en git**:

```bash
cd /opt/pyxel-trade
set -a; . ./.env; set +a
envsubst < config/odoo.conf.template > config/odoo.conf
chmod 600 config/odoo.conf

# Comprobar el render SIN enseñar las claves
sed -E 's/(admin_passwd|db_password) *=.*/\1 = ****/' config/odoo.conf
```

Lo que hay que ver ahí: `addons_path` apuntando a `/mnt/extra-addons`,
`db_host = db`, `workers` con el valor del `.env`, y `proxy_mode = True` —
sin eso Odoo genera URLs en `http://` detrás de Caddy.

## Paso 7 — Base, base de datos y módulos

**Este es el paso del que quiero la salida entera.**

```bash
cd /opt/pyxel-trade

# 7.1 Solo la base de datos primero, y esperar a que esté sana
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d db
sleep 10
docker compose --env-file .env -f infra/docker-compose.prod.yml ps

# 7.2 Crear la base e instalar los módulos, con log completo y sin recortar.
#     --stop-after-init: instala y sale, no deja el proceso levantado.
#     Los nombres de módulo SALEN DEL README, no de aquí.
docker compose --env-file .env -f infra/docker-compose.prod.yml run --rm \
  odoo odoo -d "$DB_NAME" -i base,web \
  --without-demo=all --log-level=info --stop-after-init \
  2>&1 | tee /tmp/odoo-init-base.log

docker compose --env-file .env -f infra/docker-compose.prod.yml run --rm \
  odoo odoo -d "$DB_NAME" -i <MODULOS_DEL_README> \
  --log-level=info --stop-after-init \
  2>&1 | tee /tmp/odoo-init-modulos.log

# 7.3 Levantar el stack completo
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d
docker compose --env-file .env -f infra/docker-compose.prod.yml ps
```

**Qué devolver de este paso, íntegro y sin resumir:**

```bash
# El traceback entero: cada línea dice qué corregir
cat /tmp/odoo-init-modulos.log

# Los avisos del arranque, aunque no rompan nada
grep -nE 'WARNING|ERROR|CRITICAL' /tmp/odoo-init-modulos.log

# Y los del proceso ya levantado
docker compose --env-file .env -f infra/docker-compose.prod.yml logs --tail 200 odoo \
  | grep -nE 'WARNING|ERROR|CRITICAL'
```

> **No intentes arreglar los errores del módulo.** Pásalos tal cual.

**Dónde es más probable que falle** (mira estas tres primero al leer el log):

| Sospechoso | Síntoma en el log |
|---|---|
| `xpath` sobre el `<notebook>` del formulario de contacto y del de producto | `ValidationError` / `Element '<xpath expr=...>' cannot be located in parent view` |
| Campo `website_url` de `product.template` | `KeyError: 'website_url'` o `Field ... does not exist` |
| Parámetro `?category=` del controlador `/shop` de `website_sale` | `TypeError: ... got an unexpected keyword argument 'category'` |

## Paso 8 — Caddy

```bash
# 8.1 Copia de seguridad del Caddyfile ANTES de tocarlo
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%F-%H%M)

# 8.2 AÑADIR al final. No tocar ningún bloque ajeno.
cat /opt/pyxel-trade/infra/caddy-site.conf >> /etc/caddy/Caddyfile

# 8.3 Validar SIEMPRE antes de recargar
caddy validate --config /etc/caddy/Caddyfile

# 8.4 Solo si la validación pasa
systemctl reload caddy
systemctl is-active caddy
```

Forma que debe tener el bloque (la buena está en el repo del proyecto):

```caddy
trade.enetradex.com {
    encode zstd gzip

    # El websocket de Odoo va a su propio puerto; sin esto, el chat y las
    # notificaciones en vivo caen a long-polling y cargan el proceso web.
    @ws path /websocket /longpolling/*
    handle @ws {
        reverse_proxy 127.0.0.1:8311
    }

    handle {
        reverse_proxy 127.0.0.1:8310
    }
}
```

> **Si `caddy validate` falla**: restaura la copia
> (`cp /etc/caddy/Caddyfile.bak.<sello> /etc/caddy/Caddyfile`), **no recargues**
> y repórtalo. Los sitios de los demás siguen sirviéndose con la config vieja
> mientras no se recargue.

---

# PARTE 3 — Verificación y mediciones

## 3.1 Prueba de humo

```bash
cat > /tmp/smoke.sh <<'EOF'
#!/usr/bin/env bash
# Prueba de humo contra el despliegue REAL. Que la portada dé 200 no basta:
# los estáticos rotos dejan la web a medias sin que nada falle.
set -u
BASE="https://trade.enetradex.com"
ok=0; ko=0
comprobar() { # nombre  esperado  url  [patron]
  local n="$1" esp="$2" url="$3" pat="${4:-}"
  local cod; cod=$(curl -sk -o /tmp/smoke.body -w '%{http_code}' --max-time 20 "$url")
  local extra="" bien=1
  [ "$cod" = "$esp" ] || bien=0
  if [ -n "$pat" ]; then
    if grep -qi "$pat" /tmp/smoke.body; then extra=" · contiene '$pat'";
    else bien=0; extra=" · NO contiene '$pat'"; fi
  fi
  if [ $bien = 1 ]; then echo "OK   $n → $cod$extra"; ok=$((ok+1));
  else echo "FALLO $n → $cod (esperaba $esp)$extra"; ko=$((ko+1)); fi
}

echo "===== PRUEBA DE HUMO — $BASE ====="
# 1. Salud del proceso
comprobar "salud del proceso"      200 "$BASE/web/health"
# 2. Salud CON PostgreSQL (esto sí toca la base)
comprobar "salud con base de datos" 200 "$BASE/web/database/selector" "database"
# 3. Página de acceso
comprobar "pagina de acceso"        200 "$BASE/web/login" "password"
# 4. El gestor de bases NO puede estar abierto
comprobar "gestor de bases cerrado" 404 "$BASE/web/database/manager"
# 5. La hoja de estilos carga DE VERDAD (no un 200 con HTML de error)
CSS=$(curl -sk --max-time 20 "$BASE/web/login" \
      | grep -oE '/web/assets/[^"]+\.css' | head -1)
if [ -z "$CSS" ]; then
  echo "FALLO estaticos → no se encontro ninguna hoja de estilos en el HTML"; ko=$((ko+1))
else
  TIPO=$(curl -sk -o /tmp/smoke.css -w '%{content_type}' --max-time 20 "$BASE$CSS")
  BYTES=$(wc -c < /tmp/smoke.css)
  case "$TIPO:$BYTES" in
    text/css*) [ "$BYTES" -gt 1000 ] \
        && { echo "OK   estaticos → $CSS · $TIPO · $BYTES bytes"; ok=$((ok+1)); } \
        || { echo "FALLO estaticos → $CSS solo $BYTES bytes"; ko=$((ko+1)); } ;;
    *) echo "FALLO estaticos → $CSS devolvio $TIPO (no es CSS)"; ko=$((ko+1)) ;;
  esac
fi

echo "===================================="
echo "$ok correctas · $ko fallos"
[ $ko -eq 0 ] || exit 1
EOF
chmod +x /tmp/smoke.sh && bash /tmp/smoke.sh 2>&1 | tee /tmp/smoke-salida.txt
```

## 3.2 Peso de la página

Decide si el frontend puede quedarse en Odoo o hay que sacarlo a un cliente
propio. **En Cuba el giga adicional cuesta 18,7 veces más que el del plan
base**, así que el peso del paquete de estáticos de Odoo no es estético.

```bash
cat > /tmp/measure.sh <<'EOF'
#!/usr/bin/env bash
# Peso REAL sobre el cable: se pide con gzip/br, que es como llega al visitante.
set -u
BASE="https://trade.enetradex.com"
RUTAS="/web/login /shop /"

pesa() { # url → bytes transferidos y tipo
  curl -sk --compressed -o /tmp/m.body -w '%{size_download} %{content_type}' \
       --max-time 30 "$1"
}

printf '%-34s %10s %10s %8s  %s\n' RECURSO BYTES KB TIPO ORIGEN
printf '%.0s-' {1..92}; echo

TOTAL=0
for r in $RUTAS; do
  read -r B T <<<"$(pesa "$BASE$r")"
  TOTAL=$((TOTAL+B))
  printf '%-34s %10s %10s %8s  %s\n' "$r" "$B" "$((B/1024))" "html" "documento"

  # Estáticos que ESA página pide (assets de Odoo: js y css empaquetados)
  for a in $(curl -sk --compressed --max-time 30 "$BASE$r" \
             | grep -oE '/web/assets/[^"]+\.(css|js)' | sort -u | head -20); do
    read -r AB AT <<<"$(pesa "$BASE$a")"
    TOTAL=$((TOTAL+AB))
    corto=$(echo "$a" | sed -E 's|.*/||' | cut -c1-32)
    printf '%-34s %10s %10s %8s  %s\n' "$corto" "$AB" "$((AB/1024))" \
      "$(echo "$AT" | cut -d/ -f2 | cut -d';' -f1)" "$r"
  done
done

printf '%.0s-' {1..92}; echo
printf '%-34s %10s %10s\n' "TOTAL (comprimido)" "$TOTAL" "$((TOTAL/1024))"
echo
echo "Referencia de coste en Cuba: 1 giga adicional cuesta 18,7 veces el del plan base."
echo "Visitas que caben en 1 GB con este peso: $(( 1073741824 / (TOTAL>0?TOTAL:1) ))"
EOF
chmod +x /tmp/measure.sh && bash /tmp/measure.sh 2>&1 | tee /tmp/measure-salida.txt
```

## 3.3 Websocket

```bash
# Odoo 19 sirve el websocket en /websocket. Con las cabeceras de upgrade, la
# respuesta correcta es 101 (Switching Protocols). Un 200 significa que Caddy
# NO está enrutando al puerto del websocket y todo cae a long-polling.
curl -sk -o /dev/null -w 'websocket → %{http_code}\n' \
  --max-time 15 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" \
  -H "Origin: https://trade.enetradex.com" \
  "https://trade.enetradex.com/websocket"

# Y que el puerto interno esté donde debe: loopback, nunca 0.0.0.0
ss -ltnp | grep -E ':(8310|8311)'
```

| Código | Qué significa |
|---|---|
| **101** | Correcto: el websocket sube |
| 200 | Caddy no enruta `/websocket` al 8311 — revisar el bloque |
| 404 | El proceso de websocket no está levantado |
| 502 | Caddy enruta bien pero detrás no hay nadie escuchando en 8311 |

## 3.4 Lo que NO se puede medir desde el servidor

**La latencia desde China hacia el servidor.** No se mide desde dentro: un
`ping` desde el GEX44 mide la ida, no lo que sufre un visitante chino (el
cuello está en el cruce internacional, y es asimétrico).

Hace falta un punto de medición **en China**: un servicio de comprobación
global, o alguien allí ejecutando `curl -w '%{time_total}'`. Si no lo tienes a
mano, **dilo y déjalo pendiente** — no lo estimes.

---

# Qué devolver

En este orden, con **salidas literales y sin resumir**:

1. Salida de `recon.sh` **y** respuesta a las cinco preguntas de la parte 1.
2. Salida de la instalación de módulos, **con todos los errores y avisos**.
3. Salida de `caddy validate`.
4. Salida de `smoke.sh`.
5. Tabla de `measure.sh`.
6. Código HTTP del websocket.
7. **Cualquier cosa que te haya obligado a apartarte de este guion, y por qué.**

Los ficheros quedan en el servidor para poder recuperarlos:

```bash
for f in /tmp/recon-salida.txt /tmp/odoo-init-modulos.log \
         /tmp/smoke-salida.txt /tmp/measure-salida.txt; do
  echo; echo "########## $f ##########"; cat "$f"
done
```

> Si te bloqueas, di **exactamente dónde y con qué error**. Un despliegue a
> medias bien reportado vale más que uno completo sobre un servidor de terceros
> que nadie sabe cómo quedó.

---

# Marcha atrás

Si hay que dejar el servidor como estaba:

```bash
cd /opt/pyxel-trade
docker compose --env-file .env -f infra/docker-compose.prod.yml down    # SIN -v
cp /etc/caddy/Caddyfile.bak.<sello> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```

**`down` sin `-v`**: con `-v` se borran los volúmenes y con ellos la base de
datos. Y **nunca `docker system prune`**: se llevaría por delante volúmenes de
Qbaprotic y de la fábrica.

---

*Escrito desde el patrón verificado en este mismo servidor (despliegue de la
fábrica de tiendas, 2026-08-28) y de la forma real de un Odoo de este proyecto.
El mapa de puertos y la IP hay que reverificarlos el día del despliegue. Ante
cualquier discrepancia con el README de `pyxel-trade/`, manda el README.*
