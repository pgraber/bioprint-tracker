# Setup and self-test

## What you upload
`addon/addon.js` (the built single file). Never upload the `src/` or `lib/` files. If you change
anything in `src/`, rebuild with `./build.sh` before uploading.

## One-time tenant setup

### 1. Sample types and fields

> **Shortcut (admin only, verify on your tenant):** an admin can create both sample types and all
> their fields automatically instead of building them by hand — in the add-on, click
> **Set up / check** → **Set up sample types** (or add `#bioprinting-setup-types` to the Inventory
> URL, or run `BioprintTracker.setupSampleTypes()` in the browser console). It skips any type that already
> exists, and afterwards checks every field came through with the right type. You can re-confirm any
> time with **Set up / check** → **Check sample types** (read-only). Creating sample types is server-restricted
> to administrators: if a non-admin runs it, the dialog reports "not permitted (needs an admin
> account)" rather than doing anything. The `POST /sampleTypes` create calls are confirmed working on
> the tenant (an admin run created both types with all their fields) — but still **confirm it worked** for
> your group (the dialog reports
> created / already-exists / not-permitted / failed per type; check the browser console/Network on a
> failure) and fall back to the manual steps below if a type did not get created. The manual
> instructions remain the source of truth.

Sample types belong to a **group** (they are created in the caller's primary group), so this is a
**per-group** task: a group administrator sets it up once for their group, and then everyone in that
group can use the add-on. A group that hasn't been set up sees a "Not set up for your group yet" nudge
on the launcher until an admin completes it.

Create these two Inventory sample types in eLabNext (Inventory settings). The field **names must
match exactly**, because the add-on sends metadata keyed by these names.

> **⚠️ The two sample-type NAMES are load-bearing.** The add-on finds each type by its name at
> runtime (there is no ID to configure — see §2), so the type names must be **exactly**:
>
> ```
> Bioprint Template
> Bioprinted Plate
> ```
>
> Matching ignores capitalisation and leading/trailing spaces, so `bioprinted plate` is fine. It does
> **not** forgive typos, plurals, or internal spacing/punctuation: `Bioprint Templates`, `Bioprint
> Plate`, and `Print  Template` (double space) all fail to match. If a name is off, the add-on does
> not save silently — it shows "not set up yet" and, when it can, names the closest existing type so
> you can spot the typo. Copy the two names above verbatim when creating the types.
>
> _(Add setup screenshots to the marketplace listing at submission.)_

**Bioprint Template** (the reusable protocol, imported from the `.rastrum`). Confirm this type has
these fields:

| Field name | Type |
|---|---|
| Printer version | Text |
| Print model | Text |
| Matrix code | Text |
| Cell line | Text |
| Cell concentration (cells/mL) | Text |
| Wellplate | Text |
| Bioink | Text |
| Activator | Text |
| Inert base bioink | Text |
| Inert base activator | Text |
| Bioink pressure (kPa) | Numeric |
| Bioink open time (us) | Numeric |
| Activator pressure (kPa) | Numeric |
| Activator open time (us) | Numeric |
| RASTRUM schema version | Text |
| Source file hash | Text |
| Designed plates (JSON) | Text |
| Print file | File |
| Protocol PDF | File |
| Wellplate summary (CSV) | File |

The field **names must match exactly**. If a value the add-on sends has no matching field on the
sample type, eLabNext silently drops it (it does not error). The add-on guards against this: after
saving a protocol it re-reads the record and, if any field did not persist, it names the exact
fields you need to add. `Matrix code` is populated for Allegro files only (the older RASTRUM
format does not encode a matrix code); `Cell line` and `Cell concentration (cells/mL)` are parsed
from the file and pre-filled into the Log-print-run form. `Wellplate` stores the human plate name
with the internal code in brackets, e.g. `Greiner 96-well [WP025]`. `Print file` is the raw `.rastrum`
itself, attached to the template. At log time the add-on **re-parses this file** to drive the per-plate
wizard — so any later parser improvement applies to existing templates automatically (the file is the
source of truth; see ADR-0003). `Designed plates (JSON)` is a **fallback-only** copy of the parsed
layout: it is written **only when the raw `.rastrum` cannot be attached** (upload failed, or the file
had no raw bytes), so a normal upload leaves this field empty rather than storing a large JSON blob.
It is still **read** as a fallback for templates that have no attached `Print file` (older records) or
whose re-parse fails. Both are optional: a protocol with neither still logs, just with less per-plate
detail. Keep the field defined on the type so the fallback path can write to it when needed.

**Bioprinted Plate** (one per physical plate). Create this type and note its ID.

| Field name | Type |
|---|---|
| Bioprint Template | Sample link (to the Bioprint Template sample) |
| Cell line | Text |
| Cell concentration (cells/mL) | Text |
| Passage number | Text |
| Printer | Text |
| Print date | Date |
| Inert base print date | Date |
| Print run ID | Text |
| Matrix code | Text |
| Plate | Text |
| Bioink lot | Text |
| Activator lot | Text |
| Wellplate | Text |

There is deliberately **no "Experiment/Study" field**. A plate is a shared-Inventory sample that may
be used by several experiments and people; you link a plate into your own experiment **natively from
the experiment side** (add the sample to an experiment section). That native link is the source of
truth, so the add-on does not capture an experiment name at print time. (If you had an old
"Experiment/Study" field on the type, it can stay; the add-on simply no longer writes to it.)

There is also deliberately **no "Operator" field**. eLabNext already attributes every sample to the
logged-in user who created it (native `owner`/`creatorID`), and logins here are personal, so that
native attribution is used instead of a typed name — no free-text field to mistype, and it shows up
directly in the exported CSV's "Operator" column. (An old "Operator" field can stay; the add-on
simply no longer writes to it.)

There is also deliberately **no "Condition" or "Replicate type/number" field** — treatment condition
and replicate lineage are derived downstream from the stored facts (Bioprint Template, Print run ID, date),
not stored on the plate. See `docs/.record/decisions.md` (2026-07-22 and 2026-07-18 entries) for the
full reasoning.

`Cell concentration (cells/mL)` is **Text**, not Numeric: a single plate can carry more than one
concentration (e.g. a seeding-density plate split into 2000000, 3000000, 5000000), so the value is a
comma-separated set — the same shape as the multi-value `Cell line`. Numeric analysis is done in the
downstream analysis layer, which parses the set; eLabNext just stores the fact.

`Passage number` is optional and also **Text** for the same reason: a plate with several cell lines
can have a different passage per line, so the value is a comma-separated set aligned to the cell-line
order (e.g. cell lines `Cell A, Cell B` at passage `12, 8`). It is **not** read from the `.rastrum`
file (the printer does not record it) — it is entered by hand in the per-plate step at log time.
Passage matters biologically because it affects cell phenotype, and it is what distinguishes a
biological replicate; leaving it blank is allowed.

`Wellplate` is set only for a multi-plate run (via the per-plate wizard) and records which physical
plate format each barcode is, e.g. `Greiner 384-well [WP035]`; a single-plate run leaves it blank
because the plate's format is already on the linked protocol.

`Printer` is the physical machine the run was printed on (its name, e.g. your lab's unit), chosen at log
time. It is a plain text field with suggestions drawn from previously-used printers, so the list
learns your machines rather than being hard-coded. This is **distinct** from the protocol's `Printer
version` (RASTRUM vs Allegro), which is the machine generation and is detected automatically from the
`.rastrum` file at upload, never typed. (If you previously had a `Printer` field on the **Print
Template** holding RASTRUM/Allegro, rename it to `Printer version` so the detected value persists.)

Do **not** add a custom "Notes" field — eLabNext reserves that name for the native Notes/"Notizen"
field every sample already has; the add-on writes run notes there directly instead.

The barcode is native to every sample, do not add it as a field.

### Naming convention
- **Bioprint Template** names are auto-generated: `{date}_{printer version}_{your text, slugified}_{hash6}`,
  e.g. `2026-07-18_RASTRUM_Large-Plug-v2_a3f9c1`. The printer version (RASTRUM/Allegro) is detected
  from the file, not typed. The hash suffix is the print file's own SHA-256,
  so two protocols given the same free-text name never collide, and the exact source file behind a
  given protocol name is always traceable. Uploaded PDF/CSV filenames follow the same name.
- **Print run ID** (`PR-{date}-{4 hex digits}`) is generated once per "Log print run" submission and
  shared across every plate created in that batch — useful for later finding "everything from this
  one run" regardless of each plate's own name or barcode.
- **Bioprinted Plate** names are
  `{protocol short name}_{print run ID}_{condition}_rep{replicate number}`, e.g.
  `Large-Plug-v2_PR-2026-07-18-7a86_Trametinib_rep1`. The condition tag keeps plates from different
  groups of one run distinct; a single uniform group with no condition drops the tag (`…_rep1`), and
  blank-but-multiple groups fall back to an ordinal (`…_g2_rep1`). **Replicate number** restarts at 1
  within each group and counts the *technical* replicates (the duplicate plates of one condition in
  this run). The *biological* replicate is the run itself: one print run is one cell prep on one day,
  so plates from a later run with the same protocol + condition + experiment are the next biological
  replicate, distinguished by their Print run ID and date (not stored as a number). This replaces the
  old plain "Plate number", since one print run rarely produces a single indistinguishable plate.

### 2. No ID configuration needed — the add-on finds the types by name
Once the two sample types exist (step 1), there is nothing more to configure: the add-on finds
"Bioprint Template" and "Bioprinted Plate" by their **exact names** at runtime (see `resolveSampleTypeID`
in `src/addon.core.js`). It fails loudly and clearly rather than guessing if a name is missing or
ambiguous — a regular user sees "This tenant is not set up for Bioprinting yet… ask your eLab
administrator to create it", never a silent wrong save.

**If a tenant has duplicate-named types.** If more than one type is named exactly "Bioprint Template"
(or "Bioprinted Plate"), name lookup cannot pick one — **rename the duplicates** so only one carries
each name. (A numeric type-ID override is no longer exposed in the Configure dialog, which now shows
only the file-storage folder number. The add-on can still read `SAMPLE_TYPE_PROTOCOL` / `SAMPLE_TYPE_PLATE`
from the `CONFIG` block in `src/addon.core.js` if you ever truly need to force one — set it there and
run `./build.sh`.)

**Configuration Schema shape (for `pdfFolderID`).** Confirmed empirically: the schema's settings must
be **flat, top-level keys** — a standard nested JSON-Schema (`{"properties": {...}}`) is not
understood; eLabNext renders the schema's own top-level keys (`$schema`, `type`, `properties`, ...) as
if they were the settings instead of looking inside `properties`. `config.schema.json` is already in
this flat shape, and matches the example in the official add-on configuration documentation.

**If the Configure dialog opens but shows no fields** (observed in a production tenant 2026-07-31, while
the same add-on rendered the field correctly in the sandbox), the schema is not the cause. Check, in
order: whether the installed version predates the schema (bump the version, publish, then **upgrade
the install** — publishing alone does not update an existing install, and an unchanged version number
gives the platform no reason to consider it stale); and whether the install's **scope** permits the
current user to edit it (SYSTEM and INSTITUTE are admin-editable only). Since v1.1.0 this no longer
blocks setup, because the folder can be set from inside the add-on instead. Raise it with eLabNext
support if neither explains it.

### 3. Install
Account Settings → Developer tab (a System Administrator enables this per user) → Side Loading, and
point it at `addon.js`, or publish it through the Developer Platform. The add-on's `@rootVar` is
`BioprintTracker`. (Confirm your tenant's exact menu labels.)

## Use
The **Bioprint Tracker** launcher is a button in the Inventory sample browser — under "+ Add Sample"
in Inventory Browser V2, and on the classic-browser toolbar in v1. It is registered on both, so the
correct one renders whichever browser your tenant serves. A printed plate is a sample, so the
launcher lives where samples are created.

Any of them opens the same dialog:
- **Upload protocol** — choose a `.rastrum`, it is parsed in the browser and saved as a Print
  Template sample with the design metadata as fields.
- **Log print run** — pick a protocol (its recorded details appear in a collapsed "Protocol
  details" section, and Cell line + concentration are pre-filled from the protocol as editable
  suggestions), enter the run-level details once (date, reagent lots — no Operator field, eLabNext's
  native record owner covers that), then add one **plate
  group** per condition or destination. Each group has its own condition, experiment/study, replicate
  type and plate count, and expands into that many barcoded Bioprinted Plate samples — all linked to
  the protocol, all sharing one Print run ID, differing only by replicate number within the group. A
  single group reproduces the old "N identical plates" behaviour. Condition, experiment and cell line
  offer previously-used values and warn on a near-duplicate typo, so re-used labels stay identical and
  replicates group together. The barcodes are shown grouped by condition so you can print and apply them.
  If the chosen protocol lays out **more than one physical plate** (a multi-wellplate design), the form
  becomes a **per-plate wizard**: it steps through each plate (Plate 1 → Plate 2 …), showing that
  plate's map, and you set the condition/experiment/copies for each. Every plate still shares the one
  Print run ID; each record also stores its own Wellplate format.

## Automated tests (run before committing a parser change)
The parser and its helpers have a zero-dependency test suite that runs against the real exported
print files in `addon/test/fixtures/`:

```
node addon/test/parser.test.js
node addon/test/run-flow.test.js
node addon/test/placement.test.js
```

All exit non-zero on any failure. `placement.test.js` drives `init()` under mocked SDKs to lock in
that the launcher is the native Inventory button (v1 `addButton` and/or v2 `registerAddSampleAction`)
and that nothing is appended to the page body. A fourth suite, `node addon/test/wizard.test.js`,
covers the per-plate wizard DOM flow and needs `jsdom` (`npm install`). Run them after any change to
`src/addon.core.js`, and add a fixture plus expected values in `parser.test.js` when a genuinely new
file shape turns up. Ad-hoc `.rastrum`
files dropped at the repo root are gitignored; promote one into `addon/test/fixtures/` (with a clean
name) when it becomes a canonical case worth locking in.

## Self-test checklist (in the tenant)
0. **Placement.** Open Inventory and confirm a "Bioprint Tracker" button appears in the sample-browser
   toolbar (under "+ Add Sample" in Browser V2, or the classic toolbar), for a normal non-admin lab
   member as well as an admin, and that it survives a page reload and navigating away and back. Note
   whether your tenant serves the classic browser or Inventory Browser V2. If no button appears, check
   the browser console for the "not available in this context" warning and confirm which SDK your
   Inventory page exposes.
1. Upload a real `.rastrum` and confirm a Bioprint Template sample appears in Inventory, named per the
   naming convention above, with the fields populated (model, wellplate, fluids, pressures) and the
   `protocol.pdf` attached and openable under Protocol PDF.
2. Log a run against it with two groups (e.g. condition "Control" count 2, condition "Trametinib"
   count 2): confirm selecting the protocol shows its "Protocol details" and pre-fills Cell line and
   concentration; confirm four Bioprinted Plate samples appear, each linked to the protocol, each with
   a barcode, all sharing one Print run ID, with the condition in the name and Replicate number
   restarting at 1 within each group (Control rep1/rep2, Trametinib rep1/rep2).
2b. Multi-plate: upload a multi-wellplate design, then log a run against it. Confirm the form steps
   through each plate (Plate 1 of N, with its map), that you can set a condition per plate, and that
   the created records carry each plate's own Wellplate format and cell line while sharing one Print
   run ID.
3. Open one plate sample and confirm the run fields (date, cell line, print run ID) are set, and
   that the sample's native Owner is the person who was logged in when it was created.
4. In a group's Experiment/Study (or Condition) field, type a few characters and confirm
   previously-used values appear in the dropdown; then type a value one letter or one case off an
   existing one and confirm a "did you mean?" suggestion appears and fills the field when clicked.
5. Read a real plate-reader export and a high-content-imager metadata file for the same physical
   plate and confirm the plate's barcode appears in the reader export's barcode column and the
   imager's plate-ID field — that is the join between the registry and the drive files.

## Confirm on your tenant (documented uncertainties)
- **Sample-meta schema.** The add-on sends `sampleMetas` as `{key, sampleDataType, value}`. The docs
  show an inconsistency between `key` (field name) and `sampleTypeMetaID` (a numeric field ID). If the
  metadata does not attach, the fields may need to be keyed by ID; adjust `metaField`/`metaLink` in
  `src/addon.core.js` accordingly.
- **Barcode field.** The code reads `barcode` from `GET samples/{id}`. Confirm that is the
  human-printable code and not an internal identifier.
- **Permissions.** Confirm the group can read the shared Inventory and that a plate sample can be
  linked from an experiment in a personal project.
- **PDF attachment.** `uploadFile()` posts raw bytes to `POST /api/v1/files?fileName=...` (confirmed
  in eLabNext's own API docs) and attaches the returned `fileID` via a `FILE`-type entry in the same
  `sampleMetas` array used at sample creation. The upload step is confirmed working; the exact write
  shape for linking a file to a sample field is not, so both a `files:[{fileID}]` and a flat
  `fileIDs:[fileID]` are sent as a hedge. If it fails, the protocol still saves without the PDF and a
  warning is logged to the console — check there if the file never appears.
- **File storage folder (optional).** Keep **every** uploaded file (protocol PDF, raw `.rastrum`,
  wellplate CSV) in one Data Storage folder — e.g. a group folder named **Bioprint Tracker** —
  instead of loose in the main file area. Left unset, uploads go to the main file area. A folder is
  referenced by its **number** (the API has no way to pick a folder by name — a by-name option was
  tried and dropped as unreliable; see `docs/.record/future-ideas.md`). To set it:
  1. In **Data Storage**, create the folder and drop any **marker file** into it (e.g. `bioprinting.txt`).
  2. In the add-on, click **Set up / check** → **Choose file folder** (or add `#bioprinting-setup`
     to the Inventory URL, or run `BioprintTracker.showFolderIdFinder()` in the console). It lists every
     folder that holds a file, each with its **number** and an **example filename**.
  3. Press **Use this folder** on the row listing your marker file. The add-on saves the choice
     itself, and the row is then marked **✓ in use**.
  - There is deliberately **no box for typing a folder number**. A typed number cannot be validated
     (nothing confirms a folder exists or belongs to your group) and placement cannot be corrected
     afterwards, so a single typo would misdirect every later upload permanently. Every button in the
     list points at a folder the add-on has just read files out of, so it is known to exist. This is
     also why step 1 says to drop a marker file in: a folder holding no files cannot be listed.
  - **Since v1.1.0 the add-on writes this setting itself** (`PUT /api/v1/addons/configuration`),
    so it no longer depends on the platform's **Configure** dialog. That dialog is still a valid
    second route and writes the same value; it rendered empty in a production tenant while working in the
    sandbox (2026-07-31), which is what prompted the change. Setting `CONFIG.PDF_FOLDER_ID` in the
    code remains a third route, needed only if neither of the above is available.
  - **Saving can be refused.** A SYSTEM- or INSTITUTE-scoped install is admin-editable only, so a
    user without that right gets `403` and the dialog says to ask an administrator. Under
    side-loading there is no installed record and therefore no `sdkPluginID`, so saving is
    unavailable and the dialog says so while still showing the numbers.
  - **Placement is write-once.** `folderID` is only accepted at upload and there is no move endpoint
    (nor create/list/rename for folders), so files uploaded before the folder is set stay in the main
    file area permanently. Set the folder before real use begins.
- **Experiment/Study autocomplete.** Built from `sampleMetas` on the plate list returned by
  `GET samples?sampleTypeID=...`. Whether that list endpoint returns full sample metadata or just a
  summary (name/ID) is unconfirmed — if the list endpoint only returns a summary, the field still
  works as free text, it just won't offer suggestions from prior entries. Check the browser console
  if suggestions never appear.
- **Protocol details / cell-line pre-fill.** Reads `sampleMetas` from `GET samples/{id}` for the
  selected protocol. If a protocol's fields don't appear here after selecting it, confirm this
  endpoint returns `sampleMetas` in the same `{key, value}` shape the add-on writes at creation.

## After a SciSure/eLabNext platform update
The platform can change SDK/API behaviour under us with no changelog (this already happened once,
see `docs/.record/decisions.md`). Re-run this self-test checklist after any noticed SciSure update, or
periodically, to catch a break quickly rather than mid-screen. The add-on times out a hung call after
15s and shows a visible error, and displays its own version on the button, so a break or a stale
cached copy is obvious rather than silent.

## Not in v1
Well-level readout numbers and images are not imported into eLabNext. They stay on the shared
network drive and are joined to the plate by its barcode during analysis.
