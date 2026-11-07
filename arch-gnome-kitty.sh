#!/usr/bin/env bash
# Kitty como unico terminal principal en GNOME Noir / Arch Linux.
# Instala y configura Kitty antes de eliminar Konsole y GNOME Terminal.
set -Eeuo pipefail
say(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn(){ printf '\nAVISO: %s\n' "$*" >&2; }
[[ "$EUID" -ne 0 ]] || { echo 'Ejecuta como usuario normal, sin sudo.' >&2; exit 1; }
command -v pacman >/dev/null || { echo 'Este script es para Arch Linux.' >&2; exit 1; }

say 'Instalar Kitty, Geist Mono y soporte de terminal predeterminado'
sudo pacman -S --needed kitty otf-geist-mono-nerd xdg-terminal-exec starship
command -v kitty >/dev/null || { echo 'Kitty no pudo instalarse; no se quitaran los anteriores.' >&2; exit 1; }

say 'Crear tema GNOME Noir para Kitty'
mkdir -p "$HOME/.config/kitty"
cat > "$HOME/.config/kitty/kitty.conf" <<'EOF'
# GNOME Noir — Kitty
font_family GeistMono Nerd Font Mono
font_size 11.0
disable_ligatures never

background #11131b
foreground #e3e9f5
cursor #a5b4fc
cursor_text_color #11131b
cursor_shape beam
selection_background #30364c
selection_foreground #f0f3fc

color0 #222634
color1 #f38ba8
color2 #a6e3a1
color3 #f9e2af
color4 #89b4fa
color5 #b4a0ff
color6 #89dceb
color7 #cdd6f4
color8 #6f788f
color9 #ffa0b6
color10 #bdf4b6
color11 #ffefc1
color12 #a7cdff
color13 #c5b4ff
color14 #afecf8
color15 #ffffff

background_opacity 1.0
window_padding_width 12
hide_window_decorations no
confirm_os_window_close 0
enable_audio_bell no
tab_bar_style powerline
EOF

say 'Hacer de Kitty el terminal predeterminado'
printf 'kitty.desktop\n' > "$HOME/.config/xdg-terminals.list"

# Ctrl+Alt+T: conservar el atajo existente si ya está definido.
if command -v gsettings >/dev/null && gsettings list-schemas | grep -qx org.gnome.settings-daemon.plugins.media-keys; then
  python3 - <<'PY'
import ast,subprocess
schema='org.gnome.settings-daemon.plugins.media-keys'
key='custom-keybindings'
prefix='org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:'
target='/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/gnome-noir-kitty/'
def get(*args):
    return subprocess.check_output(['gsettings','get',*args],text=True).strip()
def setv(*args):
    subprocess.run(['gsettings','set',*args],check=True)
value=get(schema,key)
if value.startswith('@as '):value=value[4:]
try:paths=ast.literal_eval(value)
except (ValueError,SyntaxError):paths=[]
if not isinstance(paths,list):paths=[]
found=None
for path in paths:
    try:
        binding=get(prefix+path,'binding').strip("'")
        if binding.lower() in ('<ctrl><alt>t','<primary><alt>t'):
            found=path
            break
    except subprocess.CalledProcessError:
        pass
selected=found or target
if selected not in paths:
    paths.append(selected)
    setv(schema,key,"["+",".join("'"+p+"'" for p in paths)+"]")
setv(prefix+selected,'name','Kitty')
setv(prefix+selected,'command','kitty')
setv(prefix+selected,'binding','<Control><Alt>t')
PY
fi

say 'Eliminar emuladores anteriores, sin forzar dependencias'
old=()
for pkg in gnome-terminal konsole; do
  if pacman -Q "$pkg" >/dev/null 2>&1; then
    old+=("$pkg")
  fi
done
if (("${#old[@]}" > 0)); then
  sudo pacman -Rns "${old[@]}" || warn 'Pacman ha bloqueado la eliminación de uno o más terminales; no se forzará.'
else
  echo 'GNOME Terminal y Konsole ya no están instalados.'
fi

say 'Kitty configurado'
echo 'Puedes abrirlo desde ArcMenu o con Ctrl+Alt+T.'
echo 'Cierra y vuelve a abrir el terminal para usar el nuevo tema.'
