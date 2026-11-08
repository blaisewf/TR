#!/usr/bin/env bash
# GNOME Noir: fix monitor GDM, GNOME overview, icon Helium y Wolow.
# Ejecutar como usuario normal dentro de GNOME/Arch.
set -Eeuo pipefail

say(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn(){ printf '\nAVISO: %s\n' "$*" >&2; }
fail(){ printf '\nERROR: %s\n' "$*" >&2; exit 1; }
[[ $EUID -ne 0 ]] || fail 'No ejecutes con sudo.'
command -v pacman >/dev/null || fail 'Este script está preparado para Arch Linux.'
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || fail 'Ejecuta desde Kitty dentro de GNOME.'

say 'Evitar abrir la Vista general de GNOME al iniciar sesión'
if gsettings writable org.gnome.shell.extensions.dash-to-panel hide-overview-on-startup 2>/dev/null | grep -qx true; then
  gsettings set org.gnome.shell.extensions.dash-to-panel hide-overview-on-startup true
else
  warn 'No se encuentra la opción de Dash to Panel; comprueba que la extensión esté instalada.'
fi

say 'Colocar el login de GDM en el monitor situado a la derecha'
if [[ -f "$HOME/.config/monitors.xml" ]]; then
  tmpmon="$(mktemp)"
  python3 - "$HOME/.config/monitors.xml" "$tmpmon" <<'PY'
import sys
from xml.etree import ElementTree as ET
src,dst=sys.argv[1:]
tree=ET.parse(src)
count=0
for conf in tree.getroot().findall(".//configuration"):
    logical=conf.findall("logicalmonitor")
    if len(logical)<2:
        continue
    places=[]
    for i, mon in enumerate(logical):
        try: x=int(mon.findtext("x", "0"))
        except ValueError: x=0
        places.append((x,i))
    if len(set(x for x,_ in places))<2:
        continue
    rightmost=max(places)[1]
    for i,mon in enumerate(logical):
        primary=mon.find("primary")
        if primary is None: primary=ET.SubElement(mon,"primary")
        primary.text="yes" if i==rightmost else "no"
    count+=1
if count==0:
    print("AVISO: no se detectaron dos monitores colocados horizontalmente; copio el orden actual.")
tree.write(dst,encoding="utf-8",xml_declaration=True)
PY
  sudo install -Dm644 "$tmpmon" /etc/xdg/monitors.xml
  rm -f "$tmpmon"
  echo 'Configuración de GDM guardada. Se aplicará al volver a iniciar sesión.'
else
  warn 'No existe ~/.config/monitors.xml; configura las pantallas desde GNOME → Configuración → Pantallas.'
fi

say 'Corregir el icono de Helium usando el SVG original de su autor'
icon_dir="$HOME/.local/share/icons/hicolor/scalable/apps"
mkdir -p "$icon_dir" "$HOME/.local/share/applications"
if curl --proto '=https' --tlsv1.2 -fL --retry 3 \
  'https://raw.githubusercontent.com/imputnet/helium/main/resources/branding/product_logo.svg' \
  -o "$icon_dir/helium.svg"; then
  python3 - "$HOME/.local/share/applications" <<'PY'
import pathlib,sys,re
folder=pathlib.Path(sys.argv[1])
found=0
for desktop in folder.glob("*.desktop"):
    text=desktop.read_text(encoding="utf-8")
    head=text.split("[Desktop Entry]",1)[-1].split("[",1)[0]
    if desktop.name.lower().find("helium")<0 and not re.search(r"(?m)^Name=Helium\s*$",head):
        continue
    if "[Desktop Entry]" not in text: continue
    prefix,body=text.split("[Desktop Entry]",1)
    main,sep,rest=body.partition("\n[")
    if re.search(r"(?m)^Icon=",main):
        main=re.sub(r"(?m)^Icon=.*$", "Icon=helium",main,count=1)
    else: main+="\nIcon=helium"
    if not re.search(r"(?m)^StartupWMClass=",main):
        main+="\nStartupWMClass=helium"
    desktop.write_text(prefix+"[Desktop Entry]"+main+(sep+rest if sep else ""),encoding="utf-8")
    found+=1
print(f"Accesos de Helium corregidos: {found}")
PY
  if command -v gtk-update-icon-cache >/dev/null; then
    gtk-update-icon-cache -f "$HOME/.local/share/icons/hicolor" >/dev/null 2>&1 || true
  fi
  if command -v update-desktop-database >/dev/null; then
    update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
  fi
else
  warn 'No se pudo descargar el icono oficial; el navegador no se ha modificado.'
fi

say 'Wolow Companion: activar inicio automático en GNOME'
wolow="$HOME/.local/bin/wolow-companion"
if [[ -x "$wolow" ]]; then
  mkdir -p "$HOME/.config/autostart"
  cat > "$HOME/.config/autostart/wolow-companion.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Wolow Companion
Comment=Control de encendido y apagado desde Wolow
Exec=$wolow
TryExec=$wolow
Terminal=false
Hidden=false
X-GNOME-Autostart-enabled=true
EOF
  echo 'Wolow Companion se iniciará con la próxima sesión GNOME.'
  if pgrep -fi 'wolow' >/dev/null 2>&1; then
    echo 'Se detectó un proceso relacionado con Wolow.'
  else
    warn 'No se detectó Wolow en ejecución. Ábrelo desde Kitty para comprobar sus mensajes:'
    printf '  %q\n' "$wolow"
  fi
else
  warn 'No encontré ~/.local/bin/wolow-companion. La instalación anterior de Wolow puede haber fallado.'
fi

say 'Wolow: preparar Wake-on-LAN en Ethernet'
sudo pacman -S --needed ethtool
if command -v nmcli >/dev/null; then
  connected=0
  while IFS=: read -r device type state; do
    if [[ "$type" == ethernet && "$state" == connected ]]; then
      connected=$((connected+1))
      echo "Ethernet activo: $device"
      sudo ethtool "$device" 2>/dev/null | grep -E 'Supports Wake-on:|Wake-on:' || true
    fi
  done < <(nmcli -t -f DEVICE,TYPE,STATE device status)
  if ((connected==0)); then
    warn 'No se detectó una interfaz Ethernet conectada. El encendido remoto WoL normalmente requiere cable.'
  fi
  while IFS=: read -r uuid type; do
    if [[ "$type" == 802-3-ethernet || "$type" == ethernet ]]; then
      sudo nmcli connection modify "$uuid" 802-3-ethernet.wake-on-lan magic \
        || warn "No pude configurar WoL en la conexión $uuid"
    fi
  done < <(nmcli -t -f UUID,TYPE connection show)
else
  warn 'NetworkManager no está disponible; no he cambiado Wake-on-LAN.'
fi
echo 'Para poder encender desde apagado, activa Wake on PCIe/LAN en BIOS y desactiva ErP si existe.'
echo 'Para apagar/reiniciar desde el móvil, comprueba que Wolow Companion siga ejecutándose y tenga permisos.'

say 'Ajustes aplicados'
echo 'Cierra sesión y entra de nuevo para comprobar GDM, Helium y Wolow.'
