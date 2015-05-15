(function(exports) {
  'use strict';

  var debug = false;
  function log(str) {
    if (!debug) {
      return;
    }

    console.log('↕️ ', str);
  }

  var maxItemCount = 18;

  function recycle(items, startIndex, criticalEnd) {
    var recyclableItems = [];
    for (var i in items) {
      if ((i < startIndex) || (i > criticalEnd)) {
        recyclableItems.push(i);
      }
    }
    return recyclableItems;
  }

  function resetTransform(item) {
    var position = parseInt(item.dataset.position);
    item.style.webkitTransform =
      item.style.transform = 'translate3d(0, ' + position + 'px, 0)';
    delete item.dataset.tweakDelta;
  }

  function tweakTransform(item, delta) {
    var position = parseInt(item.dataset.position) + delta;
    item.style.webkitTransform =
      item.style.transform = 'translate3d(0, ' + position + 'px, 0)';
    item.dataset.tweakDelta = delta;
  }

  var list = function list(container, source, scheduler) {
    this.editing = false;

    this.container = container;
    this._viewportHeight = container.offsetHeight;
    this.list = container.querySelector('ul');
    this.source = source;
    this.scheduler = scheduler;

    this._template = this.list.querySelector('li');
    this._itemHeight = this._template.offsetHeight;
    this._template.remove();

    if (debug) {
      if (this._itemHeight !== source.itemHeight()) {
        log('Template height and source height are not the same.')
      }
    }

    this._topPosition = 0;
    this._previousTop = 0;
    this._forward = true;
    this._items = [];
    this._itemsInDOM = [];

    this._updateListHeight();
    this._placeItems();

    this.container.addEventListener('scroll', this);
    window.addEventListener('resize', this);
  };

  list.prototype = {
    toggleEditMode: function() {
      var itemsInDOM = this._itemsInDOM;

      return this.scheduler.transition((function() {
        this.editing = !this.editing;
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.classList.toggle('edit', this.editing);
        }
      }).bind(this), itemsInDOM[0], 'transitionend');
    },

    insertedAtIndex: function(index) {
      if (index !== 0) {
        //TODO: support any point of insertion
        return;
      }

      if (this._topPosition > this._itemHeight || this.editing) {
        // No transition needed, just keep the scroll position
        this._insertOnTop(true);
        return;
      }

      this._pushDown()
        .then(this._insertOnTop.bind(this, false))
        .then(this._cleanInlineStyles.bind(this))
        .then(this._reveal.bind(this))
    },

    _insertOnTop: function(keepScrollPosition) {
      return this.scheduler.mutation((function() {
        this._items.unshift(null);
        delete this._items[0]; // keeping it sparse

        if (keepScrollPosition) {
          this._scrollingProgramatically = true;
          this.container.scrollTop += this._itemHeight;
          this.container.dispatchEvent(new CustomEvent('hidden-new-content'));
        } else {
          this._updateViewport(0);
        }

        this._updateListHeight();
      }).bind(this));
    },

    _pushDown: function() {
      var itemsInDOM = this._itemsInDOM;
      var itemHeight = this._itemHeight;

      if (!itemsInDOM.length) {
        return Promise.resolve();
      }

      return this.scheduler.transition(function() {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.style.transition = 'transform 0.2s ease-in';
          item.style.webkitTransition = '-webkit-transform 0.2s ease-in';
          tweakTransform(item, itemHeight);
        }
      }, itemsInDOM[0], 'transitionend');
    },

    _cleanInlineStyles: function() {
      var itemsInDOM = this._itemsInDOM;
      var container = this.container;

      return this.scheduler.mutation(function() {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.style.transition = '';
          item.style.webkitTransition = '';
          resetTransform(item);
        }
        container.scrollTop; // flushing
      });
    },

    _reveal: function() {
      var newEl = this.list.querySelector('li.new');

      return this.scheduler.transition(function() {
        newEl.style.transition = 'opacity 0.35s ease-out';
        newEl.style.webkitTransition = 'opacity 0.35s ease-out';
        newEl.classList.remove('new');
      }, newEl, 'transitionend', 350).then(function() {
        newEl.style.transition = '';
        newEl.style.webkitTransition = '';
      });
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'resize':
          this._viewportHeight = this.container.offsetHeight;
          break;
        case 'scroll':
          this.handleScroll(evt);
          break;
      }
    },

    _scrollingProgramatically: false,
    handleScroll: function(evt) {
      if (this._scrollingProgramatically) {
        this._updateViewport();
        this._scrollingProgramatically = false;
        return;
      }

      this.scheduler.direct((function() {
        this._updateViewport();

        if ((this._topPosition - this._previousTop) > 2) {
          this._forward = true;
        }

        if ((this._topPosition - this._previousTop) < -2) {
          this._forward = false;
        }

        if (this._topPosition == 0 && this._previousTop !== 0) {
          this.container.dispatchEvent(new CustomEvent('top-reached'));
        }
      }).bind(this));
    },

    _updateViewport: function(newIndex) {
      this._previousTop = this._topPosition;
      this._topPosition = this.container.scrollTop;

      this._updateVisibleItems(true, newIndex);
    },

    _updateListHeight: function() {
      return this.scheduler.mutation((function() {
        this.list.style.height = this.source.fullHeight() + 'px';
      }).bind(this));
    },

    _updateVisibleItems: function(full, newIndex) {
      var top = this._topPosition;
      var viewPortHeight = this._viewportHeight;
      var forward = this._forward;
      var itemHeight = this._itemHeight;
      var source = this.source;
      var items = this._items;
      var itemsInDOM = this._itemsInDOM;

      var startIndex = source.indexAtPosition(top);
      var criticalEnd = source.indexAtPosition(top + viewPortHeight);

      var recyclableItems = recycle(items, startIndex, criticalEnd);
      var canPrerender = recyclableItems.length;

      var endIndex = criticalEnd;
      if (forward) {
        endIndex = Math.min(source.fullLength() - 1,
                            criticalEnd + canPrerender);
      } else {
        startIndex = Math.max(0, startIndex - canPrerender);
      }

      if (full) {
        endIndex = startIndex + maxItemCount - 1;
      }

      // Put the items that are furthest away from the displayport at the end of
      // the array.
      var actionIndex = forward ? endIndex : startIndex;
      function distanceFromAction(i) {
        return Math.abs(i - actionIndex);
      }
      recyclableItems.sort(function(a, b) {
        return distanceFromAction(a) - distanceFromAction(b);
      });

      for (var i = startIndex; i <= endIndex; ++i) {
        var item = items[i];

        if (!item) {
          if (recyclableItems.length > 0) {
            var recycleIndex = recyclableItems.pop();
            item = items[recycleIndex];
            delete items[recycleIndex];
          } else if (itemsInDOM.length < maxItemCount){
            item = this._template.cloneNode(true);
            this.list.appendChild(item);
            itemsInDOM.push(item);
          } else {
            console.warn('missing a cell');
            continue;
          }

          source.populateItem(item, i);
          item.classList.toggle('edit', this.editing);
          if (i === newIndex) {
            item.classList.add('new');
          }

          items[i] = item;
        }

        item.dataset.position = i * itemHeight;

        var tweakedBy = item.dataset.tweakDelta;
        if (tweakedBy) {
          item.style.webkitTransform =
            item.style.transform = 'translate3d(0, ' + (i * itemHeight +
                                   parseInt(tweakedBy)) + 'px, 0)';
        } else {
          resetTransform(item);
        }
      }

      /* ASCII Art viewport debugging */
      if (debug) {
        var str = '[' + forward + ']';
        for (var i = 0; i < source.fullLength(); i++) {
          if (i == startIndex) {
            str += '|';
          }
          if (items[i]) {
            str += 'x';
          } else {
            str += '-';
          }
          if (i == endIndex) {
            str += '|';
          }
        }
        console.log(str)
      }
    },

    _placeItems: function() {
      return this.scheduler.mutation((function() {
        // Make sure all items are in the DOM
        this._updateVisibleItems(true);
      }).bind(this));
    }
  };

  exports.ScheduledList = list;
})(window);
