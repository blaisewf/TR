#!/usr/bin/env bash
# Noir Indigo — personalización de KDE Plasma 6 en Arch Linux
# Ejecutar como usuario normal, dentro de la sesión gráfica Plasma.
set -Eeuo pipefail

fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
# Nunca dejar al usuario sin escritorio si un paso falla al reiniciar Plasma.
ensure_shell() {
  if ! pgrep -x -u "$(id -u)" plasmashell >/dev/null 2>&1; then
    systemctl --user start plasma-plasmashell.service >/dev/null 2>&1 || {
      nohup plasmashell --replace >/dev/null 2>&1 &
    }
  fi
}
trap ensure_shell EXIT
notice() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }

[[ $EUID -ne 0 ]] || fail 'No ejecutes este script con sudo.'
command -v pacman >/dev/null || fail 'Este instalador es solo para Arch Linux.'
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || fail 'Ejecuta esto en Konsole, dentro de KDE Plasma.'
[[ -n "${KDE_FULL_SESSION:-}" || "${XDG_CURRENT_DESKTOP:-}" == *KDE* ]] || fail 'No se ha detectado una sesión de KDE Plasma.'

CFG="$HOME/.config"
BACKUP="$HOME/.local/state/noir-indigo/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP" "$HOME/.local/share/color-schemes" "$HOME/.local/share/wallpapers/NoirIndigo"
notice "Guardando copia de seguridad en $BACKUP"
files=()
for f in kdeglobals kwinrc kscreenlockerrc plasmashellrc plasma-org.kde.plasma.desktop-appletsrc; do
  [[ -f "$CFG/$f" ]] && files+=(".config/$f")
done
if ((${#files[@]})); then tar -C "$HOME" -czf "$BACKUP/plasma-before.tar.gz" "${files[@]}"; fi
cat > "$BACKUP/restore.sh" <<'RESTORE'
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$HOME"
if [[ -f "$(dirname "$0")/plasma-before.tar.gz" ]]; then
    tar -xzf "$(dirname "$0")/plasma-before.tar.gz" -C "$HOME"
fi
systemctl --user restart plasma-plasmashell.service || true
qdbus6 org.kde.KWin /KWin reconfigure || true
echo 'Configuración restaurada. Cierra sesión y vuelve a entrar si es necesario.'
RESTORE
chmod +x "$BACKUP/restore.sh"

notice 'Instalando únicamente fuente, iconos y herramientas de configuración'
sudo pacman -S --needed inter-font papirus-icon-theme qt6-tools python breeze-gtk
for cmd in kwriteconfig6 plasma-apply-colorscheme qdbus6; do
  command -v "$cmd" >/dev/null || fail "No se encontró $cmd."
done
qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript '1+1' >/dev/null || fail 'plasmashell no responde a D-Bus.'

BLACK="$HOME/.local/share/wallpapers/NoirIndigo/black.png"
SCHEME="$HOME/.local/share/color-schemes/NoirIndigo.colors"
notice 'Creando fondo negro y paleta personalizada'
python3 - "$BLACK" "$SCHEME" <<'PY'
import sys, struct, zlib, configparser
from pathlib import Path
black, scheme = map(Path, sys.argv[1:])
def chunk(name, payload):
    return struct.pack('!I',len(payload))+name+payload+struct.pack('!I',zlib.crc32(name+payload)&0xffffffff)
w=h=64
raw=(b'\0'+(b'\0\0\0')*w)*h
black.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
source=Path('/usr/share/color-schemes/BreezeDark.colors')
if not source.exists():
    raise SystemExit('No encuentro el esquema BreezeDark.colors de KDE.')
config=configparser.ConfigParser(interpolation=None,strict=False)
config.optionxform=str
config.read(source)
def setk(s,k,v):
    if not config.has_section(s): config.add_section(s)
    config.set(s,k,v)
setk('General','Name','Noir Indigo')
setk('General','ColorScheme','NoirIndigo')
for section,bg,fg in [
    ('Colors:Window','22,24,30','233,237,247'),
    ('Colors:View','15,17,22','235,239,248'),
    ('Colors:Button','34,37,47','233,237,247'),
    ('Colors:Header','27,29,37','237,240,249'),
    ('Colors:Tooltip','32,35,45','235,239,248'),
    ('Colors:Complementary','20,22,28','233,237,247'),
    ('Colors:Selection','113,135,231','255,255,255'),
]:
    setk(section,'BackgroundNormal',bg)
    setk(section,'ForegroundNormal',fg)
for sec in ('Colors:Window','Colors:View','Colors:Button','Colors:Header'):
    setk(sec,'DecorationFocus','146,164,255')
    setk(sec,'DecorationHover','170,185,255')
with scheme.open('w') as f:
    config.write(f,space_around_delimiters=False)
PY
plasma-apply-colorscheme NoirIndigo

# Fondo negro en todos los escritorios y en la pantalla de bloqueo
kwriteconfig6 --file kscreenlockerrc --group Greeter --key WallpaperPlugin org.kde.image
kwriteconfig6 --file kscreenlockerrc --group Greeter --group Wallpaper --group org.kde.image --group General --key Image "file://$BLACK"

# Papirus + Inter; conservar monospace independiente en el editor/terminal
kwriteconfig6 --file kdeglobals --group Icons --key Theme Papirus-Dark
kwriteconfig6 --file kdeglobals --group General --key font 'Inter,10,-1,5,50,0,0,0,0,0'
kwriteconfig6 --file kdeglobals --group General --key menuFont 'Inter,10,-1,5,50,0,0,0,0,0'
kwriteconfig6 --file kdeglobals --group General --key toolBarFont 'Inter,10,-1,5,50,0,0,0,0,0'
kwriteconfig6 --file kdeglobals --group General --key smallestReadableFont 'Inter,9,-1,5,50,0,0,0,0,0'
kwriteconfig6 --file kdeglobals --group General --key taskbarFont 'Inter,10,-1,5,50,0,0,0,0,0'
kwriteconfig6 --file kdeglobals --group WM --key activeFont 'Inter,10,-1,5,57,0,0,0,0,0'
kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft ''
kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight IAX
kwriteconfig6 --file kwinrc --group Plugins --key blurEnabled true
kwriteconfig6 --file kwinrc --group Plugins --key contrastEnabled true
kwriteconfig6 --file kdeglobals --group General --key accentColorFromWallpaper false

notice 'Preparando los paneles verticales y el fondo para los dos monitores'
JS="$BACKUP/plasma-layout.js"
# Path quoted safely as JSON/JS string
BACKGROUND_URL=$(python3 - "$BLACK" <<'PY'
import json,sys
print(json.dumps(sys.argv[1] and 'file://'+sys.argv[1]))
PY
)
cat > "$JS" <<JS
(function() {
  const wallpaperUrl = $BACKGROUND_URL;
  const screens = [];
  const desk = desktops();
  for (let i = 0; i < desk.length; i++) {
    const d=desk[i];
    if (d.screen >= 0 && screens.indexOf(d.screen) === -1) screens.push(d.screen);
    d.wallpaperPlugin='org.kde.image';
    d.currentConfigGroup=['Wallpaper','org.kde.image','General'];
    d.writeConfig('Image', wallpaperUrl);
    d.reloadConfig();
  }
  screens.sort((a,b)=>a-b);
  if (screens.length < 2) { throw new Error('Plasma solo detecta un monitor. No se modifican los paneles.'); }
  // Crear dos paneles nuevos. Los anteriores se sustituyen únicamente después de
  // comprobar que los nuevos tienen sus widgets.
  const oldPanels=panels();
  function createPanel() {
    let p=new Panel;
    p.location='bottom';
    p.height=46;
    p.lengthMode='fill';
    p.alignment='center';
    p.hiding='none';
    p.addWidget('org.kde.plasma.kickoff');
    let task=p.addWidget('org.kde.plasma.icontasks');
    task.currentConfigGroup=['General'];
    task.writeConfig('showOnlyCurrentScreen',true);
    task.writeConfig('showOnlyCurrentDesktop',false);
    task.writeConfig('groupingStrategy',1);
    task.writeConfig('launchers','applications:org.kde.dolphin.desktop,applications:org.kde.konsole.desktop');
    p.addWidget('org.kde.plasma.panelspacer');
    p.addWidget('org.kde.plasma.systemtray');
    p.addWidget('org.kde.plasma.digitalclock');
    p.addWidget('org.kde.plasma.showdesktop');
    return p;
  }
  const a=createPanel(), b=createPanel();
  const state=ConfigFile('plasmashellrc');
  state.group='NoirIndigoLayout';
  state.writeEntry('Panel0',String(a.id));
  state.writeEntry('Panel1',String(b.id));
  state.writeEntry('Screen0',String(screens[0]));
  state.writeEntry('Screen1',String(screens[1]));
  for (const old of oldPanels) old.remove();
})();
JS
qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$(cat "$JS")" >/dev/null || fail 'Fallo al ejecutar la configuración de Plasma. Utiliza el restore.sh de la copia de seguridad.'
sleep 2
STATE="$CFG/plasmashellrc"
readcfg() { kreadconfig6 --file plasmashellrc --group NoirIndigoLayout --key "$1" 2>/dev/null || true; }
P0=$(readcfg Panel0)
P1=$(readcfg Panel1)
S0=$(readcfg Screen0)
S1=$(readcfg Screen1)
[[ "$P0" =~ ^[0-9]+$ && "$P1" =~ ^[0-9]+$ && "$S0" =~ ^[0-9]+$ && "$S1" =~ ^[0-9]+$ ]] || fail "No pude identificar los paneles creados. Restaura desde $BACKUP/restore.sh"

notice 'Asignando cada barra a su monitor (solución para Plasma 6.8)'
# Es importante parar plasmashell antes de escribir lastScreen o sobrescribe el valor.
if systemctl --user is-active --quiet plasma-plasmashell.service; then
    systemctl --user stop plasma-plasmashell.service
else
    kquitapp6 plasmashell || true
    sleep 2
fi
kwriteconfig6 --file plasma-org.kde.plasma.desktop-appletsrc --group Containments --group "$P0" --key lastScreen "$S0"
kwriteconfig6 --file plasma-org.kde.plasma.desktop-appletsrc --group Containments --group "$P1" --key lastScreen "$S1"
for p in "$P0" "$P1"; do
  kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $p" --key floating 0
  kwriteconfig6 --file plasmashellrc --group PlasmaViews --group "Panel $p" --group Defaults --key thickness 46
done
if systemctl --user list-unit-files plasma-plasmashell.service >/dev/null 2>&1; then
    systemctl --user start plasma-plasmashell.service || { nohup plasmashell --replace >/dev/null 2>&1 & }
else
    nohup plasmashell --replace >/dev/null 2>&1 &
fi
qdbus6 org.kde.KWin /KWin reconfigure || true

printf '\n\033[1;32m¡Noir Indigo aplicado!\033[0m\n'
printf 'Backup/restauración: %s/restore.sh\n' "$BACKUP"
printf 'Cierra sesión y vuelve a entrar para aplicar todas las fuentes y efectos.\n'
