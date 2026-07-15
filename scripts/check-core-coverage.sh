#!/usr/bin/env bash
set -euo pipefail

node \
  --experimental-test-coverage \
  --test-coverage-lines=80 \
  --test-coverage-functions=80 \
  --test-coverage-include=history-format.js \
  --test-coverage-include=history-store.js \
  --test-coverage-include=i18n.js \
  --test-coverage-include=marketing-diagnosis.js \
  --test-coverage-include=model-adapters.js \
  --test-coverage-include=output-validator.js \
  --test-coverage-include=prompt-compiler.js \
  --test-coverage-include=prompt-schemas.js \
  --test-coverage-include=prompt-variants.js \
  --test-coverage-include=result-format.js \
  --test-coverage-include=templates.js \
  --test tests/*.test.js
