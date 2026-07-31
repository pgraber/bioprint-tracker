/* DOM tests for the "Log a print run" per-plate wizard, driven in jsdom.
 *
 * Run:  node addon/test/wizard.test.js   (needs `npm install` for jsdom)
 *
 * Unlike the other suites (which test pure functions), this renders the real add-on UI into a jsdom
 * document, stubs eLabSDK's API so a protocol resolves to a designed-plates blob, and drives the
 * wizard the way a user would (focus/click/type). It locks in the P0 fixes that live in DOM code:
 * per-plate pre-fill incl. concentration (#3), approve gating (#2), approve-then-edit un-approve and
 * the create/submit guard (#1), and the partial-failure results dialog (#4).
 *
 * NB: intentionally NOT strict mode — a direct eval() in strict mode gets its own scope, so the
 * add-on's top-level `var BioprintTracker` would not leak into this module. Same trick as parser.test.js.
 */
var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..', '..');
var JSDOM = require(path.join(ROOT, 'node_modules', 'jsdom')).JSDOM;

// ─── jsdom environment ──────────────────────────────────────────────────────────
var dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://tenant.example/' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Event = dom.window.Event;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.HTMLElement = dom.window.HTMLElement;

// ─── Stub eLabSDK.API.Call (MooTools-class shape: new + .execute(); async via setTimeout) ─────────
// One protocol whose two designed plates have DIFFERENT concentrations, so the per-plate concentration
// fix (#3) is observable: plate W1 = 2,000,000, plate W2 = 3,000,000. The protocol-level value is the
// comma-joined set, whose first number (2,000,000) is the old (wrong) default for every plate.
var DESIGNED = [
  { plate: 'W1', label: 'Plate 1', wellplate: 'PhenoPlate 96-well [WP007]', cell_line: 'Cell A', concentration: '2000000', matrix_codes: 'Px01.28', rows: [{ wr: ['A1', 'A2'], m: 'M', mx: 'Px01.28', c: 'Cell A' }] },
  { plate: 'W2', label: 'Plate 2', wellplate: 'Greiner 384-well [WP035]', cell_line: 'Cell B', concentration: '3000000', matrix_codes: 'Px01.69', rows: [{ wr: ['A1', 'A2'], m: 'M', mx: 'Px01.69', c: 'Cell B' }] }
];
var api = { posts: 0, failPostAt: 0, nextId: 9000, sampleTypes: null };   // failPostAt=N -> Nth POST rejects; sampleTypes=array -> GET sampleTypes returns them
// The add-on reads eLabSDK as a BARE global (not window.eLabSDK), so stub it on Node's global —
// same as placement.test.js. jsdom's window is not Node's global.
global.eLabSDK = { API: { Call: function (cfg) {
  this.cfg = cfg;
  this.execute = function (_body) {
    var cfg = this.cfg;
    setTimeout(function () {
      try {
        var resp, m = cfg.method, p = cfg.path;
        if (m === 'GET' && /^samples\/\d+$/.test(p) && cfg.queryParams && cfg.queryParams['$expand']) {
          // A real GET samples/{id}?$expand=meta returns the top-level barcode as well as the meta
          // array; getSampleById now always requests $expand, so the barcode read-back lands here too.
          resp = { barcode: 'BC' + p.split('/')[1], meta: [
            { key: 'Cell line', value: 'Cell A, Cell B' },
            { key: 'Cell concentration (cells/mL)', value: '2000000, 3000000' },
            { key: 'Designed plates (JSON)', value: JSON.stringify(DESIGNED) }
          ] };
        } else if (m === 'POST' && p === 'samples') {
          api.posts++;
          if (api.failPostAt && api.posts === api.failPostAt) { cfg.onError(null, 500, 'simulated failure'); return; }
          resp = api.nextId++;                       // create -> a bare sampleID
        } else if (m === 'GET' && /^samples\/\d+$/.test(p)) {
          resp = { barcode: 'BC' + p.split('/')[1] }; // barcode read-back
        } else if (m === 'GET' && p === 'sampleTypes') {
          resp = api.sampleTypes ? { data: api.sampleTypes } : {}; // {} -> resolveSampleTypeID rejects (not set up)
        } else { resp = {}; }
        cfg.onSuccess(null, 200, resp);
      } catch (e) { cfg.onError(null, 0, String(e)); }
    }, 0);
  };
} } };

// ─── Load the add-on (same non-strict-eval trick as parser.test.js) ───────────────
var src = fs.readFileSync(path.join(ROOT, 'addon/src/addon.core.js'), 'utf8');
eval(src); // defines BioprintTracker in this module scope
var addon = BioprintTracker;

// ─── Tiny async assert harness ────────────────────────────────────────────────────
var passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '  (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function section(n) { console.log('\n• ' + n); }
function tick() { return new Promise(function (r) { setTimeout(r, 5); }); }        // let a stub call resolve
async function settle() { for (var i = 0; i < 12; i++) await tick(); }             // let a multi-step chain finish
function fire(el, type) { el.dispatchEvent(new window.Event(type, { bubbles: true })); }
function $(sel) { return document.querySelector(sel); }

// Open the form and select the one protocol, so the wizard renders. Returns after plates are shown.
async function openWithProtocol() {
  api.posts = 0; api.failPostAt = 0;
  addon.showRunForm(
    [{ sampleID: 27952, name: '2026-07-20_Allegro_two-plates_244a69', meta: [
      { key: 'Cell line', value: 'Cell A, Cell B' }, { key: 'Matrix code', value: 'Px01.28, Px01.69' }
    ] }],
    27890, { cellLines: [] }, 27889
  );
  document.getElementById('inp-printer-machine').value = 'PrinterA';  // required physical-printer field (date auto-fills)
  var search = document.getElementById('inp-protocol-search');
  fire(search, 'focus');                       // renders the combo list
  var item = $('#bpt-protocol-list .bpt-combo-item');
  item.click();                                // choose -> loadProtocolDetails -> apiCall (async)
  await tick();                                // let the GET resolve and renderPlateArea run
}
function setInput(sel, value) { var el = $(sel); el.value = value; fire(el, 'input'); return el; }
function approveBtn() { return document.getElementById('bpt-wiz-approve'); }
function statusText() { var s = document.getElementById('bpt-wiz-status'); return s ? s.textContent : ''; }

(async function () {
  // ── 1. Per-plate pre-fill, incl. the concentration fix (#3) ─────────────────────
  section('Wizard renders plate 1 pre-filled from the file');
  await openWithProtocol();
  ok(/Plate 1 of 2/.test(document.getElementById('bpt-plate-area').textContent), 'shows "Plate 1 of 2"');
  eq($('.bpt-pl-cellline').value, 'Cell A', 'plate 1 cell line pre-filled from the file');
  eq($('.bpt-pl-conc').value, '2000000', 'plate 1 concentration pre-filled (2M)');

  // ── 2. Approve gating: a blank field cannot be approved (#2) ────────────────────
  section('Approve is blocked while a required field is blank / invalid');
  setInput('.bpt-pl-cellline', '');            // blank the cell line
  approveBtn().click();
  ok(/cell line/i.test(statusText()), 'blank cell line -> approve refused with a message');
  ok(!/Approved/.test(approveBtn().textContent), 'button is not in the approved state');

  setInput('.bpt-pl-cellline', 'Cell A');
  setInput('.bpt-pl-conc', 'abc');             // non-numeric concentration
  approveBtn().click();
  ok(/whole number/i.test(statusText()), 'non-numeric concentration -> approve refused');

  // ── 3. Valid -> approve; then editing un-approves the plate (#1) ─────────────────
  section('Editing after approving un-approves the plate');
  setInput('.bpt-pl-conc', '2000000');
  approveBtn().click();
  await tick();                                // approve advances to plate 2 (last-plate re-renders in place)
  // We advanced to plate 2 — go Back to plate 1 to check its approved state persisted.
  document.getElementById('bpt-wiz-prev').click();
  ok(/✓ Approved/.test(approveBtn().textContent), 'plate 1 shows approved after a valid approve');
  setInput('.bpt-pl-cellline', 'Cell A2');     // edit after approving
  ok(!/Approved/.test(approveBtn().textContent), 'editing a field cleared the approval');

  // ── 3b. Clicking an already-approved button toggles it back off, staying on the same plate ──────
  section('Clicking "✓ Approved" again un-approves the plate without advancing');
  setInput('.bpt-pl-cellline', 'Cell A'); setInput('.bpt-pl-conc', '2000000'); // restore a valid value
  approveBtn().click(); await tick();          // approve plate 1 again
  ok(/Plate 1 of 2/.test(document.getElementById('bpt-plate-area').textContent),
    'approving stays on the current plate (it does not navigate)');
  document.getElementById('bpt-wiz-next').click(); // forward by the nav control
  ok(/Plate 2 of 2/.test(document.getElementById('bpt-plate-area').textContent), 'Next moves forward');
  document.getElementById('bpt-wiz-prev').click(); // back to plate 1
  ok(/✓ Approved/.test(approveBtn().textContent), 'plate 1 is approved again before the toggle test');
  approveBtn().click();                        // click the ALREADY-approved button
  ok(!/Approved/.test(approveBtn().textContent), 'clicking it again un-approves the plate (toggle)');
  ok(/Plate 1 of 2/.test(document.getElementById('bpt-plate-area').textContent),
    'un-approving stays on the same plate');

  // ── 3b. Navigation and approval are INDEPENDENT ─────────────────────────────────
  // The trap this replaced: approving was the only way to advance, and an approved plate's button
  // un-approved instead, so returning to an earlier plate left no way forward except withdrawing and
  // re-granting approval. Moving must never change approval, in either direction.
  section('Moving between plates never changes approval state');
  setInput('.bpt-pl-cellline', 'Cell A');
  setInput('.bpt-pl-conc', '2000000');
  approveBtn().click(); await tick();          // plate 1 approved, still on plate 1
  document.getElementById('bpt-wiz-next').click();
  ok(/Plate 2 of 2/.test(document.getElementById('bpt-plate-area').textContent), 'moved to plate 2');
  ok(!/Approved/.test(approveBtn().textContent), 'plate 2 is untouched by the move (not approved)');
  document.getElementById('bpt-wiz-prev').click();
  ok(/✓ Approved/.test(approveBtn().textContent), 'plate 1 kept its approval across the round trip');
  // The ends are closed off rather than silently doing nothing.
  ok(document.getElementById('bpt-wiz-prev').disabled, 'Back is disabled on the first plate');
  document.getElementById('bpt-wiz-next').click();
  ok(document.getElementById('bpt-wiz-next').disabled, 'Next is disabled on the last plate');
  // A dot jumps straight to its plate, which is the fast route once there are several.
  document.querySelectorAll('#bpt-plate-area .bpt-wiz-dot')[0].click();
  ok(/Plate 1 of 2/.test(document.getElementById('bpt-plate-area').textContent), 'clicking a dot jumps to that plate');
  ok(/✓ Approved/.test(approveBtn().textContent), 'jumping by dot does not change approval either');
  // Anything typed is kept when moving away and coming back.
  setInput('.bpt-pl-passage', '17');
  document.querySelectorAll('#bpt-plate-area .bpt-wiz-dot')[1].click();
  document.querySelectorAll('#bpt-plate-area .bpt-wiz-dot')[0].click();
  eq($('.bpt-pl-passage').value, '17', 'field values survive navigating away and back');

  // ── 4. Per-plate concentration differs (the #3 payoff) ──────────────────────────
  section('Plate 2 keeps its OWN concentration, not the protocol default');
  setInput('.bpt-pl-cellline', 'Cell A');      // restore plate 1
  approveBtn().click(); await tick();          // approve plate 1
  document.getElementById('bpt-wiz-next').click();
  ok(/Plate 2 of 2/.test(document.getElementById('bpt-plate-area').textContent), 'now on plate 2');
  eq($('.bpt-pl-conc').value, '3000000', 'plate 2 pre-fills 3M (its own), not the 2M protocol default');

  // ── 5. Create is blocked until every plate is approved ──────────────────────────
  section('Create refused while a plate is unapproved; no records created');
  document.getElementById('bpt-btn-0').click(); // "Create plate records" — plate 2 not yet approved
  await tick();
  var err = document.getElementById('bpt-err');
  ok(err && err.style.display !== 'none' && /[Aa]pprove/.test(err.textContent), 'Create blocked with an approve message');
  eq(api.posts, 0, 'nothing was created');

  // ── 6. Happy path: approve all -> create -> results dialog with barcodes ────────
  section('Approve all -> Create -> results dialog lists the barcodes');
  approveBtn().click(); await tick();           // approve plate 2 (both approved now)
  document.getElementById('bpt-btn-0').click(); await settle();
  eq(api.posts, 2, 'two plate records created');
  ok(/Plates created/.test(document.querySelector('.bpt-card-header').textContent), 'success dialog shown');
  ok(/BC90/.test(document.querySelector('.bpt-table').textContent), 'barcodes listed in the results');

  // ── 7. Partial failure: 2nd create fails -> results still show the 1 saved barcode (#4) ─────────
  section('Partial failure still surfaces the created barcodes (not lost)');
  await openWithProtocol();
  api.failPostAt = 2;                           // the second POST will reject
  // approve both plates
  setInput('.bpt-pl-cellline', 'Cell A'); setInput('.bpt-pl-conc', '2000000'); approveBtn().click(); await tick();
  document.getElementById('bpt-wiz-next').click();
  setInput('.bpt-pl-cellline', 'Cell B'); setInput('.bpt-pl-conc', '3000000'); approveBtn().click(); await tick();
  document.getElementById('bpt-btn-0').click(); await settle();
  eq(api.posts, 2, 'attempted both (second failed)');
  ok(/Partly created/.test(document.querySelector('.bpt-card-header').textContent), 'partial-failure dialog shown');
  ok(/BC/.test(document.querySelector('.bpt-table').textContent), 'the one created barcode is still shown (not lost)');

  // ── 8. Protocol upload: live name preview shows the auto-added parts before a file is chosen ─────
  section('Upload form previews the auto-generated protocol name as the label is typed');
  addon.showProtocolForm({}, 27889);
  var nameWrap = document.getElementById('bpt-name-preview-wrap');
  ok(nameWrap && nameWrap.style.display === 'none', 'name preview hidden until a label is typed');
  setInput('#inp-name', 'Large Plug v2');
  var np = document.getElementById('bpt-name-preview');
  ok(nameWrap.style.display !== 'none', 'name preview shows once a label is entered');
  // Before a file is chosen the version + hash are placeholders, but the date + slug are real.
  ok(/_Large-Plug-v2_/.test(np.textContent), 'preview slugifies the label into the name (' + np.textContent + ')');
  ok(/^\d{4}-\d{2}-\d{2}_/.test(np.textContent), 'preview leads with the auto-added date');
  // Before a file is chosen, version + fingerprint are muted placeholder WORDS (not "/" or dots).
  ok(/version/.test(np.textContent) && /fingerprint/.test(np.textContent),
    'version + fingerprint shown as placeholder words until the file is parsed (' + np.textContent + ')');
  ok(np.textContent.indexOf('/') === -1 && np.textContent.indexOf('•') === -1,
    'no literal slash or dots that could read as part of the name');

  // ── 9. Folder-ID finder: groups files by folder, shows a filename to identify each, marks current ─
  section('Folder-ID finder lists folder IDs with example filenames and marks the current target');
  global.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, json: function () {
      return Promise.resolve([
        { fileID: 1, folderID: 42, filename: 'bioprinting.txt' },
        { fileID: 2, folderID: 42, filename: '2026-07-22_RASTRUM_x.pdf' },
        { fileID: 3, folderID: 0, filename: 'other.csv' }
      ]);
    } });
  };
  addon.showFolderIdFinder();          // CONFIG.PDF_FOLDER_ID defaults to 0 (root) in this harness
  await settle();
  var ftable = document.querySelector('#bpt-folder-list table');
  ok(ftable, 'folder table rendered');
  ok(/42/.test(ftable.textContent), 'a real folder ID (42) is listed');
  ok(/bioprinting\.txt/.test(ftable.textContent), 'an example filename is shown so the folder is recognisable');
  ok(/main file area/.test(ftable.textContent) && /in use/.test(ftable.textContent),
    'main-file-area row shown and marked in use (no folder configured)');
  // The "in use" mark must survive the case where saving is unavailable, which is what this harness
  // simulates: there is no installed-add-on record, so the button column is empty.
  ok(ftable.querySelectorAll('[data-bpt-folder]').length === 0,
    'no save buttons offered when the add-on has no installed record (side-loading)');
  ok(!/enter a folder number/i.test(document.body.textContent),
    'no free-text folder-number box (an unvalidatable number would be permanent, files cannot be moved)');

  // ── 10. Launcher setup nudge: appears only when the group is NOT set up ──────────
  section('Launcher shows a setup nudge only when the group is not set up');
  // Not set up: GET sampleTypes returns {} so both types fail to resolve.
  api.sampleTypes = null;
  addon.showMainDialog();
  await settle();
  ok(/Set up \/ check/.test(document.body.textContent), 'a quiet "Set up / check" admin link is always present');
  ok(/Not set up for your group yet/.test(document.body.textContent), 'nudge shown when the group is not set up');
  ok(/group administrator/.test(document.body.textContent), 'nudge names a group administrator as the one to set it up');
  // Set up: the two types resolve, so the nudge must NOT appear.
  api.sampleTypes = [{ sampleTypeID: 1, name: 'Bioprint Template' }, { sampleTypeID: 2, name: 'Bioprinted Plate' }];
  addon.showMainDialog();
  await settle();
  ok(!/Not set up for your group yet/.test(document.body.textContent), 'no nudge once both sample types resolve');

  // ── 11. Setup hub: the three tasks, and sub-dialogs return to the hub on close ────
  section('Setup hub offers the three tasks; sub-dialog close returns to the hub');
  addon.showSetupHub();
  await settle();
  var hubBtns = Array.prototype.map.call(
    document.querySelectorAll('.bpt-card-footer .bpt-btn-primary'), function (b) { return b.textContent; });
  ok(hubBtns.indexOf('Set up sample types') !== -1, 'hub offers "Set up sample types"');
  ok(hubBtns.indexOf('Check sample types') !== -1, 'hub offers "Check sample types"');
  ok(hubBtns.indexOf('Choose file folder') !== -1, 'hub offers "Choose file folder"');
  // A setup sub-dialog's cancel button must go BACK to the hub, not exit the whole thing.
  addon.showFolderIdFinder();
  await settle();
  var cancelBtn = document.getElementById('bpt-cancel');
  // The exit button names its destination: a bare "Back" is ambiguous, and in the run dialog it
  // collided with the wizard's own plate-level Back.
  ok(cancelBtn && /Back to setup/.test(cancelBtn.textContent),
    'sub-dialog exit button names where it goes ("Back to setup")');
  cancelBtn.click();
  await settle();
  ok(/Bioprint Tracker setup/.test(document.body.textContent), 'clicking Back reopens the setup hub, not closes everything');

  // ── 10. Leaving a form with unsaved input asks first; an untouched one does not ──
  // Nothing in these forms is saved until the primary button, so exiting discards. The prompt must
  // fire only when there is something to lose, otherwise it becomes noise people click through.
  section('Back from a form confirms only when something was entered');
  var confirmCalls = 0, confirmAnswer = true;
  window.confirm = function () { confirmCalls++; return confirmAnswer; };

  addon.showProtocolForm({}, 27889);
  confirmCalls = 0;
  document.getElementById('bpt-cancel').click();
  await settle();
  eq(confirmCalls, 0, 'an untouched form leaves without asking');
  ok(/What would you like to do/.test(document.body.textContent), 'and lands on the launcher menu');

  addon.showProtocolForm({}, 27889);
  ok(/Back to menu/.test(document.getElementById('bpt-cancel').textContent),
    'a form exit button names the menu as its destination');
  setInput('#inp-name', 'Large Plug v2');       // now there is unsaved input
  confirmCalls = 0; confirmAnswer = false;      // the user decides to stay
  document.getElementById('bpt-cancel').click();
  await settle();
  eq(confirmCalls, 1, 'leaving a dirty form asks');
  ok(document.getElementById('inp-name'), 'declining keeps the form open');
  eq(document.getElementById('inp-name').value, 'Large Plug v2', 'and keeps what was typed');

  confirmAnswer = true;                          // the user confirms the discard
  document.getElementById('bpt-cancel').click();
  await settle();
  ok(/What would you like to do/.test(document.body.textContent), 'confirming leaves for the menu');

  // The plate wizard's own navigation must not read as "leave the form" now the footer is adjacent.
  section('Plate navigation is labelled by what it moves through');
  await openWithProtocol();
  ok(/Previous plate/.test(document.getElementById('bpt-wiz-prev').textContent),
    'wizard back button says "Previous plate", not a bare "Back"');
  ok(/Next plate/.test(document.getElementById('bpt-wiz-next').textContent), 'and forward says "Next plate"');
  ok(/Back to menu/.test(document.getElementById('bpt-cancel').textContent),
    'while the footer names the menu, so the two Backs cannot be confused');

  console.log('\n' + (failed === 0 ? '✓ ALL PASSED' : '✗ FAILURES') + ' — ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
})().catch(function (e) { console.error('Wizard test harness crashed:', e); process.exit(1); });
