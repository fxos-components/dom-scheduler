
/**
 * Dependencies
 */

var GaiaDialogProto = require('./fxos-dialog').prototype;
var component = require('fxos-component');

/**
 * Exports
 */
module.exports = component.register('fxos-dialog-confirm', {
  created: function() {
    this.setupShadowRoot();

    this.els = {
      dialog: this.shadowRoot.querySelector('fxos-dialog'),
      submit: this.shadowRoot.querySelector('.submit'),
      cancel: this.shadowRoot.querySelector('.cancel')
    };

    this.els.cancel.addEventListener('click', this.close.bind(this));
    this.els.submit.addEventListener('click', this.close.bind(this));
  },

  open: function(e) {
    return GaiaDialogProto.show.call(this)
      .then(() => this.els.dialog.open(e));
  },

  close: function() {
    // First close (hide) inner dialog and then the container.
    return this.els.dialog.close()
      .then(GaiaDialogProto.hide.bind(this));
  },

  template: `
    <fxos-dialog>
      <section>
        <p><content></content></p>
      </section>
      <fieldset>
        <button class="cancel">Cancel</button>
        <button class="submit danger">Confirm</button>
      </fieldset>
    </fxos-dialog>

    <style>

    :host {
      display: block;
      position: fixed;
      width: 100%;
      height: 100%;
      z-index: 999;

      display: none;
    }

    fxos-dialog section {
      max-width: 320px;
    }

    </style>`
});
