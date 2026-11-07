#!/usr/bin/env bash
# Orchis Dark + paneles inferiores fijos para Arch Linux / KDE Plasma 6
# Basado en https://github.com/vinceliuice/Orchis-kde
# No ejecuta el instalador global del tema ni reorganiza tus widgets.
set -Eeuo pipefail

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[[ $EUID -ne 0 ]] || fail 'Ejecuta este script como usuario normal, sin sudo.'
command -v pacman >/dev/null || fail 'Este script está preparado para Arch Linux.'
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || fail 'Ejecuta el script desde Konsole dentro de KDE Plasma.'
[[ "${XDG_CURRENT_DESKTOP:-}" == *KDE* || -n "${KDE_FULL_SESSION:-}" ]] || fail 'No se ha detectado KDE Plasma.'

BACKUP="$HOME/.local/state/orchis-kde/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
files=()
for rel in \
  .config/kdeglobals \
  .config/kwinrc \
  .config/kscreenlockerrc \
  .config/Kvantum/kvantum.kvconfig \
  .config/plasmashellrc \
  .config/plasma-org.kde.plasma.desktop-appletsrc; do
  if [[ -f "$HOME/$rel" ]]; then files+=("$rel"); fi
done
if (("${#files[@]}" > 0)); then
  tar -C "$HOME" -czf "$BACKUP/settings-before.tar.gz" "${files[@]}"
fi

cat > "$BACKUP/restore.sh" <<'RESTORE'
#!/usr/bin/env bash
set -Eeuo pipefail
dir="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$dir/settings-before.tar.gz" ]] || { echo 'No se encontró el backup.' >&2; exit 1; }
if systemctl --user is-active --quiet plasma-plasmashell.service; then
  systemctl --user stop plasma-plasmashell.service
else
  command -v kquitapp6 >/dev/null && kquitapp6 plasmashell >/dev/null 2>&1 || true
fi
tar -C "$HOME" -xzf "$dir/settings-before.tar.gz"
if systemctl --user list-unit-files plasma-plasmashell.service >/dev/null 2>&1; then
  systemctl --user start plasma-plasmashell.service
else
  nohup plasmashell --replace >/dev/null 2>&1 &
fi
qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true
echo 'Configuración anterior restaurada. Cierra sesión y vuelve a entrar.'
RESTORE
chmod +x "$BACKUP/restore.sh"
say "Backup guardado: $BACKUP"

# Si una operación falla después de detener Plasma, intenta recuperar la barra.
recover_shell() {
  if ! pgrep -x -u "$(id -u)" plasmashell >/dev/null 2>&1; then
    systemctl --user start plasma-plasmashell.service >/dev/null 2>&1 || {
      nohup plasmashell --replace >/dev/null 2>&1 &
    }
  fi
}
trap recover_shell EXIT

say 'Instalando dependencias necesarias desde los repositorios oficiales'
sudo pacman -S --needed git kvantum python

for command_name in kwriteconfig6 qdbus6 plasma-apply-colorscheme; do
  command -v "$command_name" >/dev/null || fail "Falta $command_name."
done

tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"; recover_shell' EXIT
say 'Descargando una revisión concreta del tema original Orchis'
git -C "$tmp" init -q
git -C "$tmp" remote add origin https://github.com/vinceliuice/Orchis-kde.git
ORCHIS_COMMIT='b2a96919eee40264e79db402b915f926436100ad'
git -C "$tmp" fetch --quiet --depth 1 origin "$ORCHIS_COMMIT"
git -C "$tmp" checkout -q FETCH_HEAD
[[ "$(git -C "$tmp" rev-parse HEAD)" == "$ORCHIS_COMMIT" ]] || fail 'La revisión de Orchis no coincide.'

say 'Instalando Orchis Dark de forma selectiva (sin modificar los paneles)'
mkdir -p \
  "$HOME/.local/share/color-schemes" \
  "$HOME/.local/share/plasma/desktoptheme/Orchis-dark" \
  "$HOME/.local/share/aurorae/themes" \
  "$HOME/.config/Kvantum"
cp -f "$tmp/color-schemes/OrchisDark.colors" "$HOME/.local/share/color-schemes/"
cp -a "$tmp/plasma/desktoptheme/Orchis-dark/." "$HOME/.local/share/plasma/desktoptheme/Orchis-dark/"
if [[ -d "$tmp/plasma/desktoptheme/icons" ]]; then
  cp -a "$tmp/plasma/desktoptheme/icons" "$HOME/.local/share/plasma/desktoptheme/Orchis-dark/"
fi
cp -f "$tmp/color-schemes/OrchisDark.colors" "$HOME/.local/share/plasma/desktoptheme/Orchis-dark/colors"
cp -a "$tmp/aurorae/Orchis-dark-solid" "$HOME/.local/share/aurorae/themes/"
cp -a "$tmp/Kvantum/Orchis-solid" "$HOME/.config/Kvantum/"

# El tema original incluye metadata.desktop de Plasma antiguo.
# Añadimos metadata.json para que Plasma 6 pueda identificar el tema.
cat > "$HOME/.local/share/plasma/desktoptheme/Orchis-dark/metadata.json" <<'EOF'
{
  "KPlugin": {
    "Id": "Orchis-dark",
    "Name": "Orchis Dark",
    "Description": "Orchis Dark Plasma theme by vinceliuice",
    "License": "GPL-3.0-or-later",
    "Website": "https://github.com/vinceliuice/Orchis-kde"
  }
}
EOF

# Mantener un panel opaco y estable: evita efectos adaptativos que parecen
# barras flotantes cuando se maximizan ventanas.
cat > "$HOME/.local/share/plasma/desktoptheme/Orchis-dark/plasmarc" <<'EOF'
[Settings]
FallbackTheme=breeze-dark
[AdaptiveTransparency]
enabled=false
EOF

say 'Activando paleta oscura, estilo Orchis y decoraciones de ventana'
plasma-apply-colorscheme OrchisDark
if command -v plasma-apply-desktoptheme >/dev/null; then
  plasma-apply-desktoptheme Orchis-dark || warn 'El componente visual de paneles Orchis no se pudo activar en esta versión de Plasma.'
fi
kwriteconfig6 --file "$HOME/.config/Kvantum/kvantum.kvconfig" \
  --group General --key theme Orchis-solid
kwriteconfig6 --file kdeglobals --group KDE --key widgetStyle kvantum
kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key library org.kde.kwin.aurorae
kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme __aurorae__svg__Orchis-dark-solid
# El orden de botones ya establecido se conserva: minimizar/maximizar/cerrar a la derecha.

say 'Manteniendo el fondo negro en escritorio y pantalla de bloqueo'
BLACK="$HOME/.local/share/wallpapers/NoirIndigo/black.png"
mkdir -p "$(dirname "$BLACK")"
if [[ ! -f "$BLACK" ]]; then
  python3 - "$BLACK" <<'PY'
import sys, struct, zlib
def chunk(name, data):
    return struct.pack(">I",len(data))+name+data+struct.pack(">I",zlib.crc32(name+data)&0xffffffff)
w=h=64
image = b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">2I5B",w,h,8,2,0,0,0))
image+=chunk(b"IDAT",zlib.compress((b"\x00"+b"\x00\x00\x00"*w)*h))
image+=chunk(b"IEND",b"")
with open(sys.argv[1],"wb") as f: f.write(image)
PY
fi
kwriteconfig6 --file kscreenlockerrc --group Greeter --key WallpaperPlugin org.kde.image
kwriteconfig6 --file kscreenlockerrc --group Greeter --group Wallpaper \
  --group org.kde.image --group General --key Image "file://$BLACK"

say 'Configurando barras: inferior, ancho completo, fijas y no flotantes'
if command -v qdbus6 >/dev/null; then
  wallpaper_url="$(python3 - "$BLACK" <<'PY'
import json,sys
print(json.dumps('file://'+sys.argv[1]))
PY
)"
  js="$(cat <<EOF
(function () {
  var url = $wallpaper_url;
  for (const d of desktops()) {
    d.wallpaperPlugin = "org.kde.image";
    d.currentConfigGroup = ["Wallpaper", "org.kde.image", "General"];
    d.writeConfig("Image", url);
    d.reloadConfig();
  }
  for (const p of panels()) {
    p.location = "bottom";
    p.hiding = "none";
    p.lengthMode = "fill";
    p.alignment = "left";
    p.height = 46;
    // Mantiene widgets y espacios existentes; no elimina ninguno.
  }
})();
EOF
)"
  qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$js" || warn 'La sesión de Plasma no permitió aplicar todos los cambios dinámicos.'
fi

# La opción floating se guarda en plasmashellrc y se debe editar con Plasma
# cerrado para que no la vuelva a sobrescribir al guardar su configuración.
if systemctl --user is-active --quiet plasma-plasmashell.service; then
  systemctl --user stop plasma-plasmashell.service
else
  kquitapp6 plasmashell >/dev/null 2>&1 || true
  sleep 2
fi
panels=()
if [[ -f "$HOME/.config/plasmashellrc" ]]; then
  mapfile -t panels < <(grep -oE '\[Panel [0-9]+\]' "$HOME/.config/plasmashellrc" | grep -oE '[0-9]+' | sort -u)
fi
if (("${#panels[@]}" == 0)); then
  warn 'No se encontraron IDs de panel; no se modifican sus ajustes persistentes.'
else
  for panel_id in "${panels[@]}"; do
    kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $panel_id" --key floating 0
    kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $panel_id" --key panelLengthMode 0
    kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $panel_id" --key panelVisibility 0
    kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $panel_id" --key panelOpacity 0
    kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $panel_id" --group Defaults --key thickness 46
  done
fi
if systemctl --user list-unit-files plasma-plasmashell.service >/dev/null 2>&1; then
  systemctl --user start plasma-plasmashell.service
else
  nohup plasmashell --replace >/dev/null 2>&1 &
fi
qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true

say 'Orchis Dark instalado: paneles inferiores fijos y fondo negro'
echo "Copia de seguridad: $BACKUP"
echo "Para deshacerlo: bash \"$BACKUP/restore.sh\""
echo 'Cierra sesión y vuelve a entrar para aplicar todos los componentes.'
echo 'Orchis tiene componentes antiguos: si observas fallos visuales, usa el backup.'
