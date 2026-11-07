#!/usr/bin/env bash
# Entrada principal para configurar un sistema GNOME Noir en Arch Linux.
# El antiguo instalador KDE se conserva con su nombre de archivo.
set -Eeuo pipefail
[[ "$EUID" -ne 0 ]] || { echo 'Ejecuta sin sudo.' >&2; exit 1; }
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
curl --proto '=https' --tlsv1.2 -fL --retry 3 \
  https://raw.githubusercontent.com/blaisewf/TR/arch-kde-setup/arch-gnome-migrate.sh \
  -o "$tmp"
bash -n "$tmp"
exec bash "$tmp"
