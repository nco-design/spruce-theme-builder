# Project specifications

## Project architecture

```text
spruce-theme-builder/
|
|-- build-theme.js                 Builds a theme with a frontend and an icon pack
|
|-- src/                           Shared builder source code
|
|-- frontends/                     Build definitions for each target CFW
|   `-- spruceos/
|       |-- theme/
|       |   |-- theme.json         Standard 480p 4:3 definition (required)
|       |   |-- theme-720.json     TSP/TSPS definition (optional)
|       |   `-- theme-<resolution>.json
|       |                           Additional resolution definitions (optional)
|       |
|       `-- icon-pack/
|           |-- icon-pack.json     Standard 480p 4:3 definition (required)
|           |-- icon-pack-720.json TSP/TSPS definition (optional)
|           `-- icon-pack-<resolution>.json
|                                       Additional resolution definitions (optional)
|
|-- projects/                      Source projects
|   |-- themes/                    Master projects and color palettes
|   |   `-- example-theme/
|   |       |-- config.json        Theme information
|   |       |-- source-palette.json
|   |       |                       Source colors used by the theme SVG files
|   |       |-- assets/            Shared SVG source files
|   |       `-- palettes/          At least one palette is required
|   |           |-- light-palette.json
|   |           `-- dark-palette.json
|   |
|   `-- icon-packs/
|       `-- example-pack/
|           |-- config.json        Icon pack information
|           |-- source-palette.json
|           |                       Source colors used by the icon pack SVG files
|           `-- assets/            SVG sources recolored with the theme palettes
|
`-- builds/                        Generated files
    `-- spruceos/                  Selected frontend
        |-- example-theme-light-palette/
        |   |-- skin/
        |   |-- skin_640_480/
        |   |-- skin_1280x720/
        |   |-- icons/             Selected icon pack using the light palette
        |   `-- icons_1280x720/
        `-- example-theme-dark-palette/
            |-- skin/
            |-- skin_640_480/
            |-- skin_1280x720/
            |-- icons/             Selected icon pack using the dark palette
            `-- icons_1280x720/
```

The theme is the master project. Its palettes are used to recolor both the theme
assets and the selected icon pack. Icon packs do not contain their own palettes.

A theme build requires three arguments:

```bash
node build-theme <theme-name> <frontend-name> <icon-pack-name>
```

The default build only includes the main resolution. Add `--720p` to include
the optional 720p theme assets, icon-pack assets and resolution config:

```bash
node build-theme <theme-name> <frontend-name> <icon-pack-name> --720p
```

By default, every theme palette is built. Use `--palette` to build only the
palette matching its `palette-name`:

```bash
node build-theme <theme-name> <frontend-name> <icon-pack-name> --palette <palette-name>
```

`--palette` and `--720p` can be combined.

Example:

```bash
node build-theme PS-modern spruceos ic-squares-monochrome
```

## Theme config.json

```json
{
  "theme-name": "example-theme",
  "description": "Simple theme designed as an example, with a clear UI",
  "Author": "Nicolas C"
}
```

## Palette config.json

```json
{
  "palette-name": "light-palette",
  "description": "Light palette",
  "Author": "Nicolas C",
  "properties": {
    "bg-color": "#ffffff",
    "primary-color": "#000064",
    "primary-dark": "#7f7fb1",
    "secondary-color": "#7f7fb1",
    "secondary-dark": "#7f7fb1",
    "accent-color": "#0000ff"
  }
}
```

## source-palette.json

Each theme and icon pack contains its own source palette. This allows their SVG
files to use different working colors while both are converted to the selected
theme palette during the build.

```json
{
  "primary-color-source": "#e5e5e5",
  "primary-dark-color-source": "#cccccc",
  "secondary-color-source": "#808080",
  "secondary-dark-color-source": "#666666",
  "accent-color-source": "#ff0000",
  "background-color-source": "#0d0d26"
}
```

## theme.json and icon-pack.json

```json
{
  "icons": [
    {
      "icon-name": "source icon name",
      "target-path": "built file path",
      "source": "source file path",
      "width": 640,
      "height": 480,
      "format": "png"
    },
    {
      "icon-name": "Empty",
      "target-path": "/skin",
      "source": "/icons/is_empty.svg",
      "width": 96,
      "height": 96,
      "format": "png"
    },
    {
      "icon-name": "app_loading_01",
      "target-path": "/skin",
      "source": "/icons/app_loading_01.svg",
      "width": 100,
      "height": 480,
      "format": "png"
    },
    {
      "icon-name": "app_loading_02",
      "target-path": "/skin",
      "source": "/icons/app_loading_02.svg",
      "width": 100,
      "height": 480,
      "format": "png"
    }
  ]
}
```

### Background assets

Manifest entries may declare the optional `type` property:

```json
{
  "icon-name": "background",
  "target-path": "/skin",
  "source": "/projects/backgrounds/background.svg",
  "width": 640,
  "height": 480,
  "format": "png",
  "type": "background"
}
```

The property follows this contract:

- When `type` is omitted, the entry is a regular asset and keeps the default
  stretch-to-size behaviour.
- `"type": "background"` identifies a full background or visual texture whose
  aspect ratio must be preserved.
- Background assets use a centered `cover` resize: the entire target area is
  filled, overflow is cropped, and the source is never stretched.
- The generated file always uses the exact `width` and `height` declared by the
  manifest.
- The flag is declared per manifest entry, not per source file. A source reused
  by both a full background and a small UI element can therefore use different
  resize behaviours.
- `background` preserves the aspect ratio with a centered `cover` resize.
- `button` identifies a button that will use the radius-preserving button
  renderer. Until that renderer is implemented, it keeps the regular `fill`
  behaviour.
- Other `type` values are invalid.
- Background sources must currently be SVG files. Palette colors are replaced
  in the SVG before it is rendered and resized.
- Because `cover` preserves the source ratio, parts of the visual may be
  cropped when the source and target ratios differ.
- When automatic centered cropping is not suitable, provide an SVG composed
  for the target ratio and reference it from the corresponding resolution
  manifest, such as `theme-720.json`.

Raster artwork is not accepted directly. A separate import helper may support
JPEG, PNG or WebP sources in the future.
