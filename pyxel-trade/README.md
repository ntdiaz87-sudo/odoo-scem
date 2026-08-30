# PYXEL — Cuba Trade OS

Plataforma B2B China → Cuba sobre **Odoo 19**. Despliegue en Hetzner con
PostgreSQL 16 y Caddy (TLS automático).

> **Esto es un proyecto distinto de Cevende.** Cevende vive en `addons/` de
> este mismo repositorio, sobre Odoo 17, y no se toca. `pyxel-trade/` está
> aquí sólo porque la rama de trabajo está en este repositorio; debería
> mudarse a un repositorio propio cuando el proyecto se consolide.

## Estado

Escrito y validado sintácticamente, **no ejecutado**. En el entorno donde se
desarrolló no hay demonio Docker ni acceso a un servidor, así que nadie ha
arrancado todavía este Odoo 19. Lo que falta comprobar en la primera puesta
en marcha está al final de este documento.

## Requisitos previos

1. **Servidor Hetzner.** Mínimo recomendado CPX21 (3 vCPU, 4 GB). Con
   catálogo grande e imágenes, CPX31 (4 vCPU, 8 GB).
2. **Dominio apuntando al servidor.** Registro `A` del subdominio hacia la IP,
   propagado **antes** de arrancar: Caddy pide el certificado al levantar y
   falla si el dominio todavía no resuelve.

## Puesta en marcha

```bash
scp -r pyxel-trade root@<IP>:/opt/
ssh root@<IP>
cd /opt/pyxel-trade

cp .env.example .env
nano .env                      # dominio, correo y contraseñas

# Generar contraseñas robustas:
#   openssl rand -base64 32

bash scripts/bootstrap-hetzner.sh
```

El script instala Docker, abre el cortafuegos (sólo 22, 80 y 443), crea swap,
genera `config/odoo.conf` a partir de la plantilla, crea la base de datos y
levanta el stack.

## Día a día

```bash
cd /opt/pyxel-trade

docker compose logs -f odoo                 # registro
docker compose restart odoo                 # recarga estáticos y plantillas
docker compose down && docker compose up -d # reinicio completo

# Actualizar un módulo tras cambiar su código Python o sus vistas
docker compose run --rm odoo odoo -d pyxel_trade -u pyxel_trade_core --stop-after-init
docker compose restart odoo

# Instalar un módulo por primera vez
docker compose run --rm odoo odoo -d pyxel_trade -i pyxel_trade_core --stop-after-init
```

Copia de seguridad diaria (base **y** filestore):

```bash
crontab -e
0 3 * * * /opt/pyxel-trade/scripts/backup.sh >> /var/log/pyxel-backup.log 2>&1
```

## Seguridad aplicada

- PostgreSQL no publica ningún puerto: sólo existe en la red interna de Docker.
- `list_db = False` y `/web/database/*` devuelve 404 en el proxy. La base se
  crea una única vez por línea de comandos.
- Los secretos viven en `.env` y en `config/odoo.conf`, ambos excluidos de git.
  Al repositorio sólo va la plantilla.
- `proxy_mode = True`, obligatorio detrás de Caddy para que las cookies de
  sesión se marquen como seguras.
- Cortafuegos con tres puertos abiertos y fail2ban activo.

## Pendiente de comprobar en el primer arranque

Ninguna de estas cosas se ha podido verificar sin un servidor:

- Que la imagen `odoo:19` publicada corresponde a la versión esperada.
- Que `pyxel_trade_core` instala sin errores. Los modelos `uom.uom` y
  `account.incoterms` son estables desde hace muchas versiones, pero Odoo 19
  no se ha podido ejecutar para confirmarlo.
- Que el websocket responde en `/websocket` (el chat y las notificaciones en
  vivo dependen de ello).
- Disponibilidad de la localización cubana `l10n_cu` para Odoo 19. En este
  repositorio existe para Odoo 17; **puede que haya que migrarla**, y hace
  falta para facturar en Cuba.
