---
name: diseno-facturas-odoo
description: Las facturas/reportes salían sin diseño porque la compañía no tenía plantilla de documento; cómo se configuró en Agrimpex
metadata: 
  node_type: memory
  type: project
  originSessionId: 0d79d414-2e84-49ee-8766-cde06e6b878a
---

Las facturas de venta de Agrimpex salían "en blanco" (sin logo, cabecera ni pie).
Causa: la compañía tenía `external_report_layout_id = None`, así que Odoo usaba un
layout pelado. **Esto afecta a TODOS los reportes** (factura, presupuesto, orden de
compra, albarán), no solo la factura.

**Configuración aplicada (res.company id 1):**
- `external_report_layout_id` = `web.external_layout_boxed` (estilo con bordes, formal).
- `primary_color` = `#0a5c36`, `secondary_color` = `#044221` (verde Agrimpex).
- `report_footer` = línea de contacto (reemplaza el placeholder "Company Report Footer").
- `terms_type` = `plain` + `invoice_terms` = texto propio (antes mostraba la URL
  heredada `importadoras.pyxelsolution.com/terms`). OJO: en facturas YA emitidas el
  texto queda horneado en `account.move.narration`; hay que reescribir ese campo en
  las viejas. Las nuevas toman `invoice_terms` automáticamente.

**Bug de traducción heredado del clon:** en idioma **es_ES** la columna "Amount" del
reporte de factura estaba mal traducida como **"Cantidad"** (salían dos columnas
"CANTIDAD"). Lo correcto es "Importe" (en es_AR ya estaba bien). Se corrigió en la
vista `account.report_invoice_document` reescribiendo solo el `<th name="th_subtotal">`
en la traducción es_ES (write con `with_context(lang='es_ES')`). El idioma activo de
compañía/usuarios/partners es es_ES. Requiere reiniciar `odoo` para recargar la vista.

**Pendiente de dato de negocio (no inventado):** la compañía no tiene NIT propio
(`vat=False`) → la factura no muestra "Identificación fiscal" del emisor; el estado
sale como "Playa SLI" (código de provincia raro); dirección/teléfono/web son aún los
heredados de cubaelectronica. Falta que el usuario aporte los datos fiscales reales
de Agrimpex. Ver [[agrimpex-proyecto-y-rediseno]] y [[smtp-pyxelsolution-cloudflare]].

**PDF en crudo / sin estilos (gotcha de Docker, afecta a TODOS los proyectos):** si
el PDF impreso sale sin logo ni CSS (aunque el HTML `/report/html/...` se vea bien),
es porque wkhtmltopdf corre DENTRO del contenedor y no alcanza los assets. El
parámetro `report.url` (ir.config_parameter) apuntaba a `http://localhost:8369`
(puerto del HOST), pero dentro del contenedor Odoo escucha en el 8069. Fix:
`ICP.set_param('report.url', 'http://localhost:8069')` (puerto interno). No requiere
reinicio. En agrimpex se aplicó; revisar lo mismo en scem/ceimpex/avilmat (cada uno
con su puerto interno 8069).

Para probar el PDF REAL (no el HTML): instalar `poppler-utils` en el contenedor,
autenticar con curl a `/web/session/authenticate`, bajar `/report/pdf/<report>/<id>`
y convertir con `pdftoppm -png`. El HTML puede verse bien y el PDF mal (este bug).

Para previsualizar un reporte con estilos: capturar con puppeteer la URL
`/report/html/account.account_invoices/<id>` logueado (ver [[verificar-diseno-con-puppeteer]]);
renderizar desde `odoo shell --no-http` da PDF sin CSS (ConnectionRefusedError).
