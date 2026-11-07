#!/usr/bin/env bash
# Noir Indigo polish: AppGrid + Konsole + Starship (Arch/KDE Plasma 6)
set -Eeuo pipefail
msg(){ printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
[[ "$EUID" != 0 ]] || { echo "Ejecuta como usuario, no con sudo"; exit 1; }
command -v pacman >/dev/null || { echo "No es Arch Linux"; exit 1; }
command -v qdbus6 >/dev/null || { echo "No se encuentra KDE Plasma"; exit 1; }

backup="$HOME/.local/state/noir-indigo-polish/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup" "$HOME/.local/share/konsole" "$HOME/.config"
for path in "$HOME/.config/konsolerc" "$HOME/.config/starship.toml" "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc" "$HOME/.local/share/konsole/NoirIndigo.profile" "$HOME/.local/share/konsole/NoirIndigo.colorscheme"; do
  if [[ -f "$path" ]]; then
    rel="$(realpath --relative-to="$HOME" "$path")"
    mkdir -p "$backup/$(dirname "$rel")"
    cp -p "$path" "$backup/$rel"
  fi
done
msg "Backup en $backup"
msg "Instalando fuente y prompt"
sudo pacman -S --needed git base-devel ttf-jetbrains-mono-nerd starship konsole

msg "Instalando AppGrid desde el AUR mantenido por su autor"
if ! pacman -Qq plasma6-applets-appgrid >/dev/null 2>&1; then
  if command -v yay >/dev/null 2>&1; then
    yay -S --needed plasma6-applets-appgrid
  elif command -v paru >/dev/null 2>&1; then
    paru -S --needed plasma6-applets-appgrid
  else
    temp="$(mktemp -d)"
    git clone --depth 1 https://aur.archlinux.org/plasma6-applets-appgrid.git "$temp/appgrid"
    echo "Revisa el PKGBUILD antes de confirmar:"
    cat "$temp/appgrid/PKGBUILD"
    (cd "$temp/appgrid" && makepkg -si)
    rm -rf "$temp"
  fi
fi

msg "Creando tema Noir Indigo para Konsole"
cat > "$HOME/.local/share/konsole/NoirIndigo.colorscheme" <<'EOF'
[General]
Description=Noir Indigo
Opacity=0.91
Wallpaper=
[Background]
Color=16,18,25
[BackgroundIntense]
Color=24,27,38
[BackgroundFaint]
Color=12,14,19
[Foreground]
Color=224,230,244
[ForegroundIntense]
Color=248,250,255
[ForegroundFaint]
Color=155,166,192
[Color0]
Color=31,34,45
[Color0Intense]
Color=85,91,112
[Color1]
Color=243,139,168
[Color1Intense]
Color=255,160,182
[Color2]
Color=166,227,161
[Color2Intense]
Color=189,244,182
[Color3]
Color=249,226,175
[Color3Intense]
Color=255,239,193
[Color4]
Color=137,180,250
[Color4Intense]
Color=167,205,255
[Color5]
Color=180,160,255
[Color5Intense]
Color=197,180,255
[Color6]
Color=137,220,235
[Color6Intense]
Color=175,238,248
[Color7]
Color=205,214,244
[Color7Intense]
Color=255,255,255
EOF
cat > "$HOME/.local/share/konsole/NoirIndigo.profile" <<'EOF'
[General]
Name=Noir Indigo
Parent=FALLBACK/
[Appearance]
ColorScheme=NoirIndigo
Font=JetBrainsMono Nerd Font,11,-1,5,50,0,0,0,0,0
[Scrolling]
HistoryMode=2
HistorySize=10000
EOF
kwriteconfig6 --file konsolerc --group 'Desktop Entry' --key DefaultProfile 'NoirIndigo.profile'

msg "Configurando Starship"
cat > "$HOME/.config/starship.toml" <<'EOF'
add_newline = true
format = "$directory$git_branch$git_status$cmd_duration$line_break$character"
[directory]
style = "bold #A5B4FC"
format = "[$path]($style)  "
truncation_length = 3
truncate_to_repo = false
[git_branch]
symbol = "󰘬 "
style = "bold #89B4FA"
format = "[$symbol$branch]($style) "
[git_status]
style = "#F9E2AF"
format = "([$all_status$ahead_behind]($style)) "
[cmd_duration]
min_time = 2000
style = "#9399B2"
format = "[󱦟 $duration]($style) "
[character]
success_symbol = "[❯](bold #A5B4FC)"
error_symbol = "[❯](bold #F38BA8)"
EOF
if ! grep -Fq 'starship init bash' "$HOME/.bashrc" 2>/dev/null; then
  printf '\n# Noir Indigo\ncommand -v starship >/dev/null && eval "$(starship init bash)"\n' >> "$HOME/.bashrc"
fi
if [[ -f "$HOME/.zshrc" ]] && ! grep -Fq 'starship init zsh' "$HOME/.zshrc"; then
  printf '\n# Noir Indigo\ncommand -v starship >/dev/null && eval "$(starship init zsh)"\n' >> "$HOME/.zshrc"
fi

msg "Reemplazando el menú de inicio sin modificar tus barras"
js="$(cat <<'EOF'
(function() {
  let shortcutSet = false;
  for (const p of panels()) {
    const older = [].concat(
      p.widgets("org.kde.plasma.kickoff"),
      p.widgets("org.kde.plasma.kicker"),
      p.widgets("org.kde.plasma.kickerdash")
    );
    if (!older.length || p.widgets("dev.xarbit.appgrid").length) continue;
    const previous = older[0];
    const menu = p.addWidget("dev.xarbit.appgrid");
    if (!menu || menu.type !== "dev.xarbit.appgrid") {
      if (menu) menu.remove();
      throw new Error("AppGrid no disponible; Kickoff se conserva");
    }
    menu.index = previous.index;
    if (!shortcutSet) {
      menu.globalShortcut = previous.globalShortcut || "Alt+F1";
      shortcutSet = true;
    }
    previous.remove();
  }
})();
EOF
)"
if ! qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$js"; then
  echo 'No se pudo cambiar el menú automáticamente; puedes seleccionar AppGrid en Mostrar alternativas.' >&2
fi
msg "Terminado. Cierra y vuelve a abrir Konsole."
echo "Copia de seguridad: $backup"
