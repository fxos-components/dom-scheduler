# fxos-component [![](https://travis-ci.org/fxos-components/fxos-component.svg)](https://travis-ci.org/fxos-components/fxos-component)

A wrapper around `document.registerElement()` to define a custom-element with workarounds for gaps in the Gecko platform, plus some convenience methods.

## Installation

```bash
$ npm install fxos-component
```

## Usage

```js
var MyComponent = fxosComponent.register('my-component', {
  // extend component from the given prototype
  extends: HTMLButtonElement.prototype,

  created: function() {

    // Creates a shadow-root and
    // puts your template in it
    this.setupShadowRoot();
  },

  attributeChanged: function() {},
  attached: function() {

    // Localizes shadow DOM of your
    // component and adds an observer for
    // when localization changes
    this.setupShadowL10n();
  },
  detached: function() {},

  // You can override this function and
  // specify how the shadow DOM of your
  // component should be localized.
  localizeShadow: function(shadowRoot) {},

  template: `
    <button>I live in shadow-dom</button>
    <style>
      button { color: red }
    </style>
  `,

  // Some CSS doesn't work
  // in shadow-dom stylesheets,
  // this CSS gets put in the <head>
  globalCss: `
    @keyframes my-animation { ... }
    @font-face { ... }
  `,

  // Property descriptors that get defined
  // on the prototype and get called
  // when matching attributes change
  attrs: {
    customAttr: {
      get: function() { return this._customAttr; },
      set: function(value) { this._customAttr = value; }
    }
  }
});

var myComponent = new MyComponent();

myComponent.setAttribute('custom-attr', 'foo');
myComponent.customAttr; //=> 'foo';
```

### Component Extension

Components can extend other components:

```js
var MyComponent = fxosComponent.register('my-component', {
  // extend component from the given prototype
  extends: HTMLButtonElement.prototype,
  ...
});

var YourComponent = fxosComponent.register('your-component', {
  // extend component from the given prototype
  extends: MyComponent.prototype,
  ...
});
```

If the property ```extensible: false``` is set the registered component
cannot be extended:

```js
var MyComponent = fxosComponent.register('my-component', {
  // extend component from the given prototype
  extends: HTMLButtonElement.prototype,
  extensible: false,
  ...
});
```

Extensible components come with a little bit of overhead. For instance,
they store a copy of the template string that derived components
will use to properly inherit the styles. With the extensible flag set to false
components won't store the template string and some memory will be saved.
This is an optimization for production systems and large component hierarchies.
Registed components are extensible by default.

## Tests

If you would like to run both unit and lint tests:

1. Ensure Firefox Nightly is installed on your machine.
2. `$ npm install`
3. `$ npm test`

If your would like unit tests to run on file change use:

`$ npm run test-unit-dev`

## Lint check

Run lint check with command:

`$ npm run test-lint`
