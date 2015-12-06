
/**
 * Dependencies
 */

var GaiaDialogProto = require('./fxos-dialog').prototype;
var component = require('fxos-component');

/**
 * Exports
 */
module.exports = component.register('fxos-dialog-alert', {
  created: function() {
    this.setupShadowRoot();
    this.els = {
      dialog: this.shadowRoot.querySelector('fxos-dialog')
    };
    this.els.dialog.addEventListener('closed',
      GaiaDialogProto.hide.bind(this));
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
      <section>
        <p><content></content></p>
      </section>
      <div>
        <button class="submit primary" on-click="close">Ok</button>
      </div>
    </fxos-dialog>
    <style>
      :host {
        display: none;
        position: fixed;
        left: 0;
        top: 0;
        z-index: 999;

        width: 100%;
        height: 100%;
      }

      fxos-dialog section {
        max-width: 320px;
      }
    </style>`
});
