(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./fxos-dialog"), require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["./fxos-dialog", "fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSDialogPrompt"] = factory(require("./fxos-dialog"), require("fxos-component"));
	else
		root["FXOSDialogPrompt"] = factory(root["FXOSDialog"], root["fxosComponent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
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

	var GaiaDialogProto = __webpack_require__(1).prototype;
	var component = __webpack_require__(2);

	__webpack_require__(3);

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


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory(__webpack_require__(2));
		else if(typeof define === 'function' && define.amd)
			define(["fxos-component"], factory);
		else if(typeof exports === 'object')
			exports["FXOSTextInput"] = factory(require("fxos-component"));
		else
			root["FXOSTextInput"] = factory(root["fxosComponent"]);
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
		__webpack_require__(2);

		/**
		 * Mini logger
		 *
		 * @type {Function}
		 */
		var debug = 0 ? (...args) => console.log('[fxos-text-input]', ...args) : () => {};

		/**
		 * Exports
		 */

		module.exports = component.register('fxos-text-input', {
		  created() {
		    this.setupShadowRoot();

		    this.els = {
		      inner: this.shadowRoot.querySelector('.inner'),
		      input: this.shadowRoot.querySelector('input'),
		      clear: this.shadowRoot.querySelector('.clear')
		    };

		    this.type = this.getAttribute('type');
		    this.inputmode = this.getAttribute('x-inputmode');
		    this.disabled = this.hasAttribute('disabled');
		    this.clearable = this.hasAttribute('clearable');
		    this.placeholder = this.getAttribute('placeholder');
		    this.required = this.getAttribute('required');
		    this.value = this.getAttribute('value');

		    // Don't take focus from the input field
		    this.els.clear.addEventListener('mousedown', e => e.preventDefault());

		    this.els.clear.addEventListener('click', e => this.clear(e));
		    this.els.input.addEventListener('input', e => this.onInput(e));
		    this.els.input.addEventListener('focus', e => this.onFocus(e));
		    this.els.input.addEventListener('blur', e => this.onBlur(e));
		  },

		  /**
		   * Clear the field.
		   *
		   * @public
		   */
		  clear() {
		    debug('clear');
		    this.value = '';
		    this.emit('clear');
		  },

		  /**
		   * Focus the field.
		   *
		   * @public
		   */
		  focus() {
		    debug('focus');
		    this.els.input.focus();
		  },

		  /**
		   * Unfocus the field.
		   *
		   * @public
		   */
		  blur() {
		    debug('blur');
		    this.els.input.blur();
		  },

		  /**
		   * Runs when the field is focused.
		   *
		   * @private
		   */
		  onFocus() {
		    debug('on focus');
		    this.els.inner.classList.add('focused');
		    this.emit('focus');
		  },

		  /**
		   * Runs when the field is unfocused.
		   *
		   * @private
		   */
		  onBlur() {
		    debug('on blur');
		    this.els.inner.classList.remove('focused');
		    this.emit('blur');
		  },

		  /**
		   * Runs when the value of the
		   * input is manually changed.
		   *
		   * @private
		   */
		  onInput() {
		    debug('on input');
		    this.onValueChanged();
		  },

		  /**
		   * Runs when the values changes
		   * programatically or via keystrokes.
		   *
		   * @private
		   */
		  onValueChanged() {
		    debug('value changed');
		    var hasValue = !!this.value.length;
		    this.els.inner.classList.toggle('has-value', hasValue);
		    this.emit('input');
		  },

		  /**
		   * Emit a DOM event on the component.
		   *
		   * @param  {String} name
		   * @param  {*} detail
		   * @private
		   */
		  emit(name, detail) {
		    var e = new CustomEvent(name, { detail: detail });
		    this.dispatchEvent(e);
		  },

		  /**
		   * Attributes
		   */

		  attrs: {
		    type: {
		      get: function() { return this.els.input.getAttribute('type'); },
		      set: function(value) {
		        if (!value) { return; }
		        this.els.inner.setAttribute('type', value);
		        this.els.input.setAttribute('type', value);
		      }
		    },

		    inputmode: {
		      get: function() { return this.els.input.getAttribute('x-inputmode'); },
		      set: function(value) {
		        if (!value) {
		          this.els.input.removeAttribute('x-inputmode');
		          return;
		        }
		        this.els.input.setAttribute('x-inputmode', value);
		      }
		    },

		    placeholder: {
		      get: function() { return this.field.placeholder; },
		      set: function(value) {
		        if (!value && value !== '') { return; }
		        this.els.input.placeholder = value;
		      }
		    },

		    clearable: {
		      get: function() { return this._clearable; },
		      set: function(value) {
		        var clearable = !!(value === '' || value);
		        if (clearable === this.clearable) { return; }

		        if (clearable) this.setAttr('clearable', '');
		        else this.removeAttr('clearable');

		        this._clearable = clearable;
		      }
		    },

		    value: {
		      get() { return this.els.input.value; },
		      set(value) {
		        debug('set value', value);
		        this.els.input.value = value;
		        this.onValueChanged();
		      }
		    },

		    required: {
		      get() { return this.els.input.required; },
		      set(value) { this.els.input.required = value; }
		    },

		    maxlength: {
		      get() { return this.els.input.getAttribute('maxlength'); },
		      set(value) { this.els.input.setAttribute('maxlength', value); }
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
		      <div class="fields">
		        <input type="text"/>
		        <button class="clear" tabindex="-1"></button>
		        <div class="focus"></div>
		      </div>
		    </div>
		    <style>
		      :host {
		        display: block;
		        height: 40px;
		        margin-top: 18px;
		        margin-bottom: 18px;
		        overflow: hidden;

		        font-size: 17px;
		        font-weight: 300;
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

		      [disabled] label { opacity: 0.3 }

		      .fields {
		        position: relative;
		        width: 100%;
		        height: 100%;
		        box-sizing: border-box;
		        border: solid 1px
		          var(--fxos-text-input-border-color,
		          var(--fxos-border-color, #999));
		      }

		      [type='search'] .fields {
		        border-radius: 30px;
		        overflow: hidden;
		      }

		      input {
		        display: block;
		        width: 100%;
		        height: 100%;
		        box-sizing: border-box;
		        padding: 0 16px;
		        margin: 0;
		        border: 0;

		        font: inherit;
		        color: inherit;
		        background:
		          var(--fxos-text-input-background,
		          var(--fxos-background, #fff));
		      }

		      input[disabled] {
		        background: var(--fxos-text-input-background-disabled);
		      }

		      ::-moz-placeholder {
		        font-style: italic;
		        color: var(--fxos-text-input-placeholder-color, inherit);
		      }

		      .clear {
		        position: absolute;
		        offset-inline-end: 0;
		        top: 0;

		        display: none;
		        width: 18px;
		        height: 18px;
		        padding: 0;
		        margin: 0;
		        border: solid 10px transparent;
		        box-sizing: content-box;

		        border-radius: 50%;
		        background-clip: padding-box;
		        pointer-events: none;
		        cursor: pointer;
		        opacity: 0;

		        color: var(--fxos-text-input-clear-color, #fff);
		        background-color: var(--fxos-text-input-clear-background, #999);
		      }

		      [clearable] .clear { display: block }

		      [clearable].has-value.focused .clear {
		        pointer-events: all;
		        transition: opacity 200ms;
		        opacity: 1;
		      }

		      .clear:before {
		        content: 'close';
		        display: block;

		        font: normal 500 19px/16.5px 'fxos-icons';
		        text-rendering: optimizeLegibility;
		      }

		      .focus {
		        position: absolute;
		        left: 0;
		        bottom: 0px;

		        width: 100%;
		        height: 3px;

		        transition: transform 200ms;
		        transform: scaleX(0);
		        visibility: hidden;
		        background:
		          var(--fxos-text-input-focus-color,
		          var(--fxos-brand-color, #000));
		      }

		      [type='search'] .focus {
		        border-radius: 0 0 60px 60px;
		        left: 10px;
		        width: calc(100% - 20px);
		      }

		      .focused .focus {
		        transform: scaleX(1);
		        transition-delay: 200ms;
		        visibility: visible;
		      }
		    </style>`
		});


	/***/ },
	/* 1 */
	/***/ function(module, exports) {

		module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {

		var __WEBPACK_AMD_DEFINE_RESULT__;(function(define){'use strict';!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require,exports,module){

		/**
		 * Exports
		 */

		var base = window.FXOS_ICONS_BASE_URL
		  || window.COMPONENTS_BASE_URL
		  || 'node_modules/';

		// Load it!
		if (!document.documentElement) addEventListener('load', load);
		else load();

		function load() {
		  if (isLoaded()) return;
		  var link = document.createElement('link');
		  link.rel = 'stylesheet';
		  link.type = 'text/css';
		  link.href = base + 'fxos-icons/fxos-icons.css';
		  document.head.appendChild(link);
		  exports.loaded = true;
		}

		function isLoaded() {
		  return exports.loaded
		    || document.querySelector('link[href*=fxos-icons]')
		    || document.documentElement.classList.contains('fxos-icons-loaded');
		}

		}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));})(__webpack_require__(3));/*jshint ignore:line*/


	/***/ },
	/* 3 */
	/***/ function(module, exports) {

		module.exports = function() { throw new Error("define cannot be used indirect"); };


	/***/ }
	/******/ ])
	});
	;

/***/ }
/******/ ])
});
;