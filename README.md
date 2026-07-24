# Bioprint Tracker

An eLabNext (SciSure) browser add-on that turns a RASTRUM or Allegro `.rastrum` print file into
shared, barcoded Inventory records. Upload a `.rastrum` once as a reusable template, then log each
print run as one barcoded sample per physical plate, all linked back to the template.

## Why

Bioprinted-plate experiments generate data on several instruments (the printer, a plate reader, an
imager), stored by different people in different ways, with nothing tying them together. This add-on
makes eLabNext the single registry: every printed plate is a record with a unique barcode, and that
barcode is the key that later links the plate to its readout and image files.

## How it works

The add-on runs entirely in the browser inside eLabNext. It parses the uploaded `.rastrum` file
client-side (no server) and creates records through the eLabNext API using the logged-in user's
session. Two Inventory sample types hold the data:

- **Bioprint Template** — the reusable print design parsed from a `.rastrum` file.
- **Bioprinted Plate** — one physical printed plate, barcoded, linked to its Bioprint Template.

An administrator sets the two types up once per group (via the add-on's built-in **Set up / check**
helper, or by hand — see `addon/SETUP.md`).

## Install

1. Register an add-on in your eLabNext Developer Platform and note its identifier.
2. Set the add-on's identifier in the code (see **Add-on identifier** below).
3. Build `addon/addon.js` (`npm run build`) and upload it as the add-on code.
4. Upload `addon/config.schema.json` and `addon/config.default.json` as the configuration schema and
   default configuration.
5. Open Inventory and use **Set up / check** to create the two sample types.

Full setup and self-test steps are in `addon/SETUP.md`.

## Add-on identifier (rootVar)

eLabNext binds an add-on to a single global variable whose name must match the add-on's identifier in
your Developer Platform. This project uses **`BioprintTracker`** (see `@rootVar` in
`addon/src/header.js` and the `var BioprintTracker = {}` / IIFE call in `addon/src/addon.core.js`). If
your registered identifier differs, change that name in those places and rebuild.

## Build and test

```sh
npm install          # dev dependency: jsdom, for the DOM test
npm run build        # inlines the libraries into addon/addon.js
npm test             # runs the included test suites
```

The bundled test suites cover the pure logic and the DOM flows. The parser's fixture-based tests use
real print files that are not included in this repository.

## Structure

```
addon/
  src/         header.js + addon.core.js (the source you edit)
  addon.js     the built, uploadable single file (from build.sh)
  build.sh     inlines lib/ into addon.js
  check.sh     build-sync check + tests
  lib/         bundled JSZip and js-yaml (see lib/ATTRIBUTION.md)
  config.*.json  add-on configuration schema and defaults
  test/        test suites
  SETUP.md     tenant setup and self-test guide
```

## License

MIT — see `LICENSE`. Bundles JSZip and js-yaml, both MIT; see `addon/lib/ATTRIBUTION.md`.
