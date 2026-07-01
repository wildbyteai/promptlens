#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="scripts/package-extension.sh"

for forbidden in 'SECURITY\.md' 'CONTRIBUTING\.md' 'LICENSE'; do
  if ! grep -Fq "${forbidden}" "${SCRIPT_PATH}"; then
    printf 'missing forbidden regex coverage for %s\n' "${forbidden}" >&2
    exit 1
  fi
done

printf 'forbidden regex covers release metadata files\n'
