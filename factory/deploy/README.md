# Runbook — Desplegar la fábrica en el GEX44 (patrón de la casa)

Alineado con el runbook general "Cómo se despliega en Hetzner" (verificado
2026-08-28, escrito desde el despliegue de Qbaprotic). Piezas propias de la
fábrica: `infra/docker-compose.prod.yml`, `.env.example`,
`.gitea/workflows/deploy-test.yml` y el endpoint `/api/tls-check`.

**Normas**: no tocar nada de lo que corre; no instalar nada sin comprobar;
puertos SOLO en `127.0.0.1`; Caddy del host para TLS/dominio; DNS gris.

## Qué toca este despliegue (y nada más)

| Dónde | Qué |
|---|---|
| `/opt/fabrica` | Clon del repo + `.env` + contenedores/volúmenes propios (`STACK=fabrica`) |
| `/opt/fabrica_deploy_key(.pub)` | Deploy key de solo lectura del repo |
| `/etc/caddy/Caddyfile` | UN bloque nuevo (y `on_demand_tls` en el global si no existe) |
| Cloudflare (zona elegida) | 2 registros A **en gris**: `fabrica` y `*.fabrica` |

Puertos: **8260 (web)** y **8261 (vendure)** en 127.0.0.1 — asignados como
"proyecto nuevo" en el runbook general (8300 y 8250 ya están ocupados en GEX44; 8250 lo usa seric en 0.0.0.0).
Comprobar antes: `ss -ltnp | grep -oE '127.0.0.1:8[0-9]{3}' | sort -u`

## Paso a paso (desde la laptop, `ssh gex44`)

### 1. Repo en Gitea

Crear `nilo/fabrica` en https://git.enetradex.com (privado, rama por defecto
`develop`). Subir el contenido de `factory/` como raíz del repo. Desde un clon
del monorepo de GitHub en la laptop:

```bash
git clone -b claude/online-store-factory-9cnbb7 https://github.com/ntdiaz87-sudo/odoo-scem.git
cd odoo-scem
git subtree split --prefix=factory -b fabrica-solo
git remote add gitea git@git.enetradex.com:nilo/fabrica.git
git push gitea fabrica-solo:develop
```

### 2. Primera vez en el servidor

```bash
ssh gex44

# Deploy key propia del proyecto (patrón /opt/*_deploy_key)
ssh-keygen -t ed25519 -f /opt/fabrica_deploy_key -N "" -C "fabrica@gex44"
cat /opt/fabrica_deploy_key.pub
#   → pegarla en Gitea: repo fabrica > Settings > Deploy Keys (solo lectura)

GIT_SSH_COMMAND="ssh -i /opt/fabrica_deploy_key" \
  git clone --branch develop git@git.enetradex.com:nilo/fabrica.git /opt/fabrica
git -C /opt/fabrica config core.sshCommand "ssh -i /opt/fabrica_deploy_key"

cd /opt/fabrica
cp .env.example .env
chmod 600 .env
# EDITAR .env:
#   FACTORY_HOST  → dominio elegido (p. ej. fabrica.enetradex.com)
#   DB_PASSWORD / SUPERADMIN_PASSWORD / COOKIE_SECRET → openssl rand -base64 32

cd infra
docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build
# Primera construcción: varios minutos. La semilla crea las 2 tiendas demo sola.
```

### 3. Caddy (el del host)

En `/etc/caddy/Caddyfile`:

**a)** En el bloque global de opciones (el `{ ... }` inicial; crearlo si no
existe), añadir — necesario para los certificados por tienda:

```
on_demand_tls {
    ask http://127.0.0.1:8260/api/tls-check
}
```

**b)** Bloque del sitio (apex + subdominios de tiendas):

```
fabrica.enetradex.com, *.fabrica.enetradex.com {
    encode zstd gzip
    tls {
        on_demand
    }
    @vendure path /admin-api* /shop-api* /assets* /dashboard* /graphiql* /mailbox*
    handle @vendure {
        reverse_proxy 127.0.0.1:8261
    }
    handle {
        reverse_proxy 127.0.0.1:8260
    }
}
```

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

`/api/tls-check` responde 200 solo para el dominio raíz y para subdominios cuya
tienda existe: Caddy no emite certificados para subdominios inventados.

### 4. DNS (Cloudflare, ambos EN GRIS — naranja mata el HTTP-01)

| Tipo | Nombre | Contenido |
|---|---|---|
| A | `fabrica` | 46.4.98.13 |
| A | `*.fabrica` | 46.4.98.13 |

Zona `enetradex.com` (id `dfd7c99e1db54cd768c2533185974339`) o la zona
`dyxelsolutions.com` si se prefiere ese apellido — mismo procedimiento.

### 5. Comprobaciones

```bash
docker ps --filter name=fabrica          # todo Up
curl -s -o /dev/null -w '%{http_code}\n' https://fabrica.enetradex.com/          # 200
curl -s -o /dev/null -w '%{http_code}\n' https://verdealto.fabrica.enetradex.com/  # 200 (emite cert al vuelo)
ss -ltnp | grep -v 127.0.0.1 | grep -E ':8[0-9]{3}'   # vacío: nada en 0.0.0.0
```

URLs resultantes: `https://fabrica.enetradex.com` (web + demo),
`https://verdealto.` / `https://nocta.` (tiendas), `/dashboard` (panel Vendure,
superadmin + SUPERADMIN_PASSWORD del `.env`).

### 6. CI/CD

Con el repo en Gitea y el clon hecho, **cada push a `develop` despliega solo**
(`.gitea/workflows/deploy-test.yml`, `runs-on: gex44`, solo pasos `run:`).
La verdad del run está en `/opt/act_runner.log` si la UI de Gitea miente.

### Pendientes conocidos

- Añadir la fábrica a los backups (`/opt/backup_*.sh`) cuando haya datos que
  importen — no se añaden solos.
- `ci.sh` con lint/tests antes del paso de despliegue (Fase 1).
- Postgres del stack usa contraseña generada (no repetir el patrón `odoo/odoo`).

---

## Plan B — sin dominio ni Caddy (nip.io, HTTP)

Scripts previos, siguen funcionando para una prueba rápida SIN tocar Caddy:
`deploy/recon.sh` (reconocimiento solo lectura), `deploy/bootstrap-test.sh`
(clona de GitHub a /opt/fabrica y levanta en `<IP>.nip.io:8300` — ojo: en GEX44
el 8300 está ocupado, cambiar el puerto en `docker-compose.yml` si se usa) y
`deploy/set-domain.sh`. Para el GEX44 el camino recomendado es el patrón de la
casa de arriba.
