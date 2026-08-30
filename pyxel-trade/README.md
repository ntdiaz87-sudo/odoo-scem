# PYXEL — Cuba Trade OS

Plataforma B2B China → Cuba sobre **Odoo 19**, desplegada en el **GEX44
compartido** siguiendo el patrón de la casa.

> **Proyecto distinto de Cevende.** Cevende vive en `addons/` de este mismo
> repositorio, sobre Odoo 17, y no se toca. `pyxel-trade/` está aquí porque
> la rama de trabajo lo está; su sitio natural es `nilo/pyxel-trade` en Gitea.

## Estado

Escrito y validado sintácticamente, **no ejecutado**. No se ha arrancado
ningún Odoo 19 ni se ha tocado el GEX44. Lo que falta comprobar está al final.

## El patrón, aplicado aquí

| Regla de la casa | Cómo se cumple |
|---|---|
| Puertos sólo en `127.0.0.1` | `PORT_WEB` y `PORT_WEBSOCKET` en loopback; la base no publica nada |
| Caddy es del host | `infra/caddy-site.conf` es **un bloque** para añadir, no un proxy propio |
| Un stack por proyecto | `name: ${STACK}` aísla contenedores, redes y volúmenes |
| DNS en gris | Registro A de `trade.enetradex.com` → `46.4.98.13`, sin nube naranja |
| El `.env` real no se comitea | Sólo se versiona `.env.example` y `config/odoo.conf.template` |
| Runner en modo host | El workflow usa **sólo** pasos `run:`; el checkout es un `git fetch` a mano |

**Puertos elegidos: 8310 (web) y 8311 (websocket).** Libres según el mapa del
runbook, verificado el 2026-08-28. **Vuelve a comprobarlo el día del
despliegue** con `scripts/recon.sh`.

## Despliegue por primera vez

### 1. Reconocimiento — antes de tocar nada

```bash
ssh gex44 'bash -s' < scripts/recon.sh
```

Confirma que 8310 y 8311 están libres, que nada nuevo escucha en `0.0.0.0`
y que Caddy sigue activo.

### 2. DNS en Cloudflare — EN GRIS

Zona `enetradex.com`:

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `trade` | `46.4.98.13` | 🔘 Gris (DNS only) |

La nube naranja mata el desafío HTTP-01 y Caddy no consigue certificado.

### 3. Repositorio y clon en el servidor

Crear `nilo/pyxel-trade` en Gitea (privado, rama por defecto `develop`), y
en el servidor:

```bash
ssh gex44
ssh-keygen -t ed25519 -f /opt/pyxel-trade_deploy_key -N '' -C 'deploy pyxel-trade'
cat /opt/pyxel-trade_deploy_key.pub     # pegar en Gitea como deploy key de SOLO LECTURA

GIT_SSH_COMMAND='ssh -i /opt/pyxel-trade_deploy_key' \
  git clone -b develop git@git.enetradex.com:nilo/pyxel-trade.git /opt/pyxel-trade
```

### 4. Entorno

```bash
cd /opt/pyxel-trade
cp .env.example .env
chmod 600 .env
nano .env          # dominio, puertos y las tres contraseñas

# openssl rand -base64 32   (una distinta para cada una)
```

### 5. Configuración de Odoo y arranque

```bash
cd /opt/pyxel-trade
set -a; . ./.env; set +a
envsubst < config/odoo.conf.template > config/odoo.conf
chmod 600 config/odoo.conf

cd infra
compose="docker compose --env-file ../.env -f docker-compose.prod.yml"

$compose up -d db
# La base se crea una sola vez por línea de comandos: list_db está
# desactivado y el gestor web devuelve 404.
$compose run --rm odoo odoo -d "$ODOO_DB" -i base,pyxel_trade_core --stop-after-init
$compose up -d
```

### 6. Caddy — un bloque, y validar antes de recargar

```bash
sudo sh -c 'cat /opt/pyxel-trade/infra/caddy-site.conf >> /etc/caddy/Caddyfile'
sudo caddy validate --config /etc/caddy/Caddyfile   # NUNCA saltarse esto
sudo systemctl reload caddy
```

Un Caddyfile roto tumba los sitios de todos los proyectos del servidor.

### 7. Verificar

```bash
bash scripts/smoke.sh trade.enetradex.com
```

Comprueba la página de acceso, que el gestor de bases devuelve 404 y que
**la hoja de estilos carga de verdad** — los estáticos rotos dan una web a
medias sin que falle nada.

### 8. Copias de seguridad

```bash
ln -s /opt/pyxel-trade/scripts/backup.sh /opt/backup_pyxel_trade.sh
crontab -e
# 15 3 * * * /opt/backup_pyxel_trade.sh >> /var/log/backup_pyxel_trade.log 2>&1
```

## Día a día

```bash
cd /opt/pyxel-trade/infra
compose="docker compose --env-file ../.env -f docker-compose.prod.yml"

$compose logs -f odoo
$compose restart odoo                    # recarga estáticos y plantillas

# Tras cambiar código Python o vistas
$compose stop odoo
$compose run --rm --no-deps odoo odoo -d pyxel_trade -u pyxel_trade_core --stop-after-init
$compose up -d
```

A partir del primer despliegue esto lo hace solo el workflow de Gitea en cada
push a `develop`.

## Credenciales de este proyecto

Ninguna se comparte con otro proyecto. Aquí sólo está el inventario: los
valores viven en el servidor.

| Credencial | Dónde vive | Cómo se crea |
|---|---|---|
| Deploy key | `/opt/pyxel-trade_deploy_key` | `ssh-keygen -t ed25519`, solo lectura en Gitea |
| `DB_PASSWORD` | `/opt/pyxel-trade/.env` | `openssl rand -base64 32` |
| `ODOO_ADMIN_PASSWD` | `/opt/pyxel-trade/.env` | `openssl rand -base64 32` |
| `GITEA_TOKEN` | Secreto de GitHub Actions | Sólo si se activa el puente (`docs/sync-pyxel-trade.yml.example`) |

## Pendiente de comprobar en el primer arranque

- Que 8310 y 8311 siguen libres (`scripts/recon.sh`).
- Que la imagen `odoo:19` es la versión esperada.
- Que `pyxel_trade_core` instala sin error. `uom.uom` y `account.incoterms`
  llevan muchas versiones estables, pero no se ha podido ejecutar Odoo 19
  para confirmarlo.
- Que el websocket responde en `/websocket`.
- **`l10n_cu` para Odoo 19.** En este repositorio existe para Odoo 17 y hace
  falta para facturar en Cuba. Si no hay versión migrada, migrarla es
  trabajo previo, no algo que se resuelva sobre la marcha.
