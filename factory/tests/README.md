# Las pruebas de la fábrica

Todas son **de punta a punta**: abren un navegador de verdad, crean tiendas de
verdad contra el motor y comprueban lo que ve una persona. No hay mocks. Si una
pasa, ese camino funciona; si falla, algo se rompió de verdad.

## El loop

```bash
node tests/todas.mjs              # las 15 baterías, con resumen al final
node tests/todas.mjs marketing    # solo las que casen con el filtro
```

Sale con código 1 si algo falla, así que se puede encadenar:

```bash
node tests/todas.mjs && git push -u origin <rama>
```

Tarda entre 20 y 30 minutos completo: cada batería monta su propia tienda,
compra de verdad y espera a que el motor procese.

## Antes de correrlo: la réplica local

Las pruebas hablan con **Next en 8300** y **Vendure en 3000**. En el contenedor
de desarrollo:

```bash
su postgres -s /bin/bash -c "/usr/lib/postgresql/*/bin/pg_ctl -D /var/lib/postgresql/fabrica -l /tmp/pg.log start"
cd factory/vendure && . /tmp/venv.sh && setsid nohup npm run start > /tmp/vendure.log 2>&1 & disown
cd factory/web     && setsid nohup npx next dev -p 8300  > /tmp/next.log    2>&1 & disown
```

`todas.mjs` comprueba que ambos responden y se planta si no.

## Qué cubre cada una

| Batería | Qué demuestra |
|---|---|
| `flows` | El recorrido entero: landing, asistente, tienda creada, carrito, aislamiento, MCP |
| `qa-mercado` | Cada tienda vende en el idioma y la moneda de SU comerciante |
| `qa-multitienda` | Tres tiendas a la vez, cada una con su diseño y contraste legible |
| `qa-panel` | La puerta del back office: sesión, permisos, aislamiento |
| `qa-panel-tema` | El panel se pinta con el diseño de la tienda de su dueño |
| `qa-backoffice` | El back office completo (necesita `fixtura-backoffice.mjs`; `todas.mjs` la monta sola) |
| `qa-pedidos` | Variantes 颜色×尺码, envío del comerciante y pedido con todo aplicado |
| `qa-seguimiento` | El comprador consulta su pedido sin cuenta |
| `qa-marketing` | 优惠券 (cupones), 秒杀 (ofertas) y 分销 (distribuidores con comisión) |
| `qa-pintuan` | 拼团: abrir grupo, compartir, unirse y completar |
| `qa-clientes` | Clientes, segmentos y 会员储值 desde el panel |
| `qa-cuenta` | Cuenta del comprador y pago con su saldo |
| `qa-dominio` | Dominio propio: TXT, verificación, certificado y canónico |
| `qa-mcp` | El agente ve exactamente lo mismo que el panel (API unificada) |
| `qa-edge` | Casos límite y la válvula anti-abuso |

## La pasada visual

Las baterías dicen si algo **funciona**; no si se **ve** bien. Un botón que se
parte en tres renglones pasa todas las pruebas.

```bash
node tests/visual.mjs   # 14 capturas: móvil y escritorio, home en 3 idiomas
```

Monta una tienda con todo encendido (variantes, 拼团, cupón, 秒杀, distribuidor,
cliente con saldo) y deja los PNG en disco para mirarlos.

## Reglas al escribir una batería nueva

- **Una IP propia por batería** (`x-forwarded-for`): la válvula anti-abuso
  cuenta creaciones por IP y una tanda entera se toparía con el límite.
- **Nunca `button[type=submit]` a secas** en una página autenticada: el primer
  submit de toda página del panel es *salir*. Apunta al formulario concreto.
- **Playwright manda `accept-language: en-US`**, así que el panel sale en
  inglés aunque la tienda venda en chino. Usa selectores estructurales, no
  textos, salvo cuando el texto es justo lo que se comprueba.
- **Comprueba dentro de la MISMA tarjeta** (`.st-prod` filtrado): elegir una
  variante en una tarjeta y comprar en otra fue un fallo real de una prueba.
