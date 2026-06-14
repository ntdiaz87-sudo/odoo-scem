---
name: smtp-pyxelsolution-cloudflare
description: El SMTP mail.pyxelsolution.com resuelve a Cloudflare (sin SMTP); el servidor real es 51.75.242.31:587 STARTTLS
metadata: 
  node_type: memory
  type: project
  originSessionId: 0d79d414-2e84-49ee-8766-cde06e6b878a
---

El envío de correo de Odoo (Agrimpex, y probablemente el resto de proyectos pyxel
que usan la cuenta cubaelectronica@pyxelsolution.com) fallaba con "configure la
dirección de correo electrónico del remitente" / Connection refused / timeout.

**Causa raíz:** el DNS público de `mail.pyxelsolution.com` está detrás de
**Cloudflare** (104.21.16.8 / 172.67.165.165) — proxy solo HTTP/HTTPS, no hace
SMTP. El servidor de correo **real** (Postfix) está en **51.75.242.31** (MX
`_dc-mx.*.pyxelsolution.com`, PTR `ns3132040.ip-51-75-242.eu`, OVH/cPanel).
El puerto 25 está bloqueado por la red; el **587 STARTTLS + AUTH PLAIN/LOGIN** sí
funciona. La red del contenedor Docker está bien (gmail:587 conecta).

**Solución aplicada en Agrimpex (c:\odoo_agrimpex):**
1. `docker-compose.yml`, servicio `odoo`: `extra_hosts: ["mail.pyxelsolution.com:51.75.242.31"]`
   (fija la IP real saltando Cloudflare; mantiene el hostname para el cert TLS).
2. `ir.mail_server` id 1: host=mail.pyxelsolution.com, **port=587**, enc=starttls,
   user=cubaelectronica@pyxelsolution.com (password ya estaba).
3. Recrear contenedor (`docker compose up -d odoo`) para aplicar extra_hosts.

Verificado: `test_smtp_connection()` OK y envío de prueba a la propia cuenta OK.

**Segundo fallo (independiente del SMTP):** el botón "Enviar" de una orden de compra
daba "No se puede enviar el mensaje, configure la dirección de correo electrónico del
remitente" (raise en `mail/models/mail_thread.py` `_message_compute_author`). Causa: el
*autor* del correo es el usuario que envía, y el admin creado (uid 54, login
admin@agrimpex.cu) tenía `email=False`. Odoo no cae al email de la compañía: si el
partner del usuario no tiene email, falla. Fix: poner email en el usuario que envía =
cubaelectronica@pyxelsolution.com (agrimpex.cu no existe → no sirve como remitente real,
gmail lo rechazaría). Aplicado a uid 54 y 51 (preview). Al crear usuarios internos
nuevos, ponerles email de pyxelsolution.com.

**Nota de negocio:** no existe servidor de correo @agrimpex real (agrimpexcaribe.com.cu
no resuelve, era placeholder del mockup). Los correos salen con NOMBRE "Agrimpex"
pero el buzón real es cubaelectronica@pyxelsolution.com. Para un @agrimpex propio
hay que crear el buzón en el hosting. Ver [[agrimpex-proyecto-y-rediseno]].
