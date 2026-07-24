# Bundled libraries

`addon/build.sh` inlines these two libraries into the single uploadable `addon/addon.js` so the
add-on has no external (CDN) dependency at runtime. Both are used under the MIT License.

- **JSZip** (`jszip.min.js`) — https://github.com/Stuk/jszip — MIT License, © Stuart Knightley and
  contributors.
- **js-yaml** (`js-yaml.min.js`) — https://github.com/nodeca/js-yaml — MIT License, © Vitaly
  Puzrin and contributors.

The full MIT license text for each is available in the respective project repositories linked above.
