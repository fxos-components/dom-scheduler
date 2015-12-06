# &lt;fxos-dialog&gt; [![](https://travis-ci.org/fxos-components/fxos-dialog.svg)](https://travis-ci.org/fxos-components/fxos-dialog)

Several types of dialogs, including alert, confirm, prompt, action, select, and menu.

## Installation

```bash
$ npm install fxos-dialog
```

## Platform dependencies

- CSS Custom Properties
- Custom Elements
- Shadow DOM

## Alert Dialog

Include folowing files in HTML

```html
<script src="node_modules/fxos-component/fxos-component.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog-alert.js"></script>
```

### Usage

```html
<fxos-dialog-alert>No SIM card is present</fxos-dialog-alert>
```

## Confirm Dialog

Include folowing files in HTML

```html
<script src="node_modules/fxos-component/fxos-component.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog-confirm.js"></script>
```

### Usage

```html
<fxos-dialog-confirm>Are you sure you want to delete this contact?</fxos-dialog-confirm>
```

## Prompt Dialog

Include folowing files in HTML

```html
<script src="node_modules/fxos-component/fxos-component.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog-prompt.js"></script>
```

### Usage

```html
<fxos-dialog-prompt>Device name</fxos-dialog-prompt>
```

## Action Dialog

Include folowing files in HTML

```html
<script src="node_modules/fxos-component/fxos-component.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog-action.js"></script>
```

### Usage

```html
<fxos-dialog-action>
  <h1>Descriptions...</h1>
  <button>Action 1</button>
  <button>Action 2</button>
</fxos-dialog-action>
```

## Select Dialog

Include folowing files in HTML

```html
<script src="node_modules/fxos-component/fxos-component.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog-select.js"></script>
```

### Usage

```html
<fxos-dialog-select>
  <h1>Ring tone</h1>
  <li>Classic prism</li>
  <li>Wallphone</li>
</fxos-dialog-select>
```

#### Multiple Select

Add `multiple` attribute in `fxos-dialog-select` element to enable multiple selection.

```html
<fxos-dialog-select multiple>
  <h1>Ring tone</h1>
  <li>Classic prism</li>
  <li>Wallphone</li>
</fxos-dialog-select>
```

## Menu Dialog

Include folowing files in HTML

```html
<script src="node_modules/fxos-component/fxos-component.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog.js"></script>
<script src="node_modules/fxos-dialog/fxos-dialog-menu.js"></script>
```

### Usage

```html
<fxos-dialog-menu>
  <button data-icon="firefox">Open in new window</button>
  <button data-icon="firefox">Add to Home Screen</button>
  <button data-icon="firefox">Share link</button>
  <button data-icon="firefox">Settings</button>
</fxos-dialog-menu>
```

## Examples

- [Example](http://fxos-components.github.io/fxos-dialog/)

## Readiness

- [ ] Accessibility
- [ ] Test Coverage
- [ ] Performance
- [ ] Visual/UX
- [ ] RTL

## Developing locally

1. `git clone https://github.com/fxos-components/fxos-switch.git`
2. `cd fxos-switch`
3. `npm install` (NPM3)
4. `npm start`

## Tests

1. Ensure Firefox Nightly is installed on your machine. (Visit: [Firefox Nightly Page](https://nightly.mozilla.org/))
2. To run unit tests you need npm >= 3 installed.
3. `$ npm install`
4. `$ npm run test-unit`

If you would like tests to run on file change use:

`$ npm run test-unit-dev`

If your would like run integration tests, use:

`$ export FIREFOX_NIGHTLY_BIN=/absolute/path/to/nightly/firefox-bin`
`$ npm run test-integration`

## Lint check

Run lint check with command:

`$ npm run test-lint`
