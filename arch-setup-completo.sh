#!/usr/bin/env bash
# Arch + KDE Plasma "Noir Indigo" — instalación reproducible
# Uso: bash arch-setup-completo.sh [--full|--appearance-only]
set -Eeuo pipefail
[[ "$EUID" -ne 0 ]] || { echo "Ejecuta como usuario normal, no con sudo."; exit 1; }
command -v pacman >/dev/null || { echo "Este script es para Arch Linux."; exit 1; }
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || { echo "Abre Konsole dentro de KDE Plasma para ejecutarlo."; exit 1; }

mode="${1:---full}"
case "$mode" in
  --full|--appearance-only) ;;
  *) echo "Uso: $0 [--full|--appearance-only]"; exit 2 ;;
esac

root="https://raw.githubusercontent.com/blaisewf/TR/arch-kde-setup"
temp="$(mktemp -d)"
trap 'rm -rf -- "$temp"' EXIT

get() {
  local file="$1"
  echo "Descargando $file..."
  curl --proto '=https' --tlsv1.2 -fL --retry 3 "$root/$file" -o "$temp/$file"
  bash -n "$temp/$file"
}

if [[ "$mode" == --full ]]; then get arch-kde-setup-v3.sh; fi
get arch-noir-indigo.sh
get arch-noir-indigo-menu-konsole.sh
get arch-colloid-kde.sh

echo
echo "Scripts descargados; se ejecutarán en el siguiente orden:"
if [[ "$mode" == --full ]]; then echo "1. Aplicaciones y herramientas autorizadas"; fi
echo "2. Tema Noir Indigo, barras inferiores, fondos, ajustes del cursor y esquinas"
echo "3. AppGrid y Konsole con Geist Mono + Starship"
echo "4. Colloid KDE oscuro, iconos y decoraciones (sin cambiar paneles ni fondos)"
echo
echo "Se guardarán copias de seguridad de Plasma y Konsole."
echo "La instalación completa puede pedir confirmaciones para paquetes de AUR."
read -r -p "¿Continuar? [s/N] " answer
[[ "$answer" =~ ^[sSyY]$ ]] || exit 0

if [[ "$mode" == --full ]]; then
  bash "$temp/arch-kde-setup-v3.sh"
fi
bash "$temp/arch-noir-indigo.sh"
bash "$temp/arch-noir-indigo-menu-konsole.sh"
bash "$temp/arch-colloid-kde.sh"
printf '\nInstalación Noir Indigo finalizada. Cierra sesión y vuelve a entrar.\n'
