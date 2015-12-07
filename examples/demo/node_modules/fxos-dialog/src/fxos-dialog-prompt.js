
/**
 * Dependencies
 */

var GaiaDialogProto = require('./fxos-dialog').prototype;
var component = require('fxos-component');

require('fxos-text-input');

/**
 * Exports
 */
module.exports = component.register('fxos-dialog-prompt', {
  created: function() {
    this.setupShadowRoot();

    this.els = {
      dialog: this.shadowRoot.querySelector('fxos-dialog'),
      input: this.shadowRoot.querySelector('fxos-text-input'),
      submit: this.shadowRoot.querySelector('.submit'),
      cancel: this.shadowRoot.querySelector('.cancel')
    };

    this.els.dialog.addEventListener('opened', () => {
      this.setAttribute('opened', '');
    });

    this.els.dialog.addEventListener('closed', () => {
      this.removeAttribute('opened');
    });

    this.els.input.placeholder = this.firstChild.textContent;
    this.els.cancel.addEventListener('click', this.close.bind(this));
    this.els.submit.addEventListener('click', this.close.bind(this));
  },

  open: function(e) {
    return GaiaDialogProto.show.call(this)
      .then(() => this.els.dialog.open(e));
  },

  close: function() {
    return this.els.dialog.close()
      .then(GaiaDialogProto.hide.bind(this));
  },

  template: `
    <fxos-dialog>
      <div><fxos-text-input clearable></fxos-text-input></div>
      <fieldset>
        <button class="cancel">Cancel</button>
        <button class="submit primary">Ok</button>
      </fieldset>
    </fxos-dialog>
    <style>
      :host {
        position: fixed;
        width: 100%;
        height: 100%;
        z-index: 999;

        display: none;
      }

      fxos-text-input {
        margin: 16px !important;
      }
    </style>`
});
