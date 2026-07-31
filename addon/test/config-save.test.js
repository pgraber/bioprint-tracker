'use strict';
/*
 * Node test harness for the add-on's self-service configuration save (added in v1.1.0).
 *
 * Why this exists: the platform's Configure dialog rendered EMPTY in a production tenant while rendering
 * correctly in the sandbox (2026-07-31), which left the file folder unsettable. The add-on now writes
 * the value itself over the API, so setup no longer depends on that dialog. The exact request shapes
 * come from the API reference rather than from a call watched succeeding in the tenant, so they are
 * pinned here: a silent change to a path, a query parameter or the request body is exactly the kind
 * of drift that would only surface as a confusing in-tenant failure.
 *
 * Covered:
 *   A. getInstalledAddon  — finds this add-on's own installed record (the source of sdkPluginID)
 *   B. readStoredConfig   — GET the stored configuration, which arrives as a JSON string
 *   C. saveStoredConfig   — merge-then-PUT, at the scope the install reports
 *   D. failure paths      — 403, and side-loading (no installed record)
 *
 * Loads the BUILT add-on (addon/addon.js), the same way api-setup.test.js does.
 *
 * Run:  node addon/test/config-save.test.js      (build addon.js first with ./addon/build.sh)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const BUILT = path.join(__dirname, '..', 'addon.js');

// ── The fake eLabSDK ────────────────────────────────────────────────────────────────
// eLabSDK.API.Call is a MooTools Class: instantiated with `new`, then .execute() actually sends.
// The stub records every call so the assertions can inspect the exact shape the add-on produced.
const calls = [];
let responder = () => ({});

function makeSDK() {
  return {
    API: {
      Call: function (config) {
        this.execute = function (body) {
          const record = {
            method: config.method,
            path: config.path,
            queryParams: config.queryParams || null,
            body: body === undefined ? null : body
          };
          calls.push(record);
          let result;
          try {
            result = responder(record);
          } catch (e) {
            // A responder that throws stands for a transport/HTTP failure.
            setTimeout(() => { config.onError(null, e.status || 500, e.message); }, 0);
            return;
          }
          setTimeout(() => { config.onSuccess(null, 200, result); }, 0);
        };
      }
    }
  };
}

const sandbox = {};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.global = sandbox; sandbox.globalThis = sandbox;
sandbox.console = console;
sandbox.setTimeout = setTimeout; sandbox.clearTimeout = clearTimeout;
sandbox.TextEncoder = TextEncoder; sandbox.TextDecoder = TextDecoder;
sandbox.crypto = crypto.webcrypto;
sandbox.ArrayBuffer = ArrayBuffer; sandbox.Uint8Array = Uint8Array; sandbox.Uint16Array = Uint16Array;
sandbox.Uint32Array = Uint32Array; sandbox.Int32Array = Int32Array; sandbox.DataView = DataView;
sandbox.Buffer = Buffer;
sandbox.__BPT_TEST__ = true;
sandbox.eLabSDK = makeSDK();
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

// Each case starts from a clean slate: no recorded calls, no cached installed record.
function reset(fn) {
  calls.length = 0;
  T.resetInstalledAddonCache();
  responder = fn;
}

// The installed-add-ons response as documented: a paged envelope, not a bare array.
function installedEnvelope(records) {
  return { recordCount: records.length, hasNextPage: false, currentPage: 0, data: records };
}

const MINE = { sdkPluginID: 4211, rootVar: 'BioprintTracker', name: 'Bioprint Tracker', version: '1.1.0', active: true, scope: 'GROUP' };
const OTHER = { sdkPluginID: 99, rootVar: 'SomeOtherAddon', name: 'Other', active: true, scope: 'GROUP' };

(async function run() {
  // ── A. getInstalledAddon ──────────────────────────────────────────────────────────
  section('getInstalledAddon: find this add-on\'s own installed record');
  {
    reset(() => installedEnvelope([OTHER, MINE]));
    const a = await T.getInstalledAddon();
    eq(a.sdkPluginID, 4211, 'returns the record whose rootVar is ours, not the first row');
    eq(calls[0].method, 'GET', 'reads with GET');
    eq(calls[0].path, 'addons/installed', 'path is addons/installed');
    // Query parameters MUST travel in queryParams: the SDK silently drops a query string inside path.
    eq(calls[0].queryParams, { rootVar: 'BioprintTracker', '$records': 100 },
      'rootVar filter and page size go in queryParams, not appended to the path');

    // Cached on success, so opening the dialog repeatedly does not re-query.
    await T.getInstalledAddon();
    eq(calls.length, 1, 'a successful lookup is cached (no second request)');
  }
  {
    // An add-on can be installed at more than one scope; an inactive record must not win.
    reset(() => installedEnvelope([
      { sdkPluginID: 1, rootVar: 'BioprintTracker', active: false, scope: 'USER' },
      { sdkPluginID: 2, rootVar: 'BioprintTracker', active: true, scope: 'GROUP' }
    ]));
    const a = await T.getInstalledAddon();
    eq(a.sdkPluginID, 2, 'an active install is preferred over an inactive one');
  }
  {
    // Side-loading: the add-on is running but is not installed, so there is no sdkPluginID at all.
    reset(() => installedEnvelope([OTHER]));
    let err = null;
    try { await T.getInstalledAddon(); } catch (e) { err = e; }
    ok(err !== null, 'no matching record rejects rather than resolving undefined');
    ok(/side-load/i.test(err.message), 'the message names side-loading as the expected cause');
    ok(/Configure/i.test(err.message), 'and points at the Configure screen as the alternative');

    // A failure must stay retryable: caching it would poison every later attempt in the session.
    reset(() => installedEnvelope([MINE]));
    const a = await T.getInstalledAddon();
    eq(a.sdkPluginID, 4211, 'a failed lookup is not cached, so a later attempt still succeeds');
  }

  // ── B. readStoredConfig ───────────────────────────────────────────────────────────
  section('readStoredConfig: GET the stored configuration by sdkPluginID');
  {
    reset(rec => rec.path === 'addons/installed'
      ? installedEnvelope([MINE])
      : '{"pdfFolderID":1042}');
    const cfg = await T.readStoredConfig();
    eq(cfg, { pdfFolderID: 1042 }, 'the JSON string response is parsed');
    eq(calls[1].method, 'GET', 'reads with GET');
    eq(calls[1].path, 'addons/4211/configuration', 'path carries the sdkPluginID');
  }

  // ── C. saveStoredConfig ───────────────────────────────────────────────────────────
  section('saveStoredConfig: merge with what is stored, then PUT the whole object');
  {
    reset(rec => {
      if (rec.path === 'addons/installed') return installedEnvelope([MINE]);
      if (rec.method === 'GET') return '{"pdfFolderID":7,"somethingElse":"keep me"}';
      return '';
    });
    const merged = await T.saveStoredConfig({ pdfFolderID: 1042 });

    const put = calls.filter(c => c.method === 'PUT')[0];
    ok(put, 'a PUT is issued');
    eq(put.path, 'addons/configuration', 'the write path takes no ID (it is in the body)');
    eq(put.body.sdkPluginID, 4211, 'the body carries sdkPluginID');
    eq(put.body.scope, 'GROUP', 'written at the scope the install reports');
    ok(typeof put.body.configuration === 'string', 'configuration is sent as a STRING, per the reference');
    eq(JSON.parse(put.body.configuration), { pdfFolderID: 1042, somethingElse: 'keep me' },
      'the write is a merge: the endpoint replaces wholesale, so other settings must be preserved');
    eq(merged, { pdfFolderID: 1042, somethingElse: 'keep me' }, 'the merged object is returned');
  }
  {
    // 0 is a real choice ("the main file area"), not an absence, so it must reach the wire.
    reset(rec => rec.path === 'addons/installed' ? installedEnvelope([MINE]) : (rec.method === 'GET' ? '{"pdfFolderID":88}' : ''));
    await T.saveStoredConfig({ pdfFolderID: 0 });
    const put = calls.filter(c => c.method === 'PUT')[0];
    eq(JSON.parse(put.body.configuration).pdfFolderID, 0, 'choosing the main file area writes 0, not nothing');
  }
  {
    // A first-ever save has nothing stored: the read fails, and that must not block the write.
    reset(rec => {
      if (rec.path === 'addons/installed') return installedEnvelope([MINE]);
      if (rec.method === 'GET') { const e = new Error('not found'); e.status = 404; throw e; }
      return '';
    });
    await T.saveStoredConfig({ pdfFolderID: 5 });
    const put = calls.filter(c => c.method === 'PUT')[0];
    eq(JSON.parse(put.body.configuration), { pdfFolderID: 5 }, 'an unreadable current configuration is treated as empty, and the write still happens');
  }
  {
    // An unrecognised scope must not be forwarded verbatim; the enum is fixed.
    reset(rec => rec.path === 'addons/installed'
      ? installedEnvelope([{ sdkPluginID: 4211, rootVar: 'BioprintTracker', active: true, scope: 'somethingUnexpected' }])
      : (rec.method === 'GET' ? '{}' : ''));
    await T.saveStoredConfig({ pdfFolderID: 3 });
    eq(calls.filter(c => c.method === 'PUT')[0].body.scope, 'GROUP', 'an unusable scope falls back to GROUP');
  }
  {
    reset(rec => rec.path === 'addons/installed'
      ? installedEnvelope([{ sdkPluginID: 4211, rootVar: 'BioprintTracker', active: true, scope: 'system' }])
      : (rec.method === 'GET' ? '{}' : ''));
    await T.saveStoredConfig({ pdfFolderID: 3 });
    eq(calls.filter(c => c.method === 'PUT')[0].body.scope, 'SYSTEM', 'a lowercase scope is normalised, not rejected');
  }

  // ── D. Refusal ────────────────────────────────────────────────────────────────────
  section('saveStoredConfig: a refused write surfaces, never passes silently');
  {
    // A SYSTEM-scoped install is admin-editable only, so a non-admin gets 403 from the server. The
    // dialog keys its "ask an administrator" message off this, so the status must reach the caller.
    reset(rec => {
      if (rec.path === 'addons/installed') return installedEnvelope([MINE]);
      if (rec.method === 'GET') return '{}';
      const e = new Error('Forbidden'); e.status = 403; throw e;
    });
    let err = null;
    try { await T.saveStoredConfig({ pdfFolderID: 1 }); } catch (e) { err = e; }
    ok(err !== null, 'a refused write rejects');
    ok(/\(403\)/.test(err.message), 'the message carries the 403 the dialog matches on (' + (err && err.message) + ')');
  }

  console.log('\n' + (failed === 0 ? '✓ ALL PASSED' : '✗ FAILURES') +
    ' — ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
})();
