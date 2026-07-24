'use strict';
/*
 * Node test harness for the 2026-07-24 dev-support follow-ups:
 *   A. stampMetaIDs           — tag sample meta entries with a field's stable sampleTypeMetaID
 *   B. REQUIRED_SAMPLE_TYPE_FIELDS — the declarative sample-type field schema used by setupSampleTypes
 *   C. checkTypeFields / prettyType — verify a type's live fields against the required set
 *
 * These are the PURE parts of the three features (the network/DOM parts are exercised in-tenant).
 * Loads the BUILT add-on (addon/addon.js) the same way run-flow.test.js does.
 *
 * Run:  node addon/test/api-setup.test.js         (build addon.js first with ./addon/build.sh)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const BUILT = path.join(__dirname, '..', 'addon.js');

const sandbox = {};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.global = sandbox; sandbox.globalThis = sandbox;
sandbox.console = console;
sandbox.setTimeout = setTimeout; sandbox.clearTimeout = clearTimeout;
sandbox.TextEncoder = TextEncoder; sandbox.TextDecoder = TextDecoder;
sandbox.crypto = crypto.webcrypto;
sandbox.ArrayBuffer = ArrayBuffer; sandbox.Uint8Array = Uint8Array; sandbox.Uint16Array = Uint16Array;
sandbox.Uint32Array = Uint32Array; sandbox.Int32Array = Int32Array; sandbox.DataView = DataView;
sandbox.Buffer = Buffer;
sandbox.__BPT_TEST__ = true; // opt in to the add-on's _test surface (absent in the shipped build)
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(BUILT, 'utf8'), sandbox, { filename: 'addon.js' });

const T = sandbox.BioprintTracker && sandbox.BioprintTracker._test;
if (!T) { console.error('FAIL: BioprintTracker._test not exposed by the built add-on (rebuild with ./addon/build.sh)'); process.exit(1); }

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  ✗ ' + msg); } }
function eq(a, b, msg) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  ok(A === B, msg + '  (got ' + A + ', want ' + B + ')');
}
function section(name) { console.log('\n• ' + name); }

// ── A. stampMetaIDs ───────────────────────────────────────────────────────────────
section('stampMetaIDs: tag meta entries with sampleTypeMetaID by key');
(function () {
  const map = {
    'cell line': { sampleTypeMetaID: 11, sampleDataType: 'TEXT' },
    'print date': { sampleTypeMetaID: 22, sampleDataType: 'DATE' }
  };
  const metas = [
    { key: 'Cell line', sampleDataType: 'TEXT', value: 'HeLa' },
    { key: '  print date ', sampleDataType: 'DATE', value: '2026-07-24' }, // whitespace + case
    { key: 'Unknown field', sampleDataType: 'TEXT', value: 'x' }           // not in map
  ];
  T.stampMetaIDs(metas, map);
  eq(metas[0].sampleTypeMetaID, 11, 'matched key gets its sampleTypeMetaID');
  eq(metas[1].sampleTypeMetaID, 22, 'match is case- and whitespace-insensitive');
  ok(!('sampleTypeMetaID' in metas[2]), 'unmatched key is left untouched (by-name fallback)');

  // Non-destructive on a null map and on entries that already carry an ID.
  const before = [{ key: 'Cell line', sampleDataType: 'TEXT', value: 'A' }];
  T.stampMetaIDs(before, null);
  ok(!('sampleTypeMetaID' in before[0]), 'null map leaves metas unchanged');
  const pre = [{ key: 'Cell line', sampleDataType: 'TEXT', value: 'A', sampleTypeMetaID: 99 }];
  T.stampMetaIDs(pre, map);
  eq(pre[0].sampleTypeMetaID, 99, 'an existing sampleTypeMetaID is not overwritten');
})();

// ── B. REQUIRED_SAMPLE_TYPE_FIELDS ──────────────────────────────────────────────────
section('REQUIRED_SAMPLE_TYPE_FIELDS: declarative schema well-formed');
(function () {
  const R = T.REQUIRED_SAMPLE_TYPE_FIELDS;
  const VALID = ['TEXT', 'TEXTAREA', 'RADIO', 'CHECKBOX', 'NUMERIC', 'COMBO', 'DATE', 'DATETIME',
    'FILE', 'SAMPLELINK', 'PROJECT', 'CHEMICAL'];
  ok(!!R['Bioprint Template'] && !!R['Bioprinted Plate'], 'both sample types are declared');
  Object.keys(R).forEach(function (name) {
    const fields = R[name];
    ok(Array.isArray(fields) && fields.length > 0, name + ' has at least one field');
    const keys = {};
    fields.forEach(function (f) {
      ok(typeof f.key === 'string' && f.key.length > 0, name + ': every field has a key');
      ok(VALID.indexOf(f.type) !== -1, name + ': "' + f.key + '" has a valid sampleDataType (' + f.type + ')');
      ok(!keys[f.key], name + ': field key "' + f.key + '" is not duplicated');
      keys[f.key] = true;
    });
  });
  // Spot-check the schema matches the write sites (a drift guard).
  const plate = R['Bioprinted Plate'];
  const protocolLink = plate.find(function (f) { return f.key === 'Bioprint Template'; });
  eq(protocolLink && protocolLink.type, 'SAMPLELINK', 'Bioprinted Plate "Bioprint Template" link is a SAMPLELINK');
  const proto = R['Bioprint Template'];
  const pressure = proto.find(function (f) { return f.key === 'Bioink pressure (kPa)'; });
  eq(pressure && pressure.type, 'NUMERIC', 'Bioprint Template pressure field is NUMERIC');
  const pdf = proto.find(function (f) { return f.key === 'Protocol PDF'; });
  eq(pdf && pdf.type, 'FILE', 'Bioprint Template "Protocol PDF" is a FILE');
})();

// ── D. checkTypeFields ──────────────────────────────────────────────────────────
section('checkTypeFields: verify a type\'s live fields against the required set');
(function () {
  const required = [{ key: 'Cell line', type: 'TEXT' }, { key: 'Print date', type: 'DATE' }];
  const allOk = T.checkTypeFields(
    { 'cell line': { sampleDataType: 'TEXT' }, 'print date': { sampleDataType: 'DATE' } }, required);
  eq(allOk, { missing: [], mismatched: [], ok: 2 }, 'all fields present with right types');

  const missing = T.checkTypeFields({ 'cell line': { sampleDataType: 'TEXT' } }, required);
  eq(missing.missing, ['Print date'], 'a missing field is reported by name');
  eq(missing.ok, 1, 'ok count excludes the missing field');

  const wrong = T.checkTypeFields(
    { 'cell line': { sampleDataType: 'NUMERIC' }, 'print date': { sampleDataType: 'DATE' } }, required);
  eq(wrong.mismatched, [{ key: 'Cell line', expected: 'TEXT', got: 'NUMERIC' }], 'a wrong type is reported');
  eq(wrong.ok, 1, 'ok count excludes the mismatched field');

  ok(T.checkTypeFields(null, required).readFailed === true, 'null map -> readFailed, not all-missing');
})();

// ── E. prettyType ──────────────────────────────────────────────────────────────────
section('prettyType: human labels for API data-type codes');
(function () {
  eq(T.prettyType('NUMERIC'), 'Number', 'NUMERIC -> Number');
  eq(T.prettyType('SAMPLELINK'), 'Sample link', 'SAMPLELINK -> Sample link');
  eq(T.prettyType('date'), 'Date', 'lowercase input is handled');
  eq(T.prettyType('WEIRD'), 'WEIRD', 'unknown code passes through unchanged');
})();

console.log('\n' + (failed === 0 ? '✓ ALL PASSED' : '✗ FAILURES') +
  ' — ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
