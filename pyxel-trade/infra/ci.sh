#!/usr/bin/env bash
#
# Comprobaciones antes de desplegar. Se ejecuta en el paso «Lint + tests»
# del workflow y también en local, igual que el ci.sh de Qbaprotic.
#
#   bash infra/ci.sh
#
# No sustituye a arrancar Odoo, pero atrapa en segundos los fallos que si
# no aparecen a mitad de la instalacion de modulos, con la base ya tocada.

set -uo pipefail
cd "$(dirname "$0")/.."

fallos=0
paso() { printf '\n== %s ==\n' "$1"; }
mal()  { printf '  FALLO  %s\n' "$1"; fallos=$((fallos + 1)); }
bien() { printf '  ok     %s\n' "$1"; }

# ── 1. Python ───────────────────────────────────────────────────
paso "Python"
if python3 -m compileall -q addons >/dev/null 2>&1; then
    bien "todos los modulos compilan"
else
    python3 -m compileall -q addons 2>&1 | head -20
    mal "hay ficheros Python que no compilan"
fi

# ── 2. XML ──────────────────────────────────────────────────────
paso "XML"
n=0
while IFS= read -r f; do
    if python3 -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1])" "$f" 2>/dev/null; then
        n=$((n + 1))
    else
        mal "XML mal formado: $f"
    fi
done < <(find addons -name '*.xml' -not -path '*/node_modules/*')
bien "$n ficheros XML bien formados"

# ── 3. Sintaxis retirada en Odoo 19 ─────────────────────────────
# _sql_constraints dejo de estar soportado y <tree> paso a <list>. Los dos
# fallan en la instalacion, no antes: mejor detectarlos aqui.
paso "Compatibilidad con Odoo 19"
# El filtro descarta lineas de comentario: `\s` no existe en grep basico,
# hace falta la clase POSIX, o el propio comentario que explica el cambio
# se cuenta como incumplimiento.
if grep -rn "_sql_constraints" addons --include='*.py' | grep -vE '^[^:]+:[0-9]+:[[:space:]]*#' | grep -q .; then
    grep -rn "_sql_constraints" addons --include='*.py' | grep -vE '^[^:]+:[0-9]+:[[:space:]]*#' | head -5
    mal "_sql_constraints ya no existe en Odoo 19, usar models.Constraint"
else
    bien "sin _sql_constraints"
fi
if grep -rnE '<tree[ >]|>tree,form<' addons --include='*.xml' | grep -q .; then
    grep -rnE '<tree[ >]|>tree,form<' addons --include='*.xml' | head -5
    mal "<tree> paso a <list> en Odoo 19"
else
    bien "sin <tree> ni tree,form"
fi

# ── 4. Permisos ─────────────────────────────────────────────────
paso "Reglas de acceso"
while IFS= read -r f; do
    if python3 -c "
import csv, sys
esperado = ['id','name','model_id:id','group_id:id','perm_read','perm_write','perm_create','perm_unlink']
with open(sys.argv[1]) as fh:
    lector = csv.reader(fh)
    cabecera = next(lector)
assert cabecera == esperado, cabecera
" "$f" 2>/dev/null; then
        bien "$(basename "$(dirname "$(dirname "$f")")")/ir.model.access.csv"
    else
        mal "cabecera incorrecta en $f"
    fi
done < <(find addons -name 'ir.model.access.csv')

# ── 5. Nada de Google ───────────────────────────────────────────
# Regla de arquitectura del proyecto: la puerta del proveedor se sirve a
# China, donde los servicios de Google estan bloqueados. Una fuente o un
# captcha de Google dejan media plataforma cargando para siempre.
paso "Sin servicios de Google"
if grep -rniE 'googleapis|gstatic|google-analytics|googletagmanager|recaptcha' addons 2>/dev/null | grep -q .; then
    grep -rniE 'googleapis|gstatic|google-analytics|googletagmanager|recaptcha' addons | head -5
    mal "hay una referencia a Google: no llega a China"
else
    bien "ninguna referencia a Google"
fi

# ── 6. Puertos solo en loopback ─────────────────────────────────
# La norma del servidor compartido: el unico proceso que ve internet es el
# Caddy del host.
paso "Puertos del compose"
if grep -nE '^\s*-\s*"?[0-9]+:' infra/docker-compose.prod.yml | grep -q .; then
    grep -nE '^\s*-\s*"?[0-9]+:' infra/docker-compose.prod.yml
    mal "hay un puerto publicado fuera de 127.0.0.1"
else
    bien "todo publicado en 127.0.0.1"
fi

# ── 7. Variables del compose declaradas ─────────────────────────
# Compose solo pasa al contenedor las variables que declara, y una que
# falte no avisa: se resuelve a vacio.
paso "Variables"
faltan=$(comm -23 \
    <(grep -oE '\$\{[A-Z_]+\}' infra/docker-compose.prod.yml | tr -d '${}' | sort -u) \
    <(grep -oE '^[A-Z_]+=' .env.example | tr -d '=' | sort -u))
if [ -n "$faltan" ]; then
    echo "$faltan"
    mal "variables usadas en el compose que no estan en .env.example"
else
    bien "todas las variables del compose estan declaradas"
fi

# ── 8. Manifiestos ──────────────────────────────────────────────
paso "Manifiestos"
while IFS= read -r f; do
    modulo=$(basename "$(dirname "$f")")
    if python3 -c "
import ast, sys
d = ast.literal_eval(open(sys.argv[1]).read())
assert d.get('version','').startswith('19.'), 'version %s' % d.get('version')
assert 'license' in d, 'sin license'
assert 'active' not in d, 'clave active obsoleta'
" "$f" 2>/dev/null; then
        bien "$modulo"
    else
        python3 -c "
import ast, sys
try:
    d = ast.literal_eval(open(sys.argv[1]).read())
    print('   ', d.get('version'), d.get('license'))
except Exception as e:
    print('   ', e)
" "$f"
        mal "manifiesto de $modulo"
    fi
done < <(find addons -name '__manifest__.py')

# ── Resultado ───────────────────────────────────────────────────
echo
if [ "$fallos" -eq 0 ]; then
    echo "Todo correcto."
else
    echo "$fallos comprobacion(es) fallida(s). No se despliega."
    exit 1
fi
