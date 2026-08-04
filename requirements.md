# Project requirements

1. This project is built upon old code that is working but is not optimized (tedious process)
2. Old code can be used and edited, the main fix comes from the new architecture
3. Later on the project can be expanded to add more useful fonctions

## Project architecture

```text
spruce-theme-builder/
|
|-- build-theme.js                 Builds a theme and all its color variants
|-- build-icon-pack.js             Builds an icon pack and all its color variants
|
|-- src/                           Shared builder source code
|   `-- build-params.json          Source colors replaced by palette colors
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
|   |-- themes/
|   |   `-- example-theme/
|   |       |-- config.json        Theme information
|   |       |-- assets/            Shared SVG source files
|   |       `-- palettes/          At least one palette is required
|   |           |-- light-palette.json
|   |           `-- dark-palette.json
|   |
|   `-- icon-packs/
|       `-- example-pack/
|           |-- config.json        Icon pack information
|           |-- assets/            Shared SVG source files
|           `-- palettes/          At least one palette is required
|               |-- light-palette.json
|               `-- dark-palette.json
|
`-- builds/                        Generated files
    |-- themes/
    |   |-- example-theme-light-palette/
    |   `-- example-theme-dark-palette/
    |
    `-- icon-packs/
        |-- example-pack-light-palette/
        `-- example-pack-dark-palette/
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

## build-params.json

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

## theme.json et palette.json

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
