#!/usr/bin/env bash
# ARCH GNOME NOIR — INSTALADOR ÚNICO, noviembre de 2026
# Para Arch Linux x86_64 ya instalado con archinstall (NO ejecutar desde archiso).
# Instala GNOME + GDM, GNOME Noir, Dash to Panel, ArcMenu, Kitty,
# desarrollo, juegos/apps, Helium, Wolow, SignalRGB y splash Arch.
# No instala KDE. Cada ejecución es repetible; no usa otros scripts del repo.
# Opciones: --theme-only | --skip-boot | --skip-extras | --skip-aur | --help
set -Eeuo pipefail

say(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn(){ printf '\n\033[1;33mAVISO: %s\033[0m\n' "$*" >&2; }
fail(){ printf '\nERROR: %s\n' "$*" >&2; exit 1; }
trap 'printf "\nERROR en línea %s. Revisa el mensaje anterior.\n" "$LINENO" >&2' ERR

SKIP_BOOT=0; SKIP_EXTRAS=0; SKIP_AUR=0; THEME_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --skip-boot) SKIP_BOOT=1;;
    --theme-only) THEME_ONLY=1; SKIP_BOOT=1;;
    --skip-extras) SKIP_EXTRAS=1;;
    --skip-aur) SKIP_AUR=1;;
    --help)
      echo 'Uso: bash arch-setup-completo.sh [--theme-only] [--skip-boot] [--skip-extras] [--skip-aur]'
      echo 'Se ejecuta desde TTY o desde GNOME, después de archinstall.'
      exit 0;;
    *) fail "Opción desconocida: $arg";;
  esac
done
[[ "$EUID" -ne 0 ]] || fail 'Ejecuta como usuario normal con sudo configurado; no como root.'
[[ "$(uname -m)" == x86_64 ]] || fail 'Solo Arch Linux x86_64.'
[[ -f /etc/arch-release ]] || fail 'No parece un sistema Arch Linux.'
[[ ! -d /run/archiso ]] || fail 'No ejecutes en el ISO en vivo: primero instala Arch.'
command -v pacman >/dev/null || fail 'No se encontró pacman.'
command -v sudo >/dev/null || fail 'El usuario debe tener acceso a sudo.'
umask 022

if [[ "${GNOME_NOIR_RESUME:-0}" != 1 && "$THEME_ONLY" == 0 ]]; then
  say 'Actualizando Arch y preparando GNOME desde cero'
  sudo -v
  sudo pacman -Syu

  # Habilitar [multilib] sin duplicar secciones y actualizar antes de Steam.
  if ! pacman-conf --repo-list | grep -qx multilib; then
    sudo cp -n /etc/pacman.conf /etc/pacman.conf.before-gnome-noir
    if grep -q '^\#\[multilib\]' /etc/pacman.conf; then
      sudo sed -i '/^#\[multilib\]/{s/^#//;n;s/^#Include/Include/;}' /etc/pacman.conf
    else
      printf '\n[multilib]\nInclude = /etc/pacman.d/mirrorlist\n' | sudo tee -a /etc/pacman.conf >/dev/null
    fi
    sudo pacman -Syu
  fi

  say 'Instalando escritorio, terminal, extensiones y utilidades'
  sudo pacman -S --needed \
    gdm gnome-shell gnome-session gnome-control-center gnome-settings-daemon \
    gnome-keyring gnome-extensions-app gnome-tweaks gnome-menus nautilus gvfs \
    xdg-desktop-portal-gnome xdg-user-dirs-gtk dconf \
    gnome-shell-extension-dash-to-panel gnome-shell-extension-arc-menu \
    gnome-shell-extension-appindicator \
    adw-gtk-theme inter-font otf-geist-mono-nerd papirus-icon-theme \
    kitty starship xdg-terminal-exec \
    networkmanager bluez bluez-utils \
    pipewire pipewire-alsa pipewire-pulse wireplumber \
    base-devel git curl jq pciutils python python-pip python-pillow \
    gcc gdb make cmake jdk-openjdk rustup uv \
    mesa vulkan-icd-loader lib32-mesa lib32-vulkan-icd-loader \
    fuse2 flatpak ethtool librsvg \
    vlc vlc-plugins-extra okular spotify-launcher

  say 'Instalando TeX Live para matemáticas, TikZ, XeLaTeX y latexmk'
  sudo pacman -S --needed \
    texlive-latexrecommended texlive-latexextra texlive-fontsrecommended \
    texlive-mathscience texlive-pictures texlive-xetex texlive-luatex \
    texlive-binextra texlive-langspanish texlive-langeuropean

  sudo systemctl enable --now NetworkManager.service
  sudo systemctl enable bluetooth.service

  if ! rustup show active-toolchain >/dev/null 2>&1; then
    rustup default stable || warn 'Rustup no pudo inicializar Rust; puedes reintentarlo.'
  fi

  say 'Controladores gráficos: instalar Vulkan apropiado cuando se reconoce GPU'
  gpu="$(lspci -nn 2>/dev/null | grep -Ei 'VGA compatible controller|3D controller|Display controller' || true)"
  echo "$gpu"
  if grep -Eiq 'AMD|ATI Technologies' <<< "$gpu"; then
    sudo pacman -S --needed vulkan-radeon lib32-vulkan-radeon
  fi
  if grep -Eiq 'Intel Corporation' <<< "$gpu"; then
    sudo pacman -S --needed vulkan-intel lib32-vulkan-intel
  fi
  nvidia_unready=0
  if grep -qi NVIDIA <<< "$gpu"; then
    if pacman -Qq nvidia-utils >/dev/null 2>&1; then
      sudo pacman -S --needed lib32-nvidia-utils
    else
      nvidia_unready=1
      warn 'NVIDIA sin driver reconocido: instala el controlador adecuado a tu GPU antes de jugar.'
    fi
  fi

  say 'Steam y Discord originales'
  if [[ $nvidia_unready == 0 ]]; then
    sudo pacman -S --needed steam || warn 'No se pudo instalar Steam.'
  else
    warn 'Steam omitido hasta resolver el controlador NVIDIA.'
  fi
  sudo pacman -S --needed discord || warn 'No se pudo instalar Discord.'

  say 'Flatpak y Bitwarden'
  flatpak remote-add --user --if-not-exists flathub \
    https://dl.flathub.org/repo/flathub.flatpakrepo
  if ! pacman -Qq bitwarden >/dev/null 2>&1; then
    flatpak install --user --assumeyes flathub com.bitwarden.desktop \
      || warn 'Bitwarden quedó pendiente.'
  fi

  install_aur() {
    local pkg="$1" dir answer
    if pacman -Qq "$pkg" >/dev/null 2>&1; then return 0; fi
    dir="$(mktemp -d)"
    say "Paquete AUR: $pkg"
    if git clone --depth 1 "https://aur.archlinux.org/$pkg.git" "$dir/$pkg"; then
      cat "$dir/$pkg/PKGBUILD"
      printf '¿Autorizas la compilación de %s desde AUR tras revisar el PKGBUILD? [s/N] ' "$pkg"
      read -r answer || answer='n'
      if [[ "$answer" =~ ^[sSyY]$ ]]; then
        ( cd "$dir/$pkg" && makepkg -si ) || warn "Falló $pkg."
      fi
    else
      warn "No se pudo consultar el paquete AUR $pkg."
    fi
    rm -rf -- "$dir"
  }

  if [[ $SKIP_AUR == 0 ]]; then
    install_aur visual-studio-code-bin
    install_aur minecraft-launcher
  fi

  if [[ $SKIP_EXTRAS == 0 ]]; then
    say 'Instalando Helium desde sus lanzamientos AppImage oficiales'
    HELIUM="$HOME/.local/opt/helium/Helium.AppImage"
    mkdir -p "$(dirname "$HELIUM")" "$HOME/.local/share/applications" \
      "$HOME/.local/share/icons/hicolor/scalable/apps"
    if [[ ! -s "$HELIUM" ]]; then
      json="$(mktemp)"
      if curl -fsSL --retry 3 \
          'https://api.github.com/repos/imputnet/helium-linux/releases/latest' \
          -o "$json"; then
        url="$(jq -r '[.assets[]? | select(.name | test("\\.AppImage$";"i")) | select(.name | test("x86_64|amd64|x64";"i")) | .browser_download_url][0] // empty' "$json")"
        if [[ "$url" == https://github.com/imputnet/helium-linux/releases/download/* ]]; then
          curl -fL --retry 3 "$url" -o "$HELIUM" || rm -f "$HELIUM"
        else
          warn 'No se encontró AppImage oficial x86_64 de Helium.'
        fi
      else
        warn 'No se pudo obtener el lanzamiento de Helium.'
      fi
      rm -f "$json"
    fi
    if [[ -s "$HELIUM" ]]; then
      chmod +x "$HELIUM"
      curl -fL --retry 3 \
        'https://raw.githubusercontent.com/imputnet/helium/main/resources/branding/product_logo.svg' \
        -o "$HOME/.local/share/icons/hicolor/scalable/apps/helium.svg" \
        || warn 'No se pudo obtener el icono SVG de Helium.'
      cat > "$HOME/.local/share/applications/helium-official.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Helium
Comment=Helium Browser
Exec=$HELIUM %U
Icon=helium
StartupWMClass=helium
Categories=Network;WebBrowser;
Terminal=false
StartupNotify=true
EOF
    fi

    say 'Preparando Wolow Companion y Wake-on-LAN'
    wolow_dir="$HOME/.local/opt/wolow-companion"
    wolow_wrapper="$HOME/.local/bin/wolow-companion"
    mkdir -p "$wolow_dir" "$HOME/.local/bin" "$HOME/.config/autostart"
    if [[ ! -x "$wolow_wrapper" ]]; then
      tmp="$(mktemp -d)"
      if curl -fL --retry 3 \
          'https://storage.jackbaker.dev/downloads/linux/wolow-companion-linux-amd64.tar.gz' \
          -o "$tmp/wolow.tar.gz"; then
        if python3 - "$tmp/wolow.tar.gz" "$wolow_dir" <<'PY'
import sys,tarfile
with tarfile.open(sys.argv[1],"r:gz") as archive:
    archive.extractall(sys.argv[2], filter="data")
PY
        then
          mapfile -d '' candidates < <(find "$wolow_dir" -type f -perm /111 \
            \( -iname '*wolow*' -o -iname '*companion*' \) -print0)
          if (("${#candidates[@]}" == 1)); then
            executable="${candidates[0]}"
            printf '#!/usr/bin/env bash\ncd %q\nexec %q "$@"\n' \
              "$(dirname "$executable")" "$executable" > "$wolow_wrapper"
            chmod +x "$wolow_wrapper"
          else
            warn 'Wolow se extrajo, pero no se pudo identificar un único ejecutable.'
          fi
        else
          warn 'No se pudo extraer Wolow de forma segura.'
        fi
      else
        warn 'Falló la descarga de Wolow Companion.'
      fi
      rm -rf "$tmp"
    fi
    if [[ -x "$wolow_wrapper" ]]; then
      cat > "$HOME/.config/autostart/wolow-companion.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Wolow Companion
Exec=$wolow_wrapper
TryExec=$wolow_wrapper
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
    fi

    if command -v nmcli >/dev/null; then
      while IFS=: read -r uuid type; do
        if [[ "$type" == ethernet || "$type" == 802-3-ethernet ]]; then
          sudo nmcli connection modify "$uuid" 802-3-ethernet.wake-on-lan magic \
            || warn "No se pudo activar Wake-on-LAN en $uuid."
        fi
      done < <(nmcli -t -f UUID,TYPE connection show)
    fi

    say 'SignalRGB (beta oficial): instalación opcional del proveedor'
    if ! pacman -Qq signalrgb >/dev/null 2>&1; then
      printf '¿Instalar la beta oficial SignalRGB (ejecuta su instalador externo)? [s/N] '
      read -r answer || answer=n
      if [[ "$answer" =~ ^[sSyY]$ ]]; then
        installer="$(mktemp)"
        if curl -fsSL --retry 3 https://pkgs.signalrgb.com/install.sh -o "$installer"; then
          bash "$installer" --channel beta || warn 'SignalRGB no pudo instalarse.'
        else
          warn 'No se pudo descargar el instalador SignalRGB.'
        fi
        rm -f "$installer"
      fi
    fi
  fi

  say 'Activar GDM para iniciar GNOME en el siguiente arranque'
  for pkg in gdm gnome-shell gnome-session kitty; do
    pacman -Qq "$pkg" >/dev/null || fail "No se instaló $pkg."
  done
  sudo systemctl set-default graphical.target
  for unit in plasmalogin.service sddm.service; do
    sudo systemctl disable "$unit" >/dev/null 2>&1 || true
  done
  sudo systemctl enable --force gdm.service

  # Kitty sustituye a GNOME Terminal y Konsole si estaban instalados.
  old_terminals=()
  for terminal in gnome-terminal konsole; do
    if pacman -Qq "$terminal" >/dev/null 2>&1; then
      old_terminals+=("$terminal")
    fi
  done
  if (("${#old_terminals[@]}" > 0)); then
    sudo pacman -Rns "${old_terminals[@]}" || warn 'No se pudieron retirar los terminales anteriores por dependencias; no se forzará.'
  fi

  # Desde una TTY, iniciar un D-Bus temporal evita perder configuraciones GSettings.
  if [[ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]]; then
    say 'Iniciando bus de sesión temporal para guardar los ajustes de GNOME'
    command -v dbus-run-session >/dev/null || fail 'Falta dbus-run-session.'
    GNOME_NOIR_RESUME=1 exec dbus-run-session -- bash "$0" "$@"
  fi
fi

say 'Aplicando ajustes GNOME Noir para el usuario actual'
gset() {
  local schema="$1" key="$2" val="$3"
  if gsettings writable "$schema" "$key" 2>/dev/null | grep -qx true; then
    gsettings set "$schema" "$key" "$val" || warn "No se pudo aplicar $schema / $key"
  else
    warn "La opción $schema / $key no está disponible en esta versión."
  fi
}

# Fondo Wallhaven original y extracción real del rojo predominante mediante Pillow.
# No usamos una paleta adivinada: en cada instalación se lee la propia imagen.
if ! python3 -c 'from PIL import Image' 2>/dev/null; then
  say 'Instalando Pillow para identificar el rojo del fondo (color picker)'
  sudo pacman -S --needed python-pillow
fi
WALL="$HOME/.local/share/backgrounds/gnome-noir/wallhaven-xeko23.png"
mkdir -p "$(dirname "$WALL")" "$HOME/.config/kitty" "$HOME/.config/gtk-3.0" "$HOME/.config/gnome-noir"
if [[ ! -s "$WALL" ]]; then
  say 'Descargando el fondo original desde Wallhaven (xeko23)'
  wall_tmp="$(mktemp)"
  if curl --proto '=https' --tlsv1.2 -fL --retry 3 \
      -A 'Mozilla/5.0' -e 'https://wallhaven.cc/' \
      'https://w.wallhaven.cc/full/xe/wallhaven-xeko23.png' -o "$wall_tmp" && \
     python3 - "$wall_tmp" <<'PY'
import sys
from PIL import Image
with Image.open(sys.argv[1]) as im:
    im.verify()
with Image.open(sys.argv[1]) as im:
    assert im.format=="PNG" and im.width>=1280 and im.height>=720
PY
  then
    mv -f "$wall_tmp" "$WALL"
  else
    warn 'Wallhaven no entregó el PNG completo; no se sustituirá tu fondo actual.'
    rm -f "$wall_tmp"
  fi
fi

RED_HEX="#D6293E"  # Solo se usa como respaldo cuando la imagen es inaccesible.
RED_R=214; RED_G=41; RED_B=62
if [[ -s "$WALL" ]]; then
  # Agrupar los píxeles rojos saturados en celdas RGB de 8 valores.
  # Elegir el grupo de mayor presencia y calcular su RGB medio real.
  palette="$(python3 - "$WALL" <<'PY'
import sys, collections
from PIL import Image
from colorsys import rgb_to_hsv
with Image.open(sys.argv[1]) as src:
    im=src.convert("RGB")
    im.thumbnail((640,640))
bins=collections.defaultdict(lambda:[0,0,0,0])
for r,g,b in im.getdata():
    h,s,v=rgb_to_hsv(r/255,g/255,b/255)
    if not (h<=0.075 or h>=0.955) or s<0.43 or v<0.27:
        continue
    if r<g*1.25 or r<b*1.22: continue
    key=(r//8,g//8,b//8)
    acc=bins[key]
    acc[0]+=1; acc[1]+=r; acc[2]+=g; acc[3]+=b
if not bins: raise SystemExit(2)
_,(n,rs,gs,bs)=max(bins.items(), key=lambda kv:kv[1][0])
if n<12: raise SystemExit(2)
r,g,b=round(rs/n),round(gs/n),round(bs/n)
print(f"#{r:02X}{g:02X}{b:02X} {r} {g} {b}")
PY
)" && read -r RED_HEX RED_R RED_G RED_B <<< "$palette" || \
    warn 'No se localizaron suficientes píxeles rojos; se usa rojo de respaldo.'
fi
printf 'RED_HEX=%q\nRED_R=%q\nRED_G=%q\nRED_B=%q\n' \
  "$RED_HEX" "$RED_R" "$RED_G" "$RED_B" > "$HOME/.config/gnome-noir/palette.env"
say "Rojo muestreado del wallpaper: $RED_HEX (RGB $RED_R, $RED_G, $RED_B)"

gset org.gnome.desktop.interface color-scheme prefer-dark
gset org.gnome.desktop.interface gtk-theme adw-gtk3-dark
gset org.gnome.desktop.interface accent-color red
gset org.gnome.desktop.interface icon-theme Papirus-Dark
gset org.gnome.desktop.interface font-name 'Inter 10'
gset org.gnome.desktop.interface document-font-name 'Inter 10'
gset org.gnome.desktop.interface monospace-font-name 'GeistMono Nerd Font Mono 11'
gset org.gnome.desktop.interface enable-hot-corners false
gset org.gnome.desktop.wm.preferences button-layout ':minimize,maximize,close'
if [[ -s "$WALL" ]]; then
  gset org.gnome.desktop.background picture-uri "file://$WALL"
  gset org.gnome.desktop.background picture-uri-dark "file://$WALL"
  gset org.gnome.desktop.background picture-options zoom
  gset org.gnome.desktop.screensaver picture-uri "file://$WALL"
fi
gset org.gnome.shell disable-user-extensions false
gset org.gnome.shell enabled-extensions "['dash-to-panel@jderose9.github.com', 'arcmenu@arcmenu.com', 'appindicatorsupport@rgcjonas.gmail.com']"
# Favoritos minimalistas; instalar apps no obliga a fijar todas.
gset org.gnome.shell favorite-apps "['org.gnome.Nautilus.desktop','kitty.desktop','helium-official.desktop']"

dtp='org.gnome.shell.extensions.dash-to-panel'
for setting in 'multi-monitors true' 'show-favorites-all-monitors true' 'panel-element-positions-monitors-sync true' \
  'show-running-apps true' 'show-favorites true' 'group-apps true'; do
  key="${setting%% *}"; value="${setting#* }"; gset "$dtp" "$key" "$value"
done
for setting in 'isolate-monitors false' 'isolate-monitors-with-single-panel false' \
  'intellihide false' 'hide-overview-on-startup true' 'animate-appicon-hover false' \
  'show-activities-button false' 'stockgs-force-hotcorner false'; do
  key="${setting%% *}"; value="${setting#* }"; gset "$dtp" "$key" "$value"
done
gset "$dtp" panel-position BOTTOM
gset "$dtp" panel-size 52
gset "$dtp" panel-side-margins 0
gset "$dtp" panel-top-bottom-margins 0
gset "$dtp" panel-side-padding 4
gset "$dtp" panel-top-bottom-padding 2
gset "$dtp" appicon-padding 7
gset "$dtp" appicon-margin 5
gset "$dtp" trans-use-custom-bg true
gset "$dtp" trans-bg-color '#191215'
gset "$dtp" trans-use-custom-opacity true
gset "$dtp" trans-use-dynamic-opacity false
gset "$dtp" trans-panel-opacity 1.0
gset "$dtp" trans-use-border true
gset "$dtp" trans-border-width 1
gset "$dtp" trans-border-use-custom-color true
gset "$dtp" trans-border-custom-color "rgba($RED_R,$RED_G,$RED_B,0.24)"
gset "$dtp" dot-color-override true
gset "$dtp" dot-size 3
for i in 1 2 3 4; do gset "$dtp" "dot-color-$i" "$RED_HEX"; done
gset "$dtp" highlight-appicon-hover true
gset "$dtp" highlight-appicon-hover-border-radius 12
gset "$dtp" highlight-appicon-hover-background-color "rgba($RED_R,$RED_G,$RED_B,0.12)"
gset "$dtp" highlight-appicon-pressed-background-color "rgba($RED_R,$RED_G,$RED_B,0.20)"
gset "$dtp" group-apps-underline-unfocused true

# Ajustes JSON por monitor; los índices actúan como fallback si el ID es otro.
json_panels="$(python3 - <<'PY'
import json
print(json.dumps({str(i):"BOTTOM" for i in range(8)},separators=(",",":")))
PY
)"
json_lengths="$(python3 - <<'PY'
import json
print(json.dumps({str(i):100 for i in range(8)},separators=(",",":")))
PY
)"
json_sizes="$(python3 - <<'PY'
import json
print(json.dumps({str(i):52 for i in range(8)},separators=(",",":")))
PY
)"
json_items="$(python3 - <<'PY'
import json
base=[
    ("showAppsButton",False,"stackedTL"),("activitiesButton",False,"stackedTL"),
    ("leftBox",True,"stackedTL"),("taskbar",True,"stackedTL"),
    ("centerBox",False,"stackedBR"),("rightBox",True,"stackedBR"),
    ("dateMenu",True,"stackedBR"),("systemMenu",True,"stackedBR"),
    ("desktopButton",False,"stackedBR")]
items=[dict(element=n,visible=v,position=p) for n,v,p in base]
print(json.dumps({str(i):items for i in range(8)},separators=(",",":")))
PY
)"
gset "$dtp" panel-positions "$json_panels"
gset "$dtp" panel-lengths "$json_lengths"
gset "$dtp" panel-sizes "$json_sizes"
gset "$dtp" panel-element-positions "$json_items"

arc='org.gnome.shell.extensions.arcmenu'
gset "$arc" arcmenu-hotkey "['Super_L','Super_R']"
gset "$arc" arcmenu-hotkey-overlay-key-enabled true
gset "$arc" multi-monitor true
gset "$arc" hide-overview-on-startup true
# ArcMenu rojo sobre grafito, con bordes y selecciones usando la muestra real.
gset "$arc" override-menu-theme true
gset "$arc" menu-background-color 'rgba(22,16,19,0.98)'
gset "$arc" menu-foreground-color 'rgb(238,233,236)'
gset "$arc" menu-border-color "rgba($RED_R,$RED_G,$RED_B,0.30)"
gset "$arc" menu-border-width 1
gset "$arc" menu-border-radius 14
gset "$arc" menu-item-hover-bg-color "rgba($RED_R,$RED_G,$RED_B,0.24)"
gset "$arc" menu-item-hover-fg-color 'rgb(255,255,255)'
gset "$arc" menu-item-active-bg-color "rgba($RED_R,$RED_G,$RED_B,0.38)"
gset "$arc" menu-item-active-fg-color 'rgb(255,255,255)'
gset "$arc" menu-button-fg-color "(true, 'rgb($RED_R,$RED_G,$RED_B)')"

say 'Tema GTK3 Adwaita Dark y controles alineados'
python3 - "$HOME/.config/gtk-3.0/settings.ini" <<'PY'
import configparser,pathlib,sys
p=pathlib.Path(sys.argv[1]); p.parent.mkdir(parents=True,exist_ok=True)
cfg=configparser.ConfigParser(interpolation=None); cfg.optionxform=str
if p.exists(): cfg.read(p,encoding="utf-8")
if not cfg.has_section("Settings"): cfg.add_section("Settings")
cfg.set("Settings","gtk-theme-name","adw-gtk3-dark")
cfg.set("Settings","gtk-decoration-layout",":minimize,maximize,close")
cfg.set("Settings","gtk-application-prefer-dark-theme","true")
with p.open("w",encoding="utf-8") as f: cfg.write(f,space_around_delimiters=False)
PY

say 'Kitty con Geist Mono y Starship'
cat > "$HOME/.config/kitty/kitty.conf" <<'EOF'
font_family GeistMono Nerd Font Mono
font_size 11.0
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
confirm_os_window_close 0
enable_audio_bell no
EOF
# Aplicar también el rojo exacto al cursor, las selecciones y la paleta Kitty.
python3 - "$HOME/.config/kitty/kitty.conf" "$RED_HEX" <<'PY'
import sys, pathlib
p=pathlib.Path(sys.argv[1])
s=p.read_text()
for old in ("#a5b4fc","#89b4fa","#b4a0ff"):
    s=s.replace(old,sys.argv[2])
p.write_text(s)
PY
printf 'kitty.desktop\n' > "$HOME/.config/xdg-terminals.list"
mkdir -p "$HOME/.config"
cat > "$HOME/.config/starship.toml" <<'EOF'
add_newline = true
format = "$directory$git_branch$git_status$cmd_duration$line_break$character"
[directory]
style = "bold #A5B4FC"
format = "[$path]($style)  "
truncation_length = 3
[git_branch]
symbol = "󰘬 "
style = "bold #89B4FA"
format = "[$symbol$branch]($style) "
[git_status]
style = "#F9E2AF"
format = "([$all_status$ahead_behind]($style)) "
[cmd_duration]
min_time = 2000
style = "#9399B2"
format = "[󱦟 $duration]($style) "
[character]
success_symbol = "[❯](bold #A5B4FC)"
error_symbol = "[❯](bold #F38BA8)"
EOF
# El tema Starship comparte la misma muestra RGB del fondo.
python3 - "$HOME/.config/starship.toml" "$RED_HEX" <<'PY'
import sys, pathlib
p=pathlib.Path(sys.argv[1])
s=p.read_text()
for old in ("#A5B4FC","#89B4FA"):
    s=s.replace(old,sys.argv[2])
p.write_text(s)
PY
if ! grep -Fq 'starship init bash' "$HOME/.bashrc" 2>/dev/null; then
  printf '\n# GNOME Noir\ncommand -v starship >/dev/null && eval "$(starship init bash)"\n' >> "$HOME/.bashrc"
fi

# Atajo Ctrl+Alt+T para Kitty, configurado con gsettings.
python3 - <<'PY'
import subprocess,ast
schema="org.gnome.settings-daemon.plugins.media-keys"
prefix="org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:"
path="/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/gnome-noir-kitty/"
def get(s,k):
    return subprocess.check_output(["gsettings","get",s,k],text=True).strip()
def put(s,k,v):
    subprocess.run(["gsettings","set",s,k,v],check=True)
try:
    v=get(schema,"custom-keybindings")
    if v.startswith("@as "): v=v[4:]
    paths=ast.literal_eval(v)
    if not isinstance(paths,list): paths=[]
    if path not in paths:
        paths.append(path)
        put(schema,"custom-keybindings",repr(paths))
    put(prefix+path,"name","Kitty")
    put(prefix+path,"command","kitty")
    put(prefix+path,"binding","<Control><Alt>t")
except (OSError,ValueError,SyntaxError,subprocess.CalledProcessError) as e:
    print("AVISO: no pude configurar Ctrl+Alt+T:",e)
PY

# GDM permite usar ~/.config/monitors.xml cuando GNOME haya guardado
# la posición real de las pantallas. Instalamos el sincronizador para futuros boots.
say 'Preparar el monitor derecho para GDM (se aplica tras guardar pantallas en GNOME)'
sync="$(mktemp)"
cat > "$sync" <<'PY'
#!/usr/bin/env python3
import os,sys,xml.etree.ElementTree as ET
home=sys.argv[1]
path=os.path.join(home,".config","monitors.xml")
if not os.path.isfile(path): sys.exit(0)
try:
    tree=ET.parse(path)
    for config in tree.getroot().findall(".//configuration"):
        entries=config.findall("logicalmonitor")
        if len(entries)<2: continue
        xs=[]
        for i,e in enumerate(entries):
            try: x=int(e.findtext("x","0"))
            except ValueError: x=0
            xs.append((x,i))
        if len(set(x for x,i in xs))<2: continue
        right=max(xs)[1]
        for i,e in enumerate(entries):
            primary=e.find("primary")
            if primary is None: primary=ET.SubElement(e,"primary")
            primary.text="yes" if i==right else "no"
    ET.indent(tree)
    tree.write("/etc/xdg/monitors.xml",encoding="utf-8",xml_declaration=True)
except (OSError,ET.ParseError) as exc:
    print("GNOME Noir: no se pudo sincronizar monitors.xml:",exc,file=sys.stderr)
PY
sudo install -Dm755 "$sync" /usr/local/libexec/gnome-noir-sync-monitors
rm -f "$sync"
dropin="$(mktemp)"
printf '[Service]\nExecStartPre=/usr/local/libexec/gnome-noir-sync-monitors %s\n' "$HOME" > "$dropin"
sudo install -Dm644 "$dropin" /etc/systemd/system/gdm.service.d/gnome-noir-monitors.conf
rm -f "$dropin"
sudo systemctl daemon-reload
if [[ -f "$HOME/.config/monitors.xml" ]]; then
  sudo /usr/local/libexec/gnome-noir-sync-monitors "$HOME" || true
else
  warn 'Tras el primer inicio, configura las pantallas en GNOME. GDM adoptará la pantalla derecha en el siguiente arranque.'
fi

if [[ $SKIP_BOOT == 0 ]]; then
  say 'Plymouth: logo oficial de Arch Linux sobre fondo negro'
  # No asumir mkinitcpio: solo aplicar con generador y bootloader compatibles.
  boot_generator=''
  if command -v mkinitcpio >/dev/null && [[ -f /etc/mkinitcpio.conf ]]; then
    boot_generator='mkinitcpio'
  elif command -v dracut >/dev/null; then
    boot_generator='dracut'
  fi
  if [[ -z "$boot_generator" ]]; then
    warn 'Sin mkinitcpio/dracut: no modifico el arranque.'
  else
    sudo pacman -S --needed plymouth
    work="$(mktemp -d)"
    if curl -fL --retry 3 \
      https://archlinux.org/static/logos/archlinux-logo-light-scalable.svg \
      -o "$work/logo.svg" && \
      rsvg-convert --width=1920 --keep-aspect-ratio \
        -o "$work/logo.png" "$work/logo.svg"; then
      cat > "$work/arch-noir.plymouth" <<'EOF'
[Plymouth Theme]
Name=Arch Noir
Description=Official Arch Linux logo on black
ModuleName=script
[script]
ImageDir=/usr/share/plymouth/themes/arch-noir
ScriptFile=/usr/share/plymouth/themes/arch-noir/arch-noir.script
EOF
      cat > "$work/arch-noir.script" <<'EOF'
Window.SetBackgroundTopColor (0.0,0.0,0.0);
Window.SetBackgroundBottomColor (0.0,0.0,0.0);
image=Image("logo.png");
width=Window.GetWidth()*0.34;
if (width>850) width=850;
if (width<290) width=290;
picture=image.Scale(width, image.GetHeight()*width/image.GetWidth());
sprite=Sprite(picture);
sprite.SetPosition((Window.GetWidth()-picture.GetWidth())/2,
                   (Window.GetHeight()-picture.GetHeight())/2,10);
EOF
      sudo install -Dm644 "$work/arch-noir.plymouth" /usr/share/plymouth/themes/arch-noir/arch-noir.plymouth
      sudo install -Dm644 "$work/arch-noir.script" /usr/share/plymouth/themes/arch-noir/arch-noir.script
      sudo install -Dm644 "$work/logo.png" /usr/share/plymouth/themes/arch-noir/logo.png
      sudo plymouth-set-default-theme arch-noir

      boot_ready=0
      if [[ "$boot_generator" == mkinitcpio ]]; then
        sudo cp -an /etc/mkinitcpio.conf /etc/mkinitcpio.conf.before-arch-noir
        if sudo python3 - <<'PY'
from pathlib import Path
import re,shlex
p=Path("/etc/mkinitcpio.conf")
s=p.read_text()
m=re.search(r"(?m)^([ \t]*HOOKS[ \t]*=[ \t]*\()([^)]*)(\))",s)
if not m: raise SystemExit("No encontré HOOKS=(...)")
hooks=shlex.split(m.group(2))
if "plymouth" not in hooks:
    if "systemd" in hooks: at=hooks.index("systemd")+1
    elif "udev" in hooks: at=hooks.index("udev")+1
    else: raise SystemExit("No reconozco systemd/udev")
    hooks.insert(at,"plymouth")
    p.write_text(s[:m.start()]+m.group(1)+" ".join(hooks)+m.group(3)+s[m.end():])
PY
        then
          if sudo mkinitcpio -P; then
            boot_ready=1
          else
            warn 'Falló mkinitcpio; restaurando los hooks anteriores.'
            sudo cp -a /etc/mkinitcpio.conf.before-arch-noir /etc/mkinitcpio.conf
            sudo mkinitcpio -P || true
          fi
        fi
      else
        printf 'add_dracutmodules+=" plymouth "\n' | sudo tee /etc/dracut.conf.d/arch-noir.conf >/dev/null
        if sudo dracut --regenerate-all --force; then
          boot_ready=1
        else
          sudo rm -f /etc/dracut.conf.d/arch-noir.conf
          warn 'Falló dracut; no se modificarán las opciones del bootloader.'
        fi
      fi

      if ((boot_ready)); then
        changed=0
        for root in /boot /efi /boot/efi; do
          [[ -d "$root/loader/entries" ]] || continue
          while IFS= read -r -d '' entry; do
            [[ "$entry" == *.before-arch-noir ]] && continue
            grep -qE '^options[[:space:]]+' "$entry" || continue
            sudo cp -n "$entry" "$entry.before-arch-noir"
            sudo python3 - "$entry" <<'PY'
from pathlib import Path
import sys,re
p=Path(sys.argv[1])
lines=[]
for line in p.read_text().splitlines():
    if re.match(r"^\s*options\s+",line):
        opts=line.split()
        for key in ("quiet","splash"):
            if key not in opts: line+=" "+key
    lines.append(line)
p.write_text("\n".join(lines)+"\n")
PY
            changed=$((changed+1))
          done < <(find "$root/loader/entries" -maxdepth 1 -type f -name '*.conf' -print0)
        done
        if ((changed==0)); then
          warn 'Si utilizas UKI o un cargador distinto de systemd-boot, debes activar splash manualmente.'
        fi
      fi
    else
      warn 'No se pudo obtener el SVG oficial; Plymouth no ha cambiado el arranque.'
    fi
    rm -rf -- "$work"
  fi
fi


# OpenBar (si ya está instalado): tema Islands oscuro y rojo elegido del fondo.
# No forzamos una extensión sin soporte oficial en GNOME 50/51.
openbar_dir="$HOME/.local/share/gnome-shell/extensions/openbar@neuromorph"
if [[ -f "$openbar_dir/schemas/org.gnome.shell.extensions.openbar.gschema.xml" ]]; then
  say 'Adaptar OpenBar al rojo del fondo'
  if [[ ! -f "$openbar_dir/schemas/gschemas.compiled" ]]; then
    glib-compile-schemas "$openbar_dir/schemas" || warn 'No se pudieron compilar los esquemas de OpenBar.'
  fi
  if [[ -f "$openbar_dir/schemas/gschemas.compiled" ]]; then
    ob_schema='org.gnome.shell.extensions.openbar'
    obset(){
      GSETTINGS_SCHEMA_DIR="$openbar_dir/schemas" gsettings set "$ob_schema" "$1" "$2" \
        || warn "Ajuste OpenBar no disponible: $1"
    }
    obrgb="$(python3 - "$RED_R" "$RED_G" "$RED_B" <<'PY'
import sys
vals=[str(round(int(c)/255,4)) for c in sys.argv[1:]]
print("['"+"','".join(vals)+"']")
PY
)"
    obset bartype Islands
    obset position Bottom
    obset monitors all
    obset accent-color "$obrgb"
    obset bgcolor "['0.098','0.071','0.078']"
    obset iscolor "['0.14','0.09','0.11']"
    obset bcolor "$obrgb"
    obset hcolor "$obrgb"
    obset mhcolor "$obrgb"
    obset mscolor "$obrgb"
    obset menustyle true
    obset bradius 14.0
    obset bwidth 1.0
    obset neon false
    obset shadow false
    obset autotheme-refresh false
    # No se habilita automáticamente: GNOME 50+ aún tiene incidencias de compatibilidad.
    gnome_major="$(gnome-shell --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || true)"
    if [[ -n "$gnome_major" && "$gnome_major" -le 49 ]]; then
      say 'OpenBar es compatible según su metadata; actívalo desde Extensiones de GNOME.'
    else
      warn 'OpenBar configurado pero no habilitado; comprueba su compatibilidad con tu versión de GNOME.'
    fi
  fi
fi

say 'Configuración GNOME Noir completada'
echo 'Instalación única finalizada: no se ha instalado KDE ni otro terminal.'
echo 'Reinicia cuando el instalador del kernel/boot haya terminado correctamente: sudo reboot'
echo 'Pantallas: al ajustar la derecha como principal en GNOME, GDM lo copiará al siguiente arranque.'
echo 'Wolow: Wake-on-LAN necesita Ethernet y habilitar Wake on PCIe/LAN en BIOS (y desactivar ErP).'
echo 'VS Code/Minecraft (AUR), SignalRGB (beta) y hardware NVIDIA pueden requerir pasos adicionales.'
