#!/usr/bin/env bash
# Build the single, uploadable add-on file by inlining the libraries.
# Upload the resulting addon/addon.js into eLabNext. Never upload the src/ or lib/ files directly.
set -euo pipefail
cd "$(dirname "$0")"
{
  cat src/header.js
  echo
  echo "/* --- inlined: JSZip 3.10.1 (MIT) --- */"
  cat lib/jszip.min.js
  echo
  echo "/* --- inlined: js-yaml 4.1.0 (MIT) --- */"
  cat lib/js-yaml.min.js
  echo
  echo "/* --- add-on logic --- */"
  cat src/addon.core.js
} > addon.js
echo "Built addon.js ($(wc -c < addon.js) bytes)"
