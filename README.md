[![Download v1.0.0](https://img.shields.io/badge/download-v1.0.0-2ea44f?logo=github)](https://github.com/nco-design/spruce-theme-builder/releases/download/v1.0.0/spruce-theme-builder-v1.0.0.zip)
[![License: GPL v3 or later](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)](LICENSE)
[![GitHub profile](https://img.shields.io/badge/GitHub-nco--design-181717?logo=github)](https://github.com/nco-design)
[![PS Modern theme](https://img.shields.io/badge/theme-PS%20Modern-6f42c1?logo=github)](https://github.com/nco-design/PS-modern-theme)

# Project description

This project is a theme builder for SpruceOS. It can support multiple frontends and could be modified to work with OnionOS.
Put your theme files in `projects/themes` and your icon packs in `projects/icon-packs`.
For each theme, you can add as many color variants as you want in `theme-name/palettes`.

Once you have a theme, an icon pack for your emulators and app and a few palettes, you can build any combination you want with the builder.
So, you can work on a dark theme, add a brighter version, a colorful version or any other variant very easily.

Copyright © 2026 nco-design. This project is licensed under the
[GNU General Public License v3.0 or later](LICENSE).

# Preview

| **Snowy Peak**<br><br><img src="docs/imgs/preview-snowy-peak.png" width="240" alt="Snowy Peak preview"><br><br>`node build-theme example-theme spruceos example-pack --palette snowy-peak`             | **Autumn Nights**<br><br><img src="docs/imgs/preview-autumn-night.png" width="240" alt="Autumn Nights preview"><br><br>`node build-theme example-theme spruceos example-pack --palette autumn-nights` |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Emerald Green**<br><br><img src="docs/imgs/preview-emerald-green.png" width="240" alt="Emerald Green preview"><br><br>`node build-theme example-theme spruceos example-pack --palette emerald-green` | **Ruby Red**<br><br><img src="docs/imgs/preview-ruby-red.png" width="240" alt="Ruby Red preview"><br><br>`node build-theme example-theme spruceos example-pack --palette ruby-red`                    |
| **Pink Pearl**<br><br><img src="docs/imgs/preview-pink-pearl.png" width="240" alt="Pink Pearl preview"><br><br>`node build-theme example-theme spruceos example-pack --palette pink-pearl`             | **Blue Pearl**<br><br><img src="docs/imgs/preview-blue-pearl.png" width="240" alt="Blue Pearl preview"><br><br>`node build-theme example-theme spruceos example-pack --palette blue-pearl`            |

# How to install

> [!NOTE]
> This project requires Node.js and npm to run.

## 1. Download the project

**[Download the latest release](https://github.com/nco-design/spruce-theme-builder/releases/download/v2.0.0/spruce-theme-builder-v2.0.zip)** or clone this repository.

## 2. Install project dependencies

```bash
npm install
```

# How to use

## Recommended method

The tool includes a small interactive assistant. Copy this command and follow
the instructions:

```bash
node build-theme
```

## Manual method

```bash
node build-theme <theme-name> <frontend-name> <icon-pack-name>
```

By default, the builder will generate every palette variants.
You can find the result in `builds/`.

Example:

```bash
node build-theme example-theme spruceos example-pack
```

Front-end-specific options are declared in `frontends/<frontend>/frontend.json`.
For example, SpruceOS declares `--720p`. This option adds the front-end's
720p profiles and configuration template; a theme may override that template
with a file of the same name in its `assets/` directory:

```bash
node build-theme example-theme spruceos example-pack --720p
```

Build a single palette:

```bash
node build-theme example-theme spruceos example-pack --palette snowy-peak
```

Front-end options can be combined with `--palette`:

```bash
node build-theme example-theme spruceos example-pack --palette snowy-peak --720p
```
