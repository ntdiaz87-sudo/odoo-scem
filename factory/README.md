# Fábrica de Tiendas Online — Fase 0

Primer entregable del loop (ver `../docs/fabrica-tiendas/diseno-y-plan.md`):
la web pública de la empresa con demo instantáneo y el motor multi-tienda.

## Qué incluye

- **`vendure/`** — Motor de comercio (Vendure 3.7 + PostgreSQL). Cada tienda es
  un *Channel* con catálogo, nombre y diseño propios (campos personalizados
  `displayName`, `design`, `isSandbox`). La semilla `npm run seed:demo` crea
  las dos tiendas demo: **Verdealto** (diseño "Hoja viva") y **NOCTA**
  (diseño "Nocta").
- **`web/`** — Web pública + storefront (Next.js 15):
  - Landing de la empresa con planes (precios como `[marcadores]` hasta decidirlos).
  - `/demo`: wizard "Crear mi tienda demo" → provisiona un canal sandbox con
    productos de ejemplo y redirige a su subdominio.
  - Storefront multi-tenant: `tienda.<dominio-raíz>` se resuelve por el
    subdominio (middleware) y se renderiza con los tokens de diseño del canal.
- **`docker-compose.yml`** — Todo junto: `db` (PostgreSQL 16), `vendure`
  (API + dashboard + semilla) y `web`.

## Cómo levantarlo (Docker)

```bash
cd factory
docker compose up -d --build
```

| URL | Qué es |
|---|---|
| http://localhost:8300 | Web pública de la fábrica (landing + demo) |
| http://verdealto.localhost:8300 | Tienda demo "Verdealto" |
| http://nocta.localhost:8300 | Tienda demo "NOCTA" |
| http://localhost:8301/dashboard | Panel de administración Vendure (`superadmin` / `superadmin`) |

Los subdominios `*.localhost` resuelven solos en Chrome, Edge y Firefox.
La primera construcción tarda varios minutos (compila Vendure y su dashboard).

## Desarrollo sin Docker

Con PostgreSQL local (base `vendure`, usuario/clave `vendure`):

```bash
cd factory/vendure && npm install && npm run seed:demo && npm run dev:server
cd factory/web && npm install && npm run dev   # http://localhost:8300
```

## Variables de entorno principales

| Variable | Servicio | Por defecto | Uso |
|---|---|---|---|
| `NEXT_PUBLIC_ROOT_DOMAIN` | web | `localhost:8300` | Dominio raíz; los subdominios son las tiendas. Cambiar al dominio real al publicar. |
| `NEXT_PUBLIC_ROOT_URL` | web | `http://localhost:8300` | URL absoluta de la web pública (enlaces desde las tiendas). |
| `VENDURE_API_URL` | web | `http://localhost:3000` | URL interna del API de Vendure. |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` | vendure | `localhost` / `5432` / `vendure`×3 | Conexión PostgreSQL. |
| `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` | ambos | `superadmin` | Credenciales de administración (el web las usa para provisionar demos). |

## Avisos de la Fase 0 (pendientes para fases siguientes)

- Credenciales y `COOKIE_SECRET` son de desarrollo: **cambiarlas antes de
  exponer esto a internet** (Fase 1).
- El esquema de BD usa `synchronize: true` (cómodo en fase 0); antes de
  producción real se pasa a migraciones.
- El wizard demo no tiene límite de creación ni captcha (se añade en Fase 1
  junto con registro/login y caducidad de sandboxes).
- Los presets de diseño están duplicados en `vendure/src/designs.ts` y
  `web/lib/designs.ts`; en la Fase 2 los sustituye el diseñador agéntico.

<!-- despliegue continuo activo: GitHub → Gitea → CI GEX44 -->
