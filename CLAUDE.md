# Proyecto Odoo SCEM

Instancia de Odoo 17 sobre Docker. Tienda online (e-commerce) con módulos
personalizados.

## Entorno

- **Plataforma:** Odoo 17.0 en Docker (Docker Desktop en Windows)
- **Orquestación:** `docker-compose.yml` en la raíz del proyecto
- **Base de datos:** `scem` (PostgreSQL 16, servicio `db`)
- **Puerto web:** http://localhost:8269 (mapeado a 8069 interno)
- **Puerto longpolling:** 8272 (mapeado a 8072 interno)
- **Contenedores:** `odoo_scem` (web) y `odoo_scem_db` (base de datos)
- **Config de Odoo:** `config/odoo.conf`

## Estructura de addons

La carpeta `addons/` se monta en el contenedor como `/mnt/extra-addons`.
Contiene cuatro repositorios de módulos:

- `addons-l10n_cu/` — localización Cuba (l10n_cu, l10n_cu_address, l10n_cu_banks, l10n_cu_hr)
- `custom_muk/` — módulos MUK y el tema `theme_scita`
- `scem/` — módulos `pyxel_cem_*` (núcleo del proyecto)
- `shop-cubaelectronica/` — `pyxel_cubaelectronica_website` y personalización del sitio

El `addons_path` en `odoo.conf` es:
```
addons_path = /mnt/extra-addons/addons-l10n_cu,/mnt/extra-addons/custom_muk,/mnt/extra-addons/scem,/mnt/extra-addons/shop-cubaelectronica
```

## Comandos habituales (ejecutar desde la raíz del proyecto)

```bash
# Levantar / parar
docker compose up -d
docker compose down

# Ver logs de Odoo (lo primero ante un error 500)
docker compose logs --tail 100 web

# Reiniciar solo Odoo (recarga estáticos, plantillas)
docker compose restart web

# Actualizar un módulo tras editar su código (regenera assets)
docker compose run --rm web odoo -d scem -u NOMBRE_MODULO --stop-after-init
docker compose restart web

# Actualizar todos los módulos (lento, regenera todos los assets)
docker compose run --rm web odoo -d scem -u all --stop-after-init

# Abrir shell dentro del contenedor de Odoo
docker compose exec web bash
```

## Ubicación de los logos del sitio (referencia)

- **Cabecera/navbar:** campo `website.header_logo` en base de datos.
  Sobrescrito en `custom_muk/theme_scita/views/header_option.xml`.
  Se cambia desde la interfaz de Odoo (Configuración del sitio web), NO por código.
- **Pie de página (footer):** imagen estática hardcodeada en
  `shop-cubaelectronica/pyxel_cubaelectronica_website/static/src/img/logo_footer.png`,
  referenciada en `.../views/footer.xml`. Se cambia reemplazando el PNG.
- **PDFs/documentos:** campo `website.logo` en base de datos.
  Usado en `scem/pyxel_cem_website_sale/views/order_request.xml`.
  Se cambia desde la interfaz de Odoo.

## Reglas importantes

- **NO tocar** el fichero de backup `cevende_prod_*` de la raíz. Es una copia de
  seguridad de la base de datos, no parte del código.
- **NO modificar** `config/odoo.conf` sin avisar primero: contiene credenciales y
  el `addons_path`. Cambiarlo mal deja Odoo sin arrancar.
- **NO cambiar** los nombres de ficheros estáticos referenciados en plantillas XML
  (ej. `logo_footer.png`) sin actualizar también la plantilla que los referencia.
- Tras editar **código Python o estructura de un módulo** hace falta `-u` del módulo
  y reiniciar `web`. Tras editar solo **un fichero estático** (imagen, CSS) basta con
  `docker compose restart web`.
- Antes de modificar ficheros, explicar primero qué se va a hacer y esperar
  confirmación (mantener "Ask before edits").
## Estándares de ingeniería

Ver el fichero `estandares_ingenieria.md` en la raíz del proyecto y aplicar
todas sus reglas en cada tarea.
