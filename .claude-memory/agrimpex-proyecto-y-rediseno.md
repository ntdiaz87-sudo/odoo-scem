---
name: agrimpex-proyecto-y-rediseno
description: Proyecto odoo_agrimpex — clon rebrandeado de CEIMPEX; rediseño web pendiente con herencia CUPET
metadata: 
  node_type: memory
  type: project
  originSessionId: 0d79d414-2e84-49ee-8766-cde06e6b878a
---

`C:\odoo_agrimpex` es un proyecto Odoo 17 nuevo creado clonando CEIMPEX
(`C:\odoo_ceimpex`). Identidad propia: contenedores `agrimpex_odoo`/`agrimpex_postgres`,
puertos **8369** web / **8372** longpolling, BD `agrimpex_dev`. Corre en paralelo
a scem (8269), ceimpex (8169) y avilmat (8069) — NO tocar esos.

Rebrand a "Agrimpex" hecho (2026-06-09): 4 módulos `pyxel_ceimpex_*` -> `pyxel_agrimpex_*`,
sus modelos `pyxel.agrimpex.conciliation.*`, empresa y website = "Agrimpex" en BD.
Datos de negocio (clientes/operaciones) conservados.

**Why:** El usuario solo quería preservar clientes/operaciones de la BD; el resto
de la marca era libre de cambiar.

**How to apply:** El SITIO WEB PÚBLICO aún arrastra contenido/marketing de **CUPET**
(la web original era de combustibles CUPET, luego CUBAELECTRÓNICA, luego CEIMPEX) y
los logos viejos. El usuario entregará la nueva identidad (home, imágenes, logo)
para el REDISEÑO del sitio — no reescribir el contenido público CUPET hasta tener
esos materiales. Ver [[imagenes-dentro-del-proyecto]] para el manejo de imágenes.
