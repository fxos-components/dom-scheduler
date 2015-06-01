/* global performance */
(function(exports) {
  'use strict';

  var debug = false;
  function log(str) {
    if (!debug) {
      return;
    }

    console.log('🎶 ', str);
  }

  // The naive mode just executes all blocks right away
  // (useful for performance comparison).
  var naive = false;
  var naiveExec = function(block) {
    block();
    return Promise.resolve();
  };

  var directProtectionWindow = 260;

  // TODO: also have a shared instance
  var scheduler = function scheduler() {
    this._directTimeout = null;
    this._directProtection = false;
    this._rafID = null; // TODO: have one rafID by event type?

    this._ongoingTransitions = 0;
    this._queuedTransitions = [];

    this._flushing = false;
    this._pendingMutations = [];
  };

  scheduler.prototype = {

    // *Direct* blocks should be used for direct manipulation use cases
    // (touchevents, scrollevents...).
    // They're exectuted in a requestAnimationFrame block and are protected
    // from mutations. Request might be cancelled by subsequent direct blocks if
    // the event loop gets too busy.
    direct: function(block) {
      if (naive) {
        block();
        return;
      }

      if (this._directTimeout) {
        clearTimeout(this._directTimeout);
        this._directTimeout = null;
      }

      this._directProtection = true;

      this._directTimeout = setTimeout((function() {
        this._directProtection = false;
        this._dequeueTransitions();
        this._flushMutations();
      }).bind(this), directProtectionWindow);

      if (this._rafID) {
        window.cancelAnimationFrame(this._rafID);
        this._rafID = null;
      }

      this._rafID = window.requestAnimationFrame(function() {
        var startDate;
        if (debug) {
          startDate = performance.now();
        }

        block();

        if (debug) {
          var blockDuration = performance.now() - startDate;
          if (blockDuration > 16) {
            log('Direct block took more than a frame (' +
                 blockDuration.toString() + 'ms)');
          }
        }
      });
    },
    //
    // *Feedbacks* blocks have a built in 'transitionend' wait mechanism.
    // They're protected from mutation and will be delayed during a mutation
    // flush.
    // They have the same priority as `direct` blocks.
    //
    // -> Returns a promise fullfilled at the end of the transition for chaining
    feedback: function(block, elm, evt, timeout) {
      return this._transition(block, true, elm, evt, timeout);
    },

    // *Transitions* blocks have a built in 'transitionend' wait mechanism.
    // They're protected from mutation and will be delayed during a mutation
    // flush.
    // They will also be delayed by `direct` blocks.
    //
    // -> Returns a promise fullfilled at the end of the transition for chaining
    transition: function(block, elm, evt, timeout) {
      return this._transition(block, false, elm, evt, timeout);
    },

    _transition: function(block, feedback, elm, evt, timeout) {
      if (naive) {
        return naiveExec(block);
      }

      timeout = timeout || 500;

      return new Promise((function(resolve, reject) {
        var content = (function() {
          this._ongoingTransitions++;

          block();

          if (!elm || !evt) {
            this._ongoingTransitions--;
            resolve();
            return;
          }

          var finishTimeout;

          var done = (function() {
            clearTimeout(finishTimeout);
            elm.removeEventListener(evt, done);

            this._ongoingTransitions--;
            if (this._ongoingTransitions === 0) {
              setTimeout(this._flushMutations.bind(this));
            }

            resolve();
          }).bind(this);

          elm.addEventListener(evt, done);
          finishTimeout = setTimeout(function() {
            done();
            log('Transition block saved by a timeout of ' + timeout + ' ~ ' +
                elm.style.transition);
          }, timeout);
        }).bind(this);

        if (this._flushing || (this._directProtection && !feedback)) {
          this._queuedTransitions.push(content);
        } else {
          content();
        }
      }).bind(this));
    },

    _dequeueTransitions: function() {
      if (this._queuedTransitions.length === 0) {
        return;
      }

      if (this._flushing) {
        return;
      }

      var transitions = this._queuedTransitions;
      transitions.forEach(function(transition) {
        transition();
      });
      this._queuedTransitions = [];
    },

    // *Mutations* blocks should be used to write to the DOM or perform
    // actions requiring a reflow that are not direct manipulations.
    // We shoud always aim for the document to be almost visually identical
    // _before_ and _after_ a mutation block.
    // Any big change in layout/size will cause a flash/jump.
    //
    // -> Returns a promise fullfilled after the reflow for chaining
    mutation: function(block) {
      if (naive) {
        return naiveExec(block);
      }

      return new Promise((function(resolve, reject) {
        if (this._directProtection || this._ongoingTransitions > 0) {
          this._pendingMutations.push({
            block: block,
            resolve: resolve
          });
        } else {
          block();
          resolve();
        }
      }).bind(this));
    },

    _flushMutations: function() {
      if (this._pendingMutations.length === 0) {
        return;
      }

      if (this._directProtection || this._ongoingTransitions > 0) {
        return;
      }

      this._flushing = true;

      var fulfilments =
        this._pendingMutations
          .map(function(obj) { return obj.resolve; });

      var mutations = this._pendingMutations;
      mutations.forEach(function(mutation) {
        mutation.block();
      });
      this._pendingMutations = [];
      this._flushing = false;

      fulfilments.forEach(function(resolve) { resolve(); });

      this._dequeueTransitions();
    }
  };

  exports.DomScheduler = scheduler;
})(window);
