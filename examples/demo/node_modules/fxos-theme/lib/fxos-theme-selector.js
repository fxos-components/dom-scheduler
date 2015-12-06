(function(define){'use strict';define(function(require,exports,module){

/**
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;

  this.els = {
    themes: this.shadowRoot.querySelector('.themes'),
    rtl: this.shadowRoot.querySelector('.toggle-rtl'),
    inner: this.shadowRoot.querySelector('.inner')
  };

  this.els.rtl.addEventListener('click', this.onRtlClick.bind(this));
  this.els.themes.addEventListener('click', this.onThemeClick.bind(this));

  if (this.hasAttribute('slidehide')) {
    this.els.inner.setAttribute('slidehide', '');
  }

  this.styleHack();
  this.set(localStorage.theme || 'system');
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style');
  style.setAttribute('scoped', '');
  this.appendChild(style.cloneNode(true));
};

proto.onThemeClick = function(e) {
  var theme = e.target.value;
  if (theme) { this.set(theme); }
};

proto.onRtlClick = function() {
  document.dir = this.els.rtl.checked ? 'rtl' : 'ltr';
};

proto.set = function(theme) {
  var radio = this.shadowRoot.querySelector('[value="' + theme + '"]');
  document.documentElement.classList.remove('fxos-theme-' + this.theme);
  document.documentElement.classList.add('fxos-theme-' + theme);
  radio.checked = true;
  this.theme = theme;
  localStorage.theme = theme;
};

var template = `
<style>

* { margin: 0; padding: 0; }

fxos-theme-selector {
  position: fixed;
  top: 0; left: 0;
  z-index: 101;
  width: 100%;
  height: 30px;
  direction: ltr;
}

.inner {
  height: 100%;
}

form {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;

  background: rgba(255,255,255,0.8);
  color: #000;
  font-size: 9px;
  text-align: center;
  box-shadow: 0 1px 1px rgba(0,0,0,0.1);
}

[slidehide] form {
  transform: translateY(-100%);
  transition: transform 200ms 200ms;
}

.inner[slidehide]:hover form {
  transform: translateY(0%);
  transition-delay: 0ms;
}

form label {
  -moz-margin-start: 9px;
}

form input {
  -moz-margin-end: 6px;
  vertical-align: middle;
}

.rtl {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;

  display: flex;
  align-items: center;
}

</style>

<div class="inner">
  <form>
    <label class="rtl"><input type="checkbox" class="toggle-rtl" />RTL</label>
    <span class="themes">
      <label><input type="radio" name="theme" value="productivity"/>Prod</label>
      <label><input type="radio" name="theme" value="communications"/>Comms</label>
      <label><input type="radio" name="theme" value="media"/>Media</label>
      <label><input type="radio" name="theme" value="system"/>System</label>
    </span>
  </form>
</div>`;

document.registerElement('fxos-theme-selector', { prototype: proto });

});})((function(n,w){'use strict';return typeof define=='function'&&define.amd?define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('fxos-theme-selector',this));/*jshint ignore:line*/