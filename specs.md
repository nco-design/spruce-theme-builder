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
