#!/usr/bin/env bash
# Puesta a punto mínima de Arch + KDE Plasma (v3, noviembre de 2026)
# Apps solicitadas y utilidades KDE autorizadas. No instalar como root.
# Ejecutar solo en una instalación nueva de Arch Linux, no desde el ISO.
set -Eeuo pipefail

if (( EUID == 0 )); then
  echo 'Ejecuta este script como usuario normal (no con sudo).'
  exit 1
fi
if [[ $(uname -m) != x86_64 ]]; then
  echo 'Este script está preparado para Arch Linux x86_64.'
  exit 1
fi
command -v pacman >/dev/null || { echo 'No se encontró pacman.'; exit 1; }

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33mAVISO: %s\033[0m\n' "$*" >&2; }

say 'Actualizar Arch Linux'
sudo -v
sudo pacman -Syu

say 'Habilitar multilib para Steam y sus bibliotecas de 32 bits'
if ! pacman-conf --repo-list | grep -qx multilib; then
  sudo cp -n /etc/pacman.conf /etc/pacman.conf.pre-setup.bak
  sudo sed -i '/^#\[multilib\]/{s/^#//;n;s/^#Include/Include/;}' /etc/pacman.conf
  if ! pacman-conf --repo-list | grep -qx multilib; then
    warn 'No se pudo habilitar multilib automáticamente. Revísalo en /etc/pacman.conf.'
    exit 1
  fi
  sudo pacman -Syu
fi

say 'Dependencias del sistema y desarrollo (sin apps extra)'
sudo pacman -S --needed \
  base-devel git curl jq pciutils konsole \
  mesa vulkan-icd-loader lib32-mesa lib32-vulkan-icd-loader \
  networkmanager bluez bluez-utils \
  pipewire pipewire-alsa pipewire-pulse wireplumber \
  fuse2 \
  python python-pip \
  gcc gdb make cmake \
  jdk-openjdk rustup

sudo systemctl enable --now NetworkManager.service
sudo systemctl enable --now bluetooth.service
if ! rustup show active-toolchain >/dev/null 2>&1; then
  say 'Activar Rust estable'
  rustup default stable
fi

say 'Detectar tarjetas gráficas'
gpu_info=$(lspci -nn | grep -Ei '(VGA compatible controller|3D controller|Display controller)' || true)
printf '%s\n' "$gpu_info"
gpu_pkgs=()
if grep -Eiq '(Advanced Micro Devices|AMD/ATI|ATI Technologies)' <<< "$gpu_info"; then
  gpu_pkgs+=(vulkan-radeon lib32-vulkan-radeon)
fi
if grep -Eiq 'Intel Corporation' <<< "$gpu_info"; then
  gpu_pkgs+=(vulkan-intel lib32-vulkan-intel)
fi
nvidia_detected=false
nvidia_ready=false
if grep -Eiq 'NVIDIA' <<< "$gpu_info"; then
  nvidia_detected=true
  if pacman -Q nvidia-utils >/dev/null 2>&1; then
    nvidia_ready=true
    gpu_pkgs+=(lib32-nvidia-utils)
    echo 'NVIDIA: ya tienes nvidia-utils; no se reemplazará el driver.'
  else
    warn 'NVIDIA detectada sin nvidia-utils. NO instalaré a ciegas un driver: las GTX antiguas requieren otra rama.'
  fi
fi
if ((${#gpu_pkgs[@]})); then
  sudo pacman -S --needed "${gpu_pkgs[@]}"
fi

say 'VLC y Okular: aplicaciones originales desde los repositorios de Arch'
# VLC reparte sus codecs en paquetes adicionales: extra incluye FFmpeg y formatos comunes.
sudo pacman -S --needed vlc vlc-plugins-extra okular

say 'Bitwarden: versión verificada del desarrollador (Flathub)'
# A fecha de noviembre 2026, la versión estable de Arch va varios meses por detrás.
# Elegimos la publicación de Bitwarden Inc. en Flathub. No es un cliente alternativo.
sudo pacman -S --needed flatpak
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
if pacman -Q bitwarden >/dev/null 2>&1; then
  warn 'Ya existe Bitwarden de pacman; no instalaré una segunda copia. Comprueba su versión.'
  warn 'Para cambiar al Flatpak verificado: desinstala primero el paquete con pacman -R bitwarden.'
else
  flatpak install --user --assumeyes flathub com.bitwarden.desktop
fi

say 'LaTeX: compiladores y paquetes para apuntes, matemáticas, TikZ e idiomas'
# pdflatex + xelatex + lualatex; latexmk en texlive-binextra.
# Sin texlive-meta: evita descargar colecciones enormes que no necesitas.
sudo pacman -S --needed \
  texlive-latexrecommended texlive-latexextra \
  texlive-fontsrecommended texlive-mathscience texlive-pictures \
  texlive-xetex texlive-luatex texlive-binextra \
  texlive-langspanish texlive-langeuropean

say 'Personalización KDE: widgets adicionales y motor de temas Qt6'
# Solo se instalan las herramientas; NO se modifica tu tema ni los paneles.
sudo pacman -S --needed kdeplasma-addons kvantum

say 'Spotify: cliente original, descargado por spotify-launcher'
sudo pacman -S --needed spotify-launcher

say 'Steam: cliente de Valve'
if [[ $nvidia_detected == false || $nvidia_ready == true ]]; then
  sudo pacman -S --needed steam
else
  warn 'Steam pendiente: primero comprueba el controlador y Vulkan de NVIDIA para evitar elegir bibliotecas incorrectas.'
fi

say 'Discord: paquete oficial para Arch descargado de discord.com'
if ! pacman -Q discord >/dev/null 2>&1; then
  discord_tmp=$(mktemp -d)
  if curl -fL --retry 3 'https://discord.com/api/download/stable?platform=linux&format=pkg.tar.zst' -o "$discord_tmp/Discord.pkg.tar.zst"; then
    sudo pacman -U "$discord_tmp/Discord.pkg.tar.zst"
  else
    warn 'No se pudo descargar Discord desde su web oficial.'
  fi
  rm -rf -- "$discord_tmp"
else
  echo 'Discord ya está instalado.'
fi

# Ambos paquetes AUR son envoltorios de software original, NO clientes alternativos.
# AUR es comunitario: muestra su PKGBUILD y pide autorización separada.
install_aur() {
  local pkg="$1" tmp answer
  if pacman -Q "$pkg" >/dev/null 2>&1; then
    echo "$pkg ya está instalado."
    return 0
  fi
  tmp=$(mktemp -d)
  say "AUR: $pkg"
  if ! git clone --depth 1 "https://aur.archlinux.org/${pkg}.git" "$tmp/$pkg"; then
    warn "No se pudo obtener $pkg de AUR."
    rm -rf -- "$tmp"
    return 0
  fi
  echo "Archivo PKGBUILD: $tmp/$pkg/PKGBUILD"
  sed -n '1,160p' "$tmp/$pkg/PKGBUILD"
  read -r -p "¿Has revisado el PKGBUILD y autorizas instalar $pkg? [s/N] " answer
  if [[ $answer =~ ^[sSyY]$ ]]; then
    ( cd "$tmp/$pkg" && makepkg -si ) || warn "La instalación de $pkg no se completó."
  else
    echo "Omitido: $pkg"
  fi
  rm -rf -- "$tmp"
}

install_aur visual-studio-code-bin
install_aur minecraft-launcher

say 'Helium: AppImage oficial del proyecto (sin AUR ni Flatpak no oficial)'
if [[ -f "$HOME/.local/opt/helium/Helium.AppImage" ]]; then
  echo 'Helium ya existe; para actualizarlo, descarga su AppImage oficial más reciente.'
else
  helium_json=$(mktemp)
  if curl -fsSL --retry 2 'https://api.github.com/repos/imputnet/helium-linux/releases/latest' -o "$helium_json"; then
    helium_url=$(jq -r '[.assets[]? | select(.name | test("\\.AppImage$"; "i")) | select(.name | test("x86_64|amd64|x64"; "i")) | .browser_download_url][0] // empty' "$helium_json")
    if [[ -n $helium_url && $helium_url == https://github.com/imputnet/helium-linux/releases/download/* ]]; then
      mkdir -p "$HOME/.local/opt/helium" "$HOME/.local/share/applications"
      if curl -fL --retry 3 "$helium_url" -o "$HOME/.local/opt/helium/Helium.AppImage"; then
        chmod +x "$HOME/.local/opt/helium/Helium.AppImage"
        mkdir -p "$HOME/.local/share/icons/hicolor/scalable/apps"
        curl -fL --retry 3 'https://raw.githubusercontent.com/imputnet/helium/main/resources/branding/product_logo.svg' \
          -o "$HOME/.local/share/icons/hicolor/scalable/apps/helium.svg" \
          || warn 'No se pudo descargar el icono oficial de Helium.'
        cat > "$HOME/.local/share/applications/helium-official.desktop" <<DESKTOP
[Desktop Entry]
Name=Helium
Comment=Navegador Helium oficial
Exec=$HOME/.local/opt/helium/Helium.AppImage %U
Icon=helium
StartupWMClass=helium
Terminal=false
Type=Application
Categories=Network;WebBrowser;
StartupNotify=true
DESKTOP
        echo 'Helium integrado en el menú de KDE.'
      else
        rm -f "$HOME/.local/opt/helium/Helium.AppImage"
        warn 'Falló la descarga oficial de Helium.'
      fi
    else
      warn 'No se encontró una AppImage x86_64 en la versión más reciente de Helium.'
    fi
  else
    warn 'No se pudo consultar la versión más reciente de Helium.'
  fi
  rm -f -- "$helium_json"
fi

# ===== Nuevas aplicaciones autorizadas: Wolow Companion + SignalRGB =====

say 'Wake-on-LAN: activar paquete mágico en perfiles de Ethernet de NetworkManager'
# No habilitar WoL en Wi-Fi; la BIOS/UEFI debe permitir Wake on PCIe/LAN.
wol_profiles=0
while IFS=: read -r uuid type; do
  if [[ "$type" == "802-3-ethernet" || "$type" == "ethernet" ]]; then
    if sudo nmcli connection modify "$uuid" 802-3-ethernet.wake-on-lan magic; then
      ((wol_profiles+=1))
    else
      warn "No se pudo activar WoL en el perfil $uuid."
    fi
  fi
done < <(nmcli -t -f UUID,TYPE connection show)
if ((wol_profiles == 0)); then
  warn 'No hay perfiles Ethernet configurados; conecta por cable y activa Wake-on-LAN desde NetworkManager.'
else
  echo "Wake-on-LAN preparado en $wol_profiles perfil(es) Ethernet. Se aplicará al reconectar o reiniciar."
fi

say 'Wolow Companion: descarga oficial Linux x86_64'
# Publicado por wolow.site: archivo oficial en storage.jackbaker.dev.
# La distribución es un tar.gz; se extrae en tu HOME sin ejecutar scripts desconocidos.
wolow_dir="$HOME/.local/opt/wolow-companion"
if [[ -f "$HOME/.local/bin/wolow-companion" ]]; then
  echo 'Wolow Companion ya está preparado; omitiendo descarga.'
else
  wolow_temp=$(mktemp -d)
  if curl -fL --retry 3 --connect-timeout 15 \
    'https://storage.jackbaker.dev/downloads/linux/wolow-companion-linux-amd64.tar.gz' \
    -o "$wolow_temp/wolow.tar.gz"; then
    mkdir -p "$wolow_dir" "$HOME/.local/bin" "$HOME/.config/autostart"
    # Tarfile data filter bloquea rutas escapadas, enlaces inseguros y ficheros especiales.
    if python - "$wolow_temp/wolow.tar.gz" "$wolow_dir" <<'PYEXTRACT'
import pathlib, sys, tarfile
archive, target = sys.argv[1:]
with tarfile.open(archive, 'r:gz') as tar:
    tar.extractall(path=pathlib.Path(target), filter='data')
PYEXTRACT
    then
      # Se registra solo si existe exactamente un ejecutable con nombre relacionado.
      mapfile -d '' wolow_execs < <(find "$wolow_dir" -type f -perm /111 \
        \( -iname '*wolow*' -o -iname '*companion*' \) -print0)
      if ((${#wolow_execs[@]} == 1)); then
        wolow_exec="${wolow_execs[0]}"
        printf '#!/usr/bin/env bash\ncd %q\nexec %q "$@"\n' \
          "$(dirname "$wolow_exec")" "$wolow_exec" > "$HOME/.local/bin/wolow-companion"
        chmod +x "$HOME/.local/bin/wolow-companion"
        cat > "$HOME/.config/autostart/wolow-companion.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Wolow Companion
Comment=Control remoto de encendido/apagado para Wolow
Exec=$HOME/.local/bin/wolow-companion
Terminal=false
X-KDE-autostart-after=panel
DESKTOP
        echo 'Wolow Companion preparado para abrirse al iniciar KDE.'
      else
        warn 'Archivo oficial extraído, pero su ejecutable no se pudo identificar automáticamente.'
        warn "Revisa el contenido y las instrucciones en: $wolow_dir"
        find "$wolow_dir" -maxdepth 2 -type f -printf '%P\n' | head -25
      fi
    else
      warn 'No se pudo extraer de manera segura el archivo oficial de Wolow.'
    fi
  else
    warn 'No se pudo descargar Wolow Companion desde el sitio oficial.'
  fi
  rm -rf -- "$wolow_temp"
fi

say 'SignalRGB: instalar versión oficial beta para Arch Linux'
# Esta instalación añade el repositorio firmado del proveedor a pacman.
# El instalador oficial puede solicitar contraseña sudo.
if pacman -Q signalrgb >/dev/null 2>&1; then
  echo 'SignalRGB ya está instalado; sus actualizaciones se gestionan con pacman.'
else
  signal_installer=$(mktemp)
  if curl -fsSL --retry 3 'https://pkgs.signalrgb.com/install.sh' -o "$signal_installer"; then
    echo 'Origen: https://pkgs.signalrgb.com/install.sh'
    echo 'Se ejecutará el instalador oficial con: --channel beta'
    if bash "$signal_installer" --channel beta; then
      echo 'Se ha ejecutado correctamente el instalador oficial de SignalRGB.'
    else
      warn 'Falló la instalación de SignalRGB. Consulta https://signalrgb.com/linux/'
    fi
  else
    warn 'No se pudo obtener el instalador oficial de SignalRGB.'
  fi
  rm -f -- "$signal_installer"
fi

say 'Resumen de drivers (solo lectura)'
lspci -k | grep -EA 3 '(VGA compatible controller|3D controller|Display controller)' || true
if [[ $nvidia_detected == true && $nvidia_ready == false ]]; then
  warn 'Pendiente NVIDIA. Envíame la salida de: lspci -nnk | grep -EA 4 "VGA|3D|Display"'
fi
say 'Comprobar herramientas LaTeX'
for cmd in pdflatex xelatex lualatex latexmk; do
  if command -v "$cmd" >/dev/null 2>&1; then
    printf 'OK: %s\n' "$cmd"
  else
    warn "No aparece $cmd en PATH; comprueba la instalación de TeX Live."
  fi
done
printf '\nListo. Reinicia cuando terminen las instalaciones.\n'
printf 'WoL: recuerda habilitar Wake on PCIe/LAN en la BIOS/UEFI.\n'
printf 'SignalRGB en Linux es beta; revisa la compatibilidad de tus dispositivos.\n'
printf 'Bitwarden se actualiza con: flatpak update --user (o desde Discover).\n'
printf 'AUR y el AppImage de Helium requieren revisión/actualización independiente de pacman.\n'