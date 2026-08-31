# Fábrica de tiendas online — copia local

Guía para tener **todo el sistema corriendo en local**: el motor de comercio,
la web pública, el asistente de creación, el panel del comerciante y las
tiendas. Sin depender del servidor ni de internet (salvo la primera descarga).

## Lo primero, que es donde se tropieza todo el mundo

**La fábrica NO está en la rama `main`.** En `main` vive el proyecto de Odoo,
que es otra cosa. Todo esto está en `claude/online-store-factory-9cnbb7`, y
dentro de la carpeta `factory/`.

Si clonas sin indicar la rama, no encontrarás nada de esto.

## Necesitas

- **Docker Desktop** (Windows o Mac), arrancado.
- **Git**.
- Unos **4 GB de disco** y **6 GB de RAM** libres para los contenedores.
- Nada más: ni Node, ni PostgreSQL, ni configurar variables. Todo va dentro.

## Los tres comandos

```bash
git clone --branch claude/online-store-factory-9cnbb7 https://github.com/ntdiaz87-sudo/odoo-scem.git
cd odoo-scem/factory
docker compose up -d --build
```

Si solo quieres ejecutarlo y no te hace falta el historial, el clon va mucho
más rápido con `--depth 1` añadido al `git clone`. Para actualizar después
sirve igual.

La primera construcción tarda **entre 5 y 15 minutos**: descarga las imágenes
base, instala dependencias y compila las dos aplicaciones. Las siguientes veces
arranca en segundos.

Para seguir el progreso:

```bash
docker compose logs -f
```

Cuando en el log de `vendure` aparezca `[seed] Semilla completada.` y luego
`Vendure server started`, ya está listo.

## Dónde entrar

| Qué | Dirección |
|---|---|
| Web pública de la fábrica | http://localhost:8300 |
| Crear una tienda (asistente) | http://localhost:8300/demo |
| Panel del comerciante | http://localhost:8300/panel |
| Tiendas de ejemplo | http://qingzhu.localhost:8300 · http://noctachina.localhost:8300 |
| Consola de Vendure (avanzada) | http://localhost:8301/dashboard — `superadmin` / `superadmin` |

**Sobre los subdominios `*.localhost`:** cada tienda vive en el suyo. Chrome,
Edge y Firefox los resuelven solos a tu máquina, sin tocar el fichero `hosts`.
Si usas otro navegador y no cargan, esa es la causa.

## Crear tu primera tienda

1. Entra en http://localhost:8300/demo
2. Elige una plantilla (o pide un diseño exclusivo).
3. Pon un nombre, un correo y una contraseña de al menos 8 caracteres.
4. Al terminar te da tres enlaces: tu tienda, tu panel y tus canales.

Ese correo y esa contraseña son tu usuario del panel. La tienda nace con cuatro
productos de ejemplo —sin foto todavía— para que puedas probar el flujo entero:
comprar, cobrar, enviar.

### Dos límites que verás probando, y no son fallos

- **Un correo, una tienda.** Si repites el correo, te dice que ya tiene tienda.
  Usa otro para crear la siguiente.
- **Diez tiendas por hora.** El asistente tiene una válvula anti-abuso por
  dirección de red y en tu portátil todas salen de la misma. A la undécima te
  dirá cuántos minutos faltan. Se libera sola; no hay nada que reiniciar.

## El día a día

```bash
docker compose ps                 # ver qué está levantado
docker compose logs -f web        # log de la web (aquí salen los errores del asistente)
docker compose logs -f vendure    # log del motor
docker compose restart web        # reiniciar solo la web
docker compose down               # parar todo (los datos se conservan)
docker compose up -d              # volver a levantar
```

## Empezar de cero

Si quieres borrar todas las tiendas creadas y volver al estado inicial:

```bash
docker compose down -v            # la -v borra también la base de datos
docker compose up -d --build
```

La semilla vuelve a crear las dos tiendas de ejemplo. **Ojo: esto borra todo lo
que hayas creado en local.** No afecta al servidor.

## Si algo no arranca

**La web responde pero las tiendas dan error.** Casi siempre es que el motor
aún no terminó de arrancar. Mira `docker compose logs vendure`; la primera vez
tarda porque siembra la base.

**El asistente dice «No se pudo crear la tienda».** El motivo real sale en
`docker compose logs --tail 50 web`, en la línea que empieza por `[demo]`. Desde
la propia pantalla también verás entre corchetes en qué paso se rompió.

**Puertos ocupados.** El 8300 y el 8301 tienen que estar libres. Si los usa otra
cosa, cámbialos en `docker-compose.yml` (la parte izquierda de `'8300:3000'`).

**Se quedó sin espacio.** `docker system prune -a` libera imágenes viejas.

**Windows: el reloj de los contenedores.** Si Docker Desktop lleva días
suspendido, el reloj interno se desfasa y las promociones con hora de fin
(秒杀, 拼团) se comportan raro. Reiniciar Docker Desktop lo corrige.

## Lo que NO se lleva la copia local

- **Los pagos reales** (微信支付 / 支付宝): sin credenciales de proveedor, el
  pago se registra como autorizado y lo liquidas tú desde el panel. Es el mismo
  comportamiento que en el servidor hoy.
- **El dominio propio del comerciante**: en local no hay certificados ni DNS.
  El código está, pero se prueba en el servidor.
- **El agente de IA**: necesita una clave de modelo.

## Traer cambios nuevos

Cuando haya trabajo nuevo en la rama, se actualiza con dos comandos. Está en
[`ACTUALIZAR.md`](ACTUALIZAR.md).

## Las pruebas

El sistema trae 16 baterías que abren un navegador de verdad y compran de
verdad. No corren dentro de Docker: necesitan Node y Playwright en tu máquina.
Están explicadas en [`tests/README.md`](tests/README.md).
