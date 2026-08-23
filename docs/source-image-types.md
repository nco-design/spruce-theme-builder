# Source image types

`./frontends/spruceos/theme/` and `frontends/spruceos/icon-pack` both contain JSON config files.
Each JSON file is a list of each image used in the theme folder.
Images can have a `type` parameter. This parameter will affect how the image will be stretched in different resolutions.

## No type / Default

Basic stretch. Don't use any type if the image ratio won't change during the export.
For example : icons might have different resolutions output, but they will keep their ratio, so the stretching will not affect the visual element.

## Background

The image will be stretched using `cover`. The image will not be stretched, a simple zoom or crop will be applied to the image to fit different ratio (4:3 ; 16:9).

This is perfect for backgrounds.

## Button

Use `"type": "button"` when the same SVG must be exported in different shapes or sizes.
Rectangles stretch to the target size, while their rounded corners and outlines scale cleanly.
Text, circles and other vector shapes keep their original proportions.
Embedded raster images are not supported.

This is best used for items like :

- buttons
- selected list items
- pop-up backgrounds
- backgrounds that use rounded corners or outlines
