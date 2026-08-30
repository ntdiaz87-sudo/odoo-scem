#!/data/data/com.termux/files/usr/bin/bash
#
# PYXEL · Paso 1 desde Termux — preparar el móvil y reconocer el servidor.
# No cambia NADA en el GEX44: todo lo que ejecuta allí es de solo lectura.

GEX44_IP="46.4.98.13"
RECON="$HOME/pyxel-recon.txt"

echo "══ 1/5 · Paquetes ═══════════════════════════════════════"
pkg install -y openssh tmux >/dev/null 2>&1
command -v ssh >/dev/null || { echo "No se pudo instalar openssh."; exit 1; }
termux-wake-lock 2>/dev/null && echo "Pantalla liberada: Android ya no cortará la sesión."
echo "openssh y tmux listos."

echo
echo "══ 2/5 · Llave SSH ══════════════════════════════════════"
mkdir -p "$HOME/.ssh"; chmod 700 "$HOME/.ssh"
if [ -f "$HOME/.ssh/id_ed25519" ]; then
    echo "Ya existe una llave, se reutiliza."
else
    ssh-keygen -t ed25519 -C "termux-pyxel" -f "$HOME/.ssh/id_ed25519" -N "" >/dev/null
    echo "Llave nueva generada (termux-pyxel)."
fi
chmod 600 "$HOME/.ssh/id_ed25519"

echo
echo "══ 3/5 · Alias gex44 ════════════════════════════════════"
if grep -q "^Host gex44$" "$HOME/.ssh/config" 2>/dev/null; then
    echo "El alias ya estaba configurado."
else
    cat >> "$HOME/.ssh/config" <<CFG
Host gex44
    HostName $GEX44_IP
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 30
    ServerAliveCountMax 6
    StrictHostKeyChecking accept-new
CFG
    echo "Alias creado."
fi
chmod 600 "$HOME/.ssh/config"

echo
echo "══ 4/5 · Conexión ═══════════════════════════════════════"
probar() { ssh -o BatchMode=yes -o ConnectTimeout=12 gex44 true >/dev/null 2>&1; }

if probar; then
    echo "Conecta con la llave. Nada que hacer."
else
    echo "La llave todavía no está autorizada en el servidor."
    echo "Se va a instalar. TE PEDIRÁ LA CONTRASEÑA DE ROOT del GEX44."
    echo "(no se ve nada al escribirla, es normal)"
    echo
    ssh-copy-id -i "$HOME/.ssh/id_ed25519.pub" -o StrictHostKeyChecking=accept-new "root@$GEX44_IP"
    echo
    if probar; then
        echo "Listo: la llave ya está autorizada."
    else
        echo "SIGUE SIN CONECTAR."
        echo "Manda esta llave pública a quien administre el servidor para"
        echo "que la añada a /root/.ssh/authorized_keys :"
        echo
        cat "$HOME/.ssh/id_ed25519.pub"
        exit 1
    fi
fi

echo
echo "══ 5/5 · Reconocimiento (solo lectura) ══════════════════"
ssh gex44 'bash -s' <<'RECON' > "$RECON" 2>&1
echo "### IDENTIDAD"; hostname; curl -4 -fsS --max-time 10 ifconfig.me 2>/dev/null; echo
echo; echo "### DOCKER"; docker --version 2>&1
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>&1
echo; echo "### CADDY"; systemctl is-active caddy 2>&1
grep -E '^[a-z0-9*.-]+\.[a-z]+ \{' /etc/caddy/Caddyfile 2>/dev/null
echo; echo "### PUERTOS EN ESCUCHA"; ss -ltnp 2>/dev/null | awk 'NR==1 || /LISTEN/'
echo; echo "### PUERTOS QUE NECESITA PYXEL"
for p in 8310 8311; do
  ss -ltn 2>/dev/null | grep -q ":$p " && echo "  $p OCUPADO" || echo "  $p libre"
done
echo; echo "### DEPENDENCIAS"
for c in docker envsubst python3 git curl tmux openssl; do
  command -v "$c" >/dev/null 2>&1 && echo "  $c presente" || echo "  $c AUSENTE"
done
echo; echo "### PROYECTO"
[ -e /opt/pyxel-trade ] && echo "  /opt/pyxel-trade YA EXISTE - PARAR" || echo "  /opt/pyxel-trade no existe: camino libre"
echo; echo "### RECURSOS"; df -h / | tail -1; free -h | awk 'NR<=2'; swapon --show 2>/dev/null | head -3
echo; echo "### /opt"; ls -1 /opt 2>&1
RECON

cat "$RECON"

echo
echo "═════════════════════════════════════════════════════════"
if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$RECON"
    echo "COPIADO AL PORTAPAPELES. Pégalo en el chat."
else
    echo "Copia el texto de arriba y pégalo en el chat."
    echo "(guardado también en $RECON)"
fi
