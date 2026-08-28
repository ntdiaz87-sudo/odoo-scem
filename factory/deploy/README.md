# Runbook — Fábrica de tiendas en el entorno de TEST (GEX44)

Cómo se monta, actualiza y opera el ambiente de pruebas de la fábrica en el
GEX44 (46.4.98.13), siguiendo el patrón de la casa (runbook de Rober,
2026-08-06): entornos de test aislados, credenciales generadas, y CI/CD con
Gitea donde un push a `develop` despliega solo a test.

## Mapa del despliegue

- **Servidor:** GEX44 — convive con Loki/Grafana, MinIO/backups, runner de CI
  y Sericomerx (`/opt/seric`). La fábrica vive en **`/opt/fabrica`**, con sus
  propios contenedores y volumen de Postgres; no toca nada de lo anterior.
- **Puertos:** UFW del GEX44 permite 22/80/443; el despliegue declara además
  **8300** (web) y **8301** (panel Vendure). Recordatorio del propio runbook:
  los puertos publicados por Docker se saltan UFW — la regla se añade para que
  el firewall refleje la realidad.
- **URLs de test (sin dominio, vía nip.io):**
  - Web pública: `http://46.4.98.13.nip.io:8300`
  - Tiendas: `http://<tienda>.46.4.98.13.nip.io:8300`
  - Panel: `http://46.4.98.13.nip.io:8301/dashboard`
- **Credenciales:** generadas en el servidor al primer despliegue y guardadas
  en `.env.test` junto al `docker-compose.yml`. Nunca se comitean.

## Piezas

| Fichero | Qué hace |
|---|---|
| `deploy/recon.sh` | Reconocimiento de **solo lectura** del servidor (contenedores, puertos, proxys, disco). Ejecutar SIEMPRE antes del primer despliegue y pegar el informe en la sesión de Claude. |
| `deploy/bootstrap-test.sh` | **Primer** despliegue: instala Docker si falta, clona el repo en `/opt/fabrica` y llama a `apply-test.sh`. |
| `deploy/apply-test.sh` | Despliegue **repetible** (idempotente): crea/actualiza `.env.test`, `docker compose up -d --build`, firewall, e imprime URLs y clave. Es lo que ejecuta el CI. |
| `.gitea/workflows/deploy-test.yml` | Workflow de Gitea Actions: push a `develop` → sincroniza a `/opt/fabrica` → `apply-test.sh`. |
| `docker-compose.yml` + `docker-compose.test.yml` | Base + override de test (nip.io:8300, claves desde `.env.test`). |

## Flujo A — Primer despliegue (manual, una sola vez)

```bash
ssh root@46.4.98.13   # o el usuario devops con sudo

# 1. Reconocimiento (no cambia nada; pegar el informe en Claude para revisión)
curl -fsSL https://raw.githubusercontent.com/ntdiaz87-sudo/odoo-scem/claude/online-store-factory-9cnbb7/factory/deploy/recon.sh | bash

# 2. Con luz verde, desplegar
curl -fsSL https://raw.githubusercontent.com/ntdiaz87-sudo/odoo-scem/claude/online-store-factory-9cnbb7/factory/deploy/bootstrap-test.sh | bash
```

Actualizar a mano más tarde: `bash /opt/fabrica/factory/deploy/apply-test.sh`
(tras un `git -C /opt/fabrica pull`).

## Flujo B — CI/CD con Gitea (patrón Bussiness)

Objetivo final: la fábrica en su **repo propio de Gitea** (p. ej.
`nilo/fabrica`) con el contenido de `factory/` en la raíz, y cada push a
`develop` desplegando a test automáticamente.

1. **Crear el repo en Gitea** (`nilo/fabrica`, rama por defecto `develop`).
2. **Subir el contenido de `factory/` como raíz del nuevo repo.** Desde un
   clon del monorepo de GitHub:
   ```bash
   git subtree split --prefix=factory -b fabrica-solo
   git push <remote-gitea> fabrica-solo:develop
   ```
3. **Runner:** en `.gitea/workflows/deploy-test.yml`, cambiar `runs-on` por el
   label real del runner del GEX44 (el mismo que usa el deploy de Bussiness).
   El runner necesita poder ejecutar `rsync`, `docker compose` y escribir en
   `/opt/fabrica` (mismo esquema que ya funciona para Bussiness).
4. **Migración del estado manual:** el layout del CI deja el compose en
   `/opt/fabrica/docker-compose.yml` (raíz plana). Si antes se usó el Flujo A
   (layout monorepo con `factory/` dentro), conservar la clave:
   ```bash
   mv /opt/fabrica/factory/.env.test /tmp/fabrica-env-backup
   rm -rf /opt/fabrica && mkdir -p /opt/fabrica
   mv /tmp/fabrica-env-backup /opt/fabrica/.env.test
   ```
   y lanzar el primer push a `develop`.

Desde entonces: los cambios se desarrollan aquí (sesión de Claude → GitHub) o
directamente en Gitea, y **todo push a `develop` = test actualizado**.

## Operación diaria

```bash
cd /opt/fabrica            # (o /opt/fabrica/factory en layout monorepo)
docker compose ps          # estado
docker compose logs -f web       # logs de la web
docker compose logs -f vendure   # logs del motor
docker compose restart web       # reinicio suave
docker compose down        # parar (el volumen de datos se conserva)
```

Resembrar desde cero (borra las tiendas de prueba): `docker compose down -v`
y volver a ejecutar `apply-test.sh`.

## Pendientes / por confirmar

- **Label del runner** de GEX44 y URL del Gitea (tomar como referencia el
  workflow de Bussiness).
- **Qué sirve hoy 80/443 en GEX44** (respondió 403; lo dirá `recon.sh`).
- **Cloudflare:** al validar el test, pasar a `testfabrica.dyxelsolutions.com`
  con HTTPS como Bussiness. Salvedad: los subdominios de tiendas
  (`x.testfabrica...`) son de segundo nivel y el certificado Universal de
  Cloudflare no los cubre — se resolverá en esa fase (opciones sin coste:
  tiendas por ruta en test, o cert de origen + DNS only).
- Este entorno es de **pruebas**: sin HTTPS y con wizard de demo sin captcha
  ni límites (llegan en Fase 1). No usar datos reales.
