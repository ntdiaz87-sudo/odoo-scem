# Cómo se despliega un proyecto nuevo en Hetzner (GEX44)

Runbook portable del patrón de la casa. Sirve para levantar **cualquier
proyecto nuevo** en el servidor compartido sin tocar lo que ya corre.

Está escrito desde dos despliegues reales (Qbaprotic y la fábrica de tiendas),
no desde la teoría. Todo lo que aparece aquí se ha ejecutado.

> **Sobre las credenciales.** Este documento **no contiene ningún valor
> secreto**, a propósito: un `.md` acaba en un repo, y ahí es donde se filtran
> las claves. Lo que contiene es el **inventario completo** — qué credencial
> hace falta, dónde vive la buena, quién la emite y el comando exacto para
> crearla o rotarla. Con eso, quien despliegue puede generarlas todas en unos
> minutos sin depender de que alguien le pase nada por chat.

---

## 1. El terreno

| Cosa | Valor | Cómo confirmarlo |
|---|---|---|
| Servidor | Hetzner **GEX44** | `ssh gex44` |
| IP pública | `46.4.98.13` | `curl -4 ifconfig.me` en el server |
| Docker | instalado, en uso por varios proyectos | `docker ps` |
| Reverse proxy | **Caddy del host** (no en contenedor) | `systemctl is-active caddy` |
| TLS | Caddy, automático (Let's Encrypt) | — |
| Git privado | **Gitea** en `https://git.enetradex.com` | — |
| CI | **act_runner** de Gitea, etiqueta `gex44`, **modo host** | `cat /opt/act_runner.log` |
| DNS | Cloudflare | — |

**Antes de nada, reconocimiento de solo lectura.** No instales ni cambies nada
hasta haber leído el estado real:

```bash
ssh gex44
bash -s < deploy/recon.sh     # o pega el script; solo lee, no toca
```

### Mapa de puertos (verificado 2026-08-28 — **vuelve a comprobarlo**)

| Puerto | Quién | Interfaz |
|---|---|---|
| 8250 | seric | `0.0.0.0` ⚠️ expuesto |
| 8260 | fábrica — web | `127.0.0.1` |
| 8261 | fábrica — vendure | `127.0.0.1` |
| 8300 | ocupado | — |

```bash
# Elige tu par de puertos entre los que salgan LIBRES:
ss -ltnp | grep -oE ':8[0-9]{3}' | sort -u
```

---

## 2. La arquitectura del patrón

```
laptop / Claude Code
      │  git push
      ▼
GitHub (monorepo)  ──[workflow: git subtree split]──►  Gitea  nilo/<proyecto>  (rama develop)
                          usa el secreto GITEA_TOKEN                    │
                                                                        │ push a develop
                                                                        ▼
                                                    act_runner `gex44` (modo host)
                                                                        │
                                            git fetch+reset en /opt/<proyecto>
                                            docker compose up -d --build
                                                                        │
                                            contenedores en 127.0.0.1:<puertos>
                                                                        ▼
                                            Caddy del host  →  TLS + dominio
                                                                        ▲
                                                          Cloudflare DNS (registros EN GRIS)
```

Dos decisiones que sostienen todo lo demás:

- **Los contenedores publican solo en `127.0.0.1`.** Nada escucha en `0.0.0.0`.
  El único que ve internet es Caddy. Si un puerto tuyo aparece en `0.0.0.0`,
  está mal.
- **Caddy es del host, no del stack.** Cada proyecto añade UN bloque al
  `Caddyfile` común. Nadie levanta su propio proxy.

El puente GitHub→Gitea es **opcional**: si el proyecto vive directamente en
Gitea, sáltate el paso 8.

---

## 3. Inventario de credenciales y llaves

Ocho credenciales. Ninguna se comparte entre proyectos.

| # | Credencial | Dónde vive la buena | Quién la emite | Cómo se crea / rota |
|---|---|---|---|---|
| 1 | **Acceso SSH al GEX44** | `~/.ssh/config` de la laptop (host `gex44`) | El dueño del servidor | `ssh-keygen -t ed25519 -C tu@correo` → pega la pública en `/root/.ssh/authorized_keys` del server |
| 2 | **Deploy key del proyecto** | `/opt/<proyecto>_deploy_key` en el server | Tú, en el server | Ver §5.2. Solo lectura. Una por proyecto |
| 3 | **`GITEA_TOKEN`** | Secreto de GitHub Actions del monorepo | Gitea → *Settings → Applications → Access Tokens* | Ver §3.1. Permiso mínimo: escritura en ese repo |
| 4 | **`DB_PASSWORD`** | `/opt/<proyecto>/.env` (chmod 600) | Tú | `openssl rand -base64 32` |
| 5 | **`SUPERADMIN_PASSWORD`** | idem | Tú | `openssl rand -base64 32` |
| 6 | **`COOKIE_SECRET`** | idem | Tú | `openssl rand -base64 32` |
| 7 | **Cuenta de Cloudflare** | Panel web (o token de API si automatizas) | Cloudflare | Token: *My Profile → API Tokens → Edit zone DNS*, limitado a la zona |
| 8 | **Registro del act_runner** | Ya registrado en el GEX44 | Gitea → *Site Administration → Runners* | Solo si el runner se cae: token nuevo y `act_runner register` |

**Regla que no se negocia:** los secretos de producción y los de desarrollo son
**distintos**. El `.env` real **nunca** se comitea.

### 3.1 Crear el `GITEA_TOKEN`

1. `https://git.enetradex.com` → avatar → **Settings → Applications → Access Tokens**.
2. Nombre: `github-sync-<proyecto>`. Permisos: `repository: write` (nada más).
3. **Genera y cópialo ahora**: Gitea no lo vuelve a enseñar.
4. En GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**, nombre `GITEA_TOKEN`.

Rotarlo = borrar el viejo en Gitea, crear uno nuevo, actualizar el secreto en
GitHub. Nada más se entera.

### 3.2 Generar los tres secretos del `.env`

```bash
ssh gex44
cd /opt/<proyecto>
printf 'DB_PASSWORD=%s\n'          "$(openssl rand -base64 32)" >> .env
printf 'SUPERADMIN_PASSWORD=%s\n'  "$(openssl rand -base64 32)" >> .env
printf 'COOKIE_SECRET=%s\n'        "$(openssl rand -base64 32)" >> .env
chmod 600 .env
```

### 3.3 Dónde mirar si te falta una

| Necesitas | Mira en |
|---|---|
| Secretos del stack en producción | `/opt/<proyecto>/.env` en el GEX44 |
| ¿Está puesto el `GITEA_TOKEN`? | GitHub → Settings → Secrets (verás el nombre, **nunca** el valor) |
| Clave del superadmin de un stack | `grep SUPERADMIN_PASSWORD /opt/<proyecto>/.env` |
| Huella de la deploy key | `ssh-keygen -lf /opt/<proyecto>_deploy_key.pub` |

Un secreto de GitHub Actions **no se puede leer** una vez guardado, ni por ti ni
por nadie. Si lo perdiste, no lo recuperas: generas uno nuevo.

---

## 4. Lo que toca un despliegue nuevo (y nada más)

| Dónde | Qué |
|---|---|
| `/opt/<proyecto>` | Clon del repo + `.env` + contenedores y volúmenes propios |
| `/opt/<proyecto>_deploy_key(.pub)` | Deploy key de solo lectura |
| `/etc/caddy/Caddyfile` | UN bloque nuevo |
| Cloudflare | 1–2 registros A **en gris** |

Si tu despliegue necesita tocar algo fuera de esta lista, para y replantéalo.

---

## 5. Paso a paso

### 5.1 Repo en Gitea

Crea `nilo/<proyecto>` en `https://git.enetradex.com` — **privado**, rama por
defecto **`develop`**.

Si el código vive en un subdirectorio de un monorepo de GitHub:

```bash
git clone -b <rama> https://github.com/<owner>/<monorepo>.git
cd <monorepo>
git subtree split --prefix=<subdir> -b solo-proyecto
git remote add gitea git@git.enetradex.com:nilo/<proyecto>.git
git push gitea solo-proyecto:develop
```

### 5.2 Primera vez en el servidor

```bash
ssh gex44

# Deploy key propia del proyecto (patrón /opt/*_deploy_key)
ssh-keygen -t ed25519 -f /opt/<proyecto>_deploy_key -N "" -C "<proyecto>@gex44"
cat /opt/<proyecto>_deploy_key.pub
#   → pégala en Gitea: repo → Settings → Deploy Keys (SOLO LECTURA)

GIT_SSH_COMMAND="ssh -i /opt/<proyecto>_deploy_key" \
  git clone --branch develop git@git.enetradex.com:nilo/<proyecto>.git /opt/<proyecto>
git -C /opt/<proyecto> config core.sshCommand "ssh -i /opt/<proyecto>_deploy_key"

cd /opt/<proyecto>
cp .env.example .env
chmod 600 .env
$EDITOR .env          # dominio, puertos, y los tres secretos de §3.2
```

### 5.3 El `.env`

Plantilla — el repo debe traer un `.env.example` con esto y **sin un solo valor
real**:

```dotenv
STACK=<proyecto>
APP_HOST=<proyecto>.enetradex.com

# Puertos SOLO en 127.0.0.1 — comprueba que siguen libres (§1)
WEB_PORT=82XX
API_PORT=82XY

DB_PASSWORD=CAMBIAR-openssl-rand
SUPERADMIN_PASSWORD=CAMBIAR-openssl-rand
COOKIE_SECRET=CAMBIAR-openssl-rand
```

### 5.4 `infra/docker-compose.prod.yml`

Se invoca **siempre** con `--env-file ../.env`:

```yaml
name: ${STACK}          # aísla contenedores, redes y volúmenes de este proyecto

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [db_data:/var/lib/postgresql/data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U app -d app']
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  api:
    build: ../api
    depends_on:
      db: { condition: service_healthy }
    environment:
      DB_HOST: db
      DB_PASSWORD: ${DB_PASSWORD}
      COOKIE_SECRET: ${COOKIE_SECRET}
    ports: ['127.0.0.1:${API_PORT}:3000']    # ← 127.0.0.1 SIEMPRE
    restart: unless-stopped

  web:
    build: ../web
    depends_on: [api]
    environment:
      PUBLIC_URL: https://${APP_HOST}
    ports: ['127.0.0.1:${WEB_PORT}:3000']
    restart: unless-stopped

volumes:
  db_data:
```

Levantarlo:

```bash
cd /opt/<proyecto>/infra
docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build
```

### 5.5 Caddy (el del host)

Edita `/etc/caddy/Caddyfile` y **añade un bloque**; no reescribas los ajenos.

```caddy
<proyecto>.enetradex.com {
    encode zstd gzip
    @api path /api* /assets*
    handle @api {
        reverse_proxy 127.0.0.1:82XY
    }
    handle {
        reverse_proxy 127.0.0.1:82XX
    }
}
```

```bash
caddy validate --config /etc/caddy/Caddyfile   # valida ANTES de recargar
systemctl reload caddy
```

**Si el proyecto necesita subdominios con certificado propio** (un dominio por
cliente), añade al bloque global `{ ... }` del principio del `Caddyfile`:

```caddy
on_demand_tls {
    ask http://127.0.0.1:82XX/api/tls-check
}
```

…y en tu bloque de sitio, `tls { on_demand }` con el comodín en el nombre:
`<proyecto>.dominio.com, *.<proyecto>.dominio.com`.

Tu app tiene que servir ese `/api/tls-check`: recibe `?domain=` y responde
**200 solo si ese subdominio existe de verdad**, 404 si no. Sin esa
comprobación, cualquiera pide certificados infinitos contra tu servidor y
Let's Encrypt te limita.

### 5.6 DNS en Cloudflare — **EN GRIS**

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `<proyecto>` | `46.4.98.13` | 🔘 **Gris (DNS only)** |
| A | `*.<proyecto>` | `46.4.98.13` | 🔘 **Gris** — solo si usas subdominios |

Zona `enetradex.com`, id `dfd7c99e1db54cd768c2533185974339`.

**La nube naranja mata el desafío HTTP-01 y Caddy no consigue certificado.**
Es el fallo número uno de este patrón. Gris.

### 5.7 CI: despliegue automático

`.gitea/workflows/deploy.yml` en el repo:

```yaml
name: Desplegar <proyecto>

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: gex44
    steps:
      - name: Traer develop
        run: |
          set -e
          git -C /opt/<proyecto> fetch origin --prune --force
          git -C /opt/<proyecto> reset --hard origin/develop
          git -C /opt/<proyecto> log -1 --oneline

      - name: Levantar el stack
        run: |
          set -e
          cd /opt/<proyecto>/infra
          docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build

      - name: Verificar
        run: |
          set -e
          HOST=$(grep '^APP_HOST=' /opt/<proyecto>/.env | cut -d= -f2)
          for i in $(seq 1 30); do
            COD=$(curl -s -o /dev/null -w "%{http_code}" "https://$HOST/" || true)
            [ "$COD" = "200" ] && echo "OK" && exit 0
            sleep 4
          done
          echo "FALLO: $COD"
          docker logs --tail 50 <proyecto>-web-1 || true
          exit 1
```

**Tres reglas del runner `gex44`, en modo host:**

1. **Solo pasos `run:`.** Nada de acciones JS (`uses: actions/checkout@v4`
   incluido). Por eso el paso 1 es un `git fetch` a mano.
2. **Nada de `services:`.**
3. El runner corre **como root en el host**, no en un contenedor: ve `/opt` y
   habla con el Docker de verdad.

### 5.8 Puente GitHub → Gitea (opcional)

Si el código vive en un monorepo de GitHub, `.github/workflows/sync.yml`:

```yaml
name: Sincronizar <proyecto> a Gitea

on:
  push:
    branches: [<tu-rama>]
    paths: ['<subdir>/**']
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Subtree a Gitea develop
        env:
          GITEA_TOKEN: ${{ secrets.GITEA_TOKEN }}
        run: |
          set -e
          if [ -z "$GITEA_TOKEN" ]; then
            echo "Falta el secreto GITEA_TOKEN."; exit 1
          fi
          git subtree split --prefix=<subdir> -b solo-proyecto
          git push --force \
            "https://nilo:${GITEA_TOKEN}@git.enetradex.com/nilo/<proyecto>.git" \
            solo-proyecto:develop
```

`fetch-depth: 0` no es opcional: `git subtree split` necesita el historial
entero.

### 5.9 Verificación

```bash
docker ps --filter name=<proyecto>                                  # todo Up
curl -s -o /dev/null -w '%{http_code}\n' https://<proyecto>.enetradex.com/   # 200
ss -ltnp | grep -v 127.0.0.1 | grep -E ':8[0-9]{3}'                 # VACÍO
caddy validate --config /etc/caddy/Caddyfile                        # valid
```

Y una prueba de humo contra el **despliegue real**, no contra el servidor de
desarrollo. Que la portada dé 200 no dice nada: comprueba también los
estáticos, que es donde se rompe sin avisar (§7).

---

## 6. Reglas de la casa

1. **No romper nada de lo que ya corre.** El servidor es compartido.
2. **No instalar nada sin comprobar antes** que no está ya instalado, y sin
   preguntar.
3. **Puertos solo en `127.0.0.1`.**
4. **Caddy del host.** Un bloque nuevo, jamás tocar los ajenos.
5. **DNS en gris.**
6. **Un `STACK` por proyecto** en el compose: aísla contenedores, redes y
   volúmenes.
7. **El `.env` real nunca se comitea.** El repo lleva `.env.example` con
   marcadores.
8. **`caddy validate` antes de `systemctl reload`.** Un `Caddyfile` roto tumba
   los sitios de todos.

---

## 7. Trampas conocidas (todas pagadas ya)

| Síntoma | Causa | Arreglo |
|---|---|---|
| Caddy no consigue certificado | Registro DNS **en naranja** | Ponlo en gris |
| El CI falla en el primer paso | El runner en modo host **no ejecuta acciones JS** | Solo pasos `run:` |
| La UI de Gitea dice cosas raras del run | La verdad está en el log del runner | `cat /opt/act_runner.log` |
| El sitio da 200 pero **sin imágenes ni tipografías** | `output: 'standalone'` de Next **no incluye `public/`** | `COPY --from=builder /app/public ./public` en el Dockerfile |
| Se ve a medias y nada falla | Los 404 de estáticos no rompen el arranque | Prueba de humo que compruebe estáticos, contra el despliegue real |
| `git subtree split` se queja del historial | Falta `fetch-depth: 0` | Añádelo al checkout |
| Puerto ocupado al levantar | Otro proyecto lo cogió | Recomprueba con `ss -ltnp` **el día del despliegue** |
| Certificados infinitos con `on_demand` | Falta el `ask` | Implementa `/api/tls-check` con 404 para lo inexistente |
| Contenedores de otro proyecto se mezclan | Falta `name: ${STACK}` | Ponlo |

---

## 8. Backups

**No se añaden solos.** Existen scripts `/opt/backup_*.sh` en el GEX44; si tu
proyecto tiene datos que importan, añádelo **a mano** el día que empiece a
tener datos de verdad, no "más adelante".

```bash
ls /opt/backup_*.sh
```

---

## 9. Checklist de despliegue

```
[ ] recon.sh ejecutado; puertos libres elegidos y anotados
[ ] Repo en Gitea, privado, rama por defecto develop
[ ] Deploy key /opt/<proyecto>_deploy_key creada y pegada en Gitea (solo lectura)
[ ] Clon en /opt/<proyecto> con core.sshCommand configurado
[ ] .env creado, chmod 600, tres secretos generados con openssl
[ ] .env.example en el repo, sin un solo valor real
[ ] docker-compose.prod.yml con name: ${STACK} y puertos en 127.0.0.1
[ ] Stack levantado; docker ps limpio
[ ] Bloque de Caddy añadido; caddy validate OK; reload hecho
[ ] DNS en Cloudflare, EN GRIS
[ ] https://<proyecto>.<dominio>/ → 200
[ ] ss -ltnp sin nada en 0.0.0.0
[ ] .gitea/workflows/deploy.yml en el repo; push a develop despliega solo
[ ] GITEA_TOKEN en los secretos de GitHub (si usas el puente)
[ ] Prueba de humo contra el despliegue real, estáticos incluidos
[ ] Backup añadido, o anotado como pendiente con fecha
```

---

## 10. Ficheros de referencia en este repo

| Fichero | Para qué |
|---|---|
| `factory/deploy/README.md` | El mismo runbook, ya concretado en un proyecto |
| `factory/deploy/recon.sh` | Reconocimiento de solo lectura del servidor |
| `factory/infra/docker-compose.prod.yml` | Compose de producción real |
| `factory/.gitea/workflows/deploy-test.yml` | Workflow del runner, real |
| `.github/workflows/sync-fabrica.yml` | Puente GitHub→Gitea, real |
| `factory/.env.example` | Plantilla de entorno |
| `factory/web/Dockerfile` | Build multi-etapa con el arreglo de `public/` |
| `factory/web/app/api/tls-check/route.ts` | Endpoint `ask` del on-demand TLS |

---

*Escrito desde los despliegues de Qbaprotic y de la fábrica de tiendas.
El mapa de puertos y la IP se verificaron el 2026-08-28: vuelve a comprobarlos
el día que despliegues.*
