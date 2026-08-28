#!/usr/bin/env bash
# PRIMER despliegue del ambiente de pruebas en un servidor (Ubuntu/Debian, root
# o sudo): instala Docker si falta, clona el repo y delega en apply-test.sh.
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/ntdiaz87-sudo/odoo-scem/claude/online-store-factory-9cnbb7/factory/deploy/bootstrap-test.sh | bash
# Para actualizaciones posteriores basta apply-test.sh (o el CI de Gitea).
set -euo pipefail

REPO=https://github.com/ntdiaz87-sudo/odoo-scem.git
BRANCH=claude/online-store-factory-9cnbb7
DIR=/opt/fabrica

echo "== [1/3] Comprobaciones (norma: no se instala nada; si falta algo, se avisa) =="
FALTA=0
for cmd in docker git curl; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "ok: $cmd presente"
  else
    echo "FALTA: $cmd no está instalado"
    FALTA=1
  fi
done
if docker compose version >/dev/null 2>&1; then
  echo "ok: docker compose presente"
else
  echo "FALTA: el plugin 'docker compose' no está disponible"
  FALTA=1
fi
if [ "$FALTA" -ne 0 ]; then
  echo "Se detiene sin hacer cambios. Reporta lo que falta en la sesión de Claude."
  exit 1
fi

echo "== [2/3] Código (rama $BRANCH) =="
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$DIR"
fi

echo "== [3/3] Despliegue =="
bash "$DIR/factory/deploy/apply-test.sh"
