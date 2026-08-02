# Changelog

All notable changes to this add-on are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version numbers follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-08-03

### Added
- **Choose the file folder inside the add-on.** **Set up / check → Choose file folder** lists your
  Data Storage folders with their numbers and saves the one you pick, so setup no longer depends on
  the platform's Configure screen, which in some tenants opens with no fields in it. Folders are
  listed by an example file they contain, so put any file into the folder you want to use before
  opening the screen. A folder holding no files cannot be listed.
- **Navigation between plates when logging a run.** **Previous plate** and **Next plate**, and the
  progress dots, move between plates. A dot jumps straight to its plate.

### Changed
- **Plate record names now end with the plate's order in the print file (`_P1`, `_P2`).** The suffix
  previously passed through each file format's own key, which meant "which plate" for Allegro files
  but "which plate type" for classic RASTRUM files, so a name ending `_WP031` said nothing about
  which plate it was and did not sort in plate order. **This applies to records created from this
  version onward. Existing plates keep the names they were given**, so a sample list spanning the
  upgrade will show both styles.
- **Approving a plate no longer moves you to the next one.** Approving and navigating are separate
  actions. Previously approving was the only way forward, so returning to an earlier plate left no
  way to move on without withdrawing and re-granting approval.
- **Approving a plate locks its fields.** The button reads **✓ Approved — click to edit** and
  reopens the plate for changes. Previously an approved plate stayed editable, so its passage or
  note could be changed while it still showed as approved.
- **Records that cannot be created say which plates are still to approve**, and take you to the
  first one, instead of repeating the rule.
- **Dialogs reached from the menu say Back to menu or Back to setup** rather than a bare "Back", and
  leaving a part-filled form asks before discarding it.

### Fixed
- Folder list display: the numbered steps lost their numbers, long filenames pushed the columns out
  of shape, and the marker on the folder in use overlapped its number. The list also scrolls on its
  own now, so the confirmation message stays in view when the list is long.
- A plate's progress dot could be invisible while the plate was unapproved.

### Upgrading
Nothing to do. Sample types, their fields, and existing records are untouched. See the note under
**Changed** about plate naming.

Version 1.0.1 was withdrawn before release and is not used. This release follows 1.0.0.
