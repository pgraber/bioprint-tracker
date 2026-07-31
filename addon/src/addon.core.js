/* Bioprint Tracker, core logic.
 *
 * An eLabNext (SciSure) add-on that reads a RASTRUM/Allegro ".rastrum" print file in the browser and
 * registers it in Inventory, giving printed plates a shared, barcoded record instead of ad hoc tracking.
 *
 * Build: edit this source, then run addon/build.sh to regenerate the uploadable addon/addon.js.
 *
 * Data model:
 *   Protocol -> an Inventory Sample of type "Bioprint Template" (a reusable print design parsed once
 *               from a .rastrum file; see showProtocolDialog).
 *   Plate    -> an Inventory Sample of type "Bioprinted Plate", one per physical plate, carrying a
 *               native eLabNext barcode and linked to its Bioprint Template (see showRunDialog /
 *               createPlates). A print run creates no Experiment; the registry lives in shared
 *               Inventory, and a user's own experiments link to these plate samples afterwards.
 * Both types must exist in the tenant (created by an admin) with the required fields. The add-on finds
 * them by name at runtime (see resolveSampleTypeID); the CONFIG IDs below are optional overrides for
 * disambiguating duplicate-named types.
 *
 * Two API notes:
 * 1. eLabSDK.API.Call is a MooTools class, not a plain function: instantiate with `new` and send the
 *    request with .execute(body) (see apiCall). Called any other way it builds the request but never
 *    sends it.
 * 2. ".rastrum" files come in three shapes, all handled by parseRastrum: one "printrun.yaml"; a split
 *    inert-base + cell-model pair of "printrun_*.yaml" files (merged by mergeExtracted); and Allegro's
 *    "printplan.yaml" (extractAllegroDoc). An unrecognised file sets result.recognized = false and the
 *    UI warns instead of saving blank fields (see showProtocolDialog).
 */

var BioprintTracker = {};

(addon => {
  'use strict';

  // ─── Tenant configuration, set these for your eLabNext (SciSure) tenant ─────
  // Shown in the UI (menu title) to confirm which build is loaded and rule out a cached copy.
  const ADDON_VERSION = '1.1.0';

  // Must match @rootVar in src/header.js. Used to find this add-on's own installed record (and from
  // it, the sdkPluginID its configuration is stored against), see getInstalledAddon.
  const ROOT_VAR = 'BioprintTracker';

  const CONFIG = {
    // Both left at 0 by default, the add-on finds each type by its exact name ("Bioprint Template" /
    // "Bioprinted Plate") in whatever tenant it runs in (see resolveSampleTypeID), so no ID is needed
    // in the normal case. Setting an ID here (or via the add-on's Configuration screen) is an OPTIONAL
    // override, only useful to disambiguate a tenant that has duplicate-named types. Do NOT hardcode a
    // tenant-specific ID as the default, an ID that means "Bioprint Template" in one tenant could mean
    // nothing, or something unrelated, in another.
    SAMPLE_TYPE_PROTOCOL: 0,
    SAMPLE_TYPE_PLATE: 0,
    // Defensive guard against a maliciously crafted (zip-bomb) file.
    MAX_RASTRUM_BYTES: 25 * 1024 * 1024,
    // Optional: keep EVERY uploaded file (protocol PDF, raw .rastrum, wellplate CSV) in one Data
    // Storage folder instead of scattering them at the storage root, by its numeric folder ID.
    // Folders are referenced by ID because the API has NO list-folders / folder-by-name endpoint
    // (confirmed by eLabNext dev support 2026-07-24), a by-name convenience was tried and dropped as
    // unreliable (it depended on the undocumented file `path` and could silently fall back to root).
    // The file-storage UI is a single-page app, so the ID is NOT in the address bar; use the finder
    // (#bioprinting-setup) or the browser Network tab to read it. Folder IDs are stable; set once.
    // Leave 0 = upload to the storage root.
    PDF_FOLDER_ID: 0
  };

  // ─── HTML escaping, every dynamic value is escaped before it touches innerHTML ─
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  // ─── API helper ──────────────────────────────────────────────────────────────
  // A hard timeout turns a silently-hanging call (never firing onSuccess or onError) into a
  // visible error instead of the UI appearing to do nothing. See the file header for why
  // eLabSDK.API.Call needs `new` + .execute() rather than being called as a plain function.
  const API_TIMEOUT_MS = 15000;

  function apiCall(method, path, body, queryParams) {
    if (typeof eLabSDK === 'undefined' || !eLabSDK.API || !eLabSDK.API.Call) {
      return Promise.reject(new Error(
        'eLabSDK is not available on this page. The add-on must run on a page where add-ons are ' +
        'active (e.g. Inventory or an Experiment), not the marketplace/detail page.'));
    }
    const callPromise = new Promise((resolve, reject) => {
      // eLabSDK.API.Call is a MooTools Class: it must be instantiated with `new`, and the
      // request is only actually sent when .execute() is called with the body. Query parameters
      // MUST go in the queryParams object, not appended to path as a string, the SDK does not
      // parse a query string inside path, it silently drops it (this was the empty-dropdown bug).
      const config = {
        method,
        path,
        onSuccess(_xhr, _status, response) { resolve(response); },
        onError(_xhr, status, response) {
          reject(new Error(`eLabNext API error (${status}): ${response || ''}`));
        }
      };
      if (queryParams) config.queryParams = queryParams;
      new eLabSDK.API.Call(config).execute(body || undefined);
    });
    const timeout = new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`${method} ${path} did not respond within ${API_TIMEOUT_MS / 1000}s (no success or error callback fired).`));
      }, API_TIMEOUT_MS);
    });
    return Promise.race([callPromise, timeout]);
  }

  // ─── Read one sample: prefer eLabSDK2 where present, else eLabSDK.API.Call ─────
  // eLabSDK2 (BETA) exposes a single-sample read (eLabSDK2.Inventory.Sample.getSampleByID); it has
  // no create or list-by-type yet, so writes and listing stay on eLabSDK.API.Call. On an Inventory
  // Browser V2 page this uses the SDK2 read; everywhere else it falls back to the SDK1 GET. It
  // normalises either result to the shape callers expect, a top-level `barcode` and a `meta` array
  // of { key, value }, and, because SDK2 is BETA and its exact return shape is not guaranteed, only
  // trusts the SDK2 result when it actually carries both, otherwise falling back to the SDK1 GET
  // (which reliably returns both with $expand=meta).
  function normaliseSample(s) {
    if (!s || typeof s !== 'object') return s;
    if (!Array.isArray(s.meta)) {
      const m = s.sampleMetas || s.metas;
      if (Array.isArray(m)) s.meta = m;
    }
    return s;
  }

  function getSampleById(sampleID) {
    const v1 = () => apiCall('GET', `samples/${sampleID}`, null, { '$expand': 'meta' });
    try {
      if (typeof eLabSDK2 !== 'undefined' && eLabSDK2.Inventory && eLabSDK2.Inventory.Sample &&
        typeof eLabSDK2.Inventory.Sample.getSampleByID === 'function') {
        return Promise.resolve()
          // Request meta explicitly: SDK2 returns the meta array only with the expand filter (the
          // same reason V1 needs $expand=meta). Without it the guard below never sees a meta array,
          // so it always falls back and the SDK2 path is dead weight. The guard still falls back on
          // any unexpected shape, so asking for meta can only help.
          .then(() => eLabSDK2.Inventory.Sample.getSampleByID(sampleID, { expand: ['meta'] }))
          .then(s => {
            const n = normaliseSample(s);
            if (n && Array.isArray(n.meta) && ('barcode' in n)) return n;
            return v1();
          })
          .catch(() => v1());
      }
    } catch (e) { /* fall through to the SDK1 GET */ }
    return v1();
  }

  // Resolves a sample type ID: uses the configured numeric ID if set (fast, unambiguous, no extra
  // call, the normal case once an environment is configured), and only if it's unset (0) falls
  // back to looking up a type by exact name. The fallback fails LOUD, never guesses, on the two
  // ways that can go wrong: no type with that name, or more than one, duplicate-name collisions
  // are a real, observed failure mode in eLabNext tenants, not just a hypothetical to guard against.
  const resolvedTypeIdCache = {};
  function resolveSampleTypeID(configuredID, expectedName) {
    if (configuredID) return Promise.resolve(configuredID);
    if (resolvedTypeIdCache[expectedName]) return Promise.resolve(resolvedTypeIdCache[expectedName]);
    return apiCall('GET', 'sampleTypes').then(resp => {
      let list = resp;
      if (resp && Array.isArray(resp.data)) list = resp.data;
      else if (resp && Array.isArray(resp.items)) list = resp.items;
      else if (resp && Array.isArray(resp.results)) list = resp.results;
      if (!Array.isArray(list)) {
        throw new Error(`Could not read the tenant's sample types to find "${expectedName}".`);
      }
      const matches = list.filter(t => String(t.name || '').trim().toLowerCase() === expectedName.toLowerCase());
      if (matches.length === 0) {
        // Name matching is exact (case/edge-whitespace aside), so the usual cause is a typo or a
        // pluralised name. We already have the full list here, so point at the near-misses instead of
        // a dead end: normalise both sides (strip case and every non-alphanumeric) and surface any
        // existing name that equals or contains/overlaps the wanted one, e.g. "Bioprint Templates".
        const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const wanted = normalize(expectedName);
        const near = list.map(t => String(t.name || '')).filter(n => {
          const x = normalize(n);
          return x && (x === wanted || x.indexOf(wanted) !== -1 || wanted.indexOf(x) !== -1);
        });
        const hint = near.length
          ? ` The closest existing name${near.length > 1 ? 's are' : ' is'} "${near.join('", "')}" — most likely one of these just needs renaming to exactly "${expectedName}".`
          : '';
        throw new Error(`This tenant is not set up for Bioprint Tracker yet: no sample type named "${expectedName}" exists.${hint} Ask your eLab administrator to create it (or rename the existing one) in Inventory settings, with that exact name and the required fields.`);
      }
      if (matches.length > 1) {
        throw new Error(`There is more than one sample type named "${expectedName}" in this tenant, so the add-on cannot tell which to use. Ask your eLab administrator to rename them so only one is called exactly "${expectedName}".`);
      }
      const id = matches[0].sampleTypeID != null ? matches[0].sampleTypeID : matches[0].id;
      resolvedTypeIdCache[expectedName] = id;
      return id;
    });
  }

  // ─── One-time tenant setup: create the two sample types + their fields (admin-only) ──
  // DRAFTED 2026-07-24 on eLabNext dev support's confirmation that sample-type mutations use the
  // `/sampleTypes` endpoints (POST /sampleTypes, then POST /sampleTypes/{id}/meta per field). This
  // removes the manual admin step of hand-building the two types. It is NOT wired into the everyday
  // create path, it runs only when an admin explicitly triggers addon.setupSampleTypes() (see the
  // #bioprinting-setup-types entry). ADMIN CHECK: there is NO client-side role API, the assumed
  // `eLabSDK.User.getUserRole()` does not exist on the tenant (confirmed 2026-07-24, threw
  // "not a function"). So we do NOT pre-check the role; instead we attempt creation and let the
  // server decide, creating a sample type is server-enforced admin-only, returning 403 Forbidden for
  // a non-admin (documented). A 403 is turned into a clear "needs an admin account" message (see
  // isForbidden / setupSampleTypes). VERIFIED WORKING on the tenant (2026-07-24): an admin run created
  // Bioprint Template (20 fields) and Bioprinted Plate (13 fields), so POST /sampleTypes returns a usable
  // ID and the per-field POSTs behave as documented.
  //
  // This declarative list is the single source of truth for what a correctly-configured tenant looks
  // like. KEEP IT IN SYNC with the metaField/metaFile/metaLink calls in the two create flows
  // (showProtocolDialog's `metas` and buildRunPlateSpecs), same key spelling, same sampleDataType.
  const REQUIRED_SAMPLE_TYPE_FIELDS = {
    'Bioprint Template': [
      { key: 'Printer version', type: 'TEXT' },
      { key: 'Print model', type: 'TEXT' },
      { key: 'Matrix code', type: 'TEXT' },
      { key: 'Cell line', type: 'TEXT' },
      { key: 'Cell concentration (cells/mL)', type: 'TEXT' },
      { key: 'Wellplate', type: 'TEXT' },
      { key: 'Bioink', type: 'TEXT' },
      { key: 'Activator', type: 'TEXT' },
      { key: 'Inert base bioink', type: 'TEXT' },
      { key: 'Inert base activator', type: 'TEXT' },
      { key: 'Bioink pressure (kPa)', type: 'NUMERIC' },
      { key: 'Bioink open time (us)', type: 'NUMERIC' },
      { key: 'Activator pressure (kPa)', type: 'NUMERIC' },
      { key: 'Activator open time (us)', type: 'NUMERIC' },
      { key: 'RASTRUM schema version', type: 'TEXT' },
      { key: 'Source file hash', type: 'TEXT' },
      { key: 'Protocol PDF', type: 'FILE' },
      { key: 'Wellplate summary (CSV)', type: 'FILE' },
      { key: 'Designed plates (JSON)', type: 'TEXT' },
      { key: 'Print file', type: 'FILE' }
    ],
    'Bioprinted Plate': [
      { key: 'Bioprint Template', type: 'SAMPLELINK' },
      { key: 'Cell line', type: 'TEXT' },
      { key: 'Cell concentration (cells/mL)', type: 'TEXT' },
      { key: 'Printer', type: 'TEXT' },
      { key: 'Print date', type: 'DATE' },
      { key: 'Print run ID', type: 'TEXT' },
      { key: 'Bioink lot', type: 'TEXT' },
      { key: 'Activator lot', type: 'TEXT' },
      { key: 'Matrix code', type: 'TEXT' },
      { key: 'Wellplate', type: 'TEXT' },
      { key: 'Passage number', type: 'TEXT' },
      { key: 'Plate', type: 'TEXT' },
      { key: 'Inert base print date', type: 'DATE' }
    ]
  };

  // Does an API error look like a permission denial? apiCall formats errors as
  // "eLabNext API error (<status>): ...", so a 403 (or a 401) means the account lacks permission -
  // for sample-type creation that means "not an admin". Used to turn the server's own enforcement
  // into a clear message instead of a raw error.
  function isForbidden(err) {
    return /\((?:401|403)\)/.test(String((err && err.message) || err || ''));
  }

  // One-line descriptions set on each type at creation, so a user browsing Inventory can tell the two
  // apart and see how they relate. This is the main defence against template/plate confusion. (Colours
  // would help too, but the accepted colour-value format is undocumented, see docs/.record/future-ideas.md.)
  const REQUIRED_SAMPLE_TYPE_DESCRIPTIONS = {
    'Bioprint Template': 'The reusable print protocol imported from a .rastrum file. Each print run creates Bioprinted Plate records linked to one of these.',
    'Bioprinted Plate': 'One physical printed plate, barcoded, linked back to its Bioprint Template.'
  };

  // Create one sample type and add its fields. POST /sampleTypes returns the new sampleTypeID; fields
  // are added sequentially (POST /sampleTypes/{id}/meta) so a failure names the field that broke.
  // `description` (optional) is set on the type so browsing users can tell the two types apart.
  function createSampleTypeWithFields(name, fields, description) {
    return apiCall('POST', 'sampleTypes', description ? { name, description } : { name }).then(resp => {
      const typeID = (resp && resp.sampleTypeID != null) ? resp.sampleTypeID :
        (resp && resp.data != null ? resp.data : resp);
      if (typeID == null || typeID === '') {
        throw new Error(`Sample type "${name}" was created but no ID came back.`);
      }
      return addFieldsToType(typeID, fields).then(() => ({
        name,
        typeID,
        fieldCount: (fields || []).length
      }));
    });
  }

  // Add fields to an existing sample type, one at a time (POST /sampleTypes/{id}/meta) so a failure
  // names the field that broke. Adding a field is non-destructive: it never touches existing fields or
  // data. Used both when creating a type and when topping up a type that is missing fields.
  function addFieldsToType(typeID, fields) {
    let chain = Promise.resolve();
    (fields || []).forEach(f => {
      chain = chain.then(() => apiCall('POST', `sampleTypes/${typeID}/meta`,
        { key: f.key, sampleDataType: f.type }));
    });
    return chain;
  }

  // eLabNext's own words for a field's data type, for plain-language messages (the raw API values are
  // ALL-CAPS codes like NUMERIC/SAMPLELINK that mean nothing to a user).
  function prettyType(t) {
    const m = { TEXT: 'Text', TEXTAREA: 'Text area', NUMERIC: 'Number', DATE: 'Date',
      DATETIME: 'Date & time', FILE: 'File', SAMPLELINK: 'Sample link', PROJECT: 'Project',
      CHEMICAL: 'Chemical', COMBO: 'Dropdown', RADIO: 'Single choice', CHECKBOX: 'Checkboxes' };
    return m[String(t == null ? '' : t).toUpperCase()] || String(t == null ? '' : t);
  }
  // Read-only: compare a sample type's LIVE fields (a key→{sampleDataType} map from
  // getSampleTypeMetaMap) against the fields we require, and report what is missing or the wrong type.
  // Returns {readFailed:true} if the map could not be read (so "can't check" isn't mistaken for "all
  // missing"), else {missing:[keys], mismatched:[{key,expected,got}], ok:<count of correct fields>}.
  function checkTypeFields(map, requiredFields) {
    if (!map) return { readFailed: true };
    const missing = [], mismatched = [];
    (requiredFields || []).forEach(f => {
      const hit = map[String(f.key == null ? '' : f.key).trim().toLowerCase()];
      if (!hit) { missing.push(f.key); return; }
      if (hit.sampleDataType && f.type &&
          String(hit.sampleDataType).toUpperCase() !== String(f.type).toUpperCase()) {
        mismatched.push({ key: f.key, expected: f.type, got: hit.sampleDataType });
      }
    });
    return { missing, mismatched,
      ok: (requiredFields || []).length - missing.length - mismatched.length };
  }

  function metaField(key, type, value) {
    return { key, sampleDataType: type, value: value == null ? '' : String(value) };
  }
  function metaLink(key, sampleID) {
    return { key, sampleDataType: 'SAMPLELINK', sampleIDs: [sampleID] };
  }
  // The docs only confirm the READ shape for a FILE field (`files: [{fileID, name, realName}]`);
  // the write/create shape is unconfirmed and may differ, as is common for REST APIs (write often
  // takes bare IDs where read returns full objects). Sending both a `files` object array and a
  // flat `fileIDs` array is a cheap hedge, an unrecognised key is normally just ignored, until
  // the real write shape is confirmed via the tenant's own API reference.
  function metaFile(key, fileID) {
    return { key, sampleDataType: 'FILE', files: [{ fileID }], fileIDs: [fileID] };
  }

  // ─── Stable meta-field IDs (sampleTypeMetaID), robust writes ─────────────────
  // eLabNext dev support (2026-07-24) confirmed the recommended write flow: read each field's stable
  // sampleTypeMetaID from GET /sampleTypes/{id}/meta, then send it on the sample's meta so the value
  // matches by ID, not by display name. Two benefits over the by-name path: it survives a field being
  // renamed, and per the createSampleMeta docs a value written WITHOUT a sampleTypeMetaID is "not
  // searchable". The write schema (SampleMetaNew) does NOT list sampleTypeMetaID, but dev support said
  // the doc rendering is wrong and the server honours it, and an unrecognised key is ignored anyway,
  // so sending it is safe. This stays OPPORTUNISTIC: if the map can't be read, or a key isn't in it,
  // the entry is left exactly as before (by-name), and the $expand=meta read-back guard still catches a
  // genuine mismatch. VERIFY on the tenant that ID-matched values actually persist.
  const sampleTypeMetaMapCache = {};
  function getSampleTypeMetaMap(typeID, force) {
    if (!typeID) return Promise.resolve(null);
    // `force` re-reads from the server (used after setup adds fields, so the cached map isn't stale).
    if (!force && sampleTypeMetaMapCache[typeID]) return Promise.resolve(sampleTypeMetaMapCache[typeID]);
    // $records: 1000 because list endpoints paginate at 10 by default, a type has more fields than
    // that, so without it the tail of the field list (hence its IDs) would silently be missing.
    return apiCall('GET', `sampleTypes/${typeID}/meta`, null, { '$records': 1000 })
      .then(resp => {
        const list = (resp && Array.isArray(resp.data)) ? resp.data : (Array.isArray(resp) ? resp : []);
        // Prototype-less map: field names come from tenant field definitions and are used as keys, so
        // a field literally named "__proto__" can't reassign this map's prototype (defensive; low risk).
        const map = Object.create(null);
        list.forEach(d => {
          if (d && d.key != null && d.sampleTypeMetaID != null) {
            map[String(d.key).trim().toLowerCase()] =
              { sampleTypeMetaID: d.sampleTypeMetaID, sampleDataType: d.sampleDataType };
          }
        });
        sampleTypeMetaMapCache[typeID] = map;
        return map;
      })
      .catch(() => null); // fall back to by-name writes
  }
  // Tag each meta entry with its field's sampleTypeMetaID where the key matches (case/whitespace
  // insensitive). Non-destructive: entries with no match, or when map is null, are left untouched.
  function stampMetaIDs(metas, map) {
    if (!map || !metas) return metas;
    metas.forEach(m => {
      if (!m || m.sampleTypeMetaID != null) return;
      const hit = map[String(m.key == null ? '' : m.key).trim().toLowerCase()];
      if (hit && hit.sampleTypeMetaID != null) m.sampleTypeMetaID = hit.sampleTypeMetaID;
    });
    return metas;
  }

  // Uploads a file and returns its fileID, for use in a FILE-type sampleMetas entry (see metaFile).
  // MIME type comes from the file extension. The eLabNext file-upload docs require a Content-Type
  // header matching the file. Without it the stored file is a generic blob that will not open as a
  // PDF or CSV. The body must be RAW BINARY. Converting it to a string first silently corrupts it.
  function contentTypeFor(fileName) {
    const n = String(fileName).toLowerCase();
    if (n.slice(-4) === '.pdf') return 'application/pdf';
    if (n.slice(-4) === '.csv') return 'text/csv';
    if (n.slice(-4) === '.svg') return 'image/svg+xml';
    if (n.slice(-4) === '.png') return 'image/png';
    return 'application/octet-stream';
  }
  // POST /api/v1/files takes the file as a RAW BINARY body (not JSON, not multipart), a shape
  // eLabSDK.API.Call isn't built for, so this goes through fetch() on the same session instead.
  // Best-effort: callers should treat a rejection here as "attach the file failed", not as a
  // reason to abort the whole save, the record is still valid without the attachment.
  // Waits for the stored configuration before uploading, so an upload started right after page load
  // still gets the configured folder. Folder placement is set at upload and cannot be changed later
  // (there is no move endpoint), so losing this race would strand the file at the storage root.
  function uploadFile(fileName, arrayBuffer) {
    return configReady.then(() => uploadFileNow(fileName, arrayBuffer));
  }

  function uploadFileNow(fileName, arrayBuffer) {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, API_TIMEOUT_MS);
    const url = `/api/v1/files?fileName=${encodeURIComponent(fileName)}${CONFIG.PDF_FOLDER_ID ? `&folderID=${encodeURIComponent(CONFIG.PDF_FOLDER_ID)}` : ''}`;
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': contentTypeFor(fileName), 'X-Requested-With': 'XMLHttpRequest' },
      body: arrayBuffer,
      signal: controller.signal
    }).then(resp => {
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`File upload failed (${resp.status})`);
      return resp.json();
    }).then(json => {
      if (!json || json.fileID == null) throw new Error('File upload response had no fileID');
      return json.fileID;
    }).catch(err => {
      clearTimeout(timeout);
      throw err;
    });
  }

  // Download a file's raw bytes by fileID (the reverse of uploadFile; plain fetch, session-cookie
  // auth, same shape the round-trip check confirmed). Returns the ArrayBuffer, e.g. to re-parse a
  // .rastrum attached to a protocol.
  function fetchFileBytes(fileID) {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, API_TIMEOUT_MS);
    return fetch(`/api/v1/files/${encodeURIComponent(fileID)}`, {
      method: 'GET', credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal
    }).then(resp => {
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`File download failed (${resp.status})`);
      return resp.arrayBuffer();
    }).catch(err => { clearTimeout(timeout); throw err; });
  }

  // List files in the group (GET /api/v1/files), same session-cookie fetch as the up/download calls.
  // Used only by the folder-ID finder (a setup helper): the response carries each file's `folderID`
  // and `path`, which is the ONLY way to surface a Data Storage folder's ID, the API has no
  // list-folders endpoint. Handles both a bare array and a {data:[...]} paged envelope.
  function listFiles() {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, API_TIMEOUT_MS);
    return fetch('/api/v1/files', {
      method: 'GET', credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal
    }).then(resp => {
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`File list failed (${resp.status})`);
      return resp.json();
    }).then(json => Array.isArray(json) ? json : ((json && (json.data || json.files)) || [])).catch(err => { clearTimeout(timeout); throw err; });
  }

  // ─── The add-on's own stored configuration ────────────────────────────────────
  // The Developer Platform's Configure dialog is only ONE route into this store. The same values are
  // readable and writable over the API, and nothing stops the add-on using that route on itself:
  //   GET  /api/v1/addons/{sdkPluginID}/configuration   read  (returns the stored JSON as a STRING)
  //   PUT  /api/v1/addons/configuration                 write ({configuration, sdkPluginID, scope})
  // This matters because the Configure dialog rendered EMPTY in a production tenant while rendering
  // correctly in the sandbox (2026-07-31), leaving no way to set the file folder. Writing the value
  // from inside the add-on removes that dependency: setup finishes in the folder finder itself.
  // It is not a way around permissions. Both routes write the same value under the same rules, so a
  // user who may not edit the install's configuration gets a 403 here too, just with a clear message.
  const CONFIG_SCOPES = ['USER', 'GROUP', 'INSTITUTE', 'SYSTEM'];

  // This add-on's installed record, which is the only source of the sdkPluginID its configuration is
  // keyed by. Cached on success only: a failure (e.g. side-loaded, so there is no installed record)
  // must stay retryable rather than poisoning every later call.
  let installedAddonPromise = null;
  function getInstalledAddon() {
    if (installedAddonPromise) return installedAddonPromise;
    const p = apiCall('GET', 'addons/installed', null, { rootVar: ROOT_VAR, '$records': 100 })
      .then(resp => {
        const list = (resp && Array.isArray(resp.data)) ? resp.data : (Array.isArray(resp) ? resp : []);
        const mine = list.filter(a => a && String(a.rootVar || '').trim() === ROOT_VAR);
        if (!mine.length) {
          throw new Error(
            'This add-on does not appear as installed in this environment, so its settings cannot be ' +
            'saved from here. That is expected while side-loading. Note the folder number and set it ' +
            'in the add-on’s Configure screen instead.');
        }
        // An add-on can be installed at more than one scope; prefer an active record over an inactive
        // one, otherwise keep the order the API returned.
        const active = mine.filter(a => a.active !== false);
        return (active.length ? active : mine)[0];
      });
    p.catch(() => { installedAddonPromise = null; });
    installedAddonPromise = p;
    return p;
  }

  // The stored configuration comes back as a JSON STRING, per the reference. Tolerate the shapes a
  // gateway might hand back instead (an already-parsed object, or one wrapped in a {configuration}
  // envelope) rather than assuming one and failing opaquely. Anything unreadable means "nothing
  // configured", never a thrown error, since a missing configuration is a normal first-run state.
  function normaliseStoredConfig(raw) {
    if (raw == null || raw === '') return {};
    if (typeof raw === 'object') {
      if (raw.configuration != null) return normaliseStoredConfig(raw.configuration);
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function readStoredConfig() {
    return getInstalledAddon().then(a =>
      apiCall('GET', `addons/${encodeURIComponent(a.sdkPluginID)}/configuration`)
        .then(normaliseStoredConfig));
  }

  // Merge `patch` into whatever is already stored and write the whole object back. The endpoint
  // replaces the configuration wholesale, so writing only the changed key would silently discard
  // every other setting. A read that fails is treated as "nothing stored yet" so a first write can
  // still succeed; a read that succeeds is preserved in full.
  function saveStoredConfig(patch) {
    return getInstalledAddon().then(a => {
      const declared = String(a.scope || '').toUpperCase();
      // Write at the scope the add-on is installed at, so the value is read back by the same
      // resolution that served it. Fall back to GROUP (this add-on's sample types are per-group, so
      // that is the level its settings belong to) if the record carries no usable scope.
      const scope = CONFIG_SCOPES.indexOf(declared) !== -1 ? declared : 'GROUP';
      return apiCall('GET', `addons/${encodeURIComponent(a.sdkPluginID)}/configuration`)
        .then(normaliseStoredConfig, () => ({}))
        .then(current => {
          const merged = Object.assign({}, current, patch);
          return apiCall('PUT', 'addons/configuration', {
            configuration: JSON.stringify(merged),
            sdkPluginID: a.sdkPluginID,
            scope
          }).then(() => merged);
        });
    });
  }

  // Apply a configuration object (from either route) onto the live CONFIG block.
  function applyConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    if (cfg.sampleTypeProtocol) CONFIG.SAMPLE_TYPE_PROTOCOL = cfg.sampleTypeProtocol;
    if (cfg.sampleTypePlate) CONFIG.SAMPLE_TYPE_PLATE = cfg.sampleTypePlate;
    // Explicit 0 / '' is meaningful here: it means "the main file area", so only an absent value is
    // ignored. A non-numeric value is treated as unset rather than silently becoming NaN.
    if (cfg.pdfFolderID != null && cfg.pdfFolderID !== '') {
      CONFIG.PDF_FOLDER_ID = Number(cfg.pdfFolderID) || 0;
    }
  }

  // Resolves once the stored configuration has been applied (or has failed, which is not fatal).
  // uploadFile waits on it so a file uploaded moments after page load still lands in the configured
  // folder rather than at the storage root. Placement cannot be corrected afterwards: the API has no
  // move endpoint and folderID is only accepted at upload, so a race here is a permanent mistake.
  let configReady = Promise.resolve();

  // ─── .rastrum parser, runs entirely in the browser (JSZip + js-yaml are inlined) ─
  function sha256Hex(buf) {
    return crypto.subtle.digest('SHA-256', buf).then(h => Array.prototype.map.call(new Uint8Array(h), b => (`0${b.toString(16)}`).slice(-2)).join(''));
  }

  // RASTRUM classic/v2 schema (PascalCase: PrintJobParams/PrintFluids/PrimingGroup/...).
  // Works whether the run's inert base was printed combined (one printrun.yaml) or separately
  // (printrun_cell_model_only.yaml + printrun_inert_base_only.yaml), each file only has the
  // fields for its own phase; mergeExtracted() below combines them.
  function extractRastrumDoc(data) {
    const params = data.PrintJobParams || {};
    const fluids = {};
    (params.PrintFluids || []).forEach(f => { fluids[f.Fluid] = f; });
    const vals = Object.keys(fluids).map(k => fluids[k]);
    const byGroup = g => vals.filter(f => f.PrimingGroup === g);
    const cellFluid = byGroup('Cells')[0];
    const bioinkFluid = byGroup('Bioinks')[0];
    const inert = byGroup('Inert Base');
    const activatorList = inert.filter(f => f.CleaningFluidType === 'CellFluid');
    const bioinkBaseList = inert.filter(f => f.CleaningFluidType === 'NormalFluid');
    const activator = activatorList[0];
    const bioinkBase = bioinkBaseList[0];
    // A run can use several cell/bioink fluids (e.g. one plate, several cell lines). Show the DISTINCT
    // set, not just the first. Join with ' · ' because classic fluid NAMES embed commas
    // ("F176 - Cell A, 2,000,000/mL"), which a comma separator would collide with.
    function distinctFluids(list) {
      const out = [];
      (list || []).forEach(f => { const n = f && f.Fluid; if (n && out.indexOf(n) === -1) out.push(n); });
      return out.join(' · ');
    }

    const maps = params.PrintWellModelMaps || [];
    const cellMap = maps.filter(m => {
      if (!cellFluid) return false;
      const mc = m.MaterialsConfig || {};
      return Object.keys(mc).some(k => (mc[k] || []).some(mat => mat.Name === cellFluid.Fluid));
    })[0];

    const wc = params.WellplateConfigs || {};
    let wellplate = wc.Default || wc.WP011;
    if (!wellplate) {
      const k = Object.keys(wc).filter(x => x !== 'Target Plate')[0];
      wellplate = (k && wc[k]) || null;
    }

    const variantGroups = {};
    (params.PrintingParameterVariantGroups || []).forEach(g => { variantGroups[g.Name] = g; });
    function printParams(fluidName) {
      if (!fluidName) return {};
      for (let i = 0; i < maps.length; i++) {
        const mc = maps[i].MaterialsConfig || {};
        const keys = Object.keys(mc);
        for (let j = 0; j < keys.length; j++) {
          const mats = mc[keys[j]] || [];
          for (let m = 0; m < mats.length; m++) {
            if (mats[m].Name === fluidName) {
              const g = variantGroups[mats[m].PrintingParameterVariantGroupName] || {};
              return (g.Variants || [])[0] || {};
            }
          }
        }
      }
      return {};
    }

    // The classic schema doesn't give a product name/catalog number, but it does give the
    // manufacturer and well count, which is enough to tell plates apart at a glance.
    let wellplateDescription = '';
    if (wellplate && wellplate.RowCount && wellplate.ColCount) {
      wellplateDescription = `${(wellplate.Make ? `${String(wellplate.Make).trim()} ` : '') +
  (wellplate.RowCount * wellplate.ColCount)}-well`;
    }

    // Classic files embed the cell line and concentration inside the cell fluid's NAME, e.g.
    // "F176 - Cell A, 2,000,000/mL". Pull them out. This format carries no matrix (Px) code, so
    // matrix_codes stays empty here rather than being invented (confirmed against real files).
    let cellLine = '', cellConc = '';
    if (cellFluid && cellFluid.Fluid) {
      const mCell = String(cellFluid.Fluid).match(/-\s*(.+?),\s*([\d,]+)\s*\/\s*mL/i);
      if (mCell) { cellLine = mCell[1].trim(); cellConc = mCell[2].replace(/,/g, ''); }
    }

    return {
      print_model: (cellMap && cellMap.PrintWellModelName) || '',
      wellplate: (wellplate && wellplate.Name) || '',
      wellplate_description: wellplateDescription,
      wellplate_display: wellplateDescription || (wellplate && wellplate.Name) || '',
      cell_line: cellLine,
      cell_concentration: cellConc,
      matrix_codes: '',
      fluid_bioink: distinctFluids(byGroup('Bioinks')) || (bioinkFluid && bioinkFluid.Fluid) || '',
      fluid_cell: distinctFluids(byGroup('Cells')) || (cellFluid && cellFluid.Fluid) || '',
      fluid_activator: distinctFluids(activatorList) || (activator && activator.Fluid) || '',
      fluid_bioink_base: distinctFluids(bioinkBaseList) || (bioinkBase && bioinkBase.Fluid) || '',
      pp_bioink: printParams(bioinkFluid && bioinkFluid.Fluid),
      pp_cell: printParams(cellFluid && cellFluid.Fluid)
    };
  }

  // Allegro schema (snake_case: outcomes/resources/matrix_conditions_by_ref_code/...). Structurally
  // different from RASTRUM: cells are embedded (CellContents) on whichever fluid carries them,
  // rather than being their own fluid entry, and print pressure/time are resolved via the model's
  // NominalDropVolumeByFluidSlot + the fluid's PrintingParameterGroupNameBase.
  // Human wellplate name for an Allegro plate code, from the file's own catalog (manufacturer +
  // description + catalog number). Shared by the protocol summary and the per-plate designed-plate list.
  function allegroPlateName(resources, code) {
    const cat = ((resources || {}).compatible_wellplates || {})[code] || {};
    const make = String(cat.make || '').trim();
    const desc = String(cat.description || cat.model || '').trim();
    // The catalog description sometimes already starts with the manufacturer name; don't repeat it.
    const name = (desc && make && desc.toLowerCase().indexOf(make.toLowerCase()) === 0)
      ? desc : [make, desc].filter(Boolean).join(' ');
    return [name, cat.catalog_num ? `(#${cat.catalog_num})` : ''].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function extractAllegroDoc(data) {
    const outcomes = data.outcomes || {};
    const resources = data.resources || {};
    const models = outcomes.model_configuration_by_model_name || {};
    const modelList = Object.keys(models).map(k => models[k]);
    // Prefer the model with an architecture name set (the actual print model, not the plain
    // inert-base template that has none).
    const printModel = modelList.filter(m => m.ModelArchitectureName)[0] || modelList[0] || {};

    const wellplateEntry = (outcomes.wellplates || [])[0] || {};
    const matrixConds = outcomes.matrix_conditions_by_ref_code || {};
    const compartmentRefs = printModel.MatrixConditionRefsByCompartment || {};
    const defaultRef = compartmentRefs.Default ||
      Object.keys(compartmentRefs).map(k => compartmentRefs[k])[0];
    const cond = matrixConds[defaultRef] || {};

    const inertCond = matrixConds[wellplateEntry.inert_base_matrix_condition_ref] || {};

    const templates = resources.model_templates_by_code || {};
    const nominalVol = (templates[printModel.ModelTemplateCode] || {}).NominalDropVolumeByFluidSlot || {};
    const variantGroups = {};
    (resources.printing_parameter_variant_groups || []).forEach(g => { variantGroups[g.name] = g; });
    const fluidSpecs = resources.fluid_specs_by_name || {};

    function fcode(c, slot) { return c && c[slot] ? c[slot].FCode : ''; }
    function paramsFor(code, slot) {
      const spec = code && fluidSpecs[code];
      const vol = nominalVol[slot];
      if (!spec || !spec.PrintingParameterGroupNameBase || vol == null) return {};
      const group = variantGroups[`${spec.PrintingParameterGroupNameBase}-${vol}nl`];
      const v = group && group.variants && group.variants[0];
      return v ? { Pressure: v.printing_pressure, OpenTime: v.printing_open_time, OpenTimeUnits: 'us' } : {};
    }

    const bioinkCode = fcode(cond, 'BioinkFluid');
    const cellCode = fcode(cond, 'ActivatorFluid'); // in this schema, cells ride on the activator fluid

    // Allegro's resources list a full catalog entry per plate code. Build a CONCISE human name per
    // DISTINCT plate, a run can print onto more than one plate type, dropping the long marketing
    // suffix after the first comma/parenthesis so the overview stays readable. (The per-plate wizard
    // names each plate separately via allegroPlateName in buildDesignedPlates.)
    const catalogs = resources.compatible_wellplates || {};
    function plateNameFor(code) {
      const pc = catalogs[code] || {};
      const make = String(pc.make || '').trim();
      const desc = String(pc.description || pc.model || '').trim().split(/\s*[,(]/)[0].trim();
      const nm = (desc && make && desc.toLowerCase().indexOf(make.toLowerCase()) === 0)
        ? desc : [make, desc].filter(Boolean).join(' ');
      return [nm, pc.catalog_num ? `(#${pc.catalog_num})` : '']
        .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    const plateCodes = [];
    (outcomes.wellplates || []).forEach(w => {
      const c = w.wellplate_model_code;
      if (c && plateCodes.indexOf(c) === -1) plateCodes.push(c);
    });
    if (!plateCodes.length && wellplateEntry.wellplate_model_code) plateCodes.push(wellplateEntry.wellplate_model_code);
    const wellplateCode = plateCodes.join(', ');
    const wellplateDescription = plateCodes.map(plateNameFor).filter(Boolean).join('  ·  ');

    // Cell lines, concentrations, matrix (Px) codes AND fluids come from the matrix conditions. A
    // multi-matrix model has several conditions, each with its own bioink/activator fluid, so collect
    // the DISTINCT set of each, not just the default condition's (the earlier single-value bug). Cell
    // conditions (those carrying cells) feed the cell fluids; conditions with no cells are the inert
    // base and feed the inert fluids.
    function addTo(arr, v) { if (v && arr.indexOf(v) === -1) arr.push(v); }
    const cellNames = [], cellConcs = [], cellMatrixCodes = [];
    const bioinkCodes = [], cellFluidCodes = [], inertBioinkCodes = [], inertActivatorCodes = [];
    Object.keys(matrixConds).forEach(ref => {
      const c = matrixConds[ref] || {};
      const contents = (c.ActivatorFluid && c.ActivatorFluid.CellContents) || [];
      if (contents && contents.length) {
        addTo(cellMatrixCodes, c.MatrixCode);
        contents.forEach(cc => {
          addTo(cellNames, cc.CellName);
          if (cc.CellsPerMl != null) addTo(cellConcs, cc.CellsPerMl);
        });
        addTo(bioinkCodes, fcode(c, 'BioinkFluid'));
        addTo(cellFluidCodes, fcode(c, 'ActivatorFluid'));
      } else {
        addTo(inertBioinkCodes, fcode(c, 'BioinkFluid'));
        addTo(inertActivatorCodes, fcode(c, 'ActivatorFluid'));
      }
    });

    return {
      print_model: printModel.ModelName || '',
      wellplate: wellplateCode,
      wellplate_description: wellplateDescription,
      wellplate_display: wellplateDescription || wellplateCode,
      cell_line: cellNames.join(', '),
      cell_concentration: cellConcs.join(', '),
      matrix_codes: cellMatrixCodes.join(', '),
      // Distinct fluid set across all matrix conditions (fall back to the default condition's if the
      // per-condition scan somehow found none), so a multi-matrix model lists every bioink/activator.
      fluid_bioink: bioinkCodes.join(', ') || bioinkCode,
      fluid_cell: cellFluidCodes.join(', ') || cellCode,
      fluid_activator: inertActivatorCodes.join(', ') || fcode(inertCond, 'ActivatorFluid'),
      fluid_bioink_base: inertBioinkCodes.join(', ') || fcode(inertCond, 'BioinkFluid'),
      pp_bioink: paramsFor(bioinkCode, 'bioink'),
      pp_cell: paramsFor(cellCode, 'activator')
    };
  }

  // Full well-by-well summary for Allegro files (outcomes.platemaps_by_plate maps well ranges to a
  // model + "variant" name; a plate can use more than one model, e.g. an imaging model on some
  // wells and a multi-compartment "triple matrix" model on others). extractAllegroDoc() above only
  // reports the FIRST model, this covers every well range on every model.
  //
  // Verified against a real multi-model file with three compartments (Left/Middle/Right): variant
  // names don't always match a compartment key directly (e.g. "Left_3DControl" for compartment
  // "Left"), so resolution tries, in order: (1) an exact match, (2) the compartment whose key the
  // variant name starts with (grounded in the model template's own declared variant list, e.g.
  // "ThreeDControlVariants: [Left_3DControl, ...]"), (3) if the model has only one compartment, that
  // one regardless of the variant's name, (4) if the variant is literally "Default" and the model
  // has more than one compartment, ALL of them combined (a well can genuinely contain more than one
  // matrix, that's what a "triple matrix" well is). Anything else is reported as unresolved rather
  // than guessed.
  function resolveMatrixRefsForVariant(compartmentRefs, variantName) {
    const keys = Object.keys(compartmentRefs);
    if (compartmentRefs[variantName] != null) {
      return { refs: [compartmentRefs[variantName]], resolvedVia: 'exact' };
    }
    const prefixMatches = keys.filter(k => variantName.indexOf(k) === 0)
      .sort((a, b) => b.length - a.length);
    if (prefixMatches.length) {
      return { refs: [compartmentRefs[prefixMatches[0]]], resolvedVia: `prefix match (${prefixMatches[0]})` };
    }
    if (keys.length === 1) {
      return { refs: [compartmentRefs[keys[0]]], resolvedVia: `only compartment (${keys[0]})` };
    }
    if (variantName === 'Default' && keys.length > 1) {
      return { refs: keys.map(k => compartmentRefs[k]),
        resolvedVia: `all compartments (${keys.join('+')})` };
    }
    return { refs: [], resolvedVia: 'UNRESOLVED' };
  }

  function buildAllegroWellplateRows(data) {
    const outcomes = data.outcomes || {};
    const models = outcomes.model_configuration_by_model_name || {};
    const matrixConds = outcomes.matrix_conditions_by_ref_code || {};
    const platemaps = outcomes.platemaps_by_plate || {};
    function codeFor(ref) { const c = matrixConds[ref] || {}; return c.MatrixCode || ref; }
    // Each cell carries its own concentration (CellsPerMl), so keep them paired, a plate can hold
    // more than one cell line at more than one concentration.
    function cellPairsFor(ref) {
      const cc = ((matrixConds[ref] || {}).ActivatorFluid || {}).CellContents || [];
      return cc.filter(x => x.CellName)
        .map(x => ({
        name: x.CellName,
        conc: x.CellsPerMl
      }));
    }
    const rows = [];
    Object.keys(platemaps).forEach(plateName => {
      const modelsOnPlate = platemaps[plateName] || {};
      Object.keys(modelsOnPlate).forEach(modelName => {
        const model = models[modelName] || {};
        const compartmentRefs = model.MatrixConditionRefsByCompartment || {};
        (modelsOnPlate[modelName] || []).forEach(entry => {
          const wellRange = entry[0], variantName = entry[1];
          const r = resolveMatrixRefsForVariant(compartmentRefs, variantName);
          const pairs = [], seen = {}, names = [];
          r.refs.forEach(ref => {
            cellPairsFor(ref).forEach(p => {
              const k = `${p.name}@${p.conc}`;
              if (!seen[k]) { seen[k] = true; pairs.push(p); }
              if (names.indexOf(p.name) === -1) names.push(p.name);
            });
          });
          rows.push({
            plate: plateName, wellRange, wells: `${wellRange[0]}-${wellRange[1]}`, model: modelName,
            variant: variantName, matrix_codes: r.refs.map(codeFor).join(' + '),
            cells: names.join(', '), cell_pairs: pairs, resolved_via: r.resolvedVia
          });
        });
      });
    });
    return rows;
  }

  // The classic RASTRUM well layout lives in PrintWellModelMaps[].Actions[].P.VariantsInWells
  // (each entry is [ [startWell, endWell], variantName ]). There are no matrix (Px) codes in this
  // format, so matrix_codes stays empty. The inert-base map (fluids all in the "Inert Base" priming
  // group) is skipped, to match the Allegro well map which shows only the placed cell models.
  function buildRastrumWellplateRows(data) {
    const params = data.PrintJobParams || {};
    const fluids = {};
    (params.PrintFluids || []).forEach(f => { fluids[f.Fluid] = f; });
    function isInertOnlyMap(m) {
      const mc = m.MaterialsConfig || {};
      const names = [];
      Object.keys(mc).forEach(slot => {
        (mc[slot] || []).forEach(x => { if (x.Name) names.push(x.Name); });
      });
      if (!names.length) return true;
      return names.every(n => { const f = fluids[n]; return f && f.PrimingGroup === 'Inert Base'; });
    }
    const rows = [];
    (params.PrintWellModelMaps || []).forEach(m => {
      if (isInertOnlyMap(m)) return;
      const model = m.PrintWellModelName || m.Name || '';
      // Cell line and concentration for these wells, parsed from the cell fluid's name
      // (e.g. "F176 - Cell A, 2,000,000/mL").
      let cellName = '', cellPairs = [];
      const mc = m.MaterialsConfig || {};
      Object.keys(mc).forEach(slot => {
        (mc[slot] || []).forEach(x => {
          const f = fluids[x.Name];
          if (f && f.PrimingGroup === 'Cells') {
            const mm = String(x.Name).match(/-\s*(.+?),\s*([\d,]+)\s*\/\s*mL/i);
            if (mm) { cellName = mm[1].trim(); cellPairs = [{ name: cellName, conc: parseInt(mm[2].replace(/,/g, ''), 10) }]; }
            else { const m2 = String(x.Name).match(/-\s*(.+?),/); if (m2) { cellName = m2[1].trim(); cellPairs = [{ name: cellName, conc: null }]; } }
          }
        });
      });
      // The physical plate: classic keys each model map to a WellplateConfig, so different configs are
      // different plates (a multi-plate run has e.g. WP001 and WP031). Fall back to 'W1' when absent.
      const plate = m.WellplateConfig || 'W1';
      (m.Actions || []).forEach(a => {
        const viw = a && a.P && a.P.VariantsInWells;
        if (!viw) return;
        viw.forEach(entry => {
          const wellRange = entry[0], variant = entry[1];
          rows.push({
            plate, wellRange, wells: `${wellRange[0]}-${wellRange[1]}`,
            model, variant, matrix_codes: '', cells: cellName, cell_pairs: cellPairs,
            resolved_via: 'rastrum'
          });
        });
      });
    });
    return rows;
  }

  function csvEscape(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }
  // Neutralise CSV formula injection: a cell whose text starts with = + - @ (or a leading tab/CR) is
  // executed as a formula when the file is opened in Excel/Sheets. Prefix a single quote so it is
  // read as literal text. Values not starting with those characters, the normal case, and the
  // analysis join keys (barcode, cell line), are returned unchanged, so programmatic consumers
  // (pandas/R) still read clean values.
  function csvFormulaGuard(v) {
    v = String(v == null ? '' : v);
    return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  }

  // A well range like ["A3","A7"] is always within one row (true of every real file seen), so
  // expanding it is just walking the column numbers between the two endpoints.
  function expandWellRangeToWellIDs(wellRange) {
    const start = wellRange[0], end = wellRange[1];
    const rowLetter = start.charAt(0);
    const startCol = parseInt(start.slice(1), 10), endCol = parseInt(end.slice(1), 10);
    const ids = [];
    for (let c = startCol; c <= endCol; c++) ids.push(rowLetter + c);
    return ids;
  }

  // Plate-map grid CSV, one section per attribute (Model, Matrix code), matching the same
  // plater-style multi-section convention this lab's own existing R scripts already read (a header
  // row of column numbers, then one row per plate row letter), a genuine plate layout, not a list
  // of ranges, which is what people actually expect to see when looking at what was printed.
  function wellplateRowsToCSV(rows) {
    const byPlate = {};
    rows.forEach(r => { (byPlate[r.plate] = byPlate[r.plate] || []).push(r); });

    function section(title, maxCol, byWell) {
      const lines = [title, `,${Array.from({ length: maxCol }, (_, i) => i + 1).join(',')}`];
      let maxRow = -1;
      Object.keys(byWell).forEach(id => {
        const r = id.charCodeAt(0) - 65;
        if (r > maxRow) maxRow = r;
      });
      for (let r = 0; r <= maxRow; r++) {
        const letter = String.fromCharCode(65 + r);
        const vals = [];
        for (let c = 1; c <= maxCol; c++) vals.push(csvEscape(byWell[letter + c] || ''));
        lines.push(`${letter},${vals.join(',')}`);
      }
      return lines.join('\r\n');
    }

    const out = [];
    Object.keys(byPlate).forEach(plateName => {
      const modelByWell = {};
      const matrixByWell = {};
      let maxCol = 0;
      byPlate[plateName].forEach(r => {
        expandWellRangeToWellIDs(r.wellRange).forEach(id => {
          modelByWell[id] = r.model;
          matrixByWell[id] = r.matrix_codes;
          const col = parseInt(id.slice(1), 10);
          if (col > maxCol) maxCol = col;
        });
      });
      out.push(`Plate ${plateName}`);
      out.push(section('Model', maxCol, modelByWell));
      out.push('');
      // Only emit the matrix-code grid when there are matrix codes (Allegro). RASTRUM files have
      // none, so a matrix section there would be an empty grid, skip it rather than print blanks.
      const hasMatrix = Object.keys(matrixByWell).some(id => matrixByWell[id]);
      if (hasMatrix) {
        out.push(section('Matrix code', maxCol, matrixByWell));
        out.push('');
      }
    });
    return out.join('\r\n');
  }

  // Group the well rows into the physical plates the file describes, and summarise each, the input
  // to the run-form multi-plate wizard. Allegro lays out several wellplates in one job
  // (platemaps_by_plate keyed W1, W2, …); classic RASTRUM keys each model map to a WellplateConfig, so
  // different configs are different plates (WP001, WP031, …). Either way the rows already carry a
  // `plate` key, so this just collapses them (in first-seen order) into one entry per plate, carrying
  // the distinct cell lines / matrices / models and the trimmed rows the plate-map visual re-renders
  // from. `allegroData`, when present, resolves each plate's human wellplate name from the catalog.
  function buildDesignedPlates(wellplateRows, allegroData) {
    const order = [], byPlate = {};
    (wellplateRows || []).forEach(r => {
      const p = r.plate || 'W1';
      if (!byPlate[p]) { byPlate[p] = []; order.push(p); }
      byPlate[p].push(r);
    });
    const wellplates = ((allegroData || {}).outcomes || {}).wellplates || [];
    const resources = (allegroData || {}).resources || {};
    return order.map((p, i) => {
      const rows = byPlate[p], cells = [], matrices = [], models = [], concs = [];
      rows.forEach(r => {
        String(r.cells || '').split(', ').forEach(c => { if (c && cells.indexOf(c) === -1) cells.push(c); });
        // Per-plate concentration comes from the paired cell data (r.cell_pairs = [{name, conc}]),
        // collected as the DISTINCT set on this plate. A plate is usually uniform (one value); a plate
        // that mixes concentrations yields several, joined like the cell-line set.
        (r.cell_pairs || []).forEach(cp => {
          const c = String(cp.conc == null ? '' : cp.conc).replace(/[^\d]/g, '');
          if (c && concs.indexOf(c) === -1) concs.push(c);
        });
        // Split compound codes (a Triple-Matrix well stores "A + B + C") and collect DISTINCT
        // individual codes, so the plate summary is a clean set (e.g. "Px01.29, Px01.75") rather than
        // a repetitive string like "Px01.29, Px01.75 + Px01.75 + Px01.29, Px01.75".
        String(r.matrix_codes || '').split(/\s*[+,]\s*/).forEach(mx => {
          if (mx && matrices.indexOf(mx) === -1) matrices.push(mx);
        });
        if (r.model && models.indexOf(r.model) === -1) models.push(r.model);
      });
      concs.sort((a, b) => Number(a) - Number(b));
      // Format label: Allegro maps plate -> outcomes.wellplates[i] (by order) -> catalog name; classic's
      // plate key IS its wellplate config code, so use it directly.
      let format;
      if (allegroData) {
        const code = (wellplates[i] || {}).wellplate_model_code || '';
        format = [code ? allegroPlateName(resources, code) : '', code ? `[${code}]` : '']
          .filter(Boolean).join(' ').trim();
      } else {
        format = /^WP/i.test(p) ? p : '';
      }
      return {
        plate: p, label: `Plate ${i + 1}`, wellplate: format,
        cell_line: cells.join(', '), concentration: concs.join(', '),
        matrix_codes: matrices.sort().join(', '), models: models.join(', '),
        rows: rows.map(r => ({
          wr: r.wellRange,
          m: r.model,
          mx: r.matrix_codes,
          c: r.cells
        }))
      };
    });
  }

  // ─── Plate-map visual ──────────────────────────────────────────────────────
  // A colour-coded plate grid rendered from the well rows, shown on upload so the user can eyeball
  // that the file parsed correctly. Colourblind-safe categorical palette (Okabe-Ito). Adapts to any
  // well count (row/column come from the data), so 96- and 384-well both work.
  const PLATE_PALETTE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00', '#56B4E9', '#F0E442', '#7B4FB5'];

  function plateMapData(rows) {
    const byWell = {};
    let maxCol = 0;
    let maxRow = 0;
    (rows || []).forEach(r => {
      expandWellRangeToWellIDs(r.wellRange).forEach(id => {
        byWell[id] = { model: r.model || '', matrix: r.matrix_codes || '', cells: r.cells || '' };
        const col = parseInt(id.slice(1), 10); if (col > maxCol) maxCol = col;
        const row = id.charCodeAt(0) - 65; if (row > maxRow) maxRow = row;
      });
    });
    return { byWell, maxCol, maxRow };
  }
  function plateColorMap(byWell, mode) {
    const vals = [];
    Object.keys(byWell).forEach(id => {
      const v = byWell[id][mode] || '';
      if (v && vals.indexOf(v) === -1) vals.push(v);
    });
    vals.sort();
    const map = {};
    vals.forEach((v, i) => { map[v] = PLATE_PALETTE[i % PLATE_PALETTE.length]; });
    return { vals, map };
  }
  function inkFor(hex) {
    const c = String(hex).replace('#', ''); if (c.length < 6) return '#000';
    const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? 'rgba(0,0,0,.68)' : '#fff';
  }
  function renderPlateMapInto(rows, container) {
    if (!container) return;
    const plates = [];
    rows.forEach(r => { if (plates.indexOf(r.plate) === -1) plates.push(r.plate); });
    plates.sort();
    const allData = plateMapData(rows); // across every plate, used for consistent colours
    const modes = [];
    function anyHas(k) { return Object.keys(allData.byWell).some(id => allData.byWell[id][k]); }
    if (anyHas('matrix')) modes.push({ k: 'matrix', label: 'Matrix' });
    if (anyHas('cells')) modes.push({ k: 'cells', label: 'Cell line' });
    modes.push({ k: 'model', label: 'Model' });
    const state = { mode: modes[0].k, plate: plates[0] };
    container.style.position = 'relative'; // anchor for the floating tooltip
    function draw() {
      // A print run can produce more than one physical plate (e.g. W1 and W2). Render one at a time.
      const prows = plates.length > 1 ? rows.filter(r => r.plate === state.plate) : rows;
      const data = plateMapData(prows);
      // Colours are assigned from ALL plates so a given matrix/cell keeps the same colour across
      // W1/W2; the legend below is filtered to what is actually on the current plate.
      const cm = plateColorMap(allData.byWell, state.mode);
      const cols = data.maxCol, rowsN = data.maxRow;
      let html = `<div class="bpt-pm-toolbar">${modes.map(m => `<button type="button" class="bpt-pm-btn${m.k === state.mode ? ' active' : ''}" data-mode="${m.k}">${esc(m.label)}</button>`).join('')}</div>`;
      if (plates.length > 1) {
        html += `<div class="bpt-pm-plates">${plates.map(p => `<button type="button" class="bpt-pm-pbtn${p === state.plate ? ' active' : ''}" data-plate="${esc(p)}">Plate ${esc(p)}</button>`).join('')}</div>`;
      }
      html += `<div class="bpt-pm-scroll"><div class="bpt-pm-grid" style="grid-template-columns:20px repeat(${cols},minmax(18px,1fr));">`;
      html += '<div class="bpt-pm-hdr"></div>';
      for (let c = 1; c <= cols; c++) html += `<div class="bpt-pm-hdr">${c}</div>`;
      for (let r = 0; r <= rowsN; r++) {
        const letter = String.fromCharCode(65 + r);
        html += `<div class="bpt-pm-hdr">${letter}</div>`;
        for (let c2 = 1; c2 <= cols; c2++) {
          const id = letter + c2, w = data.byWell[id];
          if (w) {
            const val = w[state.mode] || '', col = cm.map[val] || '#e4e8f0';
            html += `<div class="bpt-pm-well" data-id="${esc(id)}" data-model="${esc(w.model)}" data-matrix="${esc(w.matrix || '—')}" data-cells="${esc(w.cells || '—')}" style="background:${col};color:${inkFor(col)};">${esc(id)}</div>`;
          } else {
            html += '<div class="bpt-pm-well bpt-pm-empty"></div>';
          }
        }
      }
      html += '</div></div>';
      const plateVals = plateColorMap(data.byWell, state.mode).vals;
      html += `<div class="bpt-pm-legend">${plateVals.map(v => `<span class="bpt-pm-lg"><span class="bpt-pm-sw" style="background:${cm.map[v]}"></span>${esc(v)}</span>`).join('')}</div>`;
      html += '<div class="bpt-pm-tip" id="bpt-pm-tip"></div>';
      container.innerHTML = html;

      // Floating tooltip anchored to the container (not the scroll box, so it isn't clipped). Delegated
      // on the grid so one handler covers every well and survives a redraw.
      const tip = container.querySelector('#bpt-pm-tip');
      const grid = container.querySelector('.bpt-pm-grid');
      function wellAt(target) {
        let el = target;
        while (el && el !== grid && !(el.className && String(el.className).indexOf('bpt-pm-well') !== -1)) {
          el = el.parentNode;
        }
        return (el && el !== grid && el.getAttribute && el.getAttribute('data-id')) ? el : null;
      }
      grid.addEventListener('mouseover', e => {
        const el = wellAt(e.target);
        if (!el) return;
        tip.innerHTML = `<b>${esc(el.getAttribute('data-id'))}</b><br><span class="k">model</span>${esc(el.getAttribute('data-model'))}<br><span class="k">matrix</span>${esc(el.getAttribute('data-matrix'))}<br><span class="k">cells</span>${esc(el.getAttribute('data-cells'))}`;
        tip.style.display = 'block';
        const cr = container.getBoundingClientRect(), wr = el.getBoundingClientRect();
        let x = (wr.left - cr.left) + wr.width / 2 - tip.offsetWidth / 2;
        x = Math.max(2, Math.min(x, cr.width - tip.offsetWidth - 2));
        let y = (wr.top - cr.top) - tip.offsetHeight - 8;
        if (y < 0) y = (wr.top - cr.top) + wr.height + 8; // flip below when no room above
        tip.style.left = `${x}px`;
        tip.style.top = `${y}px`;
      });
      grid.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

      Array.prototype.forEach.call(container.querySelectorAll('.bpt-pm-btn'), b => {
        b.onclick = () => { state.mode = b.getAttribute('data-mode'); draw(); };
      });
      Array.prototype.forEach.call(container.querySelectorAll('.bpt-pm-pbtn'), b => {
        b.onclick = () => { state.plate = b.getAttribute('data-plate'); draw(); };
      });
    }
    draw();
  }

  // ─── Naming convention ─────────────────────────────────────────────────────
  // Auto-generated, date-sortable, and self-describing names, so nobody has to invent or remember
  // a scheme by hand: {date}_{printer}_{free text, slugified}_{hash6}. The hash suffix is the print
  // file's own SHA-256 (already computed for provenance), so two protocols given the same free-text
  // name never collide, and the exact source file behind a given protocol name is always traceable.
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  // Concise wellplate label for compact UI (the wizard header). The parsed name is a long catalog
  // string, e.g. "<Vendor> 384-well microplates (...), case of 50 (#NNNNNNN) [WP007]".
  // Reduce it to "384-well · WP007" using the well count and the bracketed config code; fall back to
  // the code alone, then to a trimmed original, so it is never blank when a name exists.
  function shortWellplate(name) {
    const s = String(name || '').trim();
    if (!s) return '';
    const well = s.match(/(\d+)\s*-?\s*well/i);
    const code = s.match(/\[([^\]]+)\]/);
    const parts = [];
    if (well) parts.push(`${well[1]}-well`);
    if (code) parts.push(code[1]);
    if (parts.length) return parts.join(' · ');
    return s.length > 40 ? `${s.slice(0, 40)}…` : s;
  }
  function slugify(s) {
    return String(s || '').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
  }
  function buildProtocolName(freeText, printer, fileHash) {
    return `${todayISO()}_${printer}_${slugify(freeText)}_${(fileHash || '').slice(0, 6)}`;
  }
  // A print run ID ties every plate created in one "Log print run" batch together, independent of
  // each plate's own sample name/barcode, useful for later finding "everything from this one run".
  // Random rather than sequential: no shared counter exists across browser sessions/users, and a
  // few hex digits is enough entropy that two runs logged the same day won't collide in practice.
  function makePrintRunID() {
    const rand = Array.from({ length: 4 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    return `PR-${todayISO()}-${rand}`;
  }

  function mergeExtracted(list) {
    const out = { print_model: '', wellplate: '', wellplate_description: '', wellplate_display: '',
      cell_line: '', cell_concentration: '', matrix_codes: '', fluid_bioink: '',
      fluid_cell: '', fluid_activator: '', fluid_bioink_base: '', pp_bioink: {}, pp_cell: {} };
    list.forEach(r => {
      Object.keys(out).forEach(key => {
        const current = out[key];
        const isEmpty = typeof current === 'string' ? !current : !Object.keys(current).length;
        const candidate = r[key];
        const hasValue = typeof candidate === 'string' ? !!candidate : candidate && Object.keys(candidate).length;
        if (isEmpty && hasValue) out[key] = candidate;
      });
    });
    return out;
  }

  function parseRastrum(arrayBuffer) {
    if (arrayBuffer.byteLength > CONFIG.MAX_RASTRUM_BYTES) {
      return Promise.reject(new Error('File is unexpectedly large; refusing to parse.'));
    }
    return JSZip.loadAsync(arrayBuffer).then(zip => {
      const names = Object.keys(zip.files);
      // Matches printrun.yaml (combined) and printrun_*.yaml (printed in separate phases, e.g.
      // "cell model only" + "inert base only"), any number of files, merged below.
      const rastrumNames = names.filter(n => /^printrun.*\.yaml$/i.test(n)).sort();
      const allegroName = names.filter(n => /^printplan\.yaml$/i.test(n))[0];
      const targetNames = rastrumNames.length ? rastrumNames : (allegroName ? [allegroName] : []);
      if (!targetNames.length) {
        throw new Error('Not a valid .rastrum file (no printrun*.yaml or printplan.yaml inside).');
      }
      const mf = zip.file('manifest.yaml');
      const pdfEntry = zip.file('protocol.pdf');
      return Promise.all([
        Promise.all(targetNames.map(n => zip.file(n).async('string'))),
        Promise.resolve(!rastrumNames.length),
        Promise.resolve(targetNames),
        mf ? mf.async('string') : Promise.resolve(''),
        sha256Hex(arrayBuffer),
        pdfEntry ? pdfEntry.async('arraybuffer') : Promise.resolve(null)
      ]);
    }).then(parts => {
      const texts = parts[0], isAllegro = parts[1], sourceNames = parts[2], manifestText = parts[3], fileHash = parts[4], pdfBytes = parts[5];
      const totalLen = texts.reduce((s, t) => s + t.length, 0);
      if (totalLen > CONFIG.MAX_RASTRUM_BYTES) {
        throw new Error('Print file contents are unexpectedly large; refusing to parse.');
      }
      let schemaVersion = '';
      try {
        const mo = jsyaml.load(manifestText) || {};
        schemaVersion = mo.version != null ? String(mo.version) : '';
      } catch (e) { /* manifest optional */ }

      const allegroData = isAllegro ? (jsyaml.load(texts[0]) || {}) : null;
      const extracted = isAllegro
        ? extractAllegroDoc(allegroData)
        : mergeExtracted(texts.map(t => extractRastrumDoc(jsyaml.load(t) || {})));

      // Full well-by-well breakdown (every model/well-range on the plate). Allegro comes from
      // platemaps_by_plate (with matrix codes); RASTRUM classic comes from each file's
      // PrintWellModelMaps/VariantsInWells (no matrix codes), concatenated across split-phase files.
      let wellplateRows;
      if (isAllegro) {
        wellplateRows = buildAllegroWellplateRows(allegroData);
      } else {
        wellplateRows = [];
        texts.forEach(t => {
          wellplateRows = wellplateRows.concat(buildRastrumWellplateRows(jsyaml.load(t) || {}));
        });
      }
      const wellplateUnresolvedCount = wellplateRows.filter(r => r.resolved_via === 'UNRESOLVED').length;

      // Uniform vs structured: count the distinct (model + matrix) combinations placed on the plate.
      // One combination means the whole plate is a single printed condition (the drug-screen case);
      // more than one means a structured plate whose detail lives in the well map. This is derived,
      // never asked of the user.
      const comboSet = {}, plateSet = {};
      wellplateRows.forEach(r => {
        comboSet[`${r.model}||${r.matrix_codes}`] = true;
        plateSet[r.plate] = true;
      });
      const distinctCombos = Object.keys(comboSet).length;
      const plateCount = Object.keys(plateSet).length;

      // The summary must reflect what was actually PLACED, not merely defined: a file can declare a
      // matrix condition (e.g. a "Cell B") that no model ever places on a plate. Derive matrix codes,
      // cell lines, and concentrations from the placed well rows so the summary can't over-report, and
      // keep each cell paired with its concentration so multiple concentrations are handled. Falls back
      // to the extractor's values when there are no rows (RASTRUM files without a populated well map).
      let placedCellPairs = [];
      if (wellplateRows.length) {
        const mset = {}, pairMap = {};
        wellplateRows.forEach(r => {
          String(r.matrix_codes || '').split(/\s*\+\s*/).forEach(m => { if (m) mset[m] = true; });
          (r.cell_pairs || []).forEach(p => { pairMap[`${p.name}@${p.conc}`] = p; });
        });
        placedCellPairs = Object.keys(pairMap).map(k => pairMap[k]);
        const names = {}, concs = {};
        placedCellPairs.forEach(p => {
          if (p.name) names[p.name] = true;
          if (p.conc != null) concs[p.conc] = true;
        });
        if (Object.keys(mset).length) extracted.matrix_codes = Object.keys(mset).sort().join(', ');
        if (Object.keys(names).length) extracted.cell_line = Object.keys(names).sort().join(', ');
        if (Object.keys(concs).length) {
          extracted.cell_concentration = Object.keys(concs)
            .sort((a, b) => a - b).join(', ');
        }
      }

      const result = {
        print_model: extracted.print_model,
        wellplate: extracted.wellplate,
        wellplate_description: extracted.wellplate_description,
        wellplate_display: extracted.wellplate_display,
        cell_line: extracted.cell_line,
        cell_concentration: extracted.cell_concentration,
        matrix_codes: extracted.matrix_codes,
        fluid_bioink: extracted.fluid_bioink,
        fluid_cell: extracted.fluid_cell,
        fluid_activator: extracted.fluid_activator,
        fluid_bioink_base: extracted.fluid_bioink_base,
        pp_bioink: extracted.pp_bioink,
        pp_cell: extracted.pp_cell,
        schema_version: schemaVersion,
        file_hash: fileHash,
        source_files: sourceNames.join(', '),
        pdf_bytes: pdfBytes, // ArrayBuffer or null; the human-readable protocol.pdf from inside the .rastrum
        raw_bytes: arrayBuffer, // the original .rastrum bytes, attached to the template so logging can re-parse it

        wellplate_csv: wellplateRows.length ? wellplateRowsToCSV(wellplateRows) : null,
        wellplate_rows: wellplateRows, // kept for the plate-map visual
        designed_plates: buildDesignedPlates(wellplateRows, allegroData), // physical plates the file lays out
        wellplate_row_count: wellplateRows.length,
        wellplate_unresolved_count: wellplateUnresolvedCount,
        wellplate_distinct_combos: distinctCombos,
        wellplate_structured: distinctCombos > 1,
        wellplate_plate_count: plateCount,
        // Printer VERSION the file was designed for, detected from the file itself (Allegro exports a
        // printplan.yaml; classic RASTRUM a printrun*.yaml), never typed by the user. This is the
        // machine generation/model, distinct from the physical unit (the named machine) chosen at
        // log time. Used in the protocol name and shown as a badge in the confirm preview.
        format: isAllegro ? 'Allegro' : 'RASTRUM'
      };
      // Fail loud if the key fields could not be read (an unrecognised/changed export format).
      result.recognized = !!(result.print_model && result.wellplate &&
        (result.fluid_bioink || result.fluid_cell));
      return result;
    });
  }

  // ─── Modal + shared styling ───────────────────────────────────────────────────
  // Self-contained light theme, deliberately not matched to the host eLabNext theme (which is dark and
  // redesigned periodically, so matching it would only go stale). color-scheme:light plus explicit
  // colors on every element stop the host's dark mode bleeding through and making text invisible.
  const STYLE_ID = 'bpt-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css =
      '.bpt-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:999998;' +
        'display:flex;align-items:center;justify-content:center;color-scheme:light;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}' +
      '.bpt-card{background:#fff;color:#1a1a2e;border-radius:12px;' +
        'box-shadow:0 20px 60px rgba(15,23,42,.3),0 2px 8px rgba(15,23,42,.08);' +
        'max-width:90vw;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;}' +
      '.bpt-card-header{padding:18px 20px;border-bottom:1px solid #eef0f3;font-weight:600;' +
        'font-size:16px;letter-spacing:-.01em;color:#1a1a2e;}' +
      '.bpt-card-body{padding:24px 26px;overflow-y:auto;flex:1;font-size:13.5px;line-height:1.55;color:#1a1a2e;}' +
      '.bpt-card-footer{padding:14px 20px;border-top:1px solid #eef0f3;display:flex;' +
        'justify-content:flex-end;gap:8px;background:#fafbfc;}' +
      '.bpt-btn{padding:9px 18px;border-radius:8px;border:none;font-size:13.5px;font-weight:600;' +
        'cursor:pointer;transition:background .15s ease,transform .05s ease;font-family:inherit;}' +
      '.bpt-btn:active{transform:translateY(1px);}' +
      '.bpt-btn-secondary{background:#f1f3f5;color:#334155;}' +
      '.bpt-btn-secondary:hover{background:#e5e8eb;}' +
      '.bpt-btn-primary{background:#4f46e5;color:#fff;}' +
      '.bpt-btn-primary:hover{background:#4338ca;}' +
      '.bpt-field{display:flex;flex-direction:column;gap:4px;}' +
      '.bpt-field label{font-size:12px;font-weight:600;color:#64748b;letter-spacing:.01em;}' +
      '.bpt-field input,.bpt-field select,.bpt-field textarea{padding:8px 10px;border:1px solid #d8dce1;' +
        'border-radius:8px;font-size:13.5px;font-family:inherit;color:#1a1a2e;background:#fff;' +
        'transition:border-color .15s ease,box-shadow .15s ease;box-sizing:border-box;width:100%;}' +
      '.bpt-field input:focus,.bpt-field select:focus,.bpt-field textarea:focus{outline:none;' +
        'border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15);}' +
      '.bpt-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}' +
      '.bpt-stack{display:flex;flex-direction:column;gap:12px;}' +
      '.bpt-combo{position:relative;}' +
      '.bpt-combo-list{position:absolute;left:0;right:0;top:100%;z-index:20;background:#fff;' +
        'border:1px solid #d8dce1;border-radius:8px;margin-top:3px;max-height:240px;overflow-y:auto;' +
        'box-shadow:0 10px 30px rgba(15,23,42,.15);}' +
      '.bpt-combo-item{padding:8px 11px;cursor:pointer;border-bottom:1px solid #f1f3f5;}' +
      '.bpt-combo-item:last-child{border-bottom:none;}' +
      '.bpt-combo-item:hover,.bpt-combo-item.active{background:#eef0fe;}' +
      '.bpt-combo-item .nm{font-size:13px;color:#1a1a2e;font-weight:600;}' +
      '.bpt-combo-item .sub{font-size:11.5px;color:#64748b;margin-top:1px;}' +
      '.bpt-combo-empty{padding:10px 11px;color:#94a3b8;font-size:12.5px;}' +
      // Per-plate review inputs (cell line, concentration) and the typo-guard hint.
      '.bpt-inp{padding:8px 10px;border:1px solid #d8dce1;border-radius:8px;font-size:13.5px;' +
        'font-family:inherit;color:#1a1a2e;background:#fff;box-sizing:border-box;width:100%;}' +
      '.bpt-inp:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15);}' +
      '.bpt-dym{font-size:11.5px;color:#b45309;margin-top:4px;}' +
      '.bpt-hr{border:none;border-top:1px solid #e2e6ec;margin:6px 0 2px;}' +
      '.bpt-section{font-size:13px;font-weight:700;color:#334155;text-transform:none;letter-spacing:0;}' +
      // Repeatable reagent-lot list + its "add" button.
      '.bpt-lots{display:flex;flex-direction:column;gap:6px;}' +
      '.bpt-lot-add{align-self:flex-start;margin-top:6px;border:1px dashed #c7cbd1;background:#fff;' +
        'color:#4f46e5;border-radius:8px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.bpt-lot-add:hover{background:#eef0fe;border-color:#4f46e5;}' +
      '.bpt-dym a{color:#4338ca;font-weight:600;cursor:pointer;text-decoration:underline;}' +
      // Multi-plate wizard: one step per physical plate the file lays out, each showing its own map.
      '.bpt-wiz-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:2px 0 8px;}' +
      '.bpt-wiz-title{font-size:13.5px;font-weight:700;color:#1a1a2e;}' +
      '.bpt-wiz-sub{font-size:12px;color:#64748b;text-align:right;}' +
      '.bpt-wiz-map{margin:2px 0 10px;}' +
      // Per-plate editable fields inside the review step: cell line + concentration, both full-width
      // (two equal columns) so neither is cut off.
      '.bpt-plate-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;margin:0 0 2px;}' +
      '.bpt-wiz-nav{display:flex;justify-content:space-between;align-items:center;margin-top:12px;' +
        'border-top:1px solid #eef0f3;padding-top:10px;}' +
      '.bpt-wiz-btn{border:1px solid #d8dce1;background:#fff;color:#334155;border-radius:8px;padding:7px 13px;' +
        'font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.bpt-wiz-btn:hover:not(:disabled){background:#eef0fe;border-color:#4f46e5;color:#4338ca;}' +
      '.bpt-wiz-btn:disabled{opacity:.4;cursor:default;}' +
      '.bpt-wiz-progress{font-size:12px;color:#475569;font-weight:600;}' +
      '.bpt-wiz-dots{display:flex;gap:5px;}' +
      '.bpt-wiz-dot{width:8px;height:8px;border-radius:50%;background:#d8dce1;}' +
      '.bpt-wiz-dot.active{background:#4f46e5;}' +
      '.bpt-wiz-dot.done{background:#16a34a;}' +   // approved plate
      // Dots jump to a plate, so they are click targets. The visible dot stays 8px while padding
      // (clipped out of the background) grows the hit area to 24px, the WCAG 2.2 minimum.
      '.bpt-wiz-dot{cursor:pointer;padding:8px;background-clip:content-box;}' +
      '.bpt-wiz-dots{gap:0;}' +
      '.bpt-wiz-dot:hover,.bpt-wiz-dot:focus{outline:2px solid #c7d2fe;outline-offset:-4px;}' +
      '.bpt-wiz-approve-row{display:flex;justify-content:center;margin-top:10px;}' +
      '.bpt-steps>div{margin:0 0 6px;}' +
      // table-layout:fixed makes the <colgroup> widths bind; without it a long filename widens its
      // own column and squeezes the folder number and the button out of shape.
      '.bpt-folder-table{table-layout:fixed;width:100%;}' +
      '.bpt-folder-table td,.bpt-folder-table th{vertical-align:middle;}' +
      '.bpt-wiz-approve{border-color:#4f46e5;color:#4338ca;}' +
      '.bpt-wiz-approve.done{background:#dcfce7;border-color:#16a34a;color:#15803d;}' +
      '.bpt-wiz-status{font-size:12px;color:#475569;margin-top:8px;text-align:center;}' +
      '.bpt-pm-toolbar{display:flex;gap:6px;margin-bottom:6px;}' +
      '.bpt-pm-btn{border:1px solid #d8dce1;background:#f6f7f9;color:#475569;font-family:inherit;' +
        'font-size:12px;font-weight:600;padding:5px 13px;border-radius:7px;cursor:pointer;transition:all .12s ease;}' +
      '.bpt-pm-btn:hover{background:#eef0fe;}' +
      '.bpt-pm-btn.active{background:#4f46e5;color:#fff;border-color:#4f46e5;}' +
      '.bpt-pm-plates{display:flex;gap:6px;margin-bottom:8px;}' +
      '.bpt-pm-pbtn{border:1px solid #d8dce1;background:#fff;color:#475569;font-family:inherit;' +
        'font-size:12px;font-weight:600;padding:4px 12px;border-radius:7px;cursor:pointer;}' +
      '.bpt-pm-pbtn.active{background:#eef0fe;color:#4338ca;border-color:#c7c9f9;}' +
      '.bpt-pm-tip{position:absolute;z-index:30;background:#fff;color:#1a2233;font-size:12.5px;' +
        'line-height:1.5;padding:9px 12px;border-radius:10px;border:1px solid #e2e6ee;pointer-events:none;' +
        'max-width:270px;box-shadow:0 12px 30px rgba(15,23,42,.24);display:none;}' +
      '.bpt-pm-tip b{font-family:ui-monospace,monospace;color:#4338ca;font-size:13.5px;}' +
      '.bpt-pm-tip .k{color:#94a3b8;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;' +
        'margin-right:5px;}' +
      '.bpt-pm-scroll{overflow-x:auto;padding:3px;}' +
      '.bpt-pm-grid{display:grid;gap:3px;min-width:min-content;}' +
      '.bpt-pm-hdr{font-size:10px;color:#94a3b8;text-align:center;display:flex;align-items:center;' +
        'justify-content:center;font-family:ui-monospace,monospace;font-weight:600;}' +
      '.bpt-pm-well{aspect-ratio:1;border-radius:50%;font-size:8px;display:flex;align-items:center;' +
        'justify-content:center;font-family:ui-monospace,monospace;border:1px solid rgba(0,0,0,.06);' +
        'transition:transform .1s ease,box-shadow .1s ease;}' +
      '.bpt-pm-well:hover{transform:scale(1.16);box-shadow:0 0 0 2px rgba(79,70,229,.55);' +
        'z-index:3;position:relative;cursor:default;}' +
      '.bpt-pm-empty{background:#eef0f3;border:1px dashed #d1d5db;}' +
      '.bpt-pm-empty:hover{transform:none;box-shadow:none;}' +
      '.bpt-pm-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:11px;}' +
      '.bpt-pm-lg{display:flex;align-items:center;gap:6px;font-size:12px;color:#475569;}' +
      '.bpt-pm-sw{width:12px;height:12px;border-radius:3px;flex:none;}' +
      '.bpt-copy-btn{border:1px solid #d8dce1;background:#f6f7f9;color:#4338ca;font-family:inherit;' +
        'font-size:11.5px;font-weight:600;padding:3px 11px;border-radius:6px;cursor:pointer;white-space:nowrap;}' +
      '.bpt-copy-btn:hover{background:#eef0fe;border-color:#c7c9f9;}' +
      '.bpt-table{width:100%;border-collapse:collapse;font-size:13px;}' +
      '.bpt-table td{padding:5px 10px 5px 0;}' +
      '.bpt-table td:first-child{color:#64748b;}' +
      '.bpt-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;' +
        'font-weight:700;margin:0 0 4px;}' +
      '.bpt-name{font-size:15px;font-weight:700;color:#1a1a2e;letter-spacing:-.01em;word-break:break-all;' +
        'margin:0 0 16px;font-family:ui-monospace,"SF Mono",Menlo,monospace;}' +
      '.bpt-speccard{background:#f8fafc;border:1px solid #eef1f5;border-radius:12px;padding:17px 19px;margin:0 0 14px;}' +
      '.bpt-summary{display:grid;grid-template-columns:1fr 1fr;gap:15px 28px;margin:0;}' +
      '.bpt-sf{min-width:0;}' +
      '.bpt-sf-2{grid-column:1 / -1;}' +
      '.bpt-sf-label{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;' +
        'font-weight:700;margin-bottom:4px;}' +
      '.bpt-sf-val{font-size:14px;color:#1a1a2e;font-weight:500;line-height:1.35;}' +
      '.bpt-chips{display:flex;flex-wrap:wrap;gap:5px;}' +
      '.bpt-chip{display:inline-block;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;line-height:1.55;}' +
      '.bpt-chip-matrix{background:#eef0fe;color:#4338ca;}' +
      '.bpt-chip-cell{background:#e7f6f2;color:#0f766e;}' +
      '.bpt-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 12px;' +
        'border-radius:8px;font-size:12.5px;margin-top:2px;}' +
      '.bpt-hint{color:#475569;font-size:14.5px;font-weight:500;margin:0 0 12px;}' +
      '.bpt-details{margin-top:10px;color:#64748b;}' +
      '.bpt-details summary{cursor:pointer;font-size:12.5px;font-weight:600;color:#475569;padding:3px 0;}' +
      '.bpt-details summary:hover{color:#4f46e5;}';
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  function closeModal() {
    const el = document.getElementById('bpt-modal-overlay');
    if (el) el.remove();
  }
  addon.closeModal = closeModal;

  function showDialog(config) {
    closeModal();
    injectStyles();
    const buttons = config.customButtons || [];
    const btnHTML = buttons.map((b, i) => `<button id="bpt-btn-${i}" class="bpt-btn bpt-btn-primary">${esc(b.label)}</button>`).join('');
    const overlay = document.createElement('div');
    overlay.id = 'bpt-modal-overlay';
    overlay.className = 'bpt-overlay';
    overlay.innerHTML =
      `<div class="bpt-card" style="width:${config.width || 400}px;"><div class="bpt-card-header">${esc(config.title || '')}</div><div class="bpt-card-body">${config.content || ''}</div><div class="bpt-card-footer"><button id="bpt-cancel" class="bpt-btn bpt-btn-secondary">${esc(config.btnCancelLabel || 'Close')}</button>${btnHTML}</div></div>`;
    document.body.appendChild(overlay);
    // config.onCancel lets a dialog send the cancel/"Back" button somewhere other than closing
    // outright (e.g. back to the previous step), while clicking outside the dialog always just closes.
    document.getElementById('bpt-cancel').onclick = () => {
      if (config.onCancel) { try { config.onCancel(); } catch (e) { console.error('Bioprint Tracker add-on error:', e); } }
      else closeModal();
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    buttons.forEach((b, i) => {
      document.getElementById(`bpt-btn-${i}`).onclick = () => {
        try { b.fn(); } catch (e) {
          console.error('Bioprint Tracker add-on error:', e);
          showError('Unexpected error', (e && e.message) || String(e));
        }
      };
    });
    if (config.afterRender) config.afterRender();
  }

  function showError(title, msg) {
    showDialog({ title, width: 420, content: `<p class="bpt-error">${esc(msg)}</p>` });
  }

  function field(label, id, type, placeholder, value, extra) {
    const tag = type === 'textarea' ? 'textarea' : 'input';
    return `<div class="bpt-field"><label>${esc(label)}</label><${tag} id="${id}"${type !== 'textarea' ? ` type="${type}"` : ''} placeholder="${esc(placeholder || '')}"${value !== undefined ? ` value="${esc(value)}"` : ''} ${extra || ''}>${type === 'textarea' ? '</textarea>' : ''}</div>`;
  }

  function val(id) { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; }

  // ─── Entry point ───────────────────────────────────────────────────────────
  // `configuration` is whatever the tenant admin set via the Developer Platform's Configuration
  // Schema / Default Configuration for this add-on (see config.schema.json / config.default.json
  // in this folder). It lets the two sample-type IDs be set per-tenant without editing this file.
  addon.init = configuration => {
    applyConfig(configuration);
    // The platform does not always hand the configuration to init: it passes nothing when the add-on
    // is side-loaded, and an install whose published version predates the configuration schema has
    // no schema to render or deliver (the empty Configure dialog seen in a production tenant, 2026-07-31).
    // In those cases read the stored value over the API instead, which does not depend on the schema
    // or on the dialog. Skipped when init already supplied a folder, so the platform stays
    // authoritative where it speaks. Never fatal: an unreadable configuration just leaves defaults.
    if (!configuration || configuration.pdfFolderID == null || configuration.pdfFolderID === '') {
      configReady = readStoredConfig().then(applyConfig, () => {});
    }
    // Placement. A top-nav "Bioprint Tracker" tab via eLabSDK.CustomPage was
    // tried and removed: it rendered an empty page on the tenant because CustomPage's content
    // contract is undocumented, so the page body could not be supplied reliably.
    //
    // PRIMARY placement: a "Bioprint Tracker" button in the Inventory sample browser, under "+ Add
    // Sample" in Browser V2, and on the classic-browser toolbar in v1. A printed plate is a sample,
    // so this is where the launcher belongs, and it uses a supported API (unlike CustomPage).
    installInventoryButtons();
    // Hidden setup entry points, opened via URL hash (one-time admin tasks, deliberately NOT visible
    // menu items, they would clutter the everyday UI for every user). Also callable from the console:
    //   #bioprinting-check-types → addon.checkSampleTypes()  (read-only: confirm types + fields)
    //   #bioprinting-setup-types → addon.setupSampleTypes()  (create the two sample types + fields)
    //   #bioprinting-setup       → addon.showSetupHub()      (the setup chooser: all of the above)
    // The specific ...-types hashes are kept as direct shortcuts; the plain hash opens the hub. Checked
    // most-specific first, because each hash contains the substring of the next.
    function maybeOpenSetup() {
      const loc = (typeof window !== 'undefined' && window.location) ||
        (typeof location !== 'undefined' ? location : null);
      const hash = (loc && loc.hash) || '';
      if (/bioprinting-check-types/i.test(hash)) {
        try { addon.checkSampleTypes(); } catch (e) { /* setup helper is best-effort */ }
      } else if (/bioprinting-setup-types/i.test(hash)) {
        try { addon.setupSampleTypes(); } catch (e) { /* setup helper is best-effort */ }
      } else if (/bioprinting-setup/i.test(hash)) {
        try { addon.showSetupHub(); } catch (e) { /* setup helper is best-effort */ }
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', maybeOpenSetup);
    } else {
      maybeOpenSetup();
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('hashchange', maybeOpenSetup);
    }
  };

  // The contextually correct home for the launcher: a button in the Inventory sample browser.
  // Registered for BOTH the classic browser (eLabSDK v1) and Inventory Browser V2 (eLabSDK2),
  // because a tenant may still serve either while V2 rolls out, the correct one renders, the other
  // is a harmless no-op. Both registrations are keyed by the same id/actionID (idempotent, so a
  // re-run overwrites rather than duplicates). Returns true if at least one native path registered
  // without error.
  function installInventoryButtons() {
    let installed = false;
    // Classic Inventory browser (v1): a toolbar button placed before the standard "Add Sample".
    try {
      if (typeof eLabSDK !== 'undefined' && eLabSDK.Page && eLabSDK.Page.Sample &&
        eLabSDK.GUI && eLabSDK.GUI.Button) {
        const samplePage = new eLabSDK.Page.Sample({});
        if (typeof samplePage.addButton === 'function') {
          samplePage.addButton(new eLabSDK.GUI.Button({
            label: 'Bioprint Tracker', type: 'confirm', actionID: 'bptLauncher',
            action() { addon.showMainDialog(); }
          }));
          installed = true;
        }
      }
    } catch (e) {
      console.warn('Bioprint Tracker: classic Inventory-toolbar button not available in this context:', e);
    }
    // Inventory Browser V2 (eLabSDK2): a button under the "+ Add Sample" button. Per the SDK2 recipe,
    // registerAddSampleAction places a launcher button whose onClick can run anything (here: open our
    // dialog); the sampleData argument is ignored because we create samples from a file, not from the
    // add-sample form. SDK2 is BETA, so this is feature-detected and wrapped rather than assumed.
    try {
      if (typeof eLabSDK2 !== 'undefined' && eLabSDK2.Inventory && eLabSDK2.Inventory.Sample &&
        eLabSDK2.Inventory.Sample.SampleList &&
        typeof eLabSDK2.Inventory.Sample.SampleList.registerAddSampleAction === 'function') {
        eLabSDK2.Inventory.Sample.SampleList.registerAddSampleAction({
          id: 'bptLauncher',
          label: 'Bioprint Tracker',
          title: 'Register a RASTRUM bioprint (protocol and its barcoded plates)',
          icon: 'fas fa-print',
          onClick() { addon.showMainDialog(); },
          isVisible() { return true; }
        });
        installed = true;
      }
    } catch (e) {
      console.warn('Bioprint Tracker: Inventory Browser V2 button not available in this context:', e);
    }
    return installed;
  }

  // True when BOTH sample types can be found for the active group (or a numeric ID override is set).
  // Never rejects. Drives the launcher's "finish setup" nudge. Relies on resolveSampleTypeID caching
  // only SUCCESSES, so an un-set-up group is re-checked on every launcher open (the nudge clears
  // itself once an admin runs setup), while a set-up group is served instantly from cache. We do NOT
  // cache a yes/no flag ourselves, precisely so a stale "not ready" can't linger.
  function isTenantConfigured() {
    return Promise.all([
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PROTOCOL, 'Bioprint Template'),
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PLATE, 'Bioprinted Plate')
    ]).then(() => true, () => false);
  }

  addon.showMainDialog = () => {
    const buttons = [
      { label: 'Upload protocol', fn() { closeModal(); addon.showProtocolDialog(); } },
      { label: 'Log print run', fn() { closeModal(); addon.showRunDialog(); } }
    ];
    showDialog({
      width: 440, title: `Bioprint Tracker (v${ADDON_VERSION})`,
      // The everyday actions are the primary buttons. Setup is NOT a primary button (it would clutter
      // the menu everyone sees every day): instead a quiet "Set up / check" link sits at the bottom
      // for admins, and, only when this group is not set up yet, a prominent nudge appears above,
      // injected asynchronously so the common (already-set-up) case renders with no delay.
      content:
        '<div id="bpt-setup-nudge"></div>' +
        '<p class="bpt-hint">What would you like to do?</p>' +
        '<p class="bpt-hint" style="margin:14px 0 0;font-size:12px;opacity:0.75;">' +
          'Admin: <a href="#" id="bpt-setup-link">Set up / check</a> the sample types and file folder.</p>',
      customButtons: buttons,
      afterRender() {
        const link = document.getElementById('bpt-setup-link');
        if (link) link.onclick = e => {
          if (e && e.preventDefault) e.preventDefault();
          closeModal(); addon.showSetupHub();
        };
        isTenantConfigured().then(ready => {
          if (ready) return;
          const box = document.getElementById('bpt-setup-nudge');
          if (!box) return;
          box.innerHTML =
            '<div style="border:1px solid #e0b34d;background:#fdf6e3;border-radius:6px;padding:10px 12px;margin:0 0 12px;">' +
              '<p class="bpt-hint" style="margin:0 0 8px;color:#7a5b00;"><b>Not set up for your group yet.</b> ' +
              'Before this add-on can be used here, a <b>group administrator</b> needs to create its two ' +
              'sample types once (and, optionally, choose a file folder). Sample types belong to a group, ' +
              'so each group is set up separately.</p>' +
              '<button id="bpt-nudge-setup" class="bpt-btn bpt-btn-primary" style="margin:0;">Set up now</button>' +
            '</div>';
          const b = document.getElementById('bpt-nudge-setup');
          if (b) b.onclick = () => { closeModal(); addon.showSetupHub(); };
        });
      }
    });
  };

  // The setup "hub": one place that gathers the one-time admin tasks, reached from the launcher's
  // "Set up / check" button or the #bioprinting-setup hash. Each button opens the relevant dialog;
  // the descriptions above them say, in plain language, what each does and who can run it.
  addon.showSetupHub = () => {
    showDialog({
      width: 480, title: 'Bioprint Tracker setup',
      content: '<p class="bpt-hint" style="margin:0 0 10px;">One-time setup, normally done once per ' +
        'lab by an administrator. Choose a task:</p>' +
        '<ul class="bpt-hint" style="margin:0;padding-left:18px;">' +
          '<li><b>Set up sample types</b> — creates the two record types this add-on needs, with all ' +
            'their fields. Needs an administrator account.</li>' +
          '<li><b>Check sample types</b> — confirms those types and their fields are complete. Only ' +
            'looks; changes nothing.</li>' +
          '<li><b>Choose file folder</b> — picks the Data Storage folder that uploaded files go into, ' +
            'and saves the choice.</li>' +
        '</ul>',
      customButtons: [
        { label: 'Set up sample types', fn() { closeModal(); addon.setupSampleTypes(); } },
        { label: 'Check sample types', fn() { closeModal(); addon.checkSampleTypes(); } },
        { label: 'Choose file folder', fn() { closeModal(); addon.showFolderIdFinder(); } }
      ]
    });
  };

  // Collapse a file list into one entry per Data Storage folder. There is no list-folders and no
  // folder-by-NAME endpoint (confirmed by eLabNext dev support 2026-07-24), so the only way to
  // surface a folder is to read the `folderID` off files that already sit in it. Folders are
  // therefore identified by an EXAMPLE FILENAME they contain: recognising a file you put there is how
  // you tell one folder from another. A folder with no files in it cannot appear at all, which is why
  // the dialog also offers manual entry. Busiest folder first. Pure, so it is unit-tested.
  // Shorten a filename from the MIDDLE, so both the start and the distinguishing tail survive
  // ("2026-07-22_Allegro_newconfig_4f8b7f_wellplate.csv" -> "2026-07-22_Alle…_wellplate.csv"). Cutting
  // the end instead would leave a column of names that all begin identically and cannot be told apart.
  function shortenMiddle(name, max) {
    const s = String(name == null ? '' : name);
    if (s.length <= max) return s;
    const keepEnd = Math.max(6, Math.floor((max - 1) / 2));
    const keepStart = max - 1 - keepEnd;
    return `${s.slice(0, keepStart)}…${s.slice(s.length - keepEnd)}`;
  }

  function groupFilesByFolder(files) {
    const byFolder = {}, order = [];
    (files || []).forEach(f => {
      const id = (!f || f.folderID == null || f.folderID === 0) ? 0 : f.folderID;
      if (!byFolder[id]) { byFolder[id] = { id, count: 0, names: [] }; order.push(id); }
      byFolder[id].count++;
      const name = f && (f.filename || f.realName);
      if (byFolder[id].names.length < 3 && name) byFolder[id].names.push(name);
    });
    return order.map(id => byFolder[id]).sort((a, b) => b.count - a.count);
  }

  // Setup helper (hidden; #bioprinting-setup or console): lists the Data Storage folders that hold
  // files, with their numbers, and SAVES the chosen one as this add-on's configuration.
  //
  // It saves the value itself rather than sending the user to the platform's Configure dialog. That
  // dialog rendered empty in a production tenant while working in the sandbox (2026-07-31), which left the
  // folder unsettable; writing through the API does not depend on the configuration schema being
  // delivered to the install. See saveStoredConfig. Saving is refused by the server (403) for a user
  // who may not edit the install's configuration, and is unavailable when side-loading (no installed
  // record, so no sdkPluginID); both are reported in the dialog rather than failing quietly.
  addon.showFolderIdFinder = () => {
    let current = CONFIG.PDF_FOLDER_ID || 0;
    const describe = id => (id ? `folder number ${esc(id)}` : 'the main file area (no folder chosen)');
    showDialog({
      width: 640, title: 'Choose your file folder',
      btnCancelLabel: 'Back', onCancel() { addon.showSetupHub(); },
      content:
        `<p class="bpt-hint" style="margin:0 0 10px;">Files are being saved in: <b id="bpt-folder-current">${describe(current)}</b>.</p>` +
        '<p class="bpt-hint" style="margin:0 0 12px;">Keeping uploaded files in one folder needs that ' +
        'folder’s <b>number</b>. eLabNext doesn’t show folder numbers directly, so:</p>' +
        // Steps are numbered in the markup rather than by <ol>: the host stylesheet strips list
        // markers, which left the instructions as unnumbered indented lines.
        '<div class="bpt-hint bpt-steps">' +
          '<div><b>1.</b> In <b>Data Storage</b>, open the folder you want to use and put any file ' +
            'in it (for example a file called <code>bioprinting.txt</code>).</div>' +
          '<div><b>2.</b> Find that file in the list below and press <b>Use this folder</b> next ' +
            'to it.</div>' +
        '</div>' +
        '<div id="bpt-folder-list"><p class="bpt-hint">Loading folders…</p></div>' +
        '<div id="bpt-folder-status" style="margin:10px 0 0;"></div>',
      // There is deliberately no "type a folder number" box. A typed number cannot be checked: there
      // is no endpoint to confirm a folder exists or belongs to this group, and placement is accepted
      // only at upload with no way to move a file afterwards, so one typo would send every later
      // upload somewhere unrecoverable. Every button below points at a folder we have just read files
      // out of, so it is known to exist. A folder holding no files cannot be listed at all, which is
      // why the instructions above say to drop a marker file into it first.
      afterRender() {
        const box = document.getElementById('bpt-folder-list');
        const statusBox = document.getElementById('bpt-folder-status');
        let rows = [], installedRecord = null;

        function status(html, kind) {
          if (!statusBox) return;
          const colour = kind === 'error' ? '#b91c1c' : (kind === 'ok' ? '#15803d' : '#64748b');
          statusBox.innerHTML = `<p class="bpt-hint" style="margin:0;color:${colour};font-weight:600;">${html}</p>`;
        }
        function setButtonsDisabled(disabled) {
          const btns = document.querySelectorAll('[data-bpt-folder]');
          Array.prototype.forEach.call(btns, b => { b.disabled = disabled; });
        }

        // Redrawn after every save, not only on open: the chosen row has to carry the "in use" mark
        // and lose its button, and the previously chosen row has to give both up. Updating only the
        // line at the top would leave the table contradicting it until the dialog was reopened.
        function renderTable() {
          if (!rows.length) {
            box.innerHTML = '<p class="bpt-hint">No files found yet, so there are no folders to show. ' +
              'Put a file into the folder you want to use in Data Storage, then open this again.</p>';
            return;
          }
          box.innerHTML = `<table class="bpt-table bpt-folder-table"><colgroup><col style="width:88px;"><col><col style="width:48px;"><col style="width:124px;"></colgroup><tr><th>Folder</th><th>Example file(s) in it</th><th>Files</th><th></th></tr>${rows.map(r => {
            const label = r.id === 0 ? '<i>main file area</i>' : esc(r.id);
            const isCur = String(r.id) === String(current) || (r.id === 0 && !current);
            // Print filenames are long (a full RASTRUM export name runs past 40 characters), and
            // three of them wrapped over several lines and crushed the other columns. Two, each
            // shortened in the middle so the distinctive tail stays visible, is enough to recognise
            // a folder by. The full list is on the cell's tooltip.
            const shown = r.names.slice(0, 2).map(n => shortenMiddle(n, 30));
            const eg = r.names.length
              ? esc(shown.join(', ')) + (r.count > shown.length ? ', …' : '')
              : '—';
            const egFull = r.names.length ? ` title="${esc(r.names.join(', '))}"` : '';
            // The "in use" mark lives with the folder name, not in the button column, so it is still
            // shown when saving is unavailable (side-loading) and that column is empty.
            const mark = isCur ? '<div style="color:#15803d;font-weight:700;font-size:11px;">✓ in use</div>' : '';
            const action = (!installedRecord || isCur) ? ''
              : `<button type="button" class="bpt-btn bpt-btn-secondary" style="margin:0;padding:5px 10px;white-space:nowrap;" data-bpt-folder="${esc(r.id)}">Use this folder</button>`;
            // The chosen row is marked three ways (tint, left rule, and the tick) rather than by
            // colour alone, which would be invisible to a colourblind reader and easy to miss.
            const rowStyle = isCur
              ? ' style="background:#eef6ff;box-shadow:inset 3px 0 0 #4f46e5;"'
              : '';
            return `<tr${rowStyle}><td style="white-space:nowrap;"><b>${label}</b>${mark}</td><td style="overflow-wrap:anywhere;"${egFull}>${eg}</td><td>${esc(r.count)}</td><td>${action}</td></tr>`;
          }).join('')}</table>`;
          const btns = document.querySelectorAll('[data-bpt-folder]');
          Array.prototype.forEach.call(btns, b => {
            b.onclick = () => { save(parseInt(b.getAttribute('data-bpt-folder'), 10) || 0); };
          });
        }

        // Saving replaces the whole stored configuration, so failures must be visible, never assumed.
        function save(id) {
          setButtonsDisabled(true);
          status('Saving…');
          saveStoredConfig({ pdfFolderID: id }).then(() => {
            CONFIG.PDF_FOLDER_ID = id;
            current = id;
            const line = document.getElementById('bpt-folder-current');
            if (line) line.innerHTML = describe(id);
            renderTable();
            status(`Saved. New uploads will go to <b>${describe(id)}</b>. Files already uploaded stay ` +
              'where they are: eLabNext has no way to move a file between folders.', 'ok');
          }).catch(err => {
            setButtonsDisabled(false);
            const msg = (err && err.message) || String(err);
            if (/\(403\)|forbidden/i.test(msg)) {
              status('Not saved: your account is not allowed to change this add-on’s settings. Ask an ' +
                'eLabNext administrator to choose the folder, or to install the add-on for your group.',
                'error');
            } else {
              status(`Not saved: ${esc(msg)}`, 'error');
            }
          });
        }

        // The installed record is fetched alongside the file list because its sdkPluginID is what the
        // configuration is stored against. Without it the numbers are still worth showing, so a
        // failure disables saving rather than emptying the dialog.
        Promise.all([
          listFiles().then(f => ({ files: f }), err => ({ error: err })),
          getInstalledAddon().then(a => a, () => null)
        ]).then(res => {
          const filesResult = res[0];
          installedRecord = res[1];
          if (filesResult.error) {
            box.innerHTML = `<p class="bpt-error">Could not list files: ${esc(filesResult.error.message)}</p>`;
          } else {
            rows = groupFilesByFolder(filesResult.files);
            renderTable();
          }
          if (!installedRecord) {
            status('This add-on is not installed in this environment (side-loading does this), so the ' +
              'choice cannot be saved from here. Note the number and set it in the add-on’s Configure ' +
              'screen instead.', 'error');
          }
        });
      }
    });
  };

  // Draw the results of a setup or check run into the given box, in plain language. `results` is a
  // list of {name, action, typeID?, fieldCount?, error?, check?}. Shared by setupSampleTypes and
  // checkSampleTypes (the wording works for both, so no setup-vs-check flag is needed).
  function renderSampleTypeResults(boxId, results) {
    const box = document.getElementById(boxId);
    if (!box) return;
    // Inline coloured text (not the .bpt-error alert box, which would render as a full red panel).
    const BAD = 'color:#b91c1c;font-weight:600', GOOD = 'color:#15803d;font-weight:600';
    let anyForbidden = false, anyProblem = false;
    const rows = results.map(r => {
      let status = '', note = '';
      if (r.action === 'forbidden') {
        anyForbidden = true;
        status = `<span style="${BAD}">Not done (needs an admin account)</span>`;
      } else if (r.action === 'failed') {
        anyProblem = true;
        status = `<span style="${BAD}">Something went wrong</span>`;
        note = esc(r.error || '');
      } else if (r.action === 'missing') {
        anyProblem = true;
        status = `<span style="${BAD}">Not set up yet</span>`;
        note = 'This type does not exist. Run the setup to create it.';
      } else {
        // created / updated / exists: show the field check.
        const base = r.action === 'created' ? 'Created' : (r.action === 'updated' ? 'Updated' : 'Already set up');
        const c = r.check || {};
        const added = (r.added && r.added.length) ? `Added ${r.added.length} field(s): ${esc(r.added.join(', '))}.` : '';
        if (c.readFailed) {
          status = base;
          note = `${added} Could not re-check the fields.`.trim();
        } else if ((c.missing && c.missing.length) || (c.mismatched && c.mismatched.length)) {
          anyProblem = true;
          status = `<span style="${BAD}">${base}, needs attention</span>`;
          const parts = [];
          if (added) parts.push(added);
          if (c.missing && c.missing.length) parts.push(`Still missing: ${esc(c.missing.join(', '))}`);
          if (c.mismatched && c.mismatched.length) parts.push(`Wrong type: ${esc(c.mismatched.map(m => `${m.key} (should be ${prettyType(m.expected)}, is ${prettyType(m.got)})`).join('; '))}`);
          note = parts.join(' ');
        } else {
          status = `<span style="${GOOD}">${base}, all ${esc(c.ok)} fields correct</span>`;
          if (added) note = added;
        }
      }
      return `<tr><td>${esc(r.name)}</td><td>${status}${note ? `<br><span class="bpt-hint">${note}</span>` : ''}</td></tr>`;
    }).join('');
    const footer = anyForbidden
      ? '<p class="bpt-hint">Creating or changing sample types requires an <b>administrator</b> account. ' +
        'Ask an admin to run this (open Inventory with <code>#bioprinting-setup-types</code> in the address).</p>'
      : anyProblem
        ? '<p class="bpt-hint">Fix the items marked above by hand in <b>Configuration → Sample types</b> ' +
          '(add any still-missing field, or correct a wrong-type field), then run this again to confirm.</p>'
        : '<p class="bpt-hint">Everything is set up correctly. You can start uploading protocols and ' +
          'logging print runs.</p>';
    box.innerHTML = `<table class="bpt-table"><tr><th>Sample type</th><th>Status</th></tr>${rows}</table>${footer}`;
  }

  // Setup helper (hidden; #bioprinting-setup-types or console BioprintTracker.setupSampleTypes()):
  // create the two required sample types and their fields, so an admin doesn't have to build them by
  // hand, then check every field came through with the right type. No client-side role gate (there is
  // no working role API, see isForbidden); it attempts creation and reports a 403 as "needs an admin
  // account". A type that already exists has any MISSING fields added, then is re-checked; a field that
  // exists with the wrong type is reported, not changed (changing a field's type is not safe to automate).
  addon.setupSampleTypes = () => {
    const names = Object.keys(REQUIRED_SAMPLE_TYPE_FIELDS);
    showDialog({ width: 560, title: 'Set up sample types',
      btnCancelLabel: 'Back', onCancel() { addon.showSetupHub(); },
      content: `<div id="bpt-setup-status"><p class="bpt-hint">Working on ${esc(names.length)} sample types…</p></div>` });
    const results = [];
    let chain = Promise.resolve();
    names.forEach(name => {
      chain = chain.then(() => {
        const required = REQUIRED_SAMPLE_TYPE_FIELDS[name];
        // If the type exists, top up any MISSING fields (adding a field is non-destructive), then
        // re-check. If it does not exist, create it with all its fields. A field that exists with the
        // WRONG type is reported, not auto-changed (changing a field's type is not safe to automate).
        return resolveSampleTypeID(0, name).then(id => getSampleTypeMetaMap(id).then(map => {
          const check = checkTypeFields(map, required);
          const missing = (check && check.missing) || [];
          if ((check && check.readFailed) || !missing.length) {
            results.push({ name, action: 'exists', typeID: id, check });
            return undefined;
          }
          const toAdd = required.filter(f => missing.indexOf(f.key) !== -1);
          return addFieldsToType(id, toAdd).then(() => getSampleTypeMetaMap(id, true).then(map2 => {
            results.push({ name, action: 'updated', typeID: id, added: toAdd.map(f => f.key), check: checkTypeFields(map2, required) });
          }), err => {
            results.push({ name, action: isForbidden(err) ? 'forbidden' : 'failed', error: err.message });
          });
        }), () => createSampleTypeWithFields(name, required, REQUIRED_SAMPLE_TYPE_DESCRIPTIONS[name]).then(r => getSampleTypeMetaMap(r.typeID).then(map => {
          results.push({ name, action: 'created', typeID: r.typeID,
            fieldCount: r.fieldCount, check: checkTypeFields(map, required) });
        }), err => {
          results.push({ name, action: isForbidden(err) ? 'forbidden' : 'failed', error: err.message });
        }));
      });
    });
    chain.then(() => { renderSampleTypeResults('bpt-setup-status', results); });
  };

  // Check helper (hidden; #bioprinting-check-types or console BioprintTracker.checkSampleTypes()):
  // READ-ONLY, never creates or changes anything. For each required type it looks up the type by
  // name and reports whether every field is present with the right type, so an admin can confirm a
  // hand-built (or previously auto-built) setup is complete.
  addon.checkSampleTypes = () => {
    const names = Object.keys(REQUIRED_SAMPLE_TYPE_FIELDS);
    showDialog({ width: 560, title: 'Check sample types',
      btnCancelLabel: 'Back', onCancel() { addon.showSetupHub(); },
      content: `<div id="bpt-check-status"><p class="bpt-hint">Checking ${esc(names.length)} sample types…</p></div>` });
    const results = [];
    let chain = Promise.resolve();
    names.forEach(name => {
      chain = chain.then(() => {
        const required = REQUIRED_SAMPLE_TYPE_FIELDS[name];
        return resolveSampleTypeID(0, name).then(id => getSampleTypeMetaMap(id).then(map => {
          results.push({ name, action: 'exists', typeID: id, check: checkTypeFields(map, required) });
        }), () => {
          results.push({ name, action: 'missing' });
        });
      });
    });
    chain.then(() => { renderSampleTypeResults('bpt-check-status', results); });
  };

  // ─── Flow 1: upload a .rastrum and register it as a protocol Sample ──────────
  // Looks for an already-registered protocol with the same source-file hash, so re-uploading the
  // exact same .rastrum warns instead of silently creating a duplicate. Best-effort: on any list
  // error (or no hash) it resolves null, and the upload proceeds normally, it never falsely blocks.
  function findProtocolByHash(protocolTypeID, hash) {
    if (!hash) return Promise.resolve(null);
    return listSamplesByType(protocolTypeID).then(list => list.filter(p => metaValueByName(p.meta, 'Source file hash') === hash)[0] || null).catch(() => null);
  }

  // `prefill` (optional {name, printer}) lets "Back" from the confirm step reopen this dialog
  // without losing what was typed, only the file itself can't be restored (browsers block
  // scripts from setting a file input's value), so that one still needs re-choosing.
  addon.showProtocolDialog = prefill => {
    prefill = prefill || {};
    // Check the Bioprint Template sample type is resolvable BEFORE showing the form, otherwise
    // someone could pick a file, type a name, and only discover the setup problem after all that,
    // at the very last step. Fail fast and clearly instead, same pattern as showRunDialog.
    resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PROTOCOL, 'Bioprint Template').then(typeID => {
      addon.showProtocolForm(prefill, typeID);
    }).catch(err => { showError('Not set up yet', err.message); });
  };

  addon.showProtocolForm = (prefill, protocolTypeID) => {
    showDialog({
      width: 520, title: 'Upload a print protocol',
      // "Back" rather than "Close": this dialog is reached from the launcher menu, so the way out of
      // a wrong choice is the menu, not the whole add-on. Anything typed here is discarded, the same
      // as before, since nothing has been saved yet at this point.
      btnCancelLabel: 'Back', onCancel() { addon.showMainDialog(); },
      content:
        // Printer version (RASTRUM vs Allegro) is NOT asked here, it is detected from the file on
        // parse and shown in the next step. The physical printer (the named machine) is chosen
        // later, at log time, not at protocol upload.
        // Live full-name preview: shows the name that will actually be saved, updating as the label
        // is typed, this replaces any explanatory text, since it demonstrates the auto-added
        // date/version/fingerprint directly. Version + fingerprint fill in once a file is chosen;
        // before that they show as muted placeholder words so the shape is clear.
        `<div class="bpt-stack">${field('Protocol name *', 'inp-name', 'text', 'e.g. Large Plug v2', prefill.name)}<div id="bpt-name-preview-wrap" style="display:none;margin:4px 0 2px;"><div class="bpt-eyebrow">Will be saved as</div><div class="bpt-name" id="bpt-name-preview" style="font-size:14px;"></div></div>${field('.rastrum file *', 'inp-file', 'file', '', undefined, 'accept=".rastrum"')}<div id="bpt-err" class="bpt-error" style="display:none;"></div></div>`,
      afterRender() {
        const fileEl = document.getElementById('inp-file');
        const nameEl = document.getElementById('inp-name');
        const nameWrap = document.getElementById('bpt-name-preview-wrap');
        const namePrev = document.getElementById('bpt-name-preview');
        if (!fileEl) return;
        // Detected once a file is parsed; until then the name preview uses placeholders. No summary
        // card is shown here, Continue leads straight to the full (non-committing) Confirm screen,
        // which already previews everything; a second inline summary would just duplicate it. The
        // background parse below exists ONLY to fill the real version + fingerprint into the name
        // preview before Continue.
        let lastFormat = '', lastHash = '';
        function refreshName() {
          if (!nameEl || !nameWrap || !namePrev) return;
          const label = nameEl.value.trim();
          // Nothing to show until the user starts typing a label.
          if (!label) { nameWrap.style.display = 'none'; return; }
          nameWrap.style.display = 'block';
          // Mirror buildProtocolName's shape: {date}_{version}_{slug}_{hash6}, always joined by "_".
          // The version + fingerprint come from the file, so before one is chosen they show as MUTED
          // placeholder words (not literal characters like "/" or dots, which read as part of the
          // name). Once the file is parsed they are replaced by the real saved values.
          function ph(word) { return `<span style="opacity:.45;font-style:italic;">${word}</span>`; }
          const vHtml = lastFormat ? esc(lastFormat) : ph('version');
          const hHtml = lastHash ? esc(lastHash.slice(0, 6)) : ph('fingerprint');
          namePrev.innerHTML = `${esc(todayISO())}_${vHtml}_${esc(slugify(label))}_${hHtml}`;
        }
        if (nameEl) nameEl.addEventListener('input', refreshName);
        refreshName();
        fileEl.addEventListener('change', () => {
          const f = fileEl.files && fileEl.files[0];
          lastFormat = ''; lastHash = ''; refreshName();
          if (!f) return;
          const reader = new FileReader();
          reader.onload = e => {
            parseRastrum(e.target.result).then(parsed => {
              lastFormat = parsed.format || 'RASTRUM';
              lastHash = parsed.file_hash || '';
              refreshName();
            }).catch(() => { /* a bad file is surfaced with full guidance on Continue */ });
          };
          reader.readAsArrayBuffer(f);
        });
      },
      customButtons: [{ label: 'Continue', fn() {
        const errEl = document.getElementById('bpt-err'); errEl.style.display = 'none';
        const fileEl = document.getElementById('inp-file');
        const file = fileEl && fileEl.files[0];
        const name = val('inp-name');
        if (!file) { errEl.textContent = 'Please choose a .rastrum file.'; errEl.style.display = 'block'; return; }
        if (!name) { errEl.textContent = 'Please enter a protocol name.'; errEl.style.display = 'block'; return; }
        const reader = new FileReader();
        reader.onload = e => {
          parseRastrum(e.target.result)
            .then(parsed => {
              if (!parsed.recognized) {
                showDialog({
                  width: 520, title: '⚠ This file looks different than expected',
                  onCancel() { closeModal(); addon.showProtocolForm({ name }, protocolTypeID); },
                  content:
                    '<div>' +
                      '<p style="margin:0 0 10px;">This add-on could not find the details it ' +
                      'normally reads from a print file, like the print model, the plate type, or ' +
                      'the fluids used.</p>' +
                      '<p style="margin:0 0 10px;"><b>This does not mean your print failed.</b> It ' +
                      'usually means the printing software has changed how it saves this file since ' +
                      'this add-on was last updated, and the add-on has not caught up yet.</p>' +
                      '<p style="margin:0 0 10px;"><b>What to do:</b></p>' +
                      '<ul style="margin:0 0 10px;padding-left:20px;">' +
                        '<li><b>Do not rely on "Save anyway"</b> — it would save this protocol with ' +
                        'the details blank, which looks like a real record but is missing information.</li>' +
                        '<li><b>Keep the original file</b> you tried to upload (do not delete it) and ' +
                        '<b>send it to whoever maintains this add-on</b> so it can be updated to read ' +
                        'this new format.</li>' +
                        '<li>Once that is done, you can upload this same file again and it will save ' +
                        'correctly.</li>' +
                      '</ul>' +
                    '</div>',
                  btnCancelLabel: 'Cancel (recommended)',
                  customButtons: [{ label: 'Save anyway (fields will be blank)', fn() {
                    closeModal(); addon.confirmProtocol(parsed, name, parsed.format, protocolTypeID, file && file.name);
                  } }]
                });
                return;
              }
              // Warn if this exact file is already registered, instead of silently duplicating it.
              findProtocolByHash(protocolTypeID, parsed.file_hash).then(existing => {
                if (!existing) { addon.confirmProtocol(parsed, name, parsed.format, protocolTypeID, file && file.name); return; }
                showDialog({
                  width: 480, title: 'This protocol is already registered',
                  onCancel() { closeModal(); addon.showProtocolForm({ name }, protocolTypeID); },
                  content: `<p>This exact print file is already in Inventory as <b>${esc(existing.name)}</b> (same file fingerprint).</p><p class="bpt-hint">Uploading it again would create a duplicate protocol. Use the existing one, or save a copy anyway if you really intend a second record.</p>`,
                  btnCancelLabel: 'Back',
                  customButtons: [{ label: 'Save a copy anyway', fn() {
                    closeModal(); addon.confirmProtocol(parsed, name, parsed.format, protocolTypeID, file && file.name);
                  } }]
                });
              });
            })
            .catch(err => { showError('Parse error', `Could not parse the file: ${err.message}`); });
        };
        reader.readAsArrayBuffer(file);
      } }]
    });
  };

  addon.confirmProtocol = (parsed, name, format, protocolTypeID, fileName) => {
    format = format || parsed.format || 'RASTRUM';
    // Format a cells/mL value (or a comma-joined set of them) with thousands separators. Join a set
    // with " · ", NOT a comma, otherwise the separator collides with the thousands commas and
    // "2,000,000, 3,000,000" reads ambiguously (could look like four numbers).
    function fmtConc(v) {
      if (!v) return '';
      return String(v).split(',').map(n => {
        const num = parseInt(String(n).replace(/[^\d]/g, ''), 10);
        return isNaN(num) ? String(n).trim() : num.toLocaleString('en-US');
      }).filter(Boolean).join(' · ');
    }
    // Overview leads with the human-readable science: what material (matrix code), which cells, which
    // plate. The raw fluid codes, print pressures, plate code, and provenance sit under "Technical
    // details" below, so a non-coder sees the meaningful summary first and can expand for the rest.
    function sf(label, valHtml, span2) {
      return `<div class="bpt-sf${span2 ? ' bpt-sf-2' : ''}"><div class="bpt-sf-label">${esc(label)}</div>${valHtml}</div>`;
    }
    function chipRow(str, cls) {
      const parts = String(str || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!parts.length) return '<span class="bpt-sf-val">—</span>';
      return `<div class="bpt-chips">${parts.map(p => `<span class="bpt-chip ${cls}">${esc(p)}</span>`).join('')}</div>`;
    }
    function plainVal(v) { return `<span class="bpt-sf-val">${esc(v)}</span>`; }
    const summaryGrid = `<div class="bpt-summary">${sf('Print model', plainVal(parsed.print_model || '—'))}${sf('Matrix code', parsed.matrix_codes ? chipRow(parsed.matrix_codes, 'bpt-chip-matrix')
  : plainVal(format === 'Allegro' ? '—' : 'Not recorded in RASTRUM files (Allegro only)'))}${sf('Cell line', parsed.cell_line ? chipRow(parsed.cell_line, 'bpt-chip-cell') : plainVal('—'))}${sf('Cell concentration', plainVal(parsed.cell_concentration
  ? `${fmtConc(parsed.cell_concentration)} cells/mL` : '—'))}${sf('Wellplate', plainVal(parsed.wellplate_display || parsed.wellplate || '—'), true)}</div>`;
    const techRows = [
      ['Bioink (fluid)', parsed.fluid_bioink || '-'],
      ['Activator (fluid)', parsed.fluid_cell || '-'],
      ['Inert base bioink', parsed.fluid_bioink_base || '-'],
      ['Inert base activator', parsed.fluid_activator || '-'],
      ['Bioink pressure', `${parsed.pp_bioink.Pressure || '-'} kPa`],
      ['Bioink open time', `${parsed.pp_bioink.OpenTime || '-'} us`],
      ['Activator pressure', `${parsed.pp_cell.Pressure || '-'} kPa`],
      ['Activator open time', `${parsed.pp_cell.OpenTime || '-'} us`],
      ['Wellplate code', parsed.wellplate || '-'],
      ['Schema version', parsed.schema_version || '-'],
      ['Source file', parsed.source_files || '-'],
      ['File hash', parsed.file_hash ? `${parsed.file_hash.slice(0, 16)}…` : '-']
    ].map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
    const fullName = buildProtocolName(name, format, parsed.file_hash);
    // Keep only the facts that matter here: how many plates this file lays out, and whether any wells
    // could not be resolved. The old "Uniform / Structured · N regions" qualifier was dropped, it
    // classified only by model+matrix, so a plate with several cell lines/concentrations still read
    // "Uniform · one printed condition", which was misleading. The plate map below shows the real
    // layout.
    const noteParts = [];
    if (parsed.wellplate_plate_count > 1) {
      noteParts.push(`<b>${esc(parsed.wellplate_plate_count)} plates</b> in this run`);
    }
    if (parsed.wellplate_unresolved_count) {
      noteParts.push(`<b>${esc(parsed.wellplate_unresolved_count)} unresolved</b>`);
    }
    const wellplateNote = (parsed.wellplate_row_count && noteParts.length)
      ? `<p class="bpt-hint" style="margin:14px 0 0;">${noteParts.join(' &nbsp;·&nbsp; ')}</p>`
      : '';
    showDialog({
      width: parsed.wellplate_row_count ? 760 : 580, title: 'Confirm protocol',
      // Going back re-opens the file picker with the name/printer preserved. The file itself can't
      // be restored (browsers block scripts from setting a file input), so it has to be re-chosen.
      onCancel() { closeModal(); addon.showProtocolForm({ name }, protocolTypeID); },
      content:
        // Printer version is detected from the file (not typed). Show it as a badge alongside the
        // uploaded file name so the user can confirm the file was read as the expected generation.
        `<div class="bpt-eyebrow">Protocol name</div><div class="bpt-name">${esc(fullName)}</div><div class="bpt-hint" style="margin:2px 0 10px;"><span class="bpt-chip bpt-chip-cell" style="margin-right:6px;">${esc(format)}</span>${fileName ? `from file <b>${esc(fileName)}</b>` : ''}</div><div class="bpt-speccard">${summaryGrid}</div>${wellplateNote}${parsed.wellplate_row_count
  ? '<details class="bpt-details" open style="margin-top:14px;"><summary>Plate map</summary>' +
    '<div id="bpt-platemap" style="margin-top:12px;"></div></details>'
  : ''}<details class="bpt-details" style="margin-top:20px;border-top:1px solid #eef1f5;padding-top:16px;"><summary>Technical details</summary><table class="bpt-table" style="margin-top:8px;">${techRows}</table></details>`,
      afterRender() {
        if (parsed.wellplate_row_count) {
          renderPlateMapInto(parsed.wellplate_rows, document.getElementById('bpt-platemap'));
        }
      },
      btnCancelLabel: 'Back',
      customButtons: [{ label: 'Save protocol', fn() {
        closeModal();
        // Store the human plate name with the code kept in brackets for traceability.
        const wellplateValue = (parsed.wellplate_display || parsed.wellplate || '') +
          (parsed.wellplate && parsed.wellplate_display ? ` [${parsed.wellplate}]` : '');
        const metas = [
          // Printer VERSION (RASTRUM/Allegro), detected from the file, not the physical machine.
          metaField('Printer version', 'TEXT', format),
          metaField('Print model', 'TEXT', parsed.print_model),
          metaField('Matrix code', 'TEXT', parsed.matrix_codes),
          metaField('Cell line', 'TEXT', parsed.cell_line),
          metaField('Cell concentration (cells/mL)', 'TEXT', parsed.cell_concentration),
          metaField('Wellplate', 'TEXT', wellplateValue),
          metaField('Bioink', 'TEXT', parsed.fluid_bioink),
          metaField('Activator', 'TEXT', parsed.fluid_cell),
          metaField('Inert base bioink', 'TEXT', parsed.fluid_bioink_base),
          metaField('Inert base activator', 'TEXT', parsed.fluid_activator),
          metaField('Bioink pressure (kPa)', 'NUMERIC', parsed.pp_bioink.Pressure),
          metaField('Bioink open time (us)', 'NUMERIC', parsed.pp_bioink.OpenTime),
          metaField('Activator pressure (kPa)', 'NUMERIC', parsed.pp_cell.Pressure),
          metaField('Activator open time (us)', 'NUMERIC', parsed.pp_cell.OpenTime),
          metaField('RASTRUM schema version', 'TEXT', parsed.schema_version),
          metaField('Source file hash', 'TEXT', parsed.file_hash)
          // NB: 'Designed plates (JSON)' is intentionally NOT written here. The attached 'Print file'
          // (raw .rastrum, re-parsed at log time) is the single source of truth, so the denormalised
          // JSON blob would just duplicate it and can go stale. It is written ONLY as a fallback below,
          // when the .rastrum attach fails, see withRaw. Old records that still carry the blob are
          // still read by loadProtocolDetails.
        ];

        // Attach the human-readable protocol PDF, best-effort: a failed upload should not stop the
        // protocol itself from saving. Attaching a FILE meta needs a fileID that only exists once
        // uploaded, so this must happen (and either succeed or be skipped) before the sample create.
        const safeName = fullName.replace(/[^\w.\- ]+/g, '_');
        const withPdf = parsed.pdf_bytes
          ? uploadFile(`${safeName}.pdf`, parsed.pdf_bytes)
              .then(fileID => { metas.push(metaFile('Protocol PDF', fileID)); })
              .catch(err => { console.warn('Bioprint Tracker: PDF attach failed, saving without it:', err); })
          : Promise.resolve();

        // Same best-effort pattern for the well-by-well CSV (Allegro only; see buildAllegroWellplateRows).
        const withCsv = parsed.wellplate_csv ? (() => {
              const enc = new TextEncoder();
              return uploadFile(`${safeName}_wellplate.csv`, enc.encode(parsed.wellplate_csv).buffer)
                .then(fileID => { metas.push(metaFile('Wellplate summary (CSV)', fileID)); })
                .catch(err => { console.warn('Bioprint Tracker: wellplate CSV attach failed, saving without it:', err); });
            })() : Promise.resolve();

        // Attach the raw .rastrum itself, so logging can re-parse it later:
        // the file is the single source of truth, and parser improvements then apply to every existing
        // template without re-upload. The 'Designed plates (JSON)' blob is written ONLY as a fallback
        // here, when there is no raw file to attach, or its upload fails, so the normal case stays
        // free of the big denormalised blob but a layout is never lost.
        const designedBlob = metaField('Designed plates (JSON)', 'TEXT',
          JSON.stringify(parsed.designed_plates || []));
        let withRaw;
        if (parsed.raw_bytes) {
          withRaw = uploadFile(`${safeName}.rastrum`, parsed.raw_bytes)
            .then(fileID => { metas.push(metaFile('Print file', fileID)); })
            .catch(err => {
              console.warn('Bioprint Tracker: .rastrum attach failed; keeping the JSON-blob fallback:', err);
              metas.push(designedBlob);
            });
        } else {
          metas.push(designedBlob); // no raw file available -> the blob is the only layout source
          withRaw = Promise.resolve();
        }

        Promise.all([withPdf, withCsv, withRaw]).then(() => getSampleTypeMetaMap(protocolTypeID).then(map => {
          stampMetaIDs(metas, map);
          return apiCall('POST', 'samples',
            { sampleTypeID: protocolTypeID, name: fullName, sampleMetas: metas });
        })).then(sampleID => {
          // Verify the values actually persisted. eLabNext silently drops a value whose key does not
          // match a field defined on the sample type, so re-read the sample and report any text/numeric
          // field that we sent with a value but that did not come back. This turns today's silent-drop
          // confusion into a clear, actionable message naming the exact fields to add to the type.
          const expectedKeys = metas.filter(m => (m.sampleDataType === 'TEXT' || m.sampleDataType === 'NUMERIC') &&
            m.value != null && m.value !== '').map(m => m.key);
          return getSampleById(sampleID).then(raw => {
            const present = {};
            ((raw && raw.meta) || []).forEach(x => {
              if (x.value != null && x.value !== '') present[x.key] = true;
            });
            const missing = expectedKeys.filter(k => !present[k]);
            if (missing.length) {
              showDialog({ width: 500, title: 'Saved, but some fields did not stick',
                content: `<p>Protocol <b>${esc(fullName)}</b> was created, but ${esc(missing.length)} field value(s) were dropped because the <b>Bioprint Template</b> sample type has no field with exactly these names:</p><ul style="padding-left:20px;margin:8px 0;">${missing.map(k => `<li><code>${esc(k)}</code></li>`).join('')}</ul><p class="bpt-hint">An admin needs to add these as fields on the Bioprint Template sample type (Text), with these exact names, then upload this protocol again.</p>` });
            } else {
              showDialog({ width: 420, title: 'Protocol saved',
                content: `<p>Protocol <b>${esc(fullName)}</b> saved to Inventory, all fields stored.</p>` });
            }
          }).catch(() => {
            // Verification is best-effort; the save itself succeeded.
            showDialog({ width: 420, title: 'Protocol saved',
              content: `<p>Protocol <b>${esc(fullName)}</b> saved to Inventory.</p>` });
          });
        }).catch(err => { showError('Error', `Failed to save protocol: ${err.message}`); });
      } }]
    });
  };

  // ─── Flow 2: log a print run, create N barcoded plate Samples ───────────────
  // Distinct existing values of one field across all plate samples, for the pick-from-existing
  // dropdowns and the "did you mean?" typo guard on Condition / Cell line. Best-effort only: whether
  // the list-samples endpoint returns full sampleMetas or just a summary is unconfirmed; if it
  // doesn't, this quietly yields no suggestions rather than breaking the form.
  // This is the data-quality-by-construction defence: a re-used value is PICKED
  // (byte-identical, no re-typing), and a near-duplicate is caught before it silently splits one
  // value into two. It does NOT enforce a controlled vocabulary, genuinely new values are allowed.
  function distinctMetaValues(plates, key) {
    const set = {};
    // List items (SampleLarge) carry their fields under `meta`, same as the single-sample read.
    (plates || []).forEach(p => {
      (p.meta || []).forEach(m => {
        if (m.key === key && m.value) set[m.value] = true;
      });
    });
    return Object.keys(set).sort();
  }

  // Robust list of samples of one type. The list endpoint's exact filter param and response envelope
  // are not identical across tenants, so this accepts any of the common envelope shapes, then filters
  // client-side by sampleTypeID as a safety net in case the server ignores the query filter and
  // returns everything. It also logs the raw response, so an empty dropdown can be diagnosed from the
  // browser console (look for "Bioprint Tracker: samples list") instead of failing silently.
  // Records what the last list call actually returned, so an empty dropdown can be diagnosed on
  // screen (see showRunForm) without opening the console: the type ID asked for, the envelope shape,
  // how many rows came back, and how many matched the type after filtering.
  const lastListDebug = {};
  function describeEnvelope(resp) {
    if (resp === null) return 'null';
    if (resp === undefined) return 'undefined';
    if (Array.isArray(resp)) return 'array';
    if (typeof resp === 'object') return `object{${Object.keys(resp).slice(0, 8).join(',')}}`;
    return typeof resp;
  }
  function rawSnippet(resp) {
    let s; try { s = JSON.stringify(resp); } catch (e) { s = String(resp); }
    return (s == null ? 'null' : s).slice(0, 240);
  }
  // Per the eLabNext reference (sample_getsamplebyid): GET /samples/{id} returns the sample bare
  // (no data wrapper), and its custom fields are in a `meta` array, NOT `sampleMetas`, which is the
  // WRITE-side name used on POST /samples. Each entry is keyed by `key` (the field display name) with
  // the value in `value`. FILE fields carry `files:[{fileID,...}]`, SAMPLELINK carries `samples:[...]`.
  function metaValueByName(metas, name) {
    const m = (metas || []).filter(x => x.key === name)[0];
    return m && m.value != null ? m.value : '';
  }
  // The fileID stored in a FILE-type meta field (read shape: files:[{fileID,...}]); null if absent.
  function metaFileIdByName(metas, name) {
    const m = (metas || []).filter(x => x.key === name)[0];
    return (m && m.files && m.files[0] && m.files[0].fileID) || null;
  }
  function listSamplesByType(sampleTypeID) {
    // Query params go in the queryParams object (see apiCall). $records=1000 lifts the default page
    // size of 10 so a real list of protocols is not truncated; archived samples are excluded by
    // default. $expand=meta populates each item's field values (needed for the Condition/Cell line
    // autocomplete), which are otherwise returned empty (same behaviour as the single-sample GET).
    return apiCall('GET', 'samples', null, { sampleTypeID, '$records': 1000, '$expand': 'meta' }).then(resp => {
      let list = resp;
      if (resp && Array.isArray(resp.data)) list = resp.data;
      else if (resp && Array.isArray(resp.items)) list = resp.items;
      else if (resp && Array.isArray(resp.results)) list = resp.results;
      else if (resp && Array.isArray(resp.records)) list = resp.records;
      else if (resp && resp.data && Array.isArray(resp.data.items)) list = resp.data.items;
      const envelope = describeEnvelope(resp);
      if (!Array.isArray(list)) {
        console.warn('Bioprint Tracker: unexpected samples list envelope (see object above)', resp);
        lastListDebug[sampleTypeID] = { envelope, rawCount: null, matched: 0, error: null, raw: rawSnippet(resp) };
        return [];
      }
      const rawCount = list.length;
      const matched = list.filter(s => {
        const t = s.sampleTypeID != null ? s.sampleTypeID : (s.sampleType && s.sampleType.sampleTypeID);
        return t == null || String(t) === String(sampleTypeID);
      });
      lastListDebug[sampleTypeID] = { envelope, rawCount, matched: matched.length, error: null, raw: rawSnippet(resp) };
      return matched;
    }).catch(err => {
      console.warn(`Bioprint Tracker: samples list failed for type ${sampleTypeID}`, err);
      lastListDebug[sampleTypeID] = { envelope: null, rawCount: null, matched: 0, error: (err && err.message) || String(err), raw: null };
      return [];
    });
  }

  // ─── Grouped print-run model ──────────────────────────────────────────────────
  // A real print run can be heterogeneous: one physical print from one protocol yields plates that
  // differ in treatment condition. The run form collects a LIST OF GROUPS; each group is a set of
  // plates sharing every field, and expands into `count` barcoded plates.
  //
  // The replicate model:
  //   * ONE print run = ONE biological replicate (one cell prep, one day). It is the Print run ID +
  //     date, and is NOT stored as a number, the biological-replicate ordinal is derived at analysis
  //     time by ordering the runs (by date) that share a Protocol + Condition.
  //   * The duplicate plates WITHIN a run+condition are TECHNICAL replicates, numbered 1..count.
  //   * A plate is NOT tied to an experiment here, it is a shared-Inventory sample, and the user
  //     links it into their own experiment natively afterwards, so one run can
  //     serve several experiments without any per-run experiment field.
  // Run-level (shared by every plate): protocol, cell line, date, reagent lots, Print run ID (no
  // Operator, eLabNext's native owner/creatorID already attributes the record; see below).
  // Per group: condition, technical-replicate count. Grouped entry is a correctness guarantee,
  // not just fewer clicks: plates in one group get byte-identical grouping values by construction,
  // which is exactly what lets replicates find each other by shared VALUES.

  // Levenshtein edit distance, capped at `max`: used only to catch a single-character typo, so it
  // bails out as soon as the distance is certain to exceed the cap (the exact value past that is
  // irrelevant). Classic two-row dynamic-programming table.
  function levenshtein(a, b, max) {
    a = String(a); b = String(b);
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = [], j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowBest = i;
      for (j = 1; j <= b.length; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowBest) rowBest = cur[j];
      }
      if (rowBest > max) return max + 1; // every cell in this row already past the cap
      prev = cur;
    }
    return prev[b.length];
  }

  function normLabel(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  // Replace every run of digits with a single marker, so two labels that differ ONLY in a number
  // (a deliberate sequence like "Project 1" vs "Project 2", or "Drug screen 3" vs "…4") are seen as
  // the same shape and are NOT flagged as typos of each other, only genuinely mistyped text is.
  function digitShape(s) { return normLabel(s).replace(/\d+/g, '#'); }

  // "Did you mean?" guard for a free-text value the user is about to create. Returns the existing
  // value it is most likely a typo OF, or '' when it looks genuinely new (or already matches one
  // exactly). Catches the two ways a re-used label silently splits into a near-duplicate: a
  // case/whitespace-only difference, or a single-character slip on a value long enough that an
  // edit-distance-1 collision is unlikely to be a coincidence (so short, legitimately-distinct
  // labels like "A" vs "B" are never flagged).
  function nearestExisting(value, existing) {
    const v = normLabel(value);
    if (!v) return '';
    const list = existing || [];
    let i;
    for (i = 0; i < list.length; i++) {
      if (String(list[i]) === String(value)) return '';        // already exactly an existing value
    }
    for (i = 0; i < list.length; i++) {
      if (normLabel(list[i]) === v) return list[i];             // differs only in case / whitespace
    }
    if (v.length >= 4) {
      const vShape = digitShape(value);
      for (i = 0; i < list.length; i++) {
        const e = normLabel(list[i]);
        if (digitShape(list[i]) === vShape) continue;   // differs only in a number → a sequence, not a typo
        if (levenshtein(v, e, 1) <= 1) return list[i];   // single-character slip
      }
    }
    return '';
  }

  // Validate a plate's editable fields. Returns a human problem string, or '' if OK. PURE, shared by
  // the wizard's Approve guard and the submit-time backstop so both agree, and unit-tested. Cell line
  // must be present; concentration must be present and a whole number (cells/mL).
  function plateFieldProblem(v) {
    v = v || {};
    if (!v.cell_line) return 'Fill in the cell line before approving this plate.';
    if (!v.concentration) return 'Fill in the concentration before approving this plate.';
    // One or more whole numbers, comma-separated: a plate can hold several concentrations (e.g. a
    // seeding-density plate split into 3), so the field is a set, mirrors the multi-value cell line.
    if (!/^\d+(\s*,\s*\d+)*$/.test(String(v.concentration))) {
      return 'Concentration must be whole number(s) (cells/mL), comma-separated if more than one.';
    }
    return '';
  }

  // Expand a run into the ordered list of plate records to create, ONE record per physical plate
  // the file defines (run.plates). PURE: no DOM, no network, the unit the Node test harness checks.
  // No groups / copies / condition: the .rastrum enumerates every plate, and replicate lineage
  // (technical = same run; biological = same protocol across dates) is DERIVED DOWNSTREAM from these
  // stored facts, not encoded here. Falls back to a single synthesized plate from
  // run-level fields when a protocol carries no designed plates (older record).
  function buildRunPlateSpecs(run) {
    const nm = String(run.protocol_name || '');
    const base = nm.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_[0-9a-f]{6}$/, ''); // protocol name, no date/hash
    const fpMatch = nm.match(/_([0-9a-f]{6})$/);
    const fingerprint = fpMatch ? fpMatch[1] : '';                                    // the design fingerprint
    const plates = (run.plates && run.plates.length) ? run.plates : [{
      plate: '', label: '', cell_line: run.cell_line || '',
      concentration: run.cell_concentration || '', matrix_codes: '', wellplate: ''
    }];
    return plates.map((p, i) => {
      const cellLine = p.cell_line || run.cell_line || '';
      const conc = p.concentration || run.cell_concentration || '';
      const plateId = p.plate || p.label || '';
      // Plate suffix = an ORDINAL in the file's plate order (P1, P2), the same in both formats.
      // It used to be a pass-through of each format's own plate key, which meant different things in
      // each: Allegro supplies a plate ordinal (W1, W2) but classic RASTRUM supplies the wellplate
      // consumable config code (WP001, WP031), so the same position in the name said "which plate" in
      // one format and "which plate type" in the other. WP031 also tells a reader nothing and does not
      // sort by plate order (confirmed in the tenant 2026-07-30: the list put WP031 above WP001). The
      // consumable code is not lost, it has its own `Wellplate` field. Taken from the label ("Plate 2")
      // so it stays the file's ordinal when only some plates are logged, falling back to position.
      const labelOrdinal = String(p.label || '').match(/(\d+)/);
      const ordinal = labelOrdinal ? parseInt(labelOrdinal[1], 10) : (i + 1);
      // Only a plate with an identity of its own is numbered. A run synthesized without plates (the
      // fallback above, and older callers) has none, and stays suffix-free rather than gaining "_P1".
      const plateTag = plateId ? `P${ordinal}` : '';
      // Name = intrinsic, stable facts only (no derived rep number): date_cellline_protocol_fp_plate.
      // The barcode is the true unique key; the name is for human recognition in sample lists.
      const name = [run.date, slugify(cellLine), base, fingerprint, plateTag]
        .filter(Boolean).join('_');
      const metas = [
        metaLink('Bioprint Template', parseInt(run.protocol_id, 10)),
        metaField('Cell line', 'TEXT', cellLine),
        // TEXT (not NUMERIC): a plate can carry several concentrations (seeding-density plates), so
        // the value is a comma-separated set like "2000000, 3000000, 5000000". Numeric analysis is
        // done downstream (parses the set); the sample-type field must be Text to hold it.
        metaField('Cell concentration (cells/mL)', 'TEXT', conc),
        // No "Operator" field: eLabNext already attributes every sample to the logged-in user who
        // created it (native `owner`/`creatorID`, read back after create). Logins are personal here,
        // so that native attribution is a strictly better source than a free-typed name, no typing,
        // no risk of "Phil" vs "Philipp G." splitting one person into two labels.
        // Physical printer (machine) this plate was printed on, chosen at log time.
        metaField('Printer', 'TEXT', run.printer),
        metaField('Print date', 'DATE', run.date),
        metaField('Print run ID', 'TEXT', run.print_run_id),
        metaField('Bioink lot', 'TEXT', run.lot_bioink),
        metaField('Activator lot', 'TEXT', run.lot_cell)
        // No Condition / Experiment / Replicate fields: treatment and replicate lineage are derived
        // downstream from the facts below, not stored on the plate.
      ];
      if (p.matrix_codes) metas.push(metaField('Matrix code', 'TEXT', p.matrix_codes));
      if (p.wellplate) metas.push(metaField('Wellplate', 'TEXT', p.wellplate));
      // Passage: TEXT (not NUMERIC) because a multi-cell-line plate carries one per cell line as a
      // comma-joined set (e.g. "12, 8"), the same shape as cell line / concentration. Optional.
      if (p.passage) metas.push(metaField('Passage number', 'TEXT', p.passage));
      if (plateId) metas.push(metaField('Plate', 'TEXT', plateId));
      // The inert base is often printed on a separate day; record it when given (optional).
      if (run.date_inert_base) metas.push(metaField('Inert base print date', 'DATE', run.date_inert_base));
      return {
        plate_label: p.label || plateId || '',
        plate_id: plateId,
        cell_line: cellLine,
        concentration: conc,
        passage: p.passage || '',
        matrix: p.matrix_codes || '',
        wellplate: p.wellplate || '',
        // Native Notes on the plate = this plate's own note (notes are per-plate; no run-level note).
        // run.notes is still honoured as a fallback for a synthesized plate / older callers.
        note: p.note || run.notes || '',
        name,
        metas
      };
    });
  }

  addon.showRunDialog = () => {
    Promise.all([
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PLATE, 'Bioprinted Plate'),
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PROTOCOL, 'Bioprint Template')
    ]).then(ids => {
      const plateTypeID = ids[0], protocolTypeID = ids[1];
      return Promise.all([
        listSamplesByType(protocolTypeID),
        listSamplesByType(plateTypeID)
      ]).then(resps => {
        const protocols = resps[0], plates = resps[1];
        addon.showRunForm(protocols, plateTypeID, {
          cellLines: distinctMetaValues(plates, 'Cell line'),
          printers: distinctMetaValues(plates, 'Printer')
        }, protocolTypeID);
      });
    }).catch(err => { showError('Not set up yet', err.message); });
  };

  addon.showRunForm = (protocols, plateTypeID, existing, protocolTypeID) => {
    existing = existing || {};
    const cellLineValues = existing.cellLines || [];
    // Physical printers used before (never hard-coded, the list
    // learns itself from prior plate records, so it stays general for any lab). Offered as datalist
    // suggestions; the first use is typed, afterwards it is one click.
    const printerValues = existing.printers || [];
    // The protocol picker is a searchable combobox built in afterRender from `protocols`. The
    // Condition / Cell line datalists offer previously-used values, so a re-used label is picked
    // rather than retyped (byte-identical); see distinctMetaValues / nearestExisting.
    function optionsFor(values) {
      return (values || []).map(e => `<option value="${esc(e)}">`).join('');
    }
    // In multi-plate wizard mode, afterRender sets this to a collector that returns one entry per
    // physical plate. Declared in the form scope so both afterRender and the submit button see it;
    // `platesAllApproved` is the companion bridge letting the submit button check the approval state
    // that lives inside afterRender's per-plate wizard.
    let collectPlateGroups = null;
    let platesAllApproved = () => false;

    // When no protocols came back, show exactly what the list call returned so the cause is visible
    // without the console: wrong type ID, an envelope we didn't parse, or an API error.
    const dbg = lastListDebug[protocolTypeID] || {};
    let emptyNote = '';
    if (!protocols.length) {
      const detail = dbg.error
        ? `the list request failed with: ${esc(dbg.error)}`
        : `the request returned ${dbg.rawCount == null ? `an unrecognised response, shape ${esc(dbg.envelope)}` :
      `${esc(dbg.rawCount)} sample(s), ${esc(dbg.matched)} of them of this type`}`;
      emptyNote = `<div class="bpt-error" style="margin-bottom:2px;">No protocols found for sample type ID <b>${esc(protocolTypeID)}</b>. ${detail}.${dbg.raw ? `<br><span style="font-family:ui-monospace,monospace;font-size:11px;word-break:break-all;">raw: ${esc(dbg.raw)}</span>` : ''}<br>Send me this whole message and we will fix the lookup.</div>`;
    }
    showDialog({
      // Broad so a 384-well plate map and the two-column fields sit comfortably (capped at 90vw by
      // the modal, so it still fits smaller screens).
      width: 860, title: 'Log a print run',
      btnCancelLabel: 'Back', onCancel() { addon.showMainDialog(); },
      content:
        // Collapsed by default (no `open`) so it stays out of the way; click to expand. Pulled up
        // (negative margin on the wrapper, AND margin-top:0 on the <details> itself, the shared
        // .bpt-details class carries its own 10px top margin that otherwise cancels the wrapper's
        // pull-up) so it reads as attached to the Protocol field above, not floating at the same
        // distance as the run-level fields below it. No divider here: a rule line this close to two
        // small elements read as clutter rather than a clear section break; the tightened spacing
        // above and the normal gap below are enough to group it with Protocol on their own.
        // Run-level fields (shared by every plate). Cell line and concentration are NOT here, they
        // are per-plate, set in the review step below (pre-filled from the file/protocol). No
        // Operator field: eLabNext already attributes the created records to the logged-in user
        // (native owner/creatorID), so nothing needs typing here, see buildRunPlateSpecs. Printer
        // takes the first slot alone (the row's second cell is deliberately left blank rather than
        // forcing an artificial pairing); it is the physical machine (the named unit) chosen at log
        // time, distinct from the protocol's printer VERSION. Suggestions come from previously-used
        // printers (printerValues), new ones allowed.
        // Default the (cell/model) print date to today; the user can still change it.
        // The inert base is often printed on a separate, earlier day (optional; blank = same run).
        // Reagent lots: a run can use more than one bioink / activator lot, so each is a repeatable
        // list with an "add" button (see afterRender). Values are joined on submit.
        // Divider: everything above is run-level (shared); below is the per-plate review.
        // Per-plate review: one step per physical plate the file defines. Each is approved (with its
        // cell line + concentration) before the run can be created. See renderPlateArea. Notes are
        // captured PER PLATE inside each step (no separate run-level notes field).
        `<div class="bpt-stack">${emptyNote}<div class="bpt-field bpt-combo"><label>Bioprint Template *</label><input id="inp-protocol-search" type="text" autocomplete="off" placeholder="Type to search protocols…"><input type="hidden" id="inp-protocol"><div id="bpt-protocol-list" class="bpt-combo-list" style="display:none;"></div></div><div id="bpt-protocol-details" style="display:none;margin-top:-10px;"><details class="bpt-details" style="margin-top:0;"><summary>Bioprint Template details</summary><table class="bpt-table" id="bpt-protocol-details-table" style="margin-top:6px;"></table></details></div><div class="bpt-grid2"><div class="bpt-field"><label>Printer *</label><input class="bpt-inp" id="inp-printer-machine" type="text" list="bpt-printer-list" autocomplete="off" placeholder="e.g. your printer name"><div class="bpt-dym bpt-printer-dym" style="display:none;"></div></div></div><div class="bpt-grid2">${field('Date of print *', 'inp-date', 'date', '', todayISO())}<div class="bpt-field"><label>Inert base print date</label><input class="bpt-inp" id="inp-date-inert" type="date"></div></div><div class="bpt-grid2"><div class="bpt-field"><label>Bioink lot</label><div id="bpt-lots-bioink" class="bpt-lots"></div><button type="button" class="bpt-lot-add" data-lots="bioink">+ Add bioink lot</button></div><div class="bpt-field"><label>Activator lot</label><div id="bpt-lots-activator" class="bpt-lots"></div><button type="button" class="bpt-lot-add" data-lots="activator">+ Add activator lot</button></div></div><hr class="bpt-hr"><div class="bpt-field"><label class="bpt-section">Plates in this run *</label><div id="bpt-plate-area"></div></div><datalist id="bpt-cellline-list">${optionsFor(cellLineValues)}</datalist><datalist id="bpt-printer-list">${optionsFor(printerValues)}</datalist><div id="bpt-err" class="bpt-error" style="display:none;"></div></div>`,
      afterRender() {
        const searchEl = document.getElementById('inp-protocol-search');
        const hiddenEl = document.getElementById('inp-protocol');
        const listEl = document.getElementById('bpt-protocol-list');

        // Newest first, protocol names begin with the ISO date, so a descending sort does it.
        const sorted = (protocols || []).slice().sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        // Each row shows the parsed science (cell line, matrix, plate) under the name, so the right
        // protocol is recognised by its contents rather than by decoding the auto-generated name.
        function subtitle(p) {
          return [metaValueByName(p.meta, 'Cell line'), metaValueByName(p.meta, 'Matrix code'),
            metaValueByName(p.meta, 'Wellplate')].filter(Boolean).join(' · ');
        }
        function renderList(q) {
          q = String(q || '').trim().toLowerCase();
          const items = sorted.filter(p => {
            if (!q) return true;
            return (`${String(p.name || '')} ${subtitle(p)}`).toLowerCase().indexOf(q) !== -1;
          });
          if (!items.length) { listEl.innerHTML = '<div class="bpt-combo-empty">No protocol matches.</div>'; return; }
          listEl.innerHTML = items.map(p => {
            const id = p.sampleID != null ? p.sampleID : p.id;
            const sub = subtitle(p);
            return `<div class="bpt-combo-item" data-id="${esc(id)}" data-name="${esc(p.name || '')}"><div class="nm">${esc(p.name || (`sample ${id}`))}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>`;
          }).join('');
          Array.prototype.forEach.call(listEl.querySelectorAll('.bpt-combo-item'), el => {
            el.onclick = () => { choose(el.getAttribute('data-id'), el.getAttribute('data-name')); };
          });
        }
        function choose(id, nm) {
          hiddenEl.value = id;
          hiddenEl.setAttribute('data-name', nm);
          searchEl.value = nm;
          listEl.style.display = 'none';
          loadProtocolDetails(id);
        }
        searchEl.onfocus = () => { renderList(searchEl.value); listEl.style.display = 'block'; };
        searchEl.oninput = () => {
          hiddenEl.value = ''; // typing invalidates the previous pick until one is chosen again
          renderList(searchEl.value); listEl.style.display = 'block';
        };
        // Close the list on a click outside the combo. Bound to the overlay so it dies with the modal.
        const overlay = document.getElementById('bpt-modal-overlay');
        if (overlay) overlay.addEventListener('mousedown', e => {
          const combo = searchEl.parentNode;
          if (combo && !combo.contains(e.target)) listEl.style.display = 'none';
        });

        // Reagent lots: start each list with one input; "+ Add" appends another so a run can record
        // several bioink / activator lots. Read back on submit via the .bpt-lot-<kind> class.
        function addLotInput(kind, focus) {
          const wrap = document.getElementById(`bpt-lots-${kind}`);
          if (!wrap) return;
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = `bpt-inp bpt-lot-${kind}`;
          inp.placeholder = kind === 'bioink' ? 'e.g. INK1042' : 'e.g. INK2091';
          wrap.appendChild(inp);
          if (focus) inp.focus();
        }
        addLotInput('bioink'); addLotInput('activator');
        Array.prototype.forEach.call(document.querySelectorAll('.bpt-lot-add'), b => {
          b.onclick = () => { addLotInput(b.getAttribute('data-lots'), true); };
        });

        // Printer gets the same "did you mean?" guard as Cell line (attachDidYouMean, defined below -
        // a hoisted function declaration, so calling it here is safe). Checked against previously-used
        // printer names only (printerValues, self-learning, never a hardcoded list), so a genuinely
        // new printer is always allowed; only a near-duplicate of one already logged is flagged. This
        // matters because Printer is a join/grouping label in the analysis CSV: "Kahlo" and "Kaloh"
        // (or a case/whitespace slip) would otherwise silently split one machine into two labels.
        const printerEl = document.getElementById('inp-printer-machine');
        const printerDymEl = document.querySelector('.bpt-printer-dym');
        if (printerEl && printerDymEl) attachDidYouMean(printerEl, printerValues, printerDymEl);

        // Loads the selected template's recorded fields into the read-only "Bioprint Template details" section
        // and pre-fills cell line + concentration (both parsed from the file), editable.
        function loadProtocolDetails(id) {
          const detailsWrap = document.getElementById('bpt-protocol-details');
          const table = document.getElementById('bpt-protocol-details-table');
          if (!id) { detailsWrap.style.display = 'none'; return; }
          table.innerHTML = '<tr><td colspan="2">Loading…</td></tr>';
          detailsWrap.style.display = 'block';
          // $expand=meta is REQUIRED to get field values (confirmed in the eLabNext docs); without it
          // the meta array comes back empty.
          getSampleById(id).then(raw => {
            const metas = (raw && raw.meta) || [];
            function get(key) { return metaValueByName(metas, key); }
            const rows = [
              ['Print model', get('Print model')],
              ['Matrix code', get('Matrix code')],
              ['Cell line', get('Cell line')],
              ['Cell concentration (cells/mL)', get('Cell concentration (cells/mL)')],
              ['Wellplate', get('Wellplate')],
              ['Bioink', get('Bioink')], ['Activator', get('Activator')]
            ].filter(r => r[1]).map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
            table.innerHTML = rows || ('<tr><td colspan="2" class="bpt-hint">This protocol has no stored ' +
              'details. It may be an older record saved before the fields were set up. Try a newer protocol.</td></tr>');
            // Protocol-level defaults used to pre-fill each plate's editable fields when the plate
            // itself doesn't carry them (cell line / concentration are per-plate, but the protocol's
            // value is the sensible starting point). Concentration keeps only the first number.
            protoDefaults = {
              cell_line: get('Cell line') || '',
              concentration: String(get('Cell concentration (cells/mL)') || '').split(',')[0].replace(/[^\d]/g, '')
            };
            // Designed plates for the wizard. PREFER re-parsing the attached .rastrum (single source of
            // truth, parser improvements apply to old templates too). Fall back to the
            // cached "Designed plates (JSON)" blob for older templates that have no attached file, or if
            // the download/parse fails.
            function renderFromBlob() {
              let designed = [];
              const dpRaw = get('Designed plates (JSON)');
              if (dpRaw) {
                try {
                  designed = JSON.parse(dpRaw) || [];
                } catch (e) {
                  document.getElementById('bpt-plate-area').innerHTML =
                    '<div class="bpt-error">This protocol’s stored plate layout is unreadable ' +
                    '(corrupt "Designed plates" data). Re-upload the .rastrum to fix it.</div>';
                  return;
                }
              }
              renderPlateArea(designed);
            }
            const printFileID = metaFileIdByName(metas, 'Print file');
            if (printFileID) {
              document.getElementById('bpt-plate-area').innerHTML =
                '<div class="bpt-hint" style="font-size:12.5px;">Reading the plate layout from the print file…</div>';
              fetchFileBytes(printFileID)
                .then(buf => parseRastrum(buf))
                .then(reparsed => { renderPlateArea(reparsed.designed_plates || []); })
                .catch(err => {
                  // Attached-file path failed, fall back to the cached blob rather than blocking.
                  console.warn('Bioprint Tracker: re-parse of attached .rastrum failed, using cached layout:', err);
                  renderFromBlob();
                });
            } else {
              renderFromBlob();  // older template: no attached .rastrum
            }
          }).catch(err => {
            // Surface the real error instead of swallowing it, otherwise submit later fails with a
            // misleading "choose a protocol" message.
            table.innerHTML = `<tr><td colspan="2" class="bpt-error">Could not load this protocol: ${esc((err && err.message) || String(err))}</td></tr>`;
            document.getElementById('bpt-plate-area').innerHTML =
              `<div class="bpt-error">Could not load the protocol’s plates: ${esc((err && err.message) || String(err))}. Try again or pick another protocol.</div>`;
          });
        }

        // Inline "did you mean?" for one input against a set of existing values (the typo guard the
        // dropdowns cannot cover, since a user can still type a near-duplicate). Clicking the
        // suggestion fills the field with the exact existing value, so replicates group together.
        function attachDidYouMean(input, existingValues, hintEl) {
          input.addEventListener('blur', () => {
            const s = nearestExisting(input.value, existingValues);
            if (!s) { hintEl.style.display = 'none'; hintEl.innerHTML = ''; return; }
            hintEl.style.display = 'block';
            hintEl.innerHTML = `Did you mean <a>${esc(s)}</a>? A very similar value already exists — reuse it so records group together.`;
            hintEl.querySelector('a').onclick = () => {
              input.value = s; hintEl.style.display = 'none'; hintEl.innerHTML = '';
            };
          });
        }

        // ── Per-plate review & approve ────────────────────────────────────────────────
        // One step per physical plate the file defines (single- and multi-plate use the SAME flow).
        // Each step shows the plate map + the LOCKED facts (wellplate, matrix) and the two EDITABLE,
        // pre-filled facts (cell line, concentration). A plate must be Approved before the run can be
        // created; a plate with a blank cell line or concentration cannot be approved.
        let protoDefaults = { cell_line: '', concentration: '' }; // set by loadProtocolDetails
        const wiz = { plates: [], step: 0, edits: {}, approved: {} };
        function rehydrate(rows) {
          return (rows || []).map(r => ({
            wellRange: r.wr,
            model: r.m,
            matrix_codes: r.mx,
            cells: r.c
          }));
        }
        function plateKey(p) { return p.plate || p.label || ''; }
        function readPlateForm() {
          const area = document.getElementById('bpt-plate-area');
          const cl = area.querySelector('.bpt-pl-cellline');
          const cc = area.querySelector('.bpt-pl-conc');
          const pa = area.querySelector('.bpt-pl-passage');
          const nt = area.querySelector('.bpt-pl-note');
          return {
            cell_line: cl ? cl.value.trim() : '',
            concentration: cc ? cc.value.trim() : '',
            passage: pa ? pa.value.trim() : '',
            note: nt ? nt.value.trim() : ''
          };
        }
        function saveCurrentStep() {
          if (!wiz.plates.length) return;
          wiz.edits[plateKey(wiz.plates[wiz.step])] = readPlateForm();
        }
        // Effective values for a plate: the user's edit if present, else the plate's own file value,
        // else the protocol default.
        function plateVals(p) {
          const e = wiz.edits[plateKey(p)] || {};
          return {
            cell_line: e.cell_line != null ? e.cell_line : (p.cell_line || protoDefaults.cell_line || ''),
            concentration: e.concentration != null ? e.concentration : (p.concentration || protoDefaults.concentration || ''),
            // Passage has no file/protocol source, user-entered only, so it defaults to blank.
            passage: e.passage != null ? e.passage : '',
            note: e.note != null ? e.note : (p.note || '')
          };
        }
        function updateStatus() {
          const el = document.getElementById('bpt-wiz-status');
          if (!el) return;
          const n = wiz.plates.filter(p => wiz.approved[plateKey(p)]).length;
          const total = wiz.plates.length;
          el.textContent = (n === total)
            ? `All ${total} plate${total === 1 ? '' : 's'} approved — you can create the records.`
            : `${n} of ${total} plate${total === 1 ? '' : 's'} approved.`;
        }
        function renderStep(i) {
          const plates = wiz.plates, plate = plates[i], key = plateKey(plate);
          wiz.step = i;
          const v = plateVals(plate);
          const locked = [shortWellplate(plate.wellplate), plate.matrix_codes].filter(Boolean).join(' · ');
          // Dots double as a jump target: with more than two or three plates, stepping through with
          // Back/Next to reach one plate is tedious. title= names the plate for a screen reader and
          // on hover, since a dot alone says nothing.
          const dots = plates.map((p, j) => `<span class="bpt-wiz-dot${j === i ? ' active' : ''}${wiz.approved[plateKey(p)] ? ' done' : ''}" data-bpt-step="${j}" role="button" tabindex="0" title="Plate ${j + 1}${wiz.approved[plateKey(p)] ? ' (approved)' : ''}"></span>`).join('');
          document.getElementById('bpt-plate-area').innerHTML =
            // type="text" + inputmode=numeric instead of type="number": the eLabNext host
            // stylesheet forces input[type=number] to a fixed narrow width (even over an inline
            // width), and it clips the value. A text input with numeric inputmode keeps the phone
            // keypad / numeric intent without the host's number-input sizing, and takes width:100%.
            // Passage is optional and NOT in the print file (the printer doesn't know it), entered
            // here per plate. Like cell line / concentration it can be multi-valued: one per cell
            // line, comma-separated in the SAME order, so "Cell A, Cell B" at p12/p8 -> "12, 8".
            `<div class="bpt-wiz-head"><span class="bpt-wiz-title">Plate ${i + 1} of ${plates.length}${plate.plate ? ` · ${esc(plate.plate)}` : ''}</span>${locked ? `<span class="bpt-wiz-sub">${esc(locked)}</span>` : ''}</div><div class="bpt-wiz-map" id="bpt-wiz-map"></div><div class="bpt-plate-form"><div class="bpt-field"><label>Cell line *</label><input class="bpt-inp bpt-pl-cellline" type="text" list="bpt-cellline-list" placeholder="e.g. MDA-MB-231" value="${esc(v.cell_line)}"></div><div class="bpt-field"><label>Concentration (cells/mL) *</label><input class="bpt-inp bpt-pl-conc" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="e.g. 9400000" value="${esc(v.concentration)}"></div><div class="bpt-field bpt-sf-2"><label>Passage number</label><input class="bpt-inp bpt-pl-passage" type="text" placeholder="e.g. 12  (or 12, 8, 20 — one per cell line, same order)" value="${esc(v.passage)}"></div></div><div class="bpt-dym bpt-pl-dym" style="display:none;"></div><div class="bpt-field" style="margin-top:10px;"><label>Plate note</label><textarea class="bpt-inp bpt-pl-note" rows="2" placeholder="anything specific to THIS plate, e.g. nozzle 3 clogged">${esc(v.note)}</textarea></div><div class="bpt-wiz-nav"><button type="button" class="bpt-wiz-btn" id="bpt-wiz-prev"${i === 0 ? ' disabled' : ''}>‹ Back</button><div class="bpt-wiz-dots">${dots}</div><button type="button" class="bpt-wiz-btn" id="bpt-wiz-next"${i === plates.length - 1 ? ' disabled' : ''}>Next ›</button></div><div class="bpt-wiz-approve-row"><button type="button" class="bpt-wiz-btn bpt-wiz-approve${wiz.approved[key] ? ' done' : ''}" id="bpt-wiz-approve">${wiz.approved[key] ? '✓ Approved — click to undo' : 'Approve plate'}</button></div><div class="bpt-wiz-status" id="bpt-wiz-status"></div>`;
          renderPlateMapInto(rehydrate(plate.rows), document.getElementById('bpt-wiz-map'));
          attachDidYouMean(document.querySelector('#bpt-plate-area .bpt-pl-cellline'),
            cellLineValues, document.querySelector('#bpt-plate-area .bpt-pl-dym'));
          // Editing a field AFTER approving must un-approve the plate, otherwise the stale flag would
          // let a since-blanked/invalid value be created. Clear it live, without a full re-render (so
          // focus/typing isn't lost); just reflect it on the button, the dot and the status line.
          function unApproveOnEdit() {
            if (!wiz.approved[key]) return;
            wiz.approved[key] = false;
            const ab = document.getElementById('bpt-wiz-approve');
            if (ab) { ab.textContent = 'Approve plate'; ab.classList.remove('done'); }
            const dots2 = document.querySelectorAll('#bpt-plate-area .bpt-wiz-dot');
            if (dots2[wiz.step]) dots2[wiz.step].classList.remove('done');
            updateStatus();
          }
          const clEl = document.querySelector('#bpt-plate-area .bpt-pl-cellline');
          const ccEl = document.querySelector('#bpt-plate-area .bpt-pl-conc');
          if (clEl) clEl.addEventListener('input', unApproveOnEdit);
          if (ccEl) ccEl.addEventListener('input', unApproveOnEdit);
          // Moving between plates and approving a plate are SEPARATE actions. Approving used to be
          // the only thing that advanced, while an approved plate's button un-approved instead of
          // advancing, so returning to an earlier plate left no way forward except withdrawing and
          // re-granting approval. Navigation now never changes approval, and approving never
          // navigates. Every move saves the current fields first, so nothing typed is lost.
          function goTo(j) {
            if (j < 0 || j >= plates.length || j === wiz.step) return;
            saveCurrentStep();
            renderStep(j);
          }
          document.getElementById('bpt-wiz-prev').onclick = () => { goTo(wiz.step - 1); };
          document.getElementById('bpt-wiz-next').onclick = () => { goTo(wiz.step + 1); };
          const dotEls = document.querySelectorAll('#bpt-plate-area .bpt-wiz-dot');
          Array.prototype.forEach.call(dotEls, d => {
            const j = parseInt(d.getAttribute('data-bpt-step'), 10);
            d.onclick = () => { goTo(j); };
            d.onkeydown = ev => {
              if (ev && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); goTo(j); }
            };
          });
          // Approving stays on the current plate. An already-approved plate un-approves on click, so
          // withdrawing approval is deliberate rather than a side effect of trying to move.
          document.getElementById('bpt-wiz-approve').onclick = () => {
            if (wiz.approved[key]) { wiz.approved[key] = false; renderStep(wiz.step); return; }
            saveCurrentStep();
            const e = wiz.edits[key] || {};
            const st = document.getElementById('bpt-wiz-status');
            const problem = plateFieldProblem(e);
            if (problem) { if (st) st.textContent = problem; return; }
            wiz.approved[key] = true;
            renderStep(wiz.step);
          };
          updateStatus();
        }
        function renderPlateArea(designedPlates) {
          const plates = (designedPlates && designedPlates.length) ? designedPlates : [{
            plate: '', label: 'Plate 1', wellplate: '', cell_line: '', matrix_codes: '', rows: []
          }];
          wiz.plates = plates; wiz.step = 0; wiz.edits = {}; wiz.approved = {};
          // Bridge to the submit button: one plate record per designed plate, plus the approval check.
          collectPlateGroups = () => {
            saveCurrentStep();
            return wiz.plates.map(p => {
              const v = plateVals(p);
              return {
                plate: plateKey(p), label: p.label || '',
                cell_line: v.cell_line, concentration: v.concentration, passage: v.passage, note: v.note,
                matrix_codes: p.matrix_codes || '', wellplate: p.wellplate || ''
              };
            });
          };
          platesAllApproved = () => wiz.plates.length > 0 && wiz.plates.every(p => wiz.approved[plateKey(p)]);
          renderStep(0);
        }

        // Nothing until a protocol is chosen.
        document.getElementById('bpt-plate-area').innerHTML =
          '<div class="bpt-hint" style="font-size:12.5px;">Choose a protocol above to see its plates.</div>';
      },
      customButtons: [{ label: 'Create plate records', fn() {
        const errEl = document.getElementById('bpt-err'); errEl.style.display = 'none';
        function fail(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
        const protoEl = document.getElementById('inp-protocol');
        // Collect the (possibly several) reagent lots straight from the DOM, joined into one value.
        function lots(kind) {
          return Array.prototype.map.call(document.querySelectorAll(`.bpt-lot-${kind}`), i => i.value.trim()).filter(Boolean).join(', ');
        }
        // One record per physical plate, from the per-plate review step (each carries its own cell
        // line + concentration). Every plate must be approved before we create anything.
        const plates = collectPlateGroups ? collectPlateGroups() : null;
        const run = {
          plate_type_id: plateTypeID,
          protocol_id: protoEl.value,
          protocol_name: protoEl.getAttribute('data-name') || '',
          date: val('inp-date'),
          printer: val('inp-printer-machine'),
          date_inert_base: val('inp-date-inert'),
          lot_bioink: lots('bioink'), lot_cell: lots('activator'),
          print_run_id: makePrintRunID(), // notes are per-plate now (set in each plate's step)
          plates: plates || []
        };
        if (!run.protocol_id) return fail('Please select a protocol.');
        if (!plates || !plates.length) return fail('Choose a protocol so its plates load.');
        if (!run.printer) return fail('Printer is required.');
        if (!run.date) return fail('Date is required.');
        if (!platesAllApproved()) return fail('Approve every plate (with its cell line and ' +
          'concentration) before creating the records.');
        // Backstop: re-validate the LIVE values, not just the approval flags, so a plate that was
        // approved then edited to a blank/invalid value can never be created.
        for (let pi = 0; pi < plates.length; pi++) {
          const prob = plateFieldProblem(plates[pi]);
          if (prob) return fail(`Plate ${pi + 1}${plates[pi].plate ? ` (${plates[pi].plate})` : ''}: ${prob}`);
        }
        addon.createPlates(run);
      } }]
    });
  };

  // Copy text to the clipboard, with a fallback for contexts where the async Clipboard API is
  // blocked (some sandboxed iframes). Resolves to true/false so the UI can show feedback.
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  // One CSV row per created plate: the barcode (the join key the drive files match on) plus the key
  // facts. This is the hand-off to the analysis layer outside eLabNext, where replicate lineage is
  // reconstructed from these facts. PURE (unit-tested); `results` are the created-plate objects.
  function plateRecordsCSV(results, run, shortName) {
    const header = ['Barcode', 'Sample name', 'Plate', 'Cell line', 'Concentration (cells/mL)',
      'Passage number', 'Matrix code', 'Wellplate', 'Printer', 'Protocol', 'Print run ID', 'Print date',
      'Inert base print date', 'Operator', 'Bioink lot', 'Activator lot'];
    const lines = [header.map(csvEscape).join(',')];
    (results || []).forEach(r => {
      const s = r.spec || {};
      let code = r.barcode || (r.sampleID != null ? `id ${r.sampleID}` : '');
      // Excel mangles a long ALL-DIGIT barcode into scientific notation (e.g. 5.00001E+12). Wrap only
      // those as an Excel text-literal (="…"); leave alphanumeric barcodes / "id 123" plain so
      // programmatic consumers (pandas/R, the analysis join key) read a clean value, not `="…"`.
      if (/^\d+$/.test(code)) code = `="${code}"`;
      // "Operator" is the sample's native eLabNext owner (read back per-record after creation), not a
      // typed value, see createPlates. Kept as its own column per record rather than a single
      // run-level value, since in principle each plate could carry a different creator.
      const cells = [code, s.name, s.plate_id, s.cell_line, s.concentration, s.passage, s.matrix,
        s.wellplate, run.printer, shortName, run.print_run_id, run.date, run.date_inert_base,
        r.owner || '', run.lot_bioink, run.lot_cell];
      // Cell 0 is the barcode (already made Excel-safe above); formula-guard the rest so a value
      // starting with = + - @ cannot execute when the CSV is opened in a spreadsheet.
      lines.push(cells.map((v, i) => csvEscape(i === 0 ? String(v == null ? '' : v) : csvFormulaGuard(v))).join(','));
    });
    return lines.join('\r\n');
  }
  // Trigger a client-side download of text (the CSV). Best-effort: some sandboxed add-on iframes may
  // block it, in which case the "Copy all barcodes" button remains as a fallback.
  function downloadText(filename, text) {
    try {
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      return true;
    } catch (e) { return false; }
  }

  addon.createPlates = run => {
    closeModal();
    // Build the ordered list of plate records (pure; unit-tested). Each spec already carries its
    // name, note, and the full sampleMetas array.
    const specs = buildRunPlateSpecs(run);
    showDialog({ width: 420, title: 'Creating plates',
      content: `<p>Creating ${esc(specs.length)} plate record(s)…</p>` });

    // Strip the auto-generated date prefix and hash suffix (see buildProtocolName) back off the
    // protocol's name, so the summary reads as a clean human label rather than repeating them.
    const shortName = String(run.protocol_name || '')
      .replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_[0-9a-f]{6}$/, '');
    const results = [];
    let chain = Promise.resolve();
    specs.forEach(spec => {
      // "Notes" is a reserved custom-field name: eLabNext has a native Notes field on every sample
      // ("Notizen"). Use that (the documented `note` property), not a colliding custom field.
      chain = chain.then(() =>
      getSampleTypeMetaMap(run.plate_type_id).then(map => {
        stampMetaIDs(spec.metas, map);
        return apiCall('POST', 'samples',
          { sampleTypeID: run.plate_type_id, name: spec.name, note: spec.note, sampleMetas: spec.metas });
      })
        .then(sampleID => getSampleById(sampleID)
        .then(full => {
          const bc = (full && full.barcode) || '';
          // A created sample should always have a barcode; empty means the read-back didn't
          // return one. Flag it so it isn't silently mistaken for a valid join key.
          // `owner` is native to eLabNext (set server-side to whoever's session created the
          // sample), read it back here instead of asking the user to type an Operator name.
          return { spec, sampleID, barcode: bc, barcode_read_failed: !bc,
            owner: (full && full.owner) || '' };
        })
        .catch(() => ({
        spec,
        sampleID,
        barcode: '',
        barcode_read_failed: true,
        owner: ''
      })))
        .then(r => { results.push(r); }));
    });

    // Render the results dialog. Shown on success AND on partial failure, on failure the plates that
    // WERE created still appear here with their barcodes, so those (the analysis join key) are never
    // lost. `errMsg` non-empty means the run stopped partway.
    function showResultsDialog(errMsg) {
      // One row per created plate (plate · cell line · barcode), with per-barcode Copy / Copy-all
      // buttons so the codes go straight onto the plates (the barcode is the join key).
      const rows = results.map(r => {
        const s = r.spec;
        const label = [s.plate_label, s.cell_line].filter(Boolean).join(' · ') || '—';
        if (r.barcode_read_failed) {
          // Don't present the internal id as if it were the barcode, say the read failed and point
          // the user to the sample (the plate WAS created; only the barcode read-back didn't return).
          return `<tr><td style="padding-right:12px;">${esc(label)}</td><td colspan="2" class="bpt-error">barcode not read — open sample id ${esc(r.sampleID)} in Inventory to get it</td></tr>`;
        }
        const code = r.barcode;
        return `<tr><td style="padding-right:12px;">${esc(label)}</td><td style="font-family:ui-monospace,monospace;padding-right:12px;white-space:nowrap;">${esc(code)}</td><td><button type="button" class="bpt-copy-btn" data-copy="${esc(code)}">Copy</button></td></tr>`;
      }).join('');
      const allCodes = results.map(r => r.barcode || (`id ${r.sampleID}`)).join('\n');
      const csv = plateRecordsCSV(results, run, shortName);
      const banner = errMsg
        ? `<div class="bpt-error" style="margin-bottom:8px;">Creation stopped after an error: ${esc(errMsg)}. <b>${esc(results.length)} of ${esc(specs.length)}</b> plate(s) were created — their barcodes are below, <b>save them now</b> (copy or download). The remaining ${esc(specs.length - results.length)} were not created; fix the issue and log those again.</div>`
        : `<p>${esc(results.length)} plate record(s) created in Inventory (print run <b>${esc(run.print_run_id)}</b>), linked to <b>${esc(shortName)}</b>.</p><p class="bpt-hint" style="margin-top:8px;">Each plate has a unique barcode (its ID). Copy it onto the plate to identify it. (It can also be printed as a label if a label printer is set up.)</p>`;
      showDialog({ width: 580, title: (errMsg ? 'Partly created — save these barcodes' : 'Plates created'),
        content: `${banner}<table class="bpt-table"><tr><td style="color:#64748b;font-weight:600;">Plate · Cell line</td><td style="color:#64748b;font-weight:600;">Barcode</td><td></td></tr>${rows}</table><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button type="button" id="bpt-copy-all" class="bpt-btn bpt-btn-secondary" data-copy="${esc(allCodes)}">Copy all barcodes</button><button type="button" id="bpt-dl-csv" class="bpt-btn bpt-btn-secondary">Download CSV (barcodes + metadata)</button></div>`,
        afterRender() {
          function wire(btn) {
            if (!btn) return;
            btn.onclick = () => {
              const orig = btn.textContent;
              copyToClipboard(btn.getAttribute('data-copy')).then(ok => {
                btn.textContent = ok ? 'Copied ✓' : 'Copy failed';
                setTimeout(() => { btn.textContent = orig; }, 1400);
              });
            };
          }
          Array.prototype.forEach.call(document.querySelectorAll('.bpt-copy-btn'), wire);
          wire(document.getElementById('bpt-copy-all'));
          const dl = document.getElementById('bpt-dl-csv');
          if (dl) dl.onclick = () => {
            const ok = downloadText(`print-run-${run.print_run_id}.csv`, csv);
            if (!ok) { dl.textContent = 'Download blocked — use Copy instead'; }
          };
        }
      });
    }

    chain.then(() => {
      showResultsDialog('');
    }).catch(err => {
      // Partial failure: if ANY plates were created, show them so their barcodes aren't lost; only
      // fall back to a bare error when nothing at all was created.
      if (results.length) showResultsDialog((err && err.message) || String(err));
      else showError('Error', `No plates were created: ${(err && err.message) || String(err)}`);
    });
  };

  // ─── Test surface ─────────────────────────────────────────────────────────────
  // Pure functions exercised by the Node harnesses in addon/test/. Attached only when the test flag
  // __BPT_TEST__ is set, so it is absent from the shipped browser build. The harnesses set that flag
  // before loading the add-on. (typeof on an undeclared name is safe in strict mode.)
  if (typeof __BPT_TEST__ !== 'undefined' && __BPT_TEST__) {
    addon._test = {
      buildRunPlateSpecs,
      plateFieldProblem,
      plateRecordsCSV,
      nearestExisting,
      levenshtein,
      slugify,
      distinctMetaValues,
      buildDesignedPlates,
      parseRastrum,
      getSampleById,
      stampMetaIDs,
      groupFilesByFolder,
      shortenMiddle,
      getInstalledAddon,
      readStoredConfig,
      saveStoredConfig,
      resetInstalledAddonCache() { installedAddonPromise = null; },
      normaliseStoredConfig,
      applyConfig,
      CONFIG,
      checkTypeFields,
      prettyType,
      REQUIRED_SAMPLE_TYPE_FIELDS
    };
  }

})(BioprintTracker);
