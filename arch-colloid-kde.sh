#!/usr/bin/env bash
# Colloid Dark para Arch + KDE Plasma 6 (adaptación conservadora de tema upstream)
# No rehace paneles, no toca el fondo, no cambia tipografías ni atajos.
set -Eeuo pipefail
say(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn(){ printf '\nAVISO: %s\n' "$*" >&2; }
[[ "$EUID" -ne 0 ]] || { echo "Ejecuta esto como usuario normal, sin sudo." >&2; exit 1; }
command -v pacman >/dev/null || { echo "Se requiere Arch Linux." >&2; exit 1; }
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || { echo "Ejecuta dentro de tu sesión gráfica KDE." >&2; exit 1; }

backup="$HOME/.local/state/colloid-kde/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup"
files=()
for f in .config/kdeglobals .config/kwinrc .config/Kvantum/kvantum.kvconfig .config/plasmashellrc; do
  if [[ -f "$HOME/$f" ]]; then files+=("$f"); fi
done
if ((${#files[@]} > 0)); then
  tar -czf "$backup/config-before.tar.gz" -C "$HOME" "${files[@]}"
fi
cat > "$backup/restore.sh" <<'RESTORE'
#!/usr/bin/env bash
set -Eeuo pipefail
home="$HOME"
dir="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$dir/config-before.tar.gz" ]]; then
  tar -xzf "$dir/config-before.tar.gz" -C "$home"
fi
qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true
echo 'Configuración restaurada; cierra sesión y vuelve a entrar.'
RESTORE
chmod +x "$backup/restore.sh"
say "Copia de seguridad: $backup"

say 'Dependencias oficiales: Git y Kvantum'
sudo pacman -S --needed git kvantum

tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT

# Revisiones concretas verificadas al preparar el instalador.
# No ejecutamos el install.sh global del viejo tema KDE: escribe ~/.Xresources
# y copia archivos de Latte Dock / Plasma 5 que no queremos.
checkout_pinned() {
  local dest="$1" remote="$2" revision="$3"
  mkdir -p "$dest"
  git -C "$dest" init -q
  git -C "$dest" remote add origin "$remote"
  git -C "$dest" fetch --quiet --depth 1 origin "$revision"
  git -C "$dest" checkout -q FETCH_HEAD
  [[ "$(git -C "$dest" rev-parse HEAD)" == "$revision" ]] || {
    echo "El repositorio no coincide con la revisión esperada: $remote" >&2
    exit 1
  }
}
say 'Descargando Colloid desde el repositorio de su autor (revisión fijada)'
checkout_pinned "$tmp/kde" https://github.com/vinceliuice/Colloid-kde.git b768904d10ba9fcb95abfb59538eab100b1fed1e
checkout_pinned "$tmp/icons" https://github.com/vinceliuice/Colloid-icon-theme.git ceac6608ecd0e40025cbc2ebbd32bf0e0f4ebc6a

say 'Instalando componentes Colloid Dark para este usuario'
mkdir -p "$HOME/.local/share/color-schemes" "$HOME/.config/Kvantum" \
  "$HOME/.local/share/plasma/desktoptheme" "$HOME/.local/share/aurorae/themes"
cp -f "$tmp/kde/color-schemes/ColloidDark.colors" "$HOME/.local/share/color-schemes/"
cp -a "$tmp/kde/Kvantum/Colloid" "$HOME/.config/Kvantum/"
cp -a "$tmp/kde/aurorae/Colloid-dark-round" "$HOME/.local/share/aurorae/themes/"
mkdir -p "$HOME/.local/share/aurorae/themes/Colloid-dark-round"
cp -a "$tmp/kde/aurorae/common/." "$HOME/.local/share/aurorae/themes/Colloid-dark-round/"

plasma_style="$HOME/.local/share/plasma/desktoptheme/Colloid-dark"
mkdir -p "$plasma_style"
cp -a "$tmp/kde/plasma/desktoptheme/Colloid-dark/." "$plasma_style/"
if [[ -d "$tmp/kde/plasma/desktoptheme/icons" ]]; then
  cp -a "$tmp/kde/plasma/desktoptheme/icons" "$plasma_style/"
fi
# Metadatos nuevos para Plasma 6; el upstream sigue usando metadata.desktop.
cat > "$plasma_style/metadata.json" <<'EOF'
{
  "KPlugin": {
    "Id": "Colloid-dark",
    "Name": "Colloid Dark",
    "Description": "Dark Plasma style by vinceliuice (Plasma 6 metadata adaptation)",
    "Version": "1.0",
    "License": "GPL-3.0-only",
    "Website": "https://github.com/vinceliuice/Colloid-kde"
  },
  "X-Plasma-API": "5.0"
}
EOF
cat > "$plasma_style/plasmarc" <<'EOF'
[Settings]
FallbackTheme=breeze-dark
[AdaptiveTransparency]
enabled=false
EOF
# Usa la paleta oscura explicitamente para que el panel no herede colores claros.
cp -f "$tmp/kde/color-schemes/ColloidDark.colors" "$plasma_style/colors"

say 'Instalando iconos Colloid Purple Dark'
# Ejecución únicamente del instalador de iconos del autor (instala en ~/.local/share/icons).
bash "$tmp/icons/install.sh" -t purple -p
icon_dir="$HOME/.local/share/icons/Colloid-Purple-Dark"
if [[ ! -f "$icon_dir/index.theme" ]]; then
  warn 'No se encontró Colloid-Purple-Dark; se conservarán los iconos actuales.'
else
  kwriteconfig6 --file kdeglobals --group Icons --key Theme Colloid-Purple-Dark
fi

say 'Aplicando paleta oscura, estilo de panel y Kvantum'
command -v plasma-apply-colorscheme >/dev/null || { echo 'No se encuentra plasma-apply-colorscheme.' >&2; exit 1; }
plasma-apply-colorscheme ColloidDark
if command -v plasma-apply-desktoptheme >/dev/null; then
  if ! plasma-apply-desktoptheme Colloid-dark; then
    warn 'No se pudo activar el estilo de panel Colloid; conservamos el panel anterior.'
  fi
fi
kwriteconfig6 --file Kvantum/kvantum.kvconfig --group General --key theme Colloid
kwriteconfig6 --file kdeglobals --group KDE --key widgetStyle kvantum
# Decoración de ventanas Colloid: no cambia el orden de los botones establecido en Noir Indigo.
if [[ -f "$HOME/.local/share/aurorae/themes/Colloid-dark-round/metadata.desktop" ]]; then
  kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key library org.kde.kwin.aurorae
  kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme __aurorae__svg__Colloid-dark-round
fi
# Mantener los controles Win-like de Noir Indigo, Inter y Geist Mono.
# No aplicar el Global Theme: esa opción reemplazaría paneles y fondos.
qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true
command -v kbuildsycoca6 >/dev/null && kbuildsycoca6 --noincremental >/dev/null 2>&1 || true

say 'Colloid Dark aplicado'
echo 'No se han modificado la distribución de paneles, monitores ni los fondos.'
echo 'Cierra sesión y vuelve a entrar para aplicar el tema completamente.'
echo "Restaurar configuración: bash $backup/restore.sh"
echo 'Nota: parte de Colloid sigue siendo legacy; algunas vistas pueden diferir en Plasma 6.'
