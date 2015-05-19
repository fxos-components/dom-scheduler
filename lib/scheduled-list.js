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

    this._initialY = null;
    this._quietTimeout = null;

    this.updateScrollBar();

    this.container.addEventListener('scroll', this);
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
      // Taking into account the will-change budget
      geo.maxItemCount = Math.floor(itemPerScreen * 3);
      geo.switchWindow = Math.floor(itemPerScreen / 2);

      log('maxItemCount: ' + geo.maxItemCount);
    },

    updateViewportGeometry: function() {
      var geo = this.geometry;

      this._previousTop = geo.topPosition;
      geo.topPosition = this.container.scrollTop;

      if (((geo.topPosition - this._previousTop) > 0) && !geo.forward) {
        geo.forward = true;
      }

      if (((geo.topPosition - this._previousTop) < 0) && geo.forward) {
        geo.forward = false;
      }

      if (geo.topPosition == 0 && this._previousTop !== 0) {
        this.container.dispatchEvent(new CustomEvent('top-reached'));
      }
    },

    render: function(changedIndex) {
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
        }

        if (editing) {
          item.classList.add('edit');
        }

        placeItem(item, i, geo);
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
        this.updateViewportGeometry();
        this.render();
      }).bind(this));
    },

    updateScrollBar: function() {
      return this.scheduler.mutation((function() {
        this.list.style.height = this.source.fullHeight() + 'px';
      }).bind(this));
    },

    scrollInstantly: function(by) {
      this.container.scrollTop += by;
      this.updateViewportGeometry();
      this.render();
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
      this.list.addEventListener('touchmove', this);
      this.list.addEventListener('touchend', this);
    },

    _stopTouchListeners: function() {
      this.list.removeEventListener('touchstart', this);
      this.list.removeEventListener('touchmove', this);
      this.list.removeEventListener('touchend', this);
    },

    /* Reordering
       ---------- */
    _reorderStart: function(evt) {
      this._initialY = evt.touches[0].pageY;
      var li = evt.target.parentNode.parentNode;
      this._toggleDragging(li);
    },

    _toggleDragging: function(li) {
      var scheduler = this.scheduler;
      return scheduler.mutation(function() {
        li.style.zIndex = li.style.zIndex ? '' : 1000;
      }).then(function() {
        return scheduler.transition(function() {
          li.classList.toggle('dragging');
        }, li, 'transitionend');
      });
    },

    _reorderMove: function(evt) {
      var target = evt.target;
      var li = target.parentNode.parentNode;
      var position = evt.touches[0].pageY;

      this.scheduler.direct((function() {
        if (this._quietTimeout) {
          clearTimeout(this._quietTimeout);
          this._quietTimeout = null;
        }
        var delta = position - this._initialY;

        this._quietTimeout = setTimeout(this._rearrange.bind(this, li, delta), 100);

        tweakTransform(li, delta);
        li.dataset.taintedPosition = delta;

        // TODO: scroll when close to the beginning/end of the viewport
      }).bind(this));
    },

    _rearrange: function(li, delta) {
      var itemsInDOM = this._itemsInDOM;
      var itemHeight = this.geometry.itemHeight;
      var scheduler = this.scheduler;

      var index = itemsInDOM.indexOf(li);
      if (index < 0) {
        return;
      }

      var liDOMPosition = parseInt(li.dataset.position);
      var position = liDOMPosition + delta + itemHeight / 2;

      var toMoveDown = []
      var toMoveUp = [];
      var toReset = [];
      for (var i = 0; i < itemsInDOM.length; i++) {
        if (i === index) {
          continue;
        }

        var item = itemsInDOM[i];
        var itemDOMPosition = parseInt(item.dataset.position);
        var itemCenter = itemDOMPosition + itemHeight / 2;
        if (item.dataset.taint == 'down') {
          itemCenter += itemHeight;
        }
        if (item.dataset.taint == 'up') {
          itemCenter -= itemHeight;
        }
        if (itemDOMPosition < liDOMPosition) {
          if (position < itemCenter) {
            if (item.dataset.taint != 'down') {
              toMoveDown.push(item);
            }
          } else {
            if (item.dataset.taint == 'down') {
              toReset.push(item);
            }
          }
        }
        if (itemDOMPosition > liDOMPosition) {
          if (position > itemCenter) {
            if (item.dataset.taint != 'up') {
              toMoveUp.push(item);
            }
          } else {
            if (item.dataset.taint == 'up') {
              toReset.push(item);
            }
          }
        }
      }

      var diff = [
        { items: toMoveDown, transform: itemHeight, taint: 'down' },
        { items: toMoveUp, transform: (itemHeight * -1), taint: 'up' },
        { items: toReset, transform: 0, taint: null }
      ]

      diff.forEach(function(work) {
        if (!work.items.length) {
          return
        }

        scheduler.transition(function() {
          work.items.forEach(function(item) {
            item.style.transition = 'transform 0.25s ease';
            item.style.webkitTransition = '-webkit-transform 0.25s ease';
            setTimeout(function() {
              tweakTransform(item, work.transform);
            });
            if (!work.taint) {
              item.dataset.taint = '';
            } else {
              item.dataset.taint = work.taint;
            }
          });
        }, work.items[0], 'transitionend', 400).then(function() {
          work.items.forEach(function(item) {
            item.style.transition = '';
            item.style.webkitTransition = '';
          });
        });
      });
    },

    _reorderEnd: function(evt) {
      if (this._quietTimeout) {
        clearTimeout(this._quietTimeout);
        this._quietTimeout = null;
      }

      var li = evt.target.parentNode.parentNode;

      this._moveInPlace(li)
        .then(this._commitToDocument.bind(this, li))
        .then(this._toggleDragging.bind(this, li));
    },

    _moveInPlace: function(li) {
      var position = parseInt(li.dataset.position);
      var taintedPosition = position + parseInt(li.dataset.taintedPosition);
      var newPosition = position;
      var itemsInDOM = this._itemsInDOM;
      var itemHeight = this.geometry.itemHeight;

      itemsInDOM.forEach(function(item) {
        if (item.dataset.taint == 'down') {
          newPosition -= itemHeight;
        }
        if (item.dataset.taint == 'up') {
          newPosition += itemHeight;
        }
      });
      var duration = (Math.abs(taintedPosition - newPosition) / itemHeight) * 250;

      return this.scheduler.transition(function() {
        li.style.transition = 'transform ' + duration + 'ms linear';
        li.style.webkitTransition = '-webkit-transform ' + duration + 'ms linear';
        setTimeout(function() {
          tweakTransform(li, (newPosition - position));
        });
      }, li, 'transitionend');
    },

    _commitToDocument: function(li) {
      var itemsInDOM = this._itemsInDOM;
      var items = this._items;
      var source = this.source;

      return this.scheduler.mutation((function() {
        var index = items.indexOf(li);

        var firstDown = items.filter(function(item) {
          if (!item) {
            return false;
          }
          return item.dataset.taint == 'down';
        })[0];
        if (firstDown) {
          items.splice(index, 1);
          var c = source.removeAtIndex(index)
          var newIndex = items.indexOf(firstDown);
          items.splice(newIndex, 0, li);
          source.insertAtIndex(newIndex, c);
        }

        var ups = items.filter(function(item) {
          if (!item) {
            return false;
          }
          return item.dataset.taint == 'up';
        });
        var lastUp = ups.length && ups[ups.length - 1];
        if (lastUp) {
          var nextIndex = items.indexOf(lastUp);
          var c = source.removeAtIndex(index);
          items.splice(index, 1);
          items.splice(nextIndex, 0, li);
          source.insertAtIndex(nextIndex, c)
        }

        li.dataset.taintedPosition = '';

        itemsInDOM.forEach(function(item) {
          item.style.transition = '';
          item.style.webkitTransition = '';
          resetTransform(item);
          item.dataset.taint = '';
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
          this.render(0);
        }

        this.updateScrollBar();
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

  function placeItem(item, index, geometry) {
    item.dataset.position = index * geometry.itemHeight;

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

  function pushDown(scheduler, domItems, geometry) {
    if (!domItems.length) {
      return Promise.resolve();
    }

    return scheduler.transition(function() {
      for (var i = 0; i < domItems.length; i++) {
        var item = domItems[i];
        item.style.transition = 'transform 0.2s ease-in';
        item.style.webkitTransition = '-webkit-transform 0.20s ease-in';
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
})(window);
