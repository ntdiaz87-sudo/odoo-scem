# Despliegue de PYXEL Cuba Trade OS — hecho el 30/08/2026

**La plataforma está en pie en <https://trade.enetradex.com>**, en el GEX44
(`46.4.98.13`, alias `ssh gex44`), servidor compartido con Qbaprotic, la
fábrica de tiendas, seric y otros.

Este documento era un traspaso con lo que faltaba. Ahora es el registro de
cómo quedó. Lo que sigue vigente son las reglas y el apartado final.

## Reglas que no se negocian

- Nunca `docker system prune`, `down -v`, `ufw`, ni reiniciar el servidor.
- El Caddyfile de `/etc/caddy/` lo comparten ~24 dominios: copia antes de
  tocarlo, `caddy validate` **siempre** antes de `systemctl reload`, y si no
  valida, restaura y no recargues.
- Ningún puerto en `0.0.0.0`. Este stack publica en `127.0.0.1:8310` (web) y
  `127.0.0.1:8311` (websocket).
- Ignora el aviso `*** System restart required ***`. Reiniciar tumbaría tres
  proyectos en producción.
- **No regeneres el `.env`.** PostgreSQL se creó con ese `DB_PASSWORD` y
  Odoo dejaría de poder conectarse.

## Dónde está todo

- Código en el servidor: `/opt/pyxel-trade`
- Repositorio: `github.com/ntdiaz87-sudo/odoo-scem`, rama
  `claude/pyxel-solutions-platform-j2c87s`, subcarpeta `pyxel-trade/`
- Base de datos: `pyxel_trade`, en el contenedor `pyxel_trade-db-1`
- Backups: `/opt/backups/pyxel_trade/` y MinIO
  `enetradex/enetradex-prod/backups/pyxel_trade/`

## Cómo quedó

| Pieza | Estado |
|---|---|
| Stack (`pyxel_trade-db-1`, `pyxel_trade-odoo-1`) | Arriba y `healthy` |
| Los cuatro módulos en Odoo 19 | Instalados, sin un solo error |
| `trade.enetradex.com` con TLS | Vivo, certificado de Let's Encrypt |
| Portada, `/market`, `/shop` | 200 |
| `/suppliers` en es, en y 中文 | 200 (daban 500) |
| Gestor de bases de datos | Cerrado (404), verificado |
| Websocket del bus | `101 Switching Protocols`, verificado |
| `web.base.url` | `https://trade.enetradex.com`, congelado |
| Backup diario + copia fuera del servidor | Cron a las 4:15, probado |
| Migración a Gitea con CI/CD | **Pendiente** |

## La trampa que muerde dos veces

**Nunca hagas `chown -R root:root /opt/pyxel-trade`.** El contenedor de Odoo
no corre como root y `config/odoo.conf` tiene que pertenecer al uid del
usuario `odoo` de la imagen (hoy, 100). Si lo cambias, Odoo arranca viendo
una configuración vacía. Pasó dos veces durante este despliegue, la segunda
por sincronizar el código con `tar` y ordenar los permisos después.

La cura es una línea, y el workflow de CI ya la lleva:

```bash
cd /opt/pyxel-trade && bash scripts/render-config.sh
```

Lánzala después de **cualquier** copia de ficheros al servidor.

## Las cinco cosas que hubo que arreglar

**1. `odoo.conf` ilegible para Odoo.** El contenedor no corre como root y el
fichero quedaba en `600` propiedad de root: Odoo veía una configuración
vacía y moría con un `NoSectionError` que no explicaba nada. Arreglado en
`scripts/render-config.sh`, que ahora consulta el uid del usuario `odoo` a
la propia imagen y le da el fichero en `640`. Con eso, los cuatro módulos
entraron a la primera: ningún `xpath` se rompió en Odoo 19, ni el del
`<notebook>` del contacto ni el del producto.

**2. El gestor de bases de datos seguía abierto.** El bloque de Caddy tenía

```
handle { reverse_proxy … }
@dbmanager path /web/database/*
respond @dbmanager 404
```

y **no funcionaba**: en el orden de directivas de Caddy, `respond` se ordena
*después* de los `handle`, así que el `handle` sin matcher se tragaba la
petición antes de llegar al candado. `caddy validate` no lo detecta —es
sintaxis válida—, lo detectó `smoke.sh`, y `caddy adapt` confirmó el orden.
Arreglado metiéndolo en su propio `handle`, colocado antes del resto. No es
una precaución teórica: el Odoo del POS de este mismo grupo se comprometió
por dejarlo abierto y apareció una base `pwn_`.

**3. `/suppliers` devolvía 500 en los tres idiomas.** La puerta del
proveedor chino —la mitad del producto que mira a China— no cargaba. El
selector de idiomas hacía `t-foreach="idiomas" t-as="lang"`, y el cuerpo de
un `t-call` se renderiza *antes* que la plantilla llamada y sobre el mismo
contexto: al llegar a `website.layout`, `lang` valía un diccionario y el
`lang.replace('_','-')` del atributo `lang` del `<html>` tiraba la página
entera. Renombrada la variable del bucle. Es un fallo que ninguna revisión
de código habría cazado y que sólo aparece con Odoo sirviendo.

**4. Las fichas de categoría no filtraban.** Enlazaban a
`/shop?category=<id>`; Odoo 19 ya no lee ese parámetro, contesta 301 a
`/shop` y el visitante acaba en el catálogo entero. Ahora
`/shop/category/<id>`.

**5. La raíz del dominio servía una página en blanco.** `trade.enetradex.com`
daba la página «Home» vacía que el módulo `website` crea de serie, mientras
el marketplace vivía en `/market`. Un `post_init_hook` en
`pyxel_trade_marketplace` deja la portada en `/market` y nombra el sitio,
sin pisar nada que ya estuviera configurado. En XML no valía: el sitio ya
existe cuando el módulo se instala, así que con `noupdate="1"` no se
aplicaba nunca y sin él cada actualización pisaría al cliente.

La única salvedad que queda es cosmética: `smoke.sh` marca el websocket como
AVISO porque le manda un GET normal y el bus contesta 400. Con una petición
de upgrade real (y HTTP/1.1, que en HTTP/2 la cabecera `Upgrade` no
significa nada) contesta `101`. Comprobado a mano.

## Lo que dijo la medición

`scripts/measure.sh https://trade.enetradex.com/market` da **756 KB en la
primera visita, 607 KB de ellos JavaScript**, contra un presupuesto de 500 y
150 KB. Cuatro veces por encima, y sin una sola foto de producto todavía.

El detalle está en `docs/02-arquitectura-frontend-movil.md`. La conclusión
corta: **el frontend público no se puede quedar dentro de Odoo** si la
plataforma tiene que funcionar en la red cubana. La fase 1 sigue valiendo
para validar el negocio; la fase 2 ya no es una opción a evaluar.

## Lo que falta

Mover el proyecto a Gitea (`nilo/pyxel-trade`, rama `develop`) con su deploy
key en `/opt/pyxel-trade_deploy_key`, para tener despliegue automático como
el resto de proyectos de la casa. El workflow ya está escrito en
`.gitea/workflows/deploy.yml`. Al clonar, no olvides

```bash
git -C /opt/pyxel-trade config core.sshCommand "ssh -i /opt/pyxel-trade_deploy_key"
```

o el CI falla en el primer paso.

Y dos cosas menores, para el día del lanzamiento:

- Quitar la cabecera `X-Robots-Tag: noindex` de `infra/caddy-site.conf`.
- Medir la visita repetida con navegador. Los assets ya llevan
  `Cache-Control: immutable`, así que debería cumplirse solo.
