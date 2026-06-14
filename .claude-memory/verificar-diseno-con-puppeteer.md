---
name: verificar-diseno-con-puppeteer
description: "En trabajo de diseño/maquetación, SIEMPRE verificar con captura de navegador real (puppeteer+login) y comparar contra el mockup antes de mostrar al usuario"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0d79d414-2e84-49ee-8766-cde06e6b878a
---

Al trabajar diseño/maquetación del sitio Agrimpex, antes de enseñar nada al
usuario hay que: editar → `-u` del módulo → **capturar la página REAL con
puppeteer (con login)** → recortar mi resultado y el mockup → **superponerlos y
compararlos** → corregir → repetir hasta que coincida. Solo entonces mostrar.

**Why:** El usuario revisa visualmente y se molesta si le enseño algo que no
coincide con el diseño o capturas engañosas. Pedir que él descubra las
diferencias le hace perder tiempo. Además, las capturas *offline* con `file://`
NO ejecutan el JS (el formulario de acreditación sale con todos los campos y
desplegables vacíos) → engañosas.

**How to apply:**
- Herramienta lista: `C:\odoo_agrimpex\tmp_manifests\ppt\` (puppeteer-core + Edge).
  `node ...\ppt\capture.js <URL> <salida.png> [altoViewport]` → autentica por
  JSON como preview@agrimpex.local / Preview2026! y captura con JS ejecutado.
- Páginas internas requieren login (controlador redirige a /web/login).
- Mockups del diseño en `C:\odoo_agrimpex\images\` (agrimpex.png=home,
  acreditar.png=acreditación, importacion/tienda/carrito/detalleproducto/import.png).
- Para comparar: recortar la zona equivalente de mi captura y del mockup, escalar
  al mismo ancho y apilar (System.Drawing) para verlas una encima de otra.
- Ver [[agrimpex-proyecto-y-rediseno]].
