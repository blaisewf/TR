#!/usr/bin/env bash
# GNOME Noir: misma disposicion de controles (minimizar, maximizar, cerrar)
# y tema Adwaita oscuro para ventanas GTK3 y libadwaita.
# Los programas con ventanas propias (Electron/Chromium/Qt) pueden ignorarlo.
set -Eeuo pipefail

say(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
[[ $EUID -ne 0 ]] || { echo 'Ejecuta como usuario normal.' >&2; exit 1; }
command -v pacman >/dev/null || { echo 'Se necesita Arch Linux.' >&2; exit 1; }
command -v gsettings >/dev/null || { echo 'No se encuentra gsettings.' >&2; exit 1; }
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || { echo 'Ejecuta dentro de GNOME.' >&2; exit 1; }

say 'Instalando el estilo GTK3 compatible con libadwaita'
sudo pacman -S --needed adw-gtk-theme

say 'Unificando controles a la derecha con GNOME Adwaita Dark'
gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
gsettings set org.gnome.desktop.interface gtk-theme 'adw-gtk3-dark'
gsettings set org.gnome.desktop.wm.preferences button-layout ':minimize,maximize,close'

# GTK3 admite gtk-decoration-layout; los GTK4/libadwaita actuales siguen la
# preferencia de GNOME. Respetar el resto de ajustes GTK3 existentes.
python3 - "$HOME/.config/gtk-3.0/settings.ini" <<'PY'
import configparser, pathlib, sys
p=pathlib.Path(sys.argv[1]); p.parent.mkdir(parents=True,exist_ok=True)
c=configparser.ConfigParser(interpolation=None)
c.optionxform=str
if p.exists(): c.read(p,encoding='utf-8')
if not c.has_section('Settings'): c.add_section('Settings')
c.set('Settings','gtk-theme-name','adw-gtk3-dark')
c.set('Settings','gtk-decoration-layout',':minimize,maximize,close')
c.set('Settings','gtk-application-prefer-dark-theme','true')
with p.open('w',encoding='utf-8') as stream:
    c.write(stream,space_around_delimiters=False)
PY

say 'Ventanas GTK armonizadas'
echo 'Cierra y vuelve a abrir las aplicaciones para aplicar sus nuevos controles.'
echo 'Las aplicaciones con decoraciones propias pueden mantener botones diferentes.'
