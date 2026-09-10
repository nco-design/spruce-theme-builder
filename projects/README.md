# Projects

This folder contains the source projects used by the builder.

## Themes

`themes/` contains theme projects. Each theme needs:

```text
theme-name/
├── assets/
├── palettes/
├── config.json
└── source-palette.json
```

- `assets/` contains the SVGs, backgrounds, fonts and other source files ;
- `palettes/` contains one JSON file per color palette ;
- `config.json` contains the theme metadata and front-end bindings;
- `source-palette.json` defines the source colors used by the SVG assets.

## Icon packs

`icon-packs/` contains emulator and application icon packs. Each pack needs:

```text
icon-pack-name/
├── assets/
├── config.json
└── source-palette.json
```
