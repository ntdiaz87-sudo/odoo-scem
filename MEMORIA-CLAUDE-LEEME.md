# Memoria de Claude — sincronizada por git (SCEM / Cevende)

La carpeta `.claude-memory/` contiene la **memoria del proyecto** que usa
Claude Code. Vive dentro del repo para viajar por git entre tus PCs. En cada
PC, un **enlace (junction)** la conecta con la ruta interna de Claude:

```
C:\Users\<TU_USUARIO>\.claude\projects\C--odoo-scem\memory
        └──(junction)──►  C:\odoo_scem\.claude-memory
```

## En una PC NUEVA (1ª vez)
1. Clona el repo en `C:\odoo_scem`.
2. Ejecuta en la raíz:  `.\setup-claude-memory.ps1`  (clic derecho → "Ejecutar con PowerShell")
3. Abre Claude Code en el proyecto.

## Día a día
`git push` sube la memoria, `git pull` en la otra PC la baja. Automático.

---
**Nota técnica:** este proyecto se "aplanó" en un solo repo. Los addons
`scem`, `shop-cubaelectronica` y `addons-l10n_cu` originalmente venían de
`code.pyxelsolution.com`. Sus `.git` originales (con esa conexión) están
respaldados en `backup/nested_gits/` por si hay que reconectar.
