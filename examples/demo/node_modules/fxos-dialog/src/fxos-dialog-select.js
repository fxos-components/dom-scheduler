
/**
 * Dependencies
 */

var GaiaDialogProto = require('./fxos-dialog').prototype;
var component = require('fxos-component');

/**
 * Exports
 */
module.exports = component.register('fxos-dialog-select', {
  created: function() {
    this.setupShadowRoot();

    this.els = {
      dialog: this.shadowRoot.querySelector('fxos-dialog'),
      submit: this.shadowRoot.querySelector('.submit'),
      cancel: this.shadowRoot.querySelector('.cancel'),
      list: this.shadowRoot.querySelector('ul')
    };

    this.multiple = this.hasAttribute('multiple');
    this.els.list.addEventListener('click', this.onListClick.bind(this));
    this.els.submit.addEventListener('click', this.close.bind(this));
    this.els.cancel.addEventListener('click', this.close.bind(this));

    setTimeout(() => this.makeAccessible());
  },

  makeAccessible() {
    this.els.list.setAttribute('role', 'listbox');
    if (this.multiple) {
      this.els.list.setAttribute('aria-multiselectable', true);
    }

    [].forEach.call(this.options, option => {
      option.setAttribute('role', 'option');
      option.setAttribute('tabindex', '0');
    });
  },

  open: function(e) {
    return GaiaDialogProto.show.call(this)
      .then(() => this.els.dialog.open(e));
  },

  close: function() {
    return this.els.dialog.close()
      .then(GaiaDialogProto.hide.bind(this));
  },

  onListClick: function(e) {
    var el = e.target.closest('li');
    var selected = el.getAttribute('aria-selected') === 'true';

    if (this.multiple) { this.onChangeMultiple(el, selected); }
    else { this.onChange(el, selected); }
  },

  onChange: function(el, selected) {
    this.clearSelected();
    if (!selected) { el.setAttribute('aria-selected', !selected); }
    this.fireChange();
    this.close();
  },

  onChangeMultiple: function(el, selected) {
    el.setAttribute('aria-selected', !selected);
    this.fireChange();
  },

  clearSelected: function() {
    [].forEach.call(this.selectedOptions, function(option) {
      option.removeAttribute('aria-selected');
    });
  },

  fireChange: function() {
    var e = new CustomEvent('change', { detail: { value: this.valueString }});
    this.dispatchEvent(e);
  },

  attrs: {
    multiple: {
      get: function() { return !!this._multiple; },
      set: function(value) {
        value = value === '' ? true : value;
        if (value === this._multiple) { return; }
        if (!value) {
          this._multiple = false;
          this.removeAttribute('multiple');
          this.els.list.removeAttribute('aria-multiselectable');
        } else {
          this._multiple = true;
          this.setAttribute('multiple', '');
          this.els.list.setAttribute('aria-multiselectable', true);
        }
      }
    },

    options: {
      get: function() { return this.querySelectorAll('li'); }
    },

    selectedOptions: {
      get: function() {
        return this.querySelectorAll('li[aria-selected="true"]');
      }
    },

    selected: {
      get: function() { return this.selectedOptions[0]; }
    },

    value: {
      get: function() {
        var selected = this.selectedOptions[0];
        return selected && selected.getAttribute('value');
      }
    },

    valueString: {
      get: function() {
        var selected = this.selected;
        return selected && selected.textContent;
      }
    },

    length: {
      get: function() { return this.options.length; }
    }
  },

  template: `
    <fxos-dialog>
      <content select="h1"></content>
      <ul><content select="li"></content></ul>
      <fieldset>
        <button class="cancel">Cancel</button>
        <button class="submit primary">Select</button>
      </fieldset>
    </fxos-dialog>
    <style>
      :host {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 999;

        display: none;
        width: 100%;
        height: 100%;

        color: var(--fxos-color);
      }

      /** Title (duplicate from fxos-dialog)
       ---------------------------------------------------------*/

      ::content h1 {
        margin: 18px;
        font-size: 23px;
        line-height: 26px;
        font-weight: 200;
        font-style: italic;
        color: var(--fxos-title-color);
      }

      /** List
       ---------------------------------------------------------*/

      ul {
        display: block;
        padding: 0;
        margin: 0;
      }

      /** Options
       ---------------------------------------------------------*/

      ::content li {
        position: relative;
        display: block;
        padding: 16px;
        text-align: start;
        -moz-user-select: none;
        cursor: pointer;
        outline: 0;
      }

      ::content li[aria-selected='true'] {
        font-weight: normal;
      }

      ::content li:after {
        content: "";
        display: block;
        position: absolute;
        height: 1px;
        left: 16px;
        right: 16px;
        bottom: 1px;
        background: var(--fxos-border-color);
      }

      ::content li:last-of-type:after {
        display: none
      }

      /** Buttons
       ---------------------------------------------------------*/

      :host:not([multiple]) .submit {
        display: none !important;
      }

      :host:not([multiple]) .cancel {
        width: 100% !important;
      }

      :host:not([multiple]) .cancel:after {
        display: none !important;
      }

      /** Tick Icon
       ---------------------------------------------------------*/

      ::content li[aria-selected='true']:before {
        position: absolute;
        top: 50%;
        right: 20px;

        content: 'tick';
        display: block;
        margin-top: -12px;

        font: normal 500 14px fxos-icons;
        text-rendering: optimizeLegibility;
      }
    </style>`
});
