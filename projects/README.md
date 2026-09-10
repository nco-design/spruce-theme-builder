# Projects

This folder contains the source projects used by the builder.

## Themes

`themes/` contains theme projects. Each theme needs:

```text
theme-name/
├── assets/
├── palettes/
├── project-config.json
└── source-palette.json
```

- `assets/` contains the SVGs, backgrounds, fonts and other source files ;
- `palettes/` contains one JSON file per color palette ;
- `project-config.json` contains the theme metadata, palette bindings and
  optional front-end config overrides;
- `source-palette.json` defines the source colors used by the SVG assets.

## Icon packs

`icon-packs/` contains emulator and application icon packs. Each pack needs:

```text
icon-pack-name/
├── assets/
├── config.json
└── source-palette.json
```
