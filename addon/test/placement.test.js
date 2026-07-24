/* Zero-dependency test for the add-on's UI placement (see docs/adr/ADR-0002).
 *
 * Run:  node addon/test/placement.test.js
 * Exits non-zero on any failure, so it can gate a commit or CI step.
 *
 * It loads addon/src/addon.core.js in a minimal DOM + SDK stub (the same non-strict-eval trick as
 * parser.test.js, so the source stays a clean browser add-on with no test-only exports) and drives
 * BioprintTracker.init() under different combinations of the eLabSDK (v1) and eLabSDK2 (v2) globals.
 *
 * The contract being locked in:
 *   - the native Inventory button is the ONLY placement (v1 addButton and/or v2 registerAddSampleAction);
 *   - there is no floating fallback button (it was removed) and no eLabSDK.CustomPage tab;
 *   - a throwing/absent SDK is caught, never left unhandled.
 *
 * NB: intentionally NOT strict mode — a direct eval() in strict mode gets its own scope, so the
 * add-on's top-level `var BioprintTracker` would not leak out to here.
 */
var fs = require('fs');
var path = require('path');

var SRC = path.resolve(__dirname, '..', 'src', 'addon.core.js');
var code = fs.readFileSync(SRC, 'utf8');

// The add-on logs a console.warn when a native SDK path is unavailable or throws — that is expected
// and asserted behaviour in the cases below, so silence it to keep the test output clean.
console.warn = function () {};

// Minimal document stub: tracks whether the floating fallback button was appended to <body>.
function makeDoc() {
  var body = [];
  return {
    _body: body,
    readyState: 'complete',
    getElementById: function (id) {
      return body.find(function (e) { return e.id === id; }) || null;
    },
    createElement: function () { return { style: {}, onclick: null }; },
    addEventListener: function () {},
    head: { appendChild: function () {} },
    body: { appendChild: function (el) { el.id = 'bpt-bioprint-btn'; body.push(el); } }
  };
}

var pass = 0, fail = 0;

// Each case sets up the SDK globals, evals a fresh copy of the add-on (so BioprintTracker is clean),
// calls init(), and asserts on how many native registrations happened and whether the float appeared.
function run(label, setup, expect) {
  var BioprintTracker; // eslint-disable-line no-unused-vars — populated by the non-strict eval below
  global.document = makeDoc();
  global.eLabSDK = undefined;
  global.eLabSDK2 = undefined;
  var calls = { page: 0, v1: 0, v2: 0 };
  setup(calls);
  // eval of a TRUSTED local file (this repo's own addon.core.js, read from disk above) — not
  // untrusted input. Non-strict eval is required so the add-on's top-level `var BioprintTracker` leaks
  // into this scope for testing; same technique as parser.test.js. Not for use outside tests.
  eval(code); // defines BioprintTracker in this function scope (non-strict eval)
  BioprintTracker.init({});
  var floated = global.document._body.length > 0;
  var ok = expect(calls, floated);
  console.log((ok ? 'PASS' : 'FAIL') + ' — ' + label +
    '  [page=' + calls.page + ', v1=' + calls.v1 + ', v2=' + calls.v2 + ', float=' + floated + ']');
  if (ok) pass++; else fail++;
}

// A v1 SDK exposing the classic sample-browser addButton (bonus placement).
function v1SDK(calls) {
  global.eLabSDK = {
    Page: { Sample: function () { return { addButton: function () { calls.v1++; } }; } },
    GUI: { Button: function (cfg) { return cfg; } }
  };
}
// A v2 SDK exposing the Inventory Browser V2 registerAddSampleAction (bonus placement).
function v2SDK(calls, impl) {
  global.eLabSDK2 = global.eLabSDK2 || {};
  global.eLabSDK2.Inventory = { Sample: { SampleList: {
    registerAddSampleAction: impl || function (a) { if (a.id && a.onClick) calls.v2++; }
  } } };
}

// Contract (ADR-0002, revised again): the top-nav CustomPage tab is REMOVED (it rendered an empty
// page on the tenant — undocumented content contract). The ONLY placement is the native Inventory
// sample-browser button (v1 addButton and/or v2 registerAddSampleAction). The floating launcher is
// OFF (CONFIG.SHOW_FLOATING_LAUNCHER=false) — it is not a sanctioned placement, so it never appears,
// not even as a fallback. Nothing should ever construct an eLabSDK.CustomPage.

run('Inventory V2 only: registers the Add-Sample button; no float',
  function (c) { v2SDK(c); },
  function (c, floated) { return c.page === 0 && c.v2 === 1 && floated === false; });

run('Both inventory SDKs: registers v1 and v2 buttons; no float',
  function (c) { v1SDK(c); v2SDK(c); },
  function (c, floated) { return c.page === 0 && c.v1 === 1 && c.v2 === 1 && floated === false; });

run('Classic V1 only: adds toolbar button; no float',
  function (c) { v1SDK(c); },
  function (c, floated) { return c.page === 0 && c.v1 === 1 && floated === false; });

run('No SDK at all: nothing registers, and the float stays off',
  function () {},
  function (c, floated) { return c.page === 0 && c.v1 === 0 && c.v2 === 0 && floated === false; });

run('A CustomPage global present is never used (tab was removed)',
  function (c) { global.eLabSDK = { CustomPage: function () { c.page++; return {}; } }; },
  function (c, floated) { return c.page === 0 && floated === false; });

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
