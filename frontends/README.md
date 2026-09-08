# Front-ends

A front-end describes the target firmware UI that receives a generated theme. It maps vector assets from a theme project and icon pack to the files, formats, sizes and folders expected by that firmware.

`spruceos` is the current implementation. Additional front-ends, such as OnionOS, can use the same structure without changing a theme project.

## Directory structure

Each front-end lives in `frontends/<frontend-name>/`

| Path                        | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `frontend.json`             | Default profiles, static items and optional build modes. |
| `theme/`                    | Asset maps for files from `projects/themes/<theme>/assets/`.     |
| `icon-pack/`                | Asset maps for files from `projects/icon-packs/<pack>/assets/`.  |
| `placeholder-static-files/` | Safe defaults for static files a project may omit.               |

The directory name is the value passed as `<frontend-name>` to `build-theme`. For example, `frontends/spruceos/` is selected with `spruceos`.

## Asset-map files

`theme/theme.json` and `icon-pack/icon-pack.json` are required. Each file contains an `icons` array :

```json
{
  "icons": [
    {
      "icon-name": "background",
      "target-path": "/skin",
      "source": "/projects/backgrounds/main-background.svg",
      "width": 640,
      "height": 480,
      "format": "png",
      "type": "background",
      "opacity": 100
    }
  ]
}
```

### Properties

| Property | Description | Required? |
| --- | --- | --- |
| `icon-name` | Output filename, without the extension. | Yes |
| `target-path` | Destination directory inside the generated theme. Leading and trailing `/` are optional. | Yes |
| `source` | Source SVG path. | Yes |
| `width`, `height` | Output dimensions in pixels. | Yes |
| `format` | `png` or `svg`. | Yes |
| `type` | Optional rendering behaviour. See [source image types](../docs/source-image-types.md). | No |
| `opacity` | Optional percentage from `0` to `100`; defaults to `100`. | No |

All SVG assets are recolored from the relevant project's `source-palette.json` before being exported. Use source palette colors in SVG files whenever the asset should follow a palette.

## Front-end options

The default `theme-config` and `icon-pack-config` profiles are always used. Every additional option is declared in `frontend.json`; option names have no hard-coded meaning in the builder.

For example, SpruceOS declares its default build and its `--720p` option like this:

```json
{
  "theme-config": "theme.json",
  "icon-pack-config": "icon-pack.json",
  "static-files": [
    { "type": "folder", "name": "sound", "target": "/" },
    { "type": "config-file", "name": "config.json", "target": "/" }
  ],
  "options": {
    "720p": {
      "label": "Include optional 720p assets",
      "theme-config": "theme-720.json",
      "icon-pack-config": "icon-pack-720.json",
      "static-files": [
        { "type": "config-file", "name": "config_1280x720.json", "target": "/" }
      ]
    }
  }
}
```

| Property | Description |
| --- | --- |
| `label` | Optional text displayed by the interactive assistant. |
| `theme-config` | One asset map loaded from the front-end's `theme/` directory. |
| `icon-pack-config` | One asset map loaded from the front-end's `icon-pack/` directory. |
| `static-files` | Files and folders copied into the build. Option entries are added to the default entries. |

`static-files` entries use `folder`, `static-file` or `config-file`. A `folder` is copied recursively; a `static-file` is copied unchanged; and a `config-file` also receives palette injection. For every item, a same-name path in the theme's `assets/` directory overrides the front-end placeholder. Folders merge recursively, with the theme files taking priority.

The builder does not infer filenames from an option name and does not generate missing files. For `--720p`, `theme-720.json`, `icon-pack-720.json` and the `config_1280x720.json` placeholder must exist. A contributor can add `--960p` or `--other-setting` by adding another entry and its files, without modifying JavaScript.

## Static files and placeholders

Every `static-files` item is sourced from `placeholder-static-files/` by default. A matching item in the theme's `assets/` folder takes precedence. Project `.ttf` and `.otf` files are also copied automatically so a theme can add a custom font.

`system-fonts` is an optional root property in `frontend.json`. It lists font names referenced by a configuration that are supplied by the target firmware and therefore must not be present in the build.

The output configuration and every referenced non-system font are validated before asset rendering begins.

## Adding a new front-end

1. Create `frontends/<frontend-name>/` using the directory structure above.
2. Add `frontend.json` with default profiles, a `static-files` list and an `options` table. Use an empty object when the front-end has no additional options.
3. Add the asset maps referenced by `theme-config` and `icon-pack-config`.
4. Add all required fallback files under `placeholder-static-files/`.
5. Declare optional profiles and configuration files in `frontend.json` when needed.
6. Build an existing theme and icon pack against the new front-end, then check its output paths, sizes and static files on the device.

Use forward-slash paths in configuration files and keep every source path inside the appropriate project assets directory. The builder rejects paths that escape these directories.
