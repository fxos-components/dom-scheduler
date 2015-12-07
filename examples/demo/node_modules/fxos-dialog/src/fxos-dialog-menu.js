
/**
 * Dependencies
 */

var GaiaDialogProto = require('./fxos-dialog').prototype;
var component = require('fxos-component');

/**
 * Exports
 */
module.exports = component.register('fxos-dialog-menu', {
  created: function() {
    this.setupShadowRoot();
    this.els = {
      dialog: this.shadowRoot.querySelector('fxos-dialog'),
      items: this.shadowRoot.querySelector('.items')
    };

    this.els.dialog.addEventListener('closed',
      GaiaDialogProto.hide.bind(this));

    setTimeout(() => this.makeAccessible());
  },

  makeAccessible() {
    this.els.items.setAttribute('role', 'menu');
    [].forEach.call(this.querySelectorAll('button'),
      menuitem => menuitem.setAttribute('role', 'menuitem'));
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
      <div class="items"><content select="button"></content></div>
    </fxos-dialog>
    <style>
      :host {
        display: none;
        position: fixed;
        width: 100%;
        height: 100%;
        z-index: 999;
      }

      ::content > button {
        position: relative;
        display: block;
        width: 100%;
        height: 50px;
        line-height: 51px;
        border: 0;
        padding: 0 16px;
        font: inherit;
        font-style: italic;
        text-align: start;
        background:
          var(--fxos-dialog-button-background,
          var(--fxos-button-background));
        color:
          var(--fxos-dialog-menu-button-color,
          var(--fxos-brand-color));

      }

      ::content > button[data-icon]:before {
        width: 50px;
        font-size: 22px;
        vertical-align: middle;
      }

      /** Button Divider Line
       ---------------------------------------------------------*/

      ::content > button:after {
        content: '';
        display: block;
        position: absolute;
        height: 1px;
        left: 6px;
        right: 6px;
        top: 49px;
        background: var(--fxos-border-color);
      }

      ::content > button:last-of-type:after {
        display: none;
      }
    </style>`
});
