#!/usr/bin/env bash
# GNOME Noir: aplicar ajustes de GNOME, Helium, Wolow y splash opcional.
# Ejecutar despues de entrar en GNOME con --with-boot para incluir Plymouth.
set -Eeuo pipefail
[[ "$EUID" -ne 0 ]] || { echo "Ejecuta como usuario normal, no con sudo." >&2; exit 1; }
command -v curl >/dev/null || { echo "Se requiere curl." >&2; exit 1; }
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] || { echo "Abre Kitty dentro de GNOME." >&2; exit 1; }
case "${1:---without-boot}" in
 --without-boot|--with-boot) ;;
 *) echo "Uso: bash arch-gnome-finalize.sh [--with-boot|--without-boot]"; exit 2 ;;
esac
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
root='https://raw.githubusercontent.com/blaisewf/TR/arch-kde-setup'
for file in arch-gnome-fixes.sh arch-gnome-boot-logo.sh; do
  curl --proto '=https' --tlsv1.2 -fL --retry 3 "$root/$file" -o "$tmp/$file"
  bash -n "$tmp/$file"
done
bash "$tmp/arch-gnome-fixes.sh"
if [[ "${1:---without-boot}" == '--with-boot' ]]; then
  echo 'A continuación se configurará Plymouth y se reconstruirá initramfs.'
  echo 'Se conservarán copias de los archivos de arranque modificados.'
  bash "$tmp/arch-gnome-boot-logo.sh"
fi
echo
echo 'GNOME Noir: cambios terminados. Cierra sesión o reinicia para verlos.'
