#!/usr/bin/env bash
# Usage: diagrams.sh <markdown>...
# Renders every Mermaid block into .agents/build/diagrams/, as PNG to look at
# and SVG to measure, and prints each one's natural width. Obsidian scales a
# diagram down to the note column: past DIAGRAM_WIDEST px its text shrinks
# past reading. Exits 1 if any diagram is too wide or fails to render. Uses
# mmdc from PATH, else a cached one, else mermaid-cli through npx.
set -euo pipefail

mermaid_cli=@mermaid-js/mermaid-cli@11.4.2
widest=${DIAGRAM_WIDEST:-875}
cached=${XDG_CACHE_HOME:-$HOME/.cache}/agents-diagrams/node_modules/.bin/mmdc
if command -v mmdc >/dev/null 2>&1; then
  mmdc=(mmdc)
elif [[ -x $cached ]]; then
  mmdc=("$cached")
else
  mmdc=(npx -y -p "$mermaid_cli" mmdc)
fi
root=$(realpath -m "$(dirname "${BASH_SOURCE[0]}")/../..")
out=$root/.agents/build/diagrams
mkdir -p "$out"
puppeteer=$(mktemp --suffix=.json)
trap 'rm -f "$puppeteer"' EXIT
echo '{"args":["--no-sandbox"]}' >"$puppeteer"

status=0
for markdown in "$@"; do
  name=$(realpath -s --relative-to="$root" "$markdown" | tr '/ ' '--')
  name=${name%.md}
  rm -f "$out/$name"-*.mmd
  awk -v prefix="$out/$name" '
    /^```mermaid/ { count++; file = prefix "-" count ".mmd"; next }
    /^```$/ { file = ""; next }
    file { print > file }
  ' "$markdown"
  for source in "$out/$name"-*.mmd; do
    [[ -e $source ]] || continue
    image=${source%.mmd}
    if ! "${mmdc[@]}" -q -i "$source" -o "$image.svg" -w 4000 -p "$puppeteer" >/dev/null 2>&1 ||
      ! "${mmdc[@]}" -q -i "$source" -o "$image.png" -s 2 -b white -p "$puppeteer" >/dev/null 2>&1; then
      printf '%s: does not render\n' "${source#"$root"/}"
      status=1
      continue
    fi
    read -r width height < <(grep -o 'viewBox="[^"]*"' "$image.svg" | head -1 | tr -d '"' | awk '{ printf "%d %d\n", $3, $4 }')
    verdict=fits
    ((width > widest)) && verdict="too wide: shrunk past reading" && status=1
    printf '%-60s %5d x %-5d %s\n' "${image#"$root"/}.png" "$width" "$height" "$verdict"
  done
done
exit "$status"
