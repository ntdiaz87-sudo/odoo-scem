---
name: imagenes-dentro-del-proyecto
description: "El usuario quiere que toda imagen que proporcione se copie dentro del proyecto, no se referencie desde fuera"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cb90c8a5-95b3-464f-8afd-896816f6cd1a
---

Cuando el usuario proporcione una imagen (logo, foto de producto, fondo, etc.), SIEMPRE copiarla dentro del proyecto (carpeta `static/src/img/` o `static/src/img/products/` del módulo `pyxel_cubaelectronica_website`), nunca referenciarla desde una ruta externa como Downloads.

**Why:** El usuario lo pidió explícitamente ("esto hazlo siempre, las imágenes ubícalas en el proyecto"). Las rutas externas no son portables ni quedan versionadas con el módulo.

**How to apply:**
- Copiar el archivo a la carpeta de imágenes del módulo antes de referenciarlo.
- Mantener la relación de aspecto del original al mostrarlo (height fijo + width:auto, u object-fit:contain).
- Para imágenes que reemplazan a otras con el mismo nombre, añadir un parámetro de versión `?v=N` en el src para evitar la caché del navegador (problema de [[cache-imagenes-mismo-nombre]]).
- Para logos sobre fondo oscuro (footer navy), generar una versión blanca con fondo transparente en vez de usar `filter: brightness(0) invert(1)` (que falla si el PNG tiene fondo blanco no transparente).
- El logo de cabecera se guarda en BD (`website.logo` y `website.header_logo`); el del footer es el archivo estático `logo_footer.png`.
