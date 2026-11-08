#!/usr/bin/env bash
# GNOME Noir Boot: logotipo oficial Arch Linux en alta calidad sobre negro.
# Soporta mkinitcpio o dracut + systemd-boot con entradas .conf tradicionales.
# No altera firmware, BIOS, ESP de Windows ni sistemas UKI de forma automática.
set -Eeuo pipefail

say(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn(){ printf '\nAVISO: %s\n' "$*" >&2; }
fail(){ printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[[ $EUID -ne 0 ]] || fail 'Ejecuta como usuario normal, sin sudo.'
command -v pacman >/dev/null || fail 'Solo Arch Linux.'
[[ "$(uname -m)" == x86_64 ]] || fail 'Este script está preparado para x86_64.'

# No tocar sistemas de arranque sin un generador de initramfs soportado.
generator=''
if command -v mkinitcpio >/dev/null && [[ -f /etc/mkinitcpio.conf ]]; then
  generator='mkinitcpio'
elif command -v dracut >/dev/null; then
  generator='dracut'
else
  fail 'No encuentro mkinitcpio ni dracut. No se modificó el arranque.'
fi
say "Generador de initramfs detectado: $generator"

say 'Instalar Plymouth y herramientas para generar el logotipo'
sudo pacman -S --needed plymouth librsvg curl

theme='/usr/share/plymouth/themes/gnome-noir'
sudo mkdir -p "$theme"

work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT

# Descarga SVG de la pagina oficial Arch Linux, no un logo reinterpretado.
# Renderizamos a 1920px, y Plymouth lo reduce al tamaño de pantalla.
say 'Obtener logotipo vectorial oficial de Arch Linux'
curl --proto '=https' --tlsv1.2 -fL --retry 3 \
  'https://archlinux.org/static/logos/archlinux-logo-light-scalable.svg' \
  -o "$work/archlinux-logo.svg" || fail 'No se pudo descargar el logo SVG oficial; no se cambio Plymouth.'
rsvg-convert --width=1920 --keep-aspect-ratio \
  --output="$work/logo.png" "$work/archlinux-logo.svg" \
  || fail 'No se pudo renderizar el SVG oficial.'
[[ -s "$work/logo.png" ]] || fail 'El PNG generado esta vacio.'

cat > "$work/gnome-noir.plymouth" <<'EOF'
[Plymouth Theme]
Name=GNOME Noir
Description=Black Plymouth screen with the official high resolution Arch Linux logo
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/gnome-noir
ScriptFile=/usr/share/plymouth/themes/gnome-noir/gnome-noir.script
EOF

cat > "$work/gnome-noir.script" <<'EOF'
# GNOME Noir boot splash
Window.SetBackgroundTopColor (0.0, 0.0, 0.0);
Window.SetBackgroundBottomColor (0.0, 0.0, 0.0);

logo_original = Image ("logo.png");
# Imagen de origen de 1920 px; se muestra mas pequena sin pixelarse.
target_width = Window.GetWidth() * 0.36;
if (target_width > 820) target_width = 820;
if (target_width < 320) target_width = 320;
scale = target_width / logo_original.GetWidth();
logo_image = logo_original.Scale(target_width, logo_original.GetHeight() * scale);
logo_sprite = Sprite (logo_image);
logo_sprite.SetPosition (
  Window.GetX() + (Window.GetWidth() - logo_image.GetWidth()) / 2,
  Window.GetY() + (Window.GetHeight() - logo_image.GetHeight()) / 2, 10);

password_sprite = Sprite ();
password_sprite.SetZ (100);
bullets_sprite = Sprite ();
bullets_sprite.SetZ (101);
message_sprite = Sprite ();
message_sprite.SetZ (102);
password_sprite.SetOpacity (0);
bullets_sprite.SetOpacity (0);
message_sprite.SetOpacity (0);

fun show_password (prompt, bullets) {
  local label_image = Image.Text(prompt, 1.0, 1.0, 1.0);
  password_sprite.SetImage(label_image);
  password_sprite.SetPosition(
    (Window.GetWidth() - label_image.GetWidth()) / 2,
    Window.GetHeight() * 0.72, 100);
  password_sprite.SetOpacity(1);

  local marks = "";
  for (i = 0; i < bullets; i++) marks += "* ";
  local mark_image = Image.Text(marks, 0.75, 0.8, 1.0);
  bullets_sprite.SetImage(mark_image);
  bullets_sprite.SetPosition(
    (Window.GetWidth() - mark_image.GetWidth()) / 2,
    Window.GetHeight() * 0.77, 101);
  bullets_sprite.SetOpacity(1);
}

fun show_normal () {
  password_sprite.SetOpacity(0);
  bullets_sprite.SetOpacity(0);
}

fun show_message (message) {
  local image = Image.Text(message, 0.75, 0.8, 1.0);
  message_sprite.SetImage(image);
  message_sprite.SetPosition(
    (Window.GetWidth() - image.GetWidth()) / 2,
    Window.GetHeight() * 0.9, 102);
  message_sprite.SetOpacity(1);
}
Plymouth.SetDisplayPasswordFunction(show_password);
Plymouth.SetDisplayNormalFunction(show_normal);
Plymouth.SetMessageFunction(show_message);
EOF

sudo install -m644 "$work/gnome-noir.plymouth" "$theme/gnome-noir.plymouth"
sudo install -m644 "$work/gnome-noir.script" "$theme/gnome-noir.script"
sudo install -m644 "$work/logo.png" "$theme/logo.png"

say 'Seleccionar el tema Plymouth'
sudo plymouth-set-default-theme gnome-noir

if [[ "$generator" == 'mkinitcpio' ]]; then
  say 'Incorporar Plymouth a mkinitcpio, respetando cifrado y hooks existentes'
  sudo cp -a /etc/mkinitcpio.conf "/etc/mkinitcpio.conf.before-gnome-noir"
  sudo python3 - <<'PY'
from pathlib import Path
import re,shlex
path=Path("/etc/mkinitcpio.conf")
text=path.read_text()
pattern=r"(?m)^([ \t]*HOOKS[ \t]*=[ \t]*\()([^)]*)(\))"
match=re.search(pattern,text)
if match is None:
    raise SystemExit("No se encontró HOOKS=(...) en mkinitcpio.conf")
tokens=shlex.split(match.group(2),comments=False)
if "plymouth" not in tokens:
    if "systemd" in tokens:
        target=tokens.index("systemd")+1
    elif "udev" in tokens:
        target=tokens.index("udev")+1
    else:
        raise SystemExit("No se reconoce systemd ni udev. No se tocará HOOKS.")
    tokens.insert(target,"plymouth")
    replacement=match.group(1)+" ".join(tokens)+match.group(3)
    text=text[:match.start()]+replacement+text[match.end():]
    path.write_text(text)
PY
  say 'Reconstruir initramfs con Plymouth'
  if ! sudo mkinitcpio -P; then
    warn 'Falló la reconstrucción; restaurando mkinitcpio.conf y reintentando.'
    sudo cp -a "/etc/mkinitcpio.conf.before-gnome-noir" /etc/mkinitcpio.conf
    sudo mkinitcpio -P || true
    fail 'No se modificaron opciones de arranque porque falló mkinitcpio.'
  fi
else
  say 'Configurar Plymouth en dracut'
  printf 'add_dracutmodules+=" plymouth "\n' | sudo tee /etc/dracut.conf.d/gnome-noir.conf >/dev/null
  if ! sudo dracut --regenerate-all --force; then
    sudo rm -f /etc/dracut.conf.d/gnome-noir.conf
    fail 'Falló dracut. No se han modificado las opciones del cargador.'
  fi
fi

say 'Añadir quiet splash a entradas systemd-boot compatibles'
count=0
for root in /boot /efi /boot/efi; do
  if [[ ! -d "$root/loader/entries" ]]; then continue; fi
  while IFS= read -r -d '' entry; do
    # Un archivo con UKI pero sin linea options requiere configuración distinta.
    if ! grep -qE '^[[:space:]]*options[[:space:]]+' "$entry"; then continue; fi
    sudo cp -n "$entry" "$entry.before-gnome-noir"
    sudo python3 - "$entry" <<'PY'
from pathlib import Path
import re,sys
path=Path(sys.argv[1])
text=path.read_text()
lines=text.splitlines(keepends=True)
out=[]
for line in lines:
    if re.match(r"^\s*options\s+",line):
        end="\n" if line.endswith("\n") else ""
        body=line.rstrip("\n")
        opts=body.split()
        for flag in ("quiet","splash"):
            if flag not in opts: body+=" "+flag
        line=body+end
    out.append(line)
path.write_text("".join(out))
PY
    count=$((count+1))
  done < <(find "$root/loader/entries" -maxdepth 1 -type f -name '*.conf' -print0)
done
if ((count==0)); then
  warn 'No se encontraron entradas estándar systemd-boot con options. El tema está instalado, pero el splash puede requerir activar el parámetro splash en tu gestor de arranque/UKI.'
else
  echo "Entradas de arranque configuradas: $count"
fi

say 'Logo oficial Arch Linux en alta calidad instalado'
echo 'Este splash aparece al arrancar Linux; el logotipo UEFI/BIOS no se modifica.'
echo 'Reinicia solo después de comprobar que mkinitcpio/dracut terminó sin errores.'
