#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "${path}" ]] || fail "required file is missing: ${path}"
}

require_dir() {
  local path="$1"
  [[ -d "${path}" ]] || fail "required directory is missing: ${path}"
}

command -v python3 >/dev/null 2>&1 || fail "python3 is required to read manifest.json"
command -v zip >/dev/null 2>&1 || fail "zip is required to create the extension package"
command -v unzip >/dev/null 2>&1 || fail "unzip is required to validate the extension package"

require_file "manifest.json"

VERSION="$(python3 - <<'PY'
import json
from pathlib import Path
manifest = json.loads(Path('manifest.json').read_text(encoding='utf-8'))
version = manifest.get('version')
if not isinstance(version, str) or not version.strip():
    raise SystemExit('manifest.json does not contain a non-empty string version')
print(version)
PY
)"

DIST_DIR="dist"
ZIP_PATH="${DIST_DIR}/promptlens-v${VERSION}.zip"

FILES=(
  "manifest.json"
  "background.js"
  "content.js"
  "history-store.js"
  "history.html"
  "history.js"
  "options.html"
  "options.js"
  "result.html"
  "result.js"
  "selection.css"
  "styles.css"
  "templates.js"
)

DIRS=(
  "_locales"
  "icons"
)

for file in "${FILES[@]}"; do
  require_file "${file}"
done

for dir in "${DIRS[@]}"; do
  require_dir "${dir}"
done

mkdir -p "${DIST_DIR}"
rm -f "${ZIP_PATH}"

zip -qr "${ZIP_PATH}" "${FILES[@]}" "${DIRS[@]}"

[[ -s "${ZIP_PATH}" ]] || fail "zip was not created or is empty: ${ZIP_PATH}"

ZIP_ENTRIES=()
while IFS= read -r line; do
  ZIP_ENTRIES+=("$line")
done < <(unzip -Z1 "${ZIP_PATH}")

has_entry() {
  local expected="$1"
  local entry
  for entry in "${ZIP_ENTRIES[@]}"; do
    [[ "${entry}" == "${expected}" ]] && return 0
  done
  return 1
}

has_prefix() {
  local expected_prefix="$1"
  local entry
  for entry in "${ZIP_ENTRIES[@]}"; do
    [[ "${entry}" == "${expected_prefix}"* ]] && return 0
  done
  return 1
}

for file in "${FILES[@]}"; do
  has_entry "${file}" || fail "zip is missing required file: ${file}"
done

for dir in "${DIRS[@]}"; do
  has_prefix "${dir}/" || fail "zip is missing required directory contents: ${dir}/"
done

FORBIDDEN_REGEX='(^|/)(\.git|docs|site|dist)/|(^|/)skills-lock\.json$|(^|/)README(\.[^/]*)?\.md$|(^|/)promptlens-.*-readme\.png$'
for entry in "${ZIP_ENTRIES[@]}"; do
  if [[ "${entry}" =~ ${FORBIDDEN_REGEX} ]]; then
    fail "zip contains forbidden entry: ${entry}"
  fi
done

printf 'Created and validated %s\n' "${ZIP_PATH}"
printf 'Version: %s\n' "${VERSION}"
printf 'Files: %s\n' "${#ZIP_ENTRIES[@]}"
