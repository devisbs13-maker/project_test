#!/usr/bin/env bash
set -euo pipefail

# Recursively scan for text files and remove UTF-8 BOM, backing up changed files

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_ROOT="$ROOT_DIR/_backup_bom/$STAMP"
mkdir -p "$BACKUP_ROOT"

scan_dirs=(
  "$ROOT_DIR/apps/web"
  "$ROOT_DIR/apps/api"
  "$ROOT_DIR/apps/bot"
  "$ROOT_DIR/packages"
)

# Extensions to include
exts=("*.ts" "*.tsx" "*.json" "*.css" "*.scss" "*.md")

scanned=0
fixed=0

join_exts() {
  local args=()
  for e in "${exts[@]}"; do args+=( -name "$e" -o ); done
  # remove last -o
  unset 'args[${#args[@]}-1]'
  printf '%s\n' "${args[@]}"
}

_hexdump3() {
  # prints first 3 bytes as hex without spaces/newlines
  LC_ALL=C hexdump -n 3 -v -e '1/1 "%02x"' -- "$1" 2>/dev/null || true
}

for dir in "${scan_dirs[@]}"; do
  [[ -d "$dir" ]] || continue
  mapfile -t files < <(find "$dir" -type f \( $(join_exts) \))
  for f in "${files[@]}"; do
    ((scanned++))
    # detect BOM (EF BB BF)
    hex=$(_hexdump3 "$f")
    if [[ "$hex" == "efbbbf" ]]; then
      rel="${f#"$ROOT_DIR/"}"
      dest="$BACKUP_ROOT/$rel"
      mkdir -p "$(dirname "$dest")"
      cp -p -- "$f" "$dest"
      tmp="${f}.nobom.tmp"
      # write without first 3 bytes
      tail -c +4 -- "$f" > "$tmp" || true
      mv -f -- "$tmp" "$f"
      ((fixed++))
      printf 'fixed: %s\n' "$rel"
    fi
  done
done

printf 'Scanned: %d\n' "$scanned"
printf 'Fixed:   %d\n' "$fixed"
printf 'Backups: %s\n' "$BACKUP_ROOT"

