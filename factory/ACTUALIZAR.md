# Actualizar tu copia local

Cuando haya trabajo nuevo en la rama, así lo traes a tu portátil. La guía de
instalación desde cero está en [`LOCAL.md`](LOCAL.md).

## Lo normal: dos comandos

Desde `odoo-scem/factory`:

```bash
git pull origin claude/online-store-factory-9cnbb7
docker compose up -d --build
```

Eso trae los cambios, reconstruye lo que haga falta y relanza. Docker reutiliza
lo que no cambió, así que suele tardar entre uno y tres minutos, no como la
primera vez.

Comprueba que quedó bien:

```bash
docker compose ps                 # los tres servicios en "running"
docker compose logs --tail 20 vendure
```

En el log de `vendure` tiene que aparecer `[seed] Semilla completada.` y después
`Vendure server started`. Si se queda antes, mira más abajo.

## Ver qué ha cambiado antes de traerlo

```bash
git fetch origin claude/online-store-factory-9cnbb7
git log --oneline HEAD..origin/claude/online-store-factory-9cnbb7
```

Te lista los commits nuevos con su descripción. Los mensajes cuentan qué se
arregló y por qué.

## Qué hace falta según lo que cambie

| Qué cambió | Qué hacer |
|---|---|
| Textos, estilos, páginas | `up -d --build` |
| Código del motor o un plugin nuevo | `up -d --build` (reconstruye Vendure) |
| Campos nuevos en la base | nada especial: se crean solos al arrancar |
| Solo documentación | nada, es un `git pull` y ya |
| Una batería o el loop de pruebas | nada: corren fuera de Docker |

**No hace falta borrar la base de datos casi nunca.** El esquema se sincroniza
solo al arrancar el motor, y las tiendas que hayas creado en local se conservan
entre actualizaciones.

## Si el `git pull` se queja

Es porque tocaste ficheros en local. Para ver cuáles:

```bash
git status
```

Si esos cambios no te importan:

```bash
git checkout -- .
git pull origin claude/online-store-factory-9cnbb7
```

Si sí te importan, guárdalos antes:

```bash
git stash
git pull origin claude/online-store-factory-9cnbb7
git stash pop
```

## Si algo se rompe después de actualizar

**El motor no arranca.** Mira el log entero: `docker compose logs vendure`. Si
la semilla muere, el motor no llega a levantar y todo lo que hable con él falla
—incluida la creación de tiendas—. Pégame ese log y lo arreglo.

**La web arranca pero se ve rara.** Suele ser caché del navegador con estilos
viejos. Recarga forzando: `Ctrl` + `Shift` + `R`.

**Una tienda se ve rara pero la fábrica no.** Las tiendas son instalables como
aplicación (PWA) y guardan un service worker con la versión anterior. En las
herramientas del navegador, pestaña *Application* → *Service Workers* →
*Unregister*, y recarga.

**La construcción falla a medias.** Reconstruye sin caché:

```bash
docker compose build --no-cache
docker compose up -d
```

**Nada de eso funciona.** Vuelta a cero, que borra las tiendas locales pero no
toca el servidor:

```bash
docker compose down -v
docker compose up -d --build
```

## Volver a una versión anterior

Si una actualización te deja algo peor y quieres retroceder mientras lo
arreglamos:

```bash
git log --oneline -10          # localiza el commit bueno
git checkout <ese-commit>
docker compose up -d --build
```

Y para volver a lo último:

```bash
git checkout claude/online-store-factory-9cnbb7
git pull origin claude/online-store-factory-9cnbb7
docker compose up -d --build
```

## Las pruebas, después de actualizar

Si quieres comprobar que todo sigue en pie tras traer cambios, las 16 baterías
se explican en [`tests/README.md`](tests/README.md). No corren dentro de Docker:
necesitan Node y Playwright en tu máquina.
