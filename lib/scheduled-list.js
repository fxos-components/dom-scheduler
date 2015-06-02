(function(exports) {
  'use strict';

  /* Constructor
     =========== */
  var list = function list(container, source, scheduler) {
    this.editing = false;

    this.container = container;
    this.list = container.querySelector('ul');
    this.source = source;
    this.scheduler = scheduler;

    this.geometry = {
      topPosition: 0,
      forward: true,

      viewportHeight: 0,
      itemHeight: 0,
      maxItemCount: 0,
      switchWindow: 0
    };

    this._template = this.list.querySelector('li');
    this.geometry.itemHeight = this._template.offsetHeight;
    this._template.remove();

    this.updateContainerGeometry();

    if (debug) {
      if (this.geometry.itemHeight !== source.itemHeight()) {
        log('Template height and source height are not the same.')
      }
    }

    this._rendered = false;
    this._previousTop = 0;
    this._items = [];
    this._itemsInDOM = [];

    this.reorderingContext = {
      item: null,
      initialY: null,
      identifier: null,
      moveUp: null,
      moveDown: null,
    };

    this.updateListHeight();

    this.container.addEventListener('scroll', this);
    this.container.addEventListener('click', this);
    window.addEventListener('resize', this);

    this.scheduler.mutation((function() {
      this.render();
    }).bind(this));
  };

  list.prototype = {

    /* Rendering
       ========= */
    updateContainerGeometry: function() {
      var geo = this.geometry;

      geo.viewportHeight = this.container.offsetHeight;
      var itemPerScreen = geo.viewportHeight / geo.itemHeight;
      // Taking into account the will-change budget multiplier from
      // layout/base/nsDisplayList.cpp#1193
      geo.maxItemCount = Math.floor(itemPerScreen * 2.8);
      geo.switchWindow = Math.floor(itemPerScreen / 2);

      log('maxItemCount: ' + geo.maxItemCount);
    },

    // Returns true if we're fast scrolling
    updateViewportGeometry: function() {
      var geo = this.geometry;

      var position = this.container.scrollTop;
      this._previousTop = geo.topPosition;
      geo.topPosition = position;

      var distanceSinceLast = geo.topPosition - this._previousTop;

      if ((distanceSinceLast > 0) && !geo.forward) {
        geo.forward = true;
      }

      if ((distanceSinceLast < 0) && geo.forward) {
        geo.forward = false;
      }

      if (geo.topPosition == 0 && this._previousTop !== 0) {
        this.container.dispatchEvent(new CustomEvent('top-reached'));
      }

      var fastScrolling = Math.abs(distanceSinceLast) > geo.viewportHeight * 2;
      var onTop = position === 0;
      var atBottom = position === this.source.fullHeight() - geo.viewportHeight;

      return fastScrolling && !onTop && !atBottom;
    },

    render: function(reload, changedIndex) {
      var source = this.source;
      var items = this._items;
      var itemsInDOM = this._itemsInDOM;
      var editing = this.editing;
      var geo = this.geometry;
      var template = this._template;
      var list = this.list;

      var indices = computeIndices(this.source, this.geometry);
      var criticalStart = indices.cStart;
      var criticalEnd = indices.cEnd;
      var startIndex = indices.start;
      var endIndex = indices.end;

      // Initial render generating all dom nodes
      if (!this._rendered) {
        this._rendered = true;
        endIndex = Math.min(source.fullLength() - 1,
                            startIndex + this.geometry.maxItemCount - 1);
      }

      var recyclableItems = recycle(items, criticalStart, criticalEnd,
                                    geo.forward ? endIndex : startIndex);

      var findItemFor = function(index) {
        var item;

        if (recyclableItems.length > 0) {
          var recycleIndex = recyclableItems.pop();
          item = items[recycleIndex];
          delete items[recycleIndex];
        } else if (itemsInDOM.length < geo.maxItemCount){
          item = template.cloneNode(true);
          list.appendChild(item);
          itemsInDOM.push(item);
        } else {
          console.warn('missing a cell');
          return;
        }

        items[i] = item;
        return item;
      };

      var renderItem = function(i) {
        var item = items[i];
        if (!item) {
          item = findItemFor(i);
          source.populateItem(item, i);
          item.classList.toggle('new', i === changedIndex);
        } else if (reload) {
          source.populateItem(item, i);
        }

        placeItem(item, i, geo, source);
      };

      if (geo.forward) {
        for (var i = startIndex; i <= endIndex; ++i) {
          renderItem(i);
        }
      } else {
        for (var i = endIndex; i >= startIndex; --i) {
          renderItem(i);
        }
      }

      debugViewport(items, geo.forward, criticalStart, criticalEnd,
                    startIndex, endIndex);
    },

    /* Scrolling
       ========= */
    handleScroll: function(evt) {
      this.scheduler.direct((function() {
        var fast = this.updateViewportGeometry();
        if (!fast) {
          this.render();
        }
      }).bind(this));
    },

    updateListHeight: function() {
      return this.scheduler.mutation((function() {
        this.list.style.height = this.source.fullHeight() + 'px';
      }).bind(this));
    },

    get scrollTop() {
      return this.geometry.topPosition;
    },

    scrollInstantly: function(by) {
      this.container.scrollTop += by;
      this.updateViewportGeometry();
      this.render();
    },

    reloadData: function() {
      return this.scheduler.mutation((function() {
        this.render(true);
        this.updateListHeight();
      }).bind(this));
    },

    /* Edit mode
       ========= */
    toggleEditMode: function() {
      this.editing = !this.editing;

      if (this.editing) {
        this._startTouchListeners();
      } else {
        this._stopTouchListeners();
      }

      return toggleEditClass(this.scheduler, this.list,
                             this._itemsInDOM, this.editing);
    },

    _startTouchListeners: function() {
      this.list.addEventListener('touchstart', this);
      this.list.addEventListener('touchend', this);
    },

    _stopTouchListeners: function() {
      this.list.removeEventListener('touchstart', this);
      this.list.removeEventListener('touchend', this);
    },

    /* Reordering
       ---------- */
    _reorderStart: function(evt) {
      var ctx = this.reorderingContext;

      // Already tracking an item, bailing out
      if (ctx.item) {
        return;
      }

      var li = evt.target.parentNode.parentNode;
      var touch = evt.touches[0];

      ctx.item = li;
      ctx.initialY = touch.pageY;
      ctx.identifier = touch.identifier;
      ctx.moveUp = new Set();
      ctx.moveDown = new Set();

      var listenToMove = (function() {
        this.list.addEventListener('touchmove', this);
      }).bind(this);

      toggleIndexPromotion(this.scheduler, li, true)
        .then(listenToMove)
        .then(toggleDraggingClass.bind(null, this.scheduler, li, true));
    },

    _reorderMove: function(evt) {
      var ctx = this.reorderingContext;
      if (!ctx.item) {
        return;
      }

      // Multi touch
      if (evt.touches.length > 1) {
        return;
      }

      var li = ctx.item;
      var position = evt.touches[0].pageY;

      this.scheduler.direct((function() {
        var delta = position - ctx.initialY;

        this._rearrange(delta);
        tweakTransform(li, delta);

        // TODO: scroll when close to the beginning/end of the viewport
      }).bind(this));
    },

    _reorderEnd: function(evt) {
      var ctx = this.reorderingContext;
      if (!ctx.item) {
        return;
      }

      var li = ctx.item;
      this.list.removeEventListener('touchmove', this);
      var scheduler = this.scheduler;

      var touch = evt.changedTouches[0];
      if (touch.identifier == ctx.identifier) {
        var position = touch.pageY;
        var delta = position - ctx.initialY;
        computeChanges(ctx, this.geometry, this._itemsInDOM, delta);
      }

      Promise.all([
        applyChanges(scheduler, ctx, this.geometry, this._itemsInDOM),
        moveInPlace(scheduler, ctx, this.geometry)
      ]).then(this._commitToDocument.bind(this))
        .then(function() {
          ctx.item = null;
          ctx.initialY = null;
          ctx.identifier = null;
          ctx.moveUp = null;
          ctx.moveDown = null;
        })
        .then(toggleIndexPromotion.bind(null, scheduler, li, false))
        .then(toggleDraggingClass.bind(null, scheduler, li, false));
    },

    _rearrange: function(delta) {
      var ctx = this.reorderingContext;
      var upCount = ctx.moveUp.size;
      var downCount = ctx.moveDown.size;

      computeChanges(this.reorderingContext, this.geometry,
                     this._itemsInDOM, delta);

      if (ctx.moveUp.size === upCount &&
          ctx.moveDown.size === downCount) {
        return;
      }

      applyChanges(this.scheduler, this.reorderingContext,
                   this.geometry, this._itemsInDOM);
    },

    _commitToDocument: function() {
      var ctx = this.reorderingContext;
      var li = ctx.item;
      var itemsInDOM = this._itemsInDOM;
      var items = this._items;
      var source = this.source;

      return this.scheduler.mutation((function() {
        // Nothing to do
        if (!ctx.moveUp && !ctx.moveDown) {
          return;
        }

        var index = items.indexOf(li);
        var newIndex = index + ctx.moveUp.size - ctx.moveDown.size;

        items.splice(index, 1);
        items.splice(newIndex, 0, li);
        var c = source.removeAtIndex(index)
        source.insertAtIndex(newIndex, c);

        itemsInDOM.forEach(function(item) {
          resetTransition(item);
          resetTransform(item);
        });

        this.render();
      }).bind(this));
    },

    /* External content changes
       ======================== */
    insertedAtIndex: function(index) {
      if (index !== 0) {
        //TODO: support any point of insertion
        return;
      }

      if (this.geometry.topPosition > this.geometry.itemHeight || this.editing) {
        // No transition needed, just keep the scroll position
        this._insertOnTop(true);
        return;
      }

      var domItems = this._itemsInDOM;

      pushDown(this.scheduler, domItems, this.geometry)
        .then(this._insertOnTop.bind(this, false))
        .then(cleanInlineStyles.bind(null, this.scheduler, domItems))
        .then(reveal.bind(null, this.scheduler, this.list));
    },

    _insertOnTop: function(keepScrollPosition) {
      return this.scheduler.mutation((function() {
        this._items.unshift(null);
        delete this._items[0]; // keeping it sparse

        if (keepScrollPosition) {
          this.scrollInstantly(this.geometry.itemHeight);
          this.container.dispatchEvent(new CustomEvent('hidden-new-content'));
        } else {
          this.render(false, 0);
        }

        this.updateListHeight();
      }).bind(this));
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'resize':
          this.geometry.viewportHeight = this.container.offsetHeight;
          this.updateContainerGeometry();
          break;
        case 'scroll':
          this.handleScroll(evt);
          break;
        case 'touchstart':
          if (!evt.target.classList.contains('cursor')) {
            return;
          }
          evt.preventDefault();
          this._reorderStart(evt);
          break;
        case 'touchmove':
          if (!evt.target.classList.contains('cursor')) {
            return;
          }
          evt.preventDefault();
          this._reorderMove(evt);
          break;
        case 'touchend':
          if (!evt.target.classList.contains('cursor')) {
            return;
          }
          evt.preventDefault();
          this._reorderEnd(evt);
          break;
        case 'click':
          if (this.editing) {
            break;
          }

          var li = evt.target;
          var index = this._items.indexOf(li);

          this.list.dispatchEvent(new CustomEvent('item-selected', {detail: {
            index: index,
            clickEvt: evt
          }}));
          break;
      }
    }
  };

  exports.ScheduledList = list;

  /* Internals
     ========= */

  var debug = false;
  function log(str) {
    if (!debug) {
      return;
    }

    console.log('↕️ ', str);
  }

  /* ASCII Art viewport debugging
     ---------------------------- */
  function debugViewport(items, forward, cStart, cEnd, start, end) {
    if (!debug) {
      return;
    }

    var str = '[' + (forward ? 'v' : '^') + ']';
    for (var i = 0; i < items.length; i++) {
      if (i == start) {
        str += '|';
      }
      if (i == cStart) {
        str += '[';
      }
      if (items[i]) {
        str += 'x';
      } else {
        str += '-';
      }
      if (i == cEnd) {
        str += ']';
      }
      if (i == end) {
        str += '|';
      }
    }
    console.log(str)
  }

  function computeIndices(source, geometry) {
    var criticalStart = source.indexAtPosition(geometry.topPosition);
    var criticalEnd = source.indexAtPosition(geometry.topPosition +
                                             geometry.viewportHeight);

    var canPrerender = geometry.maxItemCount - (criticalEnd - criticalStart) - 1;
    var before = geometry.switchWindow;
    var after = canPrerender - before;
    var lastIndex = source.fullLength() - 1;

    var startIndex;
    var endIndex;

    if (geometry.forward) {
      startIndex = Math.max(0, criticalStart - before);
      endIndex = Math.min(lastIndex,
                          criticalEnd + after);
    } else {
      startIndex = Math.max(0, criticalStart - after);
      endIndex = Math.min(lastIndex,
                          criticalEnd + before);
    }

    return {
      cStart: criticalStart,
      cEnd: criticalEnd,
      start: startIndex,
      end: endIndex
    };
  }

  function recycle(items, start, end, action) {
    var recyclableItems = [];
    for (var i in items) {
      if ((i < start) || (i > end)) {
        recyclableItems.push(i);
      }
    }

    // Put the items that are furthest away from the displayport edge
    // at the end of the array.
    recyclableItems.sort(function(a, b) {
      return Math.abs(a - action) - Math.abs(b - action);
    });

    return recyclableItems;
  }

  function placeItem(item, index, geometry, source) {
    item.dataset.position = source.positionForIndex(index);

    var tweakedBy = parseInt(item.dataset.tweakDelta);
    if (tweakedBy) {
      tweakTransform(item, tweakedBy);
    } else {
      resetTransform(item);
    }
  }

  function resetTransform(item) {
    var position = parseInt(item.dataset.position);
    item.style.webkitTransform =
      item.style.transform = 'translate3d(0, ' + position + 'px, 0)';
    item.dataset.tweakDelta = '';
  }

  function tweakTransform(item, delta) {
    var position = parseInt(item.dataset.position) + delta;
    item.style.webkitTransform =
      item.style.transform = 'translate3d(0, ' + position + 'px, 0)';
    item.dataset.tweakDelta = delta;
  }

  function resetTransition(item) {
    item.style.transition = '';
    item.style.webkitTransition = '';
  }

  function tweakAndTransition(scheduler, item, tweak) {
    return scheduler.transition(function() {
      item.style.transition = 'transform 0.15s ease';
      item.style.webkitTransition = '-webkit-transform 0.15s ease';
      if (tweak === 0) {
        setTimeout(resetTransform.bind(null, item));
        return;
      }
      setTimeout(tweakTransform.bind(null, item, tweak));
    }, item, 'transitionend')
    .then(resetTransition.bind(null, item));
  }

  function pushDown(scheduler, domItems, geometry) {
    if (!domItems.length) {
      return Promise.resolve();
    }

    return scheduler.transition(function() {
      for (var i = 0; i < domItems.length; i++) {
        var item = domItems[i];
        item.style.transition = 'transform 0.15s ease-in';
        item.style.webkitTransition = '-webkit-transform 0.15s ease-in';
        tweakTransform(item, geometry.itemHeight);
      }
    }, domItems[0], 'transitionend');
  }

  function reveal(scheduler, list) {
    var newEl = list.querySelector('li.new');

    return scheduler.transition(function() {
      newEl.style.transition = 'opacity 0.25s ease-out';
      newEl.style.webkitTransition = 'opacity 0.25s ease-out';
      setTimeout(function() {
        newEl.classList.remove('new');
      });
    }, newEl, 'transitionend').then(function() {
      newEl.style.transition = '';
      newEl.style.webkitTransition = '';
    });
  }

  function cleanInlineStyles(scheduler, domItems) {
    return scheduler.mutation(function() {
      for (var i = 0; i < domItems.length; i++) {
        var item = domItems[i];
        item.style.transition = '';
        item.style.webkitTransition = '';
        resetTransform(item);
      }
      item.scrollTop; // flushing
    });
  }

  function toggleEditClass(scheduler, list, domItems, editing) {
    if (!domItems.length) {
      return Promise.resolve();
    }

    return scheduler.transition((function() {
      for (var i = 0; i < domItems.length; i++) {
        var item = domItems[i];
        item.classList.toggle('edit', editing);
      }
    }).bind(this), list, 'transitionend');
  }

  function toggleIndexPromotion(scheduler, item, on) {
    return scheduler.mutation(function() {
      item.style.zIndex = on ? '1000' : 0;
      item.style.boxShadow = on ? '0 0 3px 1px #bcbcbc' : '';
    });
  }

  function toggleDraggingClass(scheduler, item, on) {
    return scheduler.transition(function() {
      item.classList.toggle('dragging', on);
    }, item, 'transitionend');
  }

  function computeChanges(context, geometry, domItems, delta) {
    if (!context.item) {
      return;
    }

    var itemHeight = geometry.itemHeight;

    var draggedItem = context.item;
    var draggedOriginal = parseInt(draggedItem.dataset.position);
    var draggedTweaked = draggedOriginal + delta;

    for (var i = 0; i < domItems.length; i++) {
      var item = domItems[i];
      if (item === draggedItem) {
        continue;
      }

      var itemOriginal = parseInt(item.dataset.position);
      var itemTweaked = itemOriginal + parseInt(item.dataset.tweakDelta);

      if ((itemOriginal < draggedOriginal) && (draggedTweaked < itemOriginal)) {
        context.moveDown.add(item);
      } else {
        if (draggedTweaked > itemTweaked) {
          context.moveDown.delete(item);
        }
      }

      if ((itemOriginal > draggedOriginal) && (draggedTweaked > itemOriginal)) {
        context.moveUp.add(item);
      } else {
        if (draggedTweaked < itemTweaked) {
          context.moveUp.delete(item);
        }
      }
    }
  }

  function applyChanges(scheduler, context, geometry, domItems) {
    if (!context.item) {
      return Promise.resolve();
    }

    var itemHeight = geometry.itemHeight;
    var draggedItem = context.item;
    var promises = [];

    for (var i = 0; i < domItems.length; i++) {
      var item = domItems[i];
      if (item === draggedItem) {
        continue;
      }

      // Reset
      if (item.dataset.tweakDelta &&
         !context.moveUp.has(item) && !context.moveDown.has(item)) {

        promises.push(tweakAndTransition(scheduler, item, 0));
      }

      // Moving down
      if (context.moveDown.has(item)) {
        if (parseInt(item.dataset.tweakDelta) !== itemHeight) {
          promises.push(tweakAndTransition(scheduler, item, itemHeight));
        }
      }

      // Moving up
      if (context.moveUp.has(item)) {
        if (parseInt(item.dataset.tweakDelta) !== itemHeight * -1) {
          promises.push(tweakAndTransition(scheduler, item, itemHeight * -1));
        }
      }
    }

    return Promise.all(promises);
  }

  function moveInPlace(scheduler, context, geometry) {
    var li = context.item;

    // We're already in place
    if (!li.dataset.tweakDelta) {
      return Promise.resolve();
    }

    var position = parseInt(li.dataset.position);
    var taintedPosition = position + parseInt(li.dataset.tweakDelta);
    var itemHeight = geometry.itemHeight;
    var newPosition = position + context.moveUp.size * itemHeight -
                      context.moveDown.size * itemHeight;

    var duration = (Math.abs(taintedPosition - newPosition) / itemHeight) * 150;

    return scheduler.transition(function() {
      li.style.transition = 'transform ' + duration + 'ms linear';
      li.style.webkitTransition = '-webkit-transform ' + duration + 'ms linear';
      setTimeout(tweakTransform.bind(null, li, (newPosition - position)));
    }, li, 'transitionend');
  }
})(window);
