# Traspaso — terminar el despliegue de PYXEL Cuba Trade OS

> Para una sesión de Claude Code que corra **en el portátil de Nilo**, con
> `ssh gex44` funcionando. La sesión que escribió el código corre en la nube
> y no tiene salida de red hacia el servidor.

---

Retoma el despliegue de **PYXEL Cuba Trade OS** en el GEX44
(`46.4.98.13`, alias `ssh gex44`). El servidor es **compartido**: ahí corren
Qbaprotic, la fábrica de tiendas, seric y otros. **No rompas nada.**

## Reglas que no se negocian

- Nunca `docker system prune`, `down -v`, `ufw`, ni reiniciar el servidor.
- El Caddyfile de `/etc/caddy/` lo comparten ~24 dominios: copia antes de
  tocarlo, `caddy validate` **siempre** antes de `systemctl reload`, y si no
  valida, restaura y no recargues.
- Ningún puerto en `0.0.0.0`. Este stack publica en `127.0.0.1:8310` (web) y
  `127.0.0.1:8311` (websocket).
- Ignora el aviso `*** System restart required ***`. Reiniciar tumbaría tres
  proyectos en producción.

## Dónde está todo

- Código en el servidor: `/opt/pyxel-trade`
- Repositorio: `github.com/ntdiaz87-sudo/odoo-scem`, rama
  `claude/pyxel-solutions-platform-j2c87s`, subcarpeta `pyxel-trade/`
- Dominio: `trade.enetradex.com` → ya resuelve a `46.4.98.13`, en gris
- Registro del intento anterior: `/root/pyxel-deploy-20260830-1451.log`

## Qué ya está hecho

1. Código copiado a `/opt/pyxel-trade` y finales de línea normalizados.
2. `.env` creado con contraseñas generadas. **NO lo regeneres**: PostgreSQL
   ya se creó con ese `DB_PASSWORD` y Odoo dejaría de poder conectarse.
3. `config/odoo.conf` renderizado.
4. Lint (`infra/ci.sh`) pasado entero.
5. Contenedor `pyxel_trade-db-1` levantado y sano.
6. Imagen `odoo:19.0-20260817` descargada.

## Qué falló, y por qué

La instalación de módulos murió con:

```
grep: /etc/odoo/odoo.conf: Permission denied
configparser.NoSectionError: No section: 'options'
```

El contenedor de Odoo **no corre como root** y el fichero estaba en `600`
propiedad de root. Odoo veía una configuración vacía. Ya está corregido en el
repositorio (`render-config.sh` consulta el uid del usuario `odoo` a la propia
imagen), pero **la copia del servidor puede ser anterior**.

## Lo que hay que hacer

### 1. Traer los arreglos

Vuelve a copiar `pyxel-trade/` de la rama al servidor, o al menos
`scripts/render-config.sh` y `scripts/deploy-first-time.sh`. Conserva el
`.env` que ya existe.

### 2. Permisos y modulos

```bash
cd /opt/pyxel-trade
UIDO=$(docker run --rm --entrypoint id odoo:19.0-20260817 -u odoo)
chown "$UIDO:$UIDO" config/odoo.conf
chmod 640 config/odoo.conf
set -a; . ./.env; set +a
docker compose --env-file /opt/pyxel-trade/.env \
  -f /opt/pyxel-trade/infra/docker-compose.prod.yml run --rm odoo \
  odoo -d "$ODOO_DB" \
  -i base,pyxel_trade_core,pyxel_trade_marketplace,pyxel_trade_supplier,pyxel_trade_container \
  --stop-after-init
```

**Es la primera vez que estos cuatro módulos corren en un Odoo 19 real.**
Espera errores. El más probable son los `xpath` sobre el `<notebook>` del
formulario de contacto (`base.view_partner_form`) y del de producto
(`product.product_template_only_form_view`), en
`addons/pyxel_trade_core/views/pyxel_trade_views.xml`. Si Odoo 19 reorganizó
esas vistas, hay que cambiar el ancla. Otros sospechosos: el campo
`website_url` de `product.template` y el parámetro `?category=` del
controlador `/shop`.

Arregla, vuelve a lanzar, y **sube los arreglos a la rama**.

### 3. Levantar el stack

```bash
docker compose --env-file /opt/pyxel-trade/.env \
  -f /opt/pyxel-trade/infra/docker-compose.prod.yml up -d
```

### 4. Caddy

```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d-%H%M%S)
cat /opt/pyxel-trade/infra/caddy-site.conf >> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```

Si no valida: restaura la copia y **no recargues**.

### 5. Verificar

```bash
cd /opt/pyxel-trade
bash scripts/smoke.sh trade.enetradex.com
bash scripts/measure.sh https://trade.enetradex.com/market
ss -ltn | grep -v 127.0.0.1 | grep -E ':83[0-9][0-9] '   # debe salir vacio
```

`measure.sh` da el número que decide si el frontend puede quedarse dentro de
Odoo. Guárdalo.

### 6. Rematar

- `web.base.url` → `https://trade.enetradex.com` en Ajustes → Técnico →
  Parámetros del sistema. Sin esto los enlaces de los correos apuntan a
  `localhost:8069`.
- `ln -s /opt/pyxel-trade/scripts/backup.sh /opt/backup_pyxel_trade.sh` y su
  cron. Los backups **no se añaden solos**: la fábrica lleva días sin ninguno.
- Mover el proyecto a Gitea (`nilo/pyxel-trade`, rama `develop`) con su deploy
  key en `/opt/pyxel-trade_deploy_key`, para tener despliegue automático.
  Al clonar, no olvides
  `git -C /opt/pyxel-trade config core.sshCommand "ssh -i /opt/pyxel-trade_deploy_key"`,
  o el CI falla en el primer paso.

## Qué reportar

La salida de la instalación de módulos (tracebacks enteros), la de
`smoke.sh`, la tabla de `measure.sh`, y cualquier cosa que te obligara a
apartarte de este guion.
