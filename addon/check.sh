#!/usr/bin/env bash
# Pre-commit check: the built addon.js must be in sync with src, and the tests must pass.
# Run:  bash addon/check.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# 1. Rebuild the single uploadable file from src, then check it matches what is committed/staged.
bash addon/build.sh >/dev/null
if ! git diff --exit-code -- addon/addon.js >/dev/null 2>&1; then
  echo "✗ addon/addon.js is OUT OF SYNC with src/addon.core.js. Run addon/build.sh and commit." >&2
  exit 1
fi

# 2. Run the test suites. The DOM (wizard) suite needs jsdom (npm install); it is skipped with a
#    note if node_modules is absent so the zero-dependency suites still gate on their own.
node addon/test/api-setup.test.js >/dev/null
node addon/test/placement.test.js >/dev/null
if [ -d node_modules/jsdom ]; then
  node addon/test/wizard.test.js >/dev/null
  echo "✓ addon.js in sync with src; api-setup + placement + wizard suites pass"
else
  echo "✓ addon.js in sync with src; api-setup + placement pass (wizard skipped — run 'npm install')"
fi
