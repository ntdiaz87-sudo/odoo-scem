#!/usr/bin/env bash
#
# Convierte /opt/pyxel-trade en un clon de Gitea y deja el CI/CD andando.
#
#   bash scripts/migrar-a-gitea.sh
#
# ANTES, a mano y una sola vez: crear el repositorio VACÍO `pyxel-trade`
# bajo el usuario `nilo` en https://git.enetradex.com (sin README, sin
# .gitignore, sin licencia). No lo puede hacer este script: los tokens que
# hay en el servidor están limitados a repositorios que ya existen —
# `write:user` les está vetado, y el que crea repositorios es ese.
#
# Por qué token en la URL y no deploy key: el Gitea de la casa NO publica
# SSH. Corre en Docker con sólo 127.0.0.1:3000 hacia fuera, así que el
# puerto 22 de git.enetradex.com es el sshd del servidor, no el de Gitea.
# Clonar por SSH es imposible sin cambiar la publicación de puertos de un
# servicio compartido, y eso no lo decide un script. Es el mismo patrón que
# ya usan /opt/qbaprotic y /opt/fabrica.
#
# El token sale del remote de la fábrica para no pedir uno nuevo. Es un
# token compartido: el día que se rote, hay que rehacer el remote de este
# repositorio también. Para eso está la última línea de este fichero.

set -euo pipefail

RAIZ=/opt/pyxel-trade
REPO=nilo/pyxel-trade
GITEA=git.enetradex.com
RAMA=develop

cd "$RAIZ"

TOKEN="${GITEA_TOKEN:-$(git -C /opt/fabrica remote get-url origin \
    | sed -E 's#.*://[^:]+:([^@]+)@.*#\1#')}"
[[ -n "$TOKEN" ]] || { echo "No hay token. Exporta GITEA_TOKEN." >&2; exit 1; }

CODIGO=$(curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: token $TOKEN" "https://$GITEA/api/v1/repos/$REPO")
if [[ "$CODIGO" != "200" ]]; then
    echo "El repositorio $REPO no existe todavía (HTTP $CODIGO)." >&2
    echo "Créalo vacío en https://$GITEA y vuelve a lanzar esto." >&2
    exit 1
fi

if [[ ! -d .git ]]; then
    git init -q -b "$RAMA"
fi
git remote remove origin 2>/dev/null || true
git remote add origin "https://nilo:${TOKEN}@${GITEA}/${REPO}.git"

# El .gitignore ya deja fuera .env, config/odoo.conf y backups/. Se
# comprueba porque subir el .env sería filtrar la contraseña de PostgreSQL
# a un repositorio, y de ahí no se vuelve: habría que rotarla.
git add -A
if git diff --cached --name-only | grep -qE '^(\.env|config/odoo\.conf)$'; then
    echo "PELIGRO: el .env o el odoo.conf han entrado en el índice." >&2
    echo "Revisa .gitignore. No se sube nada." >&2
    git reset -q
    exit 1
fi

git -c user.name="nilo" -c user.email="ntdiaz87@gmail.com" \
    commit -q -m "Importar PYXEL Cuba Trade OS ya desplegado" || echo "Nada que confirmar."
git push -u origin "$RAMA"

# Gitea trae las Actions apagadas en repositorios nuevos.
curl -s -o /dev/null -X PATCH -H "Authorization: token $TOKEN" \
    -H "Content-Type: application/json" -d '{"has_actions":true}' \
    "https://$GITEA/api/v1/repos/$REPO"

echo
echo "Listo. A partir de ahora, un push a $RAMA despliega solo."
echo
echo "Si algún día se rota el token compartido, este remote deja de"
echo "funcionar y se rehace con:"
echo "  git -C $RAIZ remote set-url origin https://nilo:<TOKEN>@$GITEA/$REPO.git"
