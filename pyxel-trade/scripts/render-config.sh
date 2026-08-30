#!/usr/bin/env bash
#
# Genera config/odoo.conf a partir de la plantilla, sustituyendo las
# variables del .env. El fichero resultante lleva secretos y está excluido
# de git; sólo se versiona la plantilla.
#
#   bash scripts/render-config.sh
#
# Por qué existe en vez de un `envsubst` suelto: envsubst viene en
# gettext-base, que puede no estar en el servidor. Y el GEX44 es compartido
# y en producción: instalar paquetes ahí no es una decisión que deba tomar
# un script sin avisar. Así que se intenta envsubst, se cae a python3, y si
# no hay ninguno se dice exactamente qué falta.

set -euo pipefail

cd "$(dirname "$0")/.."

PLANTILLA="config/odoo.conf.template"
SALIDA="config/odoo.conf"

[[ -f .env ]] || { echo "Falta el fichero .env." >&2; exit 1; }
[[ -f "$PLANTILLA" ]] || { echo "Falta $PLANTILLA." >&2; exit 1; }

set -a; . ./.env; set +a

for var in ODOO_ADMIN_PASSWD ODOO_DB ODOO_WORKERS; do
    [[ -n "${!var:-}" ]] || { echo "La variable $var está vacía en .env." >&2; exit 1; }
done

if command -v envsubst >/dev/null 2>&1; then
    envsubst < "$PLANTILLA" > "$SALIDA"
    metodo="envsubst"
elif command -v python3 >/dev/null 2>&1; then
    # safe_substitute deja intacto lo que no reconozca, en vez de reventar.
    python3 -c '
import os, string, sys
with open(sys.argv[1]) as f:
    plantilla = string.Template(f.read())
with open(sys.argv[2], "w") as f:
    f.write(plantilla.safe_substitute(os.environ))
' "$PLANTILLA" "$SALIDA"
    metodo="python3"
else
    echo "No hay ni envsubst ni python3 en este servidor." >&2
    echo "Instala gettext-base (apt-get install -y gettext-base) y repite." >&2
    exit 1
fi

# El contenedor de Odoo NO corre como root: si el fichero queda en 600 y
# propiedad de root, Odoo no puede leerlo, ve una configuracion vacia y
# muere con un NoSectionError que no explica nada. Se le da al usuario
# odoo de la imagen, cuyo uid se consulta en vez de adivinarlo.
IMAGEN=$(grep -E '^ODOO_IMAGE=' .env | cut -d= -f2)
UID_ODOO=$(docker run --rm --entrypoint id "$IMAGEN" -u odoo 2>/dev/null || echo "")
if [ -n "$UID_ODOO" ]; then
    chown "$UID_ODOO:$UID_ODOO" "$SALIDA"
    chmod 640 "$SALIDA"
else
    # Sin poder consultar el uid, legible para todos: peor que 640, pero
    # arrancar es mejor que un fallo incomprensible.
    chmod 644 "$SALIDA"
fi

# Si queda alguna variable sin sustituir, Odoo arrancaría con basura en la
# configuración. Mejor fallar aquí y en voz alta.
if grep -q '\${' "$SALIDA"; then
    echo "Quedaron variables sin sustituir en $SALIDA:" >&2
    grep -n '\${' "$SALIDA" >&2
    rm -f "$SALIDA"
    exit 1
fi

echo "Generado $SALIDA con $metodo."
