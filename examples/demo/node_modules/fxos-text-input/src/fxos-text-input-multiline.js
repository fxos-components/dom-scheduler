
/**
 * Dependencies
 */

var component = require('fxos-component');

/**
 * Exports
 */

module.exports = component.register('fxos-text-input-multiline', {
  created() {
    this.setupShadowRoot();

    this.els = {
      inner: this.shadowRoot.querySelector('.inner'),
      field: this.shadowRoot.querySelector('textarea')
    };

    this.type = this.getAttribute('type');
    this.disabled = this.hasAttribute('disabled');
    this.placeholder = this.getAttribute('placeholder');
    this.required = this.getAttribute('required');
    this.value = this.getAttribute('value');
  },

  clear(e) {
    this.value = '';
  },

  attrs: {
    placeholder: {
      get() { return this.els.field.placeholder; },
      set(value) { this.els.field.placeholder = value || ''; }
    },

    value: {
      get() { return this.els.field.value; },
      set(value) { this.els.field.value = value; }
    },

    required: {
      get() { return this.els.field.required; },
      set(value) { this.els.field.required = value; }
    },

    disabled: {
      get() { return this.els.field.disabled; },
      set(value) {
        value = !!(value === '' || value);
        this.els.field.disabled = value;
      }
    }
  },

  template: `<div class="inner">
      <content select="label"></content>
      <div class="fields">
        <textarea></textarea>
        <div class="focus focus-1"></div>
        <div class="focus focus-2"></div>
      </div>
    </div>
    <style>
      textarea {
        box-sizing: border-box;
        border: 0;
        margin: 0;
        padding: 0;
      }

      :host {
        display: block;
        margin-top: 18px;
        margin-bottom: 18px;
        font-size: 17px;
        font-weight: 300;

        color:
          var(--fxos-text-input-color,
          var(--fxos-color, #000));
      }

      .inner { height: 100% }

      label {
        display: block;
        margin: 0 0 4px 16px;
        font-size: 14px;
      }

      [disabled] label { opacity: 0.3 }

      .fields {
        box-sizing: border-box;
        position: relative;

        width: 100%;
        height: 100%;

        border: 1px solid
          var(--fxos-text-input-border-color,
          var(--fxos-border-color, #999));
      }

      textarea {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 86px;
        padding: 10px 16px;
        border: 0;
        margin: 0;

        font: inherit;
        resize: none;
        color: inherit;
        background:
          var(--fxos-text-input-background,
          var(--fxos-background), #fff);
      }

      textarea[disabled] { background: transparent }

      ::-moz-placeholder {
        font-style: italic;
        color: var(--fxos-text-input-placeholder-color, inherit);
      }

      .focus {
        position: absolute;
        bottom: 0px;
        width: 100%;
        height: 3px;
        transition: all 200ms;
        transform: scaleX(0);
        visibility: hidden;
        background:
          var(--fxos-text-input-focus-color,
          var(--fxos-brand-color, #000));
      }

      :focus ~ .focus {
        transform: scaleX(1);
        transition-delay: 200ms;
        visibility: visible;
      }

      .focus-2 {
        top: 0;
        bottom: auto;
      }
    </style>`
});
