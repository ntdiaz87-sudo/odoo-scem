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
| Puertos sólo en `127.0.0.1` | `WEB_PORT` y `WEBSOCKET_PORT` en loopback; la base no publica nada |
| Caddy es del host | `infra/caddy-site.conf` es **un bloque** para añadir, no un proxy propio |
| Un stack por proyecto | `name: ${STACK}` aísla contenedores, redes y volúmenes |
| DNS en gris | Registro A de `trade.enetradex.com` → `46.4.98.13`, sin nube naranja |
| El `.env` real no se comitea | Sólo se versiona `.env.example` y `config/odoo.conf.template` |
| Runner en modo host | El workflow usa **sólo** pasos `run:`; el checkout es un `git fetch` a mano |

## Qué está aislado y qué se comparte

El GEX44 es compartido. Esto es exactamente lo que este proyecto tiene
propio y lo que toca de los demás.

| | |
|---|---|
| **Propio** | Contenedores, red de Docker, volúmenes, PostgreSQL, filestore y puertos. `name: ${STACK}` los separa de todo lo demás: `docker compose down` aquí no puede tocar a un vecino |
| **Propio** | Techo de memoria y CPU (`mem_limit`, `cpus`). Sin él, instalar módulos o regenerar assets puede dejar sin memoria a Qbaprotic o a la fábrica |
| **Compartido** | El **Caddy del host**. Es el único punto real de fallo común: un Caddyfile roto deja sin servicio a todos. Por eso se hace copia antes de editar y `caddy validate` antes de recargar, siempre |
| **Compartido** | El **demonio de Docker**. Nunca `docker system prune` ni `down -v`: se llevarían volúmenes ajenos |
| **Compartido** | Kernel, disco y red. Mitigado con los límites de recursos |

No hace falta una máquina aparte: un stack de Docker con nombre propio,
volúmenes propios y techo de recursos ya da el aislamiento que importa. Lo
que no da aislamiento es el Caddy, y ahí la protección es el procedimiento,
no la tecnología.

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

# Sin esto, el `git fetch` del despliegue automático no encuentra la llave
# y el CI falla en el primer paso. Es el error que más cuesta diagnosticar.
git -C /opt/pyxel-trade config core.sshCommand "ssh -i /opt/pyxel-trade_deploy_key"
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
bash scripts/render-config.sh

cd infra
compose="docker compose --env-file ../.env -f docker-compose.prod.yml"

$compose up -d db
# La base se crea una sola vez por línea de comandos: list_db está
# desactivado y el gestor web devuelve 404.
$compose run --rm odoo odoo -d "$ODOO_DB" \
    -i base,pyxel_trade_core,pyxel_trade_marketplace,pyxel_trade_supplier,pyxel_trade_container \
    --stop-after-init
$compose up -d
```

### 6. Caddy — un bloque, y validar antes de recargar

```bash
sudo sh -c 'cat /opt/pyxel-trade/infra/caddy-site.conf >> /etc/caddy/Caddyfile'
sudo caddy validate --config /etc/caddy/Caddyfile   # NUNCA saltarse esto
sudo systemctl reload caddy
```

Un Caddyfile roto tumba los sitios de todos los proyectos del servidor.

### 7. Fijar la URL base

Odoo fija `web.base.url` con lo que ve en la primera petición. Si no se
corrige, los enlaces de los correos salen apuntando a `localhost:8069`.

Ajustes → Técnico → Parámetros del sistema → `web.base.url` →
`https://trade.enetradex.com`. Y añadir `web.base.url.freeze` a `True`
para que no vuelva a cambiar solo.

### 8. Verificar

```bash
bash scripts/smoke.sh trade.enetradex.com

# Nada de este stack puede escuchar fuera de loopback. Debe salir vacío.
ss -ltnp | grep -v 127.0.0.1 | grep -E ':83[0-9]{2}'
```

Comprueba la página de acceso, que el gestor de bases devuelve 404 y que
**la hoja de estilos carga de verdad** — los estáticos rotos dan una web a
medias sin que falle nada.

### 9. Copias de seguridad

```bash
ln -s /opt/pyxel-trade/scripts/backup.sh /opt/backup_pyxel_trade.sh
crontab -e
# 15 3 * * * /opt/backup_pyxel_trade.sh >> /var/log/backup_pyxel_trade.log 2>&1
```

## Imágenes de la portada

La portada usa tres fuentes de imagen. Ninguna apunta a un fichero que no
exista: un 404 de estático deja la web a medias sin que nada falle.

| Dónde | De dónde sale | Cómo se cambia |
|---|---|---|
| Hero | `static/src/img/hero.svg` | Es un marcador de posición vectorial de 4 KB. Para poner una fotografía, deja el fichero en esa carpeta y cambia el `src` en `views/home_templates.xml` |
| Categorías | Campo `image_1920` de `product.public.category` | Desde Odoo, en cada categoría del catálogo |
| Productos | Campo `image_1920` de `product.template` | Desde la ficha del producto |

**Si pones una fotografía en el hero, cuida el peso.** Es la imagen más
cara de la página y la primera que se descarga. Recomendado: 1600 px de
ancho, WebP o AVIF, **por debajo de 120 KB**. Una foto de portada sin
optimizar ronda los 400 KB, y en el tramo caro de ETECSA eso es casi un
cuarto del presupuesto de la primera visita entero.

Odoo redimensiona solo las de categorías y productos: se piden por
`/web/image/...` en el tamaño exacto que se muestra.

Quien active el **modo ligero** deja de recibir las tres.

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

## Verificado contra Odoo 19

Comprobado con fuentes del código y la documentación de la rama 19.0:

| Cosa | Resultado |
|---|---|
| Imagen `odoo:19` | Existe. Se fija `odoo:19.0-20260817` para que el despliegue sea reproducible |
| PostgreSQL 16 | Admitida (Odoo 19 pide 13 o superior) |
| Credenciales por `HOST`/`USER`/`PASSWORD` | El entrypoint las sigue leyendo |
| `uom.uom`, `account.incoterms`, `product.supplierinfo`, `res.country.state` | Sin cambios de nombre |
| `product.template.volume` y `.weight` | Existen |
| `/web/login`, `/web/database/manager`, `/web/assets/…`, `/websocket` | Sin cambios |
| `/web/health` | Existe; con `?db_server_status=1` comprueba también PostgreSQL |
| Módulos `website`, `website_sale`, `crm`, `stock`, `purchase`, `delivery`… | Todos en Community |

Dos cambios de Odoo 19 que obligaron a corregir código ya escrito:

- **`_sql_constraints` dejó de estar soportado.** Se sustituyó por
  `models.Constraint` en `pyxel.port`. Sin esta corrección el módulo no
  instalaba.
- **`<tree>` pasó a `<list>`**, y `tree,form` a `list,form`. Las vistas de
  backend se escribieron ya con la sintaxis nueva.

## Pendiente de comprobar en el primer arranque

- Que los cuatro módulos instalan sin traceback,
  y que actualizan con `-u`.
- Que los `xpath` sobre el notebook del contacto y del producto encajan en
  las vistas reales de Odoo 19.
- Que el websocket responde en `/websocket`.
- Que 8310 y 8311 siguen libres (`scripts/recon.sh`).

## Riesgos abiertos

**`l10n_cu` para Odoo 19: existe, pero en beta.** Hay rama `19.0` en
`cuba-odoo/l10n-cuba`, con `l10n_cu` declarando versión `19.0.1`, y también
`l10n_cu_address`, `l10n_cu_banks`, `l10n_cu_reports` y
`l10n_cu_website_sale`. No es localización oficial de Odoo: es un addon
comunitario marcado como beta, y su README de la rama 19.0 todavía cita la
V18. Hay que instalarlo en una base limpia y revisar plan contable,
impuestos y reportes antes de facturar nada.

**Las unidades de `volume` y `weight` son configurables.** Odoo puede estar
en metros cúbicos o pies cúbicos, y en kilogramos o libras. El constructor
de contenedores debe normalizar internamente a m³ y kg en lugar de asumir
la unidad, o calculará mal la ocupación.
