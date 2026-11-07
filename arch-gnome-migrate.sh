#!/usr/bin/env bash
# Migración definitiva a GNOME en Arch Linux.
# Sustituye KDE Plasma por GNOME + GDM y configura Dash to Panel + ArcMenu.
# No conserva Plasma como segunda sesión ni crea copias de seguridad.
set -Eeuo pipefail

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33mAVISO: %s\033[0m\n' "$*" >&2; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[[ "$EUID" -ne 0 ]] || fail 'Ejecuta el script como usuario normal, sin sudo.'
command -v pacman >/dev/null || fail 'Este instalador requiere Arch Linux.'
[[ "$(uname -m)" == x86_64 ]] || fail 'Este script está preparado para Arch Linux x86_64.'
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || fail 'Ejecuta el script desde una sesión gráfica, no desde el instalador de Arch.'

say 'Instalar GNOME, GDM y extensiones desde repositorios oficiales'
sudo -v
sudo pacman -Syu --needed \
  gdm gnome-shell gnome-session gnome-control-center gnome-settings-daemon \
  gnome-keyring gnome-extensions-app gnome-tweaks \
  gnome-shell-extension-dash-to-panel gnome-shell-extension-arc-menu \
  gnome-menus nautilus gnome-terminal gvfs \
  xdg-desktop-portal-gnome xdg-user-dirs-gtk \
  dconf gsettings-desktop-schemas \
  inter-font otf-geist-mono-nerd papirus-icon-theme \
  starship python

# Detenerse ANTES de tocar el gestor de acceso y Plasma si falta algo.
for pkg in gdm gnome-shell gnome-session \
  gnome-shell-extension-dash-to-panel gnome-shell-extension-arc-menu; do
  pacman -Q "$pkg" >/dev/null || fail "No se instaló $pkg. No se eliminará KDE."
done
[[ -f /usr/share/wayland-sessions/gnome.desktop || -f /usr/share/wayland-sessions/gnome-wayland.desktop || -f /usr/share/xsessions/gnome.desktop ]] || \
  fail 'No se encontró una sesión GNOME instalada. KDE no se eliminará.'

say 'Configurar apariencia oscura y fondos negros'
WALL="$HOME/.local/share/backgrounds/gnome-noir/black.png"
mkdir -p "$(dirname "$WALL")"
python3 - "$WALL" <<'PY'
import sys, struct, zlib
def chunk(name,payload):
    return struct.pack("!I",len(payload))+name+payload+struct.pack("!I",zlib.crc32(name+payload)&0xffffffff)
w=h=64
data=(b"\x00"+b"\x00\x00\x00"*w)*h
png=b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack("!2I5B",w,h,8,2,0,0,0))+chunk(b"IDAT",zlib.compress(data))+chunk(b"IEND",b"")
with open(sys.argv[1],"wb") as f: f.write(png)
PY

# gsettings puede establecer preferencias GNOME incluso desde una sesión KDE.
try_setting() {
  local schema="$1" key="$2" value="$3"
  if gsettings writable "$schema" "$key" 2>/dev/null | grep -qx true; then
    gsettings set "$schema" "$key" "$value"
  else
    warn "Ajuste no disponible: $schema / $key"
  fi
}
try_setting org.gnome.desktop.interface color-scheme prefer-dark
try_setting org.gnome.desktop.interface font-name 'Inter 10'
try_setting org.gnome.desktop.interface document-font-name 'Inter 10'
try_setting org.gnome.desktop.interface monospace-font-name 'GeistMono Nerd Font Mono 11'
try_setting org.gnome.desktop.interface icon-theme Papirus-Dark
try_setting org.gnome.desktop.interface enable-hot-corners false
try_setting org.gnome.desktop.wm.preferences button-layout ':minimize,maximize,close'
try_setting org.gnome.desktop.background picture-uri "file://$WALL"
try_setting org.gnome.desktop.background picture-uri-dark "file://$WALL"
try_setting org.gnome.desktop.background picture-options zoom
try_setting org.gnome.desktop.screensaver picture-uri "file://$WALL"

say 'Configurar Dash to Panel para todos los monitores'
DTP='org.gnome.shell.extensions.dash-to-panel'
try_setting "$DTP" multi-monitors true
try_setting "$DTP" isolate-monitors false
try_setting "$DTP" show-favorites-all-monitors true
try_setting "$DTP" panel-element-positions-monitors-sync true
try_setting "$DTP" intellihide false
try_setting "$DTP" panel-position BOTTOM
try_setting "$DTP" panel-positions '{}'
try_setting "$DTP" panel-lengths '{}'
try_setting "$DTP" panel-size 44
try_setting "$DTP" panel-side-margins 0
try_setting "$DTP" panel-side-padding 0
try_setting "$DTP" panel-top-bottom-padding 0
try_setting "$DTP" show-running-apps true
try_setting "$DTP" show-favorites true
try_setting "$DTP" group-apps true
try_setting "$DTP" show-activities-button false
try_setting "$DTP" trans-use-custom-bg true
try_setting "$DTP" trans-bg-color '#151720'
try_setting "$DTP" trans-use-custom-opacity true
try_setting "$DTP" trans-panel-opacity 1.0
try_setting "$DTP" stockgs-force-hotcorner false
try_setting org.gnome.shell disable-user-extensions false
try_setting org.gnome.shell enabled-extensions \
  "['dash-to-panel@jderose9.github.com', 'arcmenu@arcmenu.com']"

# Super abre ArcMenu cuando la versión instalada soporta este ajuste.
if gsettings list-keys org.gnome.shell.extensions.arcmenu 2>/dev/null | grep -qx arcmenu-hotkey; then
  try_setting org.gnome.shell.extensions.arcmenu arcmenu-hotkey "['Super_L', 'Super_R']"
  try_setting org.gnome.shell.extensions.arcmenu arcmenu-hotkey-overlay-key-enabled true
  try_setting org.gnome.shell.extensions.arcmenu multi-monitor true
fi

say 'Configurar GNOME Terminal con Geist Mono y fondo oscuro'
if gsettings list-schemas | grep -qx 'org.gnome.Terminal.ProfilesList'; then
  UUID="$(gsettings get org.gnome.Terminal.ProfilesList default | tr -d "'")"
  if [[ -z "$UUID" || "$UUID" == none ]]; then
    UUID="$(cat /proc/sys/kernel/random/uuid)"
    gsettings set org.gnome.Terminal.ProfilesList list "['$UUID']"
    gsettings set org.gnome.Terminal.ProfilesList default "$UUID"
  fi
  PROFILE="org.gnome.Terminal.Legacy.Profile:/org/gnome/terminal/legacy/profiles:/:$UUID/"
  try_setting "$PROFILE" visible-name 'GNOME Noir'
  try_setting "$PROFILE" use-system-font false
  try_setting "$PROFILE" font 'GeistMono Nerd Font Mono 11'
  try_setting "$PROFILE" use-theme-colors false
  try_setting "$PROFILE" background-color 'rgb(17,19,27)'
  try_setting "$PROFILE" foreground-color 'rgb(227,233,245)'
fi

if [[ ! -f "$HOME/.config/starship.toml" ]]; then
  mkdir -p "$HOME/.config"
  cat > "$HOME/.config/starship.toml" <<'EOF'
add_newline = true
format = "$directory$git_branch$git_status$line_break$character"
[directory]
style = "bold #A5B4FC"
[git_branch]
symbol = "󰘬 "
style = "#89B4FA"
[character]
success_symbol = "[❯](bold #A5B4FC)"
error_symbol = "[❯](bold #F38BA8)"
EOF
fi
if ! grep -Fq 'starship init bash' "$HOME/.bashrc" 2>/dev/null; then
  printf '\n# GNOME Noir\ncommand -v starship >/dev/null && eval "$(starship init bash)"\n' >> "$HOME/.bashrc"
fi

say 'Cambiar el gestor de acceso a GDM'
sudo systemctl set-default graphical.target
for unit in plasmalogin.service sddm.service; do
  if systemctl is-enabled "$unit" >/dev/null 2>&1; then
    sudo systemctl disable "$unit"
  fi
done
sudo systemctl enable --force gdm.service
if [[ "$(readlink -f /etc/systemd/system/display-manager.service)" != /usr/lib/systemd/system/gdm.service ]]; then
  fail 'GDM no aparece como gestor de acceso predeterminado. No se desinstalará KDE.'
fi

say 'Eliminar KDE Plasma (no las aplicaciones independientes como Okular)'
# Solo los paquetes del grupo Plasma y su metapaquete. No ejecutamos pacman -Rsc
# ni borramos dependencias necesarias para otras aplicaciones.
remove=()
if pacman -Qq plasma-meta >/dev/null 2>&1; then
  remove+=(plasma-meta)
fi
while IFS= read -r p; do
  [[ -n "$p" ]] && remove+=("$p")
done < <(pacman -Qqg plasma 2>/dev/null || true)
# Omitir duplicados para que sea repetible.
if (("${#remove[@]}" > 0)); then
  mapfile -t remove < <(printf '%s\n' "${remove[@]}" | sort -u)
  if ! sudo pacman -Rns "${remove[@]}"; then
    warn 'Pacman bloqueó la eliminación completa de Plasma por dependencias. No se forzará ni se borrarán programas ajenos.'
    warn 'GDM y GNOME ya están instalados y configurados como escritorio de inicio.'
  fi
fi

say 'Aplicando el tema GNOME Noir y la nueva barra de tareas'
theme_script="$(mktemp)"
if curl --proto '=https' --tlsv1.2 -fL --retry 3 \
  https://raw.githubusercontent.com/blaisewf/TR/arch-kde-setup/arch-gnome-noir-theme.sh \
  -o "$theme_script"; then
  bash -n "$theme_script" && bash "$theme_script" || warn 'El tema no se pudo aplicar completamente. Puedes ejecutarlo más tarde.'
else
  warn 'No se pudo descargar el tema GNOME Noir.'
fi
rm -f -- "$theme_script"

say 'Migración preparada'
echo 'El próximo arranque usará GDM y GNOME.'
echo 'Tus documentos, juegos, apps, código y discos no se han formateado.'
echo 'No se ha creado backup ni un mecanismo para restaurar KDE.'
echo 'Reinicia el ordenador con: sudo reboot'
