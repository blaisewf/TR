#!/usr/bin/env bash
# GNOME Noir — estilo minimalista para GNOME + Dash to Panel + ArcMenu.
# Aplique sobre GNOME ya instalado; NO repite la migracion ni elimina aplicaciones.
set -Eeuo pipefail

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[[ "$EUID" -ne 0 ]] || fail 'Ejecuta como usuario normal, sin sudo.'
command -v pacman >/dev/null || fail 'Necesitas Arch Linux.'
command -v gsettings >/dev/null || fail 'No se encontro gsettings.'
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || fail 'Ejecuta desde tu sesion grafica de GNOME.'

say 'Instalando tema GTK, extensiones, iconos y fuentes (repositorios oficiales)'
sudo pacman -S --needed \
  adw-gtk-theme papirus-icon-theme inter-font otf-geist-mono-nerd \
  gnome-shell-extension-dash-to-panel gnome-shell-extension-arc-menu

set_gsetting() {
  local schema="$1" key="$2" value="$3"
  if gsettings writable "$schema" "$key" 2>/dev/null | grep -qx true; then
    gsettings set "$schema" "$key" "$value"
  else
    warn "No disponible: $schema / $key"
  fi
}

say 'GNOME: dark minimal con tipografia Inter, iconos Papirus y acento violeta'
set_gsetting org.gnome.desktop.interface color-scheme 'prefer-dark'
set_gsetting org.gnome.desktop.interface gtk-theme 'adw-gtk3-dark'
set_gsetting org.gnome.desktop.interface accent-color 'purple'
set_gsetting org.gnome.desktop.interface icon-theme 'Papirus-Dark'
set_gsetting org.gnome.desktop.interface font-name 'Inter 10'
set_gsetting org.gnome.desktop.interface document-font-name 'Inter 10'
set_gsetting org.gnome.desktop.interface monospace-font-name 'GeistMono Nerd Font Mono 11'
set_gsetting org.gnome.desktop.interface enable-hot-corners 'false'
set_gsetting org.gnome.desktop.wm.preferences button-layout ':minimize,maximize,close'

# Conservar el fondo completamente oscuro; sin descargar wallpapers ni tocar monitores.
black="$HOME/.local/share/backgrounds/gnome-noir/black.png"
mkdir -p "$(dirname "$black")"
if [[ ! -f "$black" ]]; then
  python3 - "$black" <<'PY'
import sys,struct,zlib
def ch(t,p):
    return struct.pack("!I",len(p))+t+p+struct.pack("!I",zlib.crc32(t+p)&0xffffffff)
w=h=64
raw=(b"\x00"+(b"\x00\x00\x00"*w))*h
image=b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack("!2I5B",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b"")
with open(sys.argv[1],"wb") as f:f.write(image)
PY
fi
set_gsetting org.gnome.desktop.background picture-uri "file://$black"
set_gsetting org.gnome.desktop.background picture-uri-dark "file://$black"
set_gsetting org.gnome.desktop.screensaver picture-uri "file://$black"

say 'Dash to Panel: ancho completo, borde inferior, misma lista en los monitores'
dtp='org.gnome.shell.extensions.dash-to-panel'
set_gsetting "$dtp" multi-monitors 'true'
set_gsetting "$dtp" isolate-monitors 'false'
set_gsetting "$dtp" isolate-monitors-with-single-panel 'false'
set_gsetting "$dtp" show-favorites-all-monitors 'true'
set_gsetting "$dtp" panel-element-positions-monitors-sync 'true'
set_gsetting "$dtp" panel-position 'BOTTOM'
set_gsetting "$dtp" panel-size '52'
set_gsetting "$dtp" intellihide 'false'
set_gsetting "$dtp" hide-overview-on-startup 'true'
set_gsetting "$dtp" panel-side-margins '0'
set_gsetting "$dtp" panel-top-bottom-margins '0'
set_gsetting "$dtp" panel-side-padding '4'
set_gsetting "$dtp" panel-top-bottom-padding '2'
set_gsetting "$dtp" show-running-apps 'true'
set_gsetting "$dtp" show-favorites 'true'
set_gsetting "$dtp" group-apps 'true'
set_gsetting "$dtp" show-activities-button 'false'
set_gsetting "$dtp" stockgs-force-hotcorner 'false'
set_gsetting "$dtp" appicon-margin '5'
set_gsetting "$dtp" appicon-padding '7'
set_gsetting "$dtp" animate-appicon-hover 'false'
set_gsetting "$dtp" highlight-appicon-hover 'true'
set_gsetting "$dtp" highlight-appicon-hover-border-radius '12'
set_gsetting "$dtp" highlight-appicon-hover-background-color 'rgba(174, 188, 255, 0.12)'
set_gsetting "$dtp" highlight-appicon-pressed-background-color 'rgba(174, 188, 255, 0.20)'
set_gsetting "$dtp" dot-color-override 'true'
for n in 1 2 3 4; do
  set_gsetting "$dtp" "dot-color-$n" '#A5B4FC'
done
set_gsetting "$dtp" dot-size '3'
set_gsetting "$dtp" group-apps-underline-unfocused 'true'

say 'Barra grafito opaca, sin margenes ni transparencia dinamica'
set_gsetting "$dtp" trans-use-custom-bg 'true'
set_gsetting "$dtp" trans-bg-color '#171923'
set_gsetting "$dtp" trans-use-custom-opacity 'true'
set_gsetting "$dtp" trans-panel-opacity '1.0'
set_gsetting "$dtp" trans-use-dynamic-opacity 'false'
set_gsetting "$dtp" trans-use-border 'true'
set_gsetting "$dtp" trans-border-width '1'
set_gsetting "$dtp" trans-border-use-custom-color 'true'
set_gsetting "$dtp" trans-border-custom-color 'rgba(165,180,252,0.16)'

# Dash to Panel guarda propiedades por monitor en objetos JSON.
# Configurar hasta 8 identificadores numericos; GNOME ignorara los no presentes.
panels_json="$(python3 - <<'PY'
import json
print(json.dumps({str(i):"BOTTOM" for i in range(8)},separators=(',',':')))
PY
)"
lengths_json="$(python3 - <<'PY'
import json
print(json.dumps({str(i):100 for i in range(8)},separators=(',',':')))
PY
)"
sizes_json="$(python3 - <<'PY'
import json
print(json.dumps({str(i):52 for i in range(8)},separators=(',',':')))
PY
)"
elements_json="$(python3 - <<'PY'
import json
items=[
  ("showAppsButton",False,"stackedTL"),
  ("activitiesButton",False,"stackedTL"),
  ("leftBox",True,"stackedTL"),
  ("taskbar",True,"stackedTL"),
  ("centerBox",False,"stackedBR"),
  ("rightBox",True,"stackedBR"),
  ("dateMenu",True,"stackedBR"),
  ("systemMenu",True,"stackedBR"),
  ("desktopButton",False,"stackedBR"),
]
data=[{"element":name,"visible":visible,"position":pos} for name,visible,pos in items]
print(json.dumps({str(i):data for i in range(8)},separators=(',',':')))
PY
)"
set_gsetting "$dtp" panel-positions "$panels_json"
set_gsetting "$dtp" panel-lengths "$lengths_json"
set_gsetting "$dtp" panel-sizes "$sizes_json"
set_gsetting "$dtp" panel-element-positions "$elements_json"

# La extension ArcMenu aporta el menu Win y el icono de la izquierda.
# Respetamos el resto de extensiones del usuario, en vez de sustituir la lista.
say 'Activando ArcMenu y Dash to Panel'
for uuid in 'dash-to-panel@jderose9.github.com' 'arcmenu@arcmenu.com'; do
  if command -v gnome-extensions >/dev/null; then
    gnome-extensions enable "$uuid" || warn "No se pudo activar $uuid inmediatamente; cerrando sesion se carga."
  fi
done

# Mantener cualquier otra extension y asegurar que estas dos se carguen al iniciar GNOME.
python3 - <<'PY'
import ast, subprocess
schema="org.gnome.shell"
key="enabled-extensions"
uuids=["dash-to-panel@jderose9.github.com","arcmenu@arcmenu.com"]
try:
    old=subprocess.check_output(["gsettings","get",schema,key],text=True).strip()
    if old.startswith("@as "): old=old[4:]
    current=ast.literal_eval(old)
    if not isinstance(current,list): current=[]
    for item in uuids:
        if item not in current: current.append(item)
    value="["+",".join("'"+x.replace("'","\\'")+"'" for x in current)+"]"
    subprocess.run(["gsettings","set",schema,key,value],check=True)
except (OSError,ValueError,subprocess.CalledProcessError) as exc:
    print("AVISO: no se pudo actualizar la lista de extensiones:",exc)
PY
set_gsetting org.gnome.shell disable-user-extensions 'false'

# Conservar el menu de Windows ya configurado en ArcMenu; no reescribir atajos.
say 'Estilo GNOME Noir aplicado'
printf 'Cierra sesion y vuelve a entrar para que todos los paneles se actualicen.\n'
