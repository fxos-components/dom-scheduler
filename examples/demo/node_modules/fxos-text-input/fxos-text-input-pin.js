(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSTextInputPin"] = factory(require("fxos-component"));
	else
		root["FXOSTextInputPin"] = factory(root["fxosComponent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Dependencies
	 */

	var component = __webpack_require__(1);

	/**
	 * Locals
	 */

	var DEFAULT_LENGTH = 4;

	/**
	 * Exports
	 */

	module.exports = component.register('fxos-text-input-pin', {
	  created() {
	    this.setupShadowRoot();

	    this.els = {
	      inner: this.shadowRoot.querySelector('.inner'),
	      fields: this.shadowRoot.querySelector('.fields'),
	      input: this.shadowRoot.querySelector('input')
	    };

	    this.disabled = this.hasAttribute('disabled');
	    this.length = this.getAttribute('length') || DEFAULT_LENGTH;

	    this.addEventListener('keyup', () => this.updateCells());
	  },

	  updateCells() {
	    var l = this.els.input.value.length;
	    this.els.cells.forEach((cell, i) => {
	      cell.classList.toggle('populated', i < l);
	      cell.classList.toggle('focused', i == l);
	    });
	  },

	  onBackspace(e) {
	    var input = e.target;
	    var empty = !input.value;
	    var previous = input.previousElementSibling;

	    if (!empty && previous) {
	      previous.clear();
	      previous.focus();
	    } else if (empty && previous) {
	      previous.focus();
	    }
	  },

	  setupFields() {
	    this.els.fields.innerHTML = '';
	    this.els.cells = [];

	    for (var i = 0, l = this.length; i < l; i++) {
	      var el = document.createElement('div');
	      el.className = 'cell';
	      this.els.fields.appendChild(el);
	      this.els.cells.push(el);
	    }
	  },

	  clear(e) {
	    this.value = '';
	    this.updateCells();
	  },

	  focus(e) {
	    this.els.input.focus();
	  },

	  /**
	   * Attributes
	   */

	  attrs: {
	    length: {
	      get() { return this._length; },
	      set(value) {
	        value = Number(value);
	        this._length = value;
	        this.els.input.setAttribute('maxlength', this.length);
	        this.setupFields();
	      }
	    },

	    value: {
	      get() { return this.els.input.value; },
	      set(value) { this.els.input.value = value; }
	    },

	    disabled: {
	      get() { return this.els.input.disabled; },
	      set(value) {
	        value = !!(value === '' || value);
	        this.els.input.disabled = value;
	      }
	    }
	  },

	  template: `
	    <div class="inner">
	      <content select="label"></content>
	      <div class="container">
	        <input x-inputmode="digit"/>
	        <div class="fields"></div>
	      </div>
	    </div>
	    <style>
	      :host {
	        display: block;
	        height: 40px;
	        margin-top: var(--base-m, 18px);
	        margin-bottom: var(--base-m, 18px);
	        font-size: 40px;
	        color:
	          var(--fxos-text-input-color,
	          var(--fxos-color));
	      }

	      .inner { height: 100% }

	      label {
	        font-size: 14px;
	        display: block;
	        margin: 0 0 4px 16px;
	      }

	      .container {
	        position: relative;
	        z-index: 0;
	        height: 100%;
	      }

	      input {
	        opacity: 0;
	        display: block;
	        position: absolute;
	        top: 0;
	        left: 0;
	        width: 100%;
	        height: 100%;
	        box-sizing: border-box;
	        z-index: 1;
	      }

	      .fields {
	        display: flex;
	        position: relative;
	        height: 100%;
	        margin-left: -1rem;
	      }

	      [disabled] + .fields {
	        pointer-events: none;
	      }

	      .cell {
	        position: relative;
	        height: 100%;
	        margin-left: 1rem;
	        flex: 1;

	        border: 1px solid
	          var(--fxos-text-input-border-color,
	          var(--fxos-border-color));
	        background:
	          var(--fxos-text-input-background,
	          var(--fxos-background));
	      }

	      [disabled] + .fields .cell {
	        background: none;
	      }

	      .cell:after {
	        position: absolute;
	        left: 50%;
	        top: 50%;

	        content: '';
	        width: 14px;
	        height: 14px;
	        margin: -7px;

	        border-radius: 50%;
	        opacity: 0;
	        background: currentColor;
	      }

	      .cell.populated:after { opacity: 1 }

	      .cell:before {
	        content: '';
	        position: absolute;
	        left: 0;
	        bottom: 0;
	        width: 100%;
	        height: 3px;
	        visibility: hidden;
	        background:
	          var(--fxos-text-input-focus-color,
	          var(--fxos-brand-color, #000));
	      }

	      input:focus + .fields .cell:before { visibility: visible; }
	    </style>`
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }
/******/ ])
});
;