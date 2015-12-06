# fxos-icons

## Installation

```bash
$ npm install fxos-icons
```

Then include folowing file in HTML

```html
<link rel="stylesheet" href="node_modules/fxos-icons/fxos-icons.css">
```

## Usage

Use `i` tag to represent an icon.

```html
<i data-icon="camera" data-l10n-id="camera"></i>
```

## Examples

- [Example](http://fxos-components.github.io/fxos-icons/)

## Accessibility

`aria-label` will be added automatically when `data-l10n-id` attribute is specified in target element.

```html
<i data-icon="camera" data-l10n-id="camera"></i>
```

If the icon is for present only, add `aria-hidden` attribute to make it unreachable by the screen reader.

```html
<i data-icon="camera" aria-hidden="true"></i>
```

If the icon is included in certain component, try integrate it as component's `data-icon` attribute and handle the accessiblity related issues automatically.

If `aria-hidden` is not used on the icon, it will always be accessible to the screen reader. Adding `data-l10n-id` to the element with `data-icon` that points to `{property}.ariaLabel` in the properties file (that will add an `aria-label` attribute to the same element and will not touch inner HTML).

## Contributions

If you wish to make changes to the icon font you'll need to follow these steps:

1. Add, remove or change respective `.svg` files inside `images/`.
2. Run `$ npm install` to get pull in all the required build tools.
3. Make sure you have `fontforge` and `ttfautohint` installed on your machine. The [grunt-webfont](https://github.com/sapegin/grunt-webfont#installation) installation guide outlines the prerequisites.
4. Run `$ grunt`.
5. Load `index.html` locally in your browser and check your icon looks good.
6. Submit a pull request.
7. Module owner will review, land, and stamp a new version.

## Guidelines

For best results, it is recommended to follow these guidelines:

* Make the document 30px × 30px (In Inkscape: File > Document Properties... > Custom size).
* Make the icon 24px × 24px.
* Center the icon (In Inkscape: Object > Align and Distribute... > Align relative to page).
* Make sure to have only one `<path>` with no overlap per icon.
* Optimise the icons using [svgo](https://github.com/svg/svgo), then export to plain SVG file (`$ inkscape -l icon.svg icon.svg`).

Please also make sure new icons naming is consistent with existing ones:

* Use lower case only.
* Separate words with hyphens.
* Use meaningful words rather than acronyms (e.g. `top-left-crop-corner` instead of <span style="text-decoration:line-through">`t-l-crop-corner`</span>).

## Gaia usage

Gaia hackers, please read the introduction to ['Version controlled packages in Gaia'](https://gist.github.com/wilsonpage/3d7f636a78db66f8f1d7) to find out how to use this package in your Gaia app.

## Get a report

You can get a report of unused icons on a project by doing:
```bash
$ node bin/report.js path/to/your/project/
```

Please note, that dynamically inserted icons may still be marked as unused in the report.

## Lint check

Run lint check with command:

`$ npm run lint`

## Current owners

- Wilson Page [:wilsonpage]
