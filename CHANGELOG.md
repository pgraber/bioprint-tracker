# Changelog

## 1.1.0

### Choose the file folder inside the add-on
**Set up / check → Choose file folder** now lists your Data Storage folders with their numbers and
saves the one you pick. Setup no longer depends on the platform's Configure screen, which in some
tenants opens with no fields in it.

Folders are listed by an example file they contain, so put any file into the folder you want to use
before opening the screen. A folder holding no files cannot be listed.

### Move between plates without approving them
In **Log a print run**, moving through the plates and approving a plate are now separate actions.
Use **Previous plate** and **Next plate**, or click a progress dot to jump. Previously the only way
forward was to approve, so returning to an earlier plate left you stuck.

Approving a plate now locks its fields. The button reads **✓ Approved — click to edit** and reopens
the plate for changes. This closes a case where a plate could show as approved while its passage or
note had since been edited.

### Clearer plate names
The plate suffix in a record name is now the plate's order in the print file: `_P1`, `_P2`. It
previously passed through each file format's own key, which meant "which plate" for Allegro files but
"which plate type" for classic RASTRUM files, so names like `_WP031` said nothing about the plate and
did not sort in plate order.

### Smaller improvements
- Refusing to create records now names the plates still needing approval and moves you to the first
  one, instead of repeating the rule.
- Dialogs reached from the menu say **Back to menu** or **Back to setup** rather than a bare "Back",
  and leaving a part-filled form asks before discarding it.
- Fixes to the folder list: numbered steps, readable column widths, shortened filenames, and a list
  that scrolls on its own so the confirmation message stays in view.
- Fixed a progress dot that could be invisible for an unapproved plate.

### Upgrading
Nothing to do. Sample types, their fields, and existing records are untouched. The new plate naming
applies to records created from this version onward, so older plates keep the names they were given.

Version 1.0.1 was withdrawn before release and is not used.
