#!/usr/bin/env bash
# GNOME Noir: Arch bootlogo nítido + botones coherentes en ventanas GTK.
# No repite la migración ni la configuración de Wolow/monitores.
set -Eeuo pipefail
[[ "$EUID" -ne 0 ]] || { echo 'Ejecuta sin sudo.' >&2; exit 1; }
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || { echo 'Ejecuta desde Kitty dentro de GNOME.' >&2; exit 1; }
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
base='https://raw.githubusercontent.com/blaisewf/TR/arch-kde-setup'
for name in arch-gnome-window-controls.sh arch-gnome-boot-logo.sh; do
  curl --proto '=https' --tlsv1.2 -fL --retry 3 "$base/$name" -o "$tmp/$name"
  bash -n "$tmp/$name"
done
bash "$tmp/arch-gnome-window-controls.sh"
bash "$tmp/arch-gnome-boot-logo.sh"
echo
echo 'Listo. Reinicia cuando la reconstrucción de initramfs haya terminado correctamente.'
