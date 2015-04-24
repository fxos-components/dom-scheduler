(function() {
  var debug = false;
  var headerHeight = 50;
  var maxItemCount = 25;

  var listSize = 1042;
  var content = [];
  for (var i = 0; i < listSize; i++) {
    content.push(makeContent(i));
  }

  function makeContent(prefix) {
    return {
      title: prefix + ' Bacon ipsum dolor ' +
             Date.now().toString().slice(7, -1),
      body: 'Turkey biltong pig boudin kevin filet de mignon drums ' + i + '.'
    }
  }

  window.addEventListener('load', function() {
    var template = document.getElementById('template');
    var itemHeight = template.offsetHeight;

    template.remove();
    template.removeAttribute('id');

    var items = [];
    var itemsInDOM = [];
    var editMode = false;
    var listContainer = document.querySelector('section');
    var list = document.querySelector('ul');

    var previousTop = 0;
    var topPosition = 0;
    var previousTimestamp = Date.now();
    var topTimestamp = Date.now();
    var viewPortHeight = window.innerHeight;
    var forward = true;

    function populateItem(item, index) {
      var title = item.firstChild;
      var body = title.nextSibling;
      var record = content[index];

      title.firstChild.data = record.title;
      body.firstChild.data = record.body;

      item.classList.toggle('edit', editMode);
      if (record.toSlide) {
        item.dataset.toSlide = true;
      } else if (item.dataset.toSlide) {
        delete item.dataset.toSlide;
      }
    }

    // Initial load
    maestro.mutation(function() {
      updateListSize();
      placeItems();
      updateViewportItems();
      updateHeader();
    });

    // Virtual-List management
    function updateListSize() {
      list.style.height = content.length * itemHeight + 'px';
    }

    function placeItems() {
      updateVisibleItems(0, itemHeight * maxItemCount);
    }

    window.addEventListener('resize', function() {
      viewPortHeight = window.innerHeight;
    });

    function recycle(startIndex, endIndex) {
      var recyclableItems = [];
      for (var i in items) {
        if (i < startIndex || i >= endIndex) {
          recyclableItems.push(i);
        }
      }
      return recyclableItems;
    }

    function updateVisibleItems(top, height) {
      top = top || topPosition;
      height = height || viewPortHeight;

      var startIndex = Math.max(0, Math.floor(top / itemHeight));
      var endIndex = Math.min(content.length - 1, Math.ceil((top + height) /
                                                        itemHeight));

      var recyclableItems = recycle(startIndex, endIndex);

      // Put the items that are furthest away from the displayport at the end of
      // the array.
      function distanceFromDisplayPort(i) {
        return i < startIndex ? startIndex - 1 - i : i - endIndex;
      }
      recyclableItems.sort(function(a, b) {
        return distanceFromDisplayPort(a) - distanceFromDisplayPort(b);
      });

      for (var i = startIndex; i <= endIndex; ++i) {
        var item = items[i];

        if (!item) {
          if (recyclableItems.length > 0) {
            var recycleIndex = recyclableItems.pop();
            item = items[recycleIndex];
            delete items[recycleIndex];
          } else if (itemsInDOM.length < maxItemCount){
            item = template.cloneNode(true);
            list.appendChild(item);
            itemsInDOM.push(item);
          } else {
            // Probably scrolling too fast anyway, bailing out
            continue;
          }
          populateItem(item, i);
          items[i] = item;
        }

        item.dataset.position = i * itemHeight;

        var tweakedBy = item.dataset.tweakDelta;
        if (tweakedBy) {
          item.style.webkitTransform =
            item.style.transform = 'translate3d(0, ' + (i * itemHeight +
                                   parseInt(tweakedBy)) + 'px, 0)';
        } else  {
          resetTransform(item);
        }
      }

      /* ASCII Art viewport debugging */
      if (debug) {
        var str = "";
        for (var i = 0; i < content.length; i++) {
          if (i == startIndex) {
            str += "|";
          }
          if (items[i]) {
            str += "x";
          } else {
            str += "-";
          }
          if (i == endIndex) {
            str += "|";
          }
        }
        console.log(str)
      }
    }

    function updateViewportItems() {
      return maestro.mutation(function() {
        var startIndex = Math.max(0, Math.floor(topPosition / itemHeight) - 1);
        var endIndex = Math.min(content.length - 1,
                               ((topPosition + viewPortHeight) /
                               itemHeight) + 1);

        for (var i in items) {
          var item = items[i];
          item.classList.toggle('viewport', i >= startIndex && i <= endIndex);
        }
      });
    }

    window.addEventListener('scrollend', updateViewportItems);

    listContainer.addEventListener('scroll', function(evt) {
      var lagTimestamp = Date.now();
      maestro.live(function() {
        previousTop = topPosition;
        previousTimestamp = topTimestamp;
        topPosition = listContainer.scrollTop;
        topTimestamp = Date.now()

        var speed = (topPosition - previousTop) /
                    (topTimestamp - previousTimestamp);
        var lag = Date.now() - lagTimestamp;
        var offset = speed * lag;

        if ((forward && offset > 0) ||
            (!forward && offset < 0)) {
          topPosition += offset;
        }

        forward = ((topPosition - previousTop) > 0);

        var vpTop = topPosition;
        var vpHeight = viewPortHeight * 2;

        if (!forward) {
          vpTop -= viewPortHeight;
        }

        updateVisibleItems(vpTop, vpHeight);
        updateNewIndicator();
      });
    });

    function updateNewIndicator() {
      var h1After = document.querySelector('#h1-after');

      if (topPosition <= 0 && h1After.classList.contains('new')) {
        maestro.transition(function() {
          h1After.classList.remove('new');
        }, h1After, 'transitionend');
      }
    }

    // New stuff coming in every 15sec
    function newContentHandler() {
      if ((topPosition > itemHeight) || editMode) {
        // No transition needed, just keep the scroll position
        insertOnTop(true);
        return;
      }

      updateViewportItems()
        .then(pushDown)
        .then(insertOnTop.bind(null, false))
        .then(cleanInlineStyles)
        .then(updateViewportItems)
        .then(slideIn)
    }

    setInterval(newContentHandler, 15000);
    window.addEventListener('new-content', newContentHandler);

    window.pushNewContent = function() {
      var start = performance.now();
      window.dispatchEvent(new CustomEvent('new-content'));
    };

    function pushDown() {
      if (!itemsInDOM.length) {
        return Promise.resolve();
      }

      return maestro.transition(function() {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.style.transition = 'transform 0.25s ease';
          item.style.webkitTransition = '-webkit-transform 0.25s ease';
          tweakTransform(item, itemHeight);
        }
      }, itemsInDOM[0], 'transitionend');
    }

    function cleanInlineStyles() {
      return maestro.mutation(function() {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.style.transition = '';
          item.style.webkitTransition = '';
          resetTransform(item);
        }
        listContainer.scrollTop; // flushing
      });
    }

    function slideIn() {
      var newEl = list.querySelector('li[data-to-slide]');

      return maestro.transition(function() {
        delete newEl.dataset.toSlide;
        setTimeout(function() {
          newEl.style.transition = 'transform 0.25s ease';
          newEl.style.webkitTransition = '-webkit-transform 0.25s ease';
          resetTransform(newEl);
        });
      }, newEl, 'transitionend').then(function() {
        newEl.style.transition = '';
        newEl.style.webkitTransition = '';
        delete content[0].toSlide;
      });
    }

    function insertOnTop(keepScrollPosition) {
      return maestro.mutation(function() {
        var newContent = makeContent('NEW');
        newContent.toSlide = !keepScrollPosition;
        content.unshift(newContent);

        items.unshift(null);
        delete items[0]; // keeping it sparse

        if (keepScrollPosition) {
          listContainer.scrollTop += itemHeight;

          var h1After = document.querySelector('#h1-after');
          maestro.transition(function() {
            h1After.classList.add('new');
          }, h1After, 'transitionend');
        }

        updateVisibleItems();
        updateHeader();
      });
    }

    function updateHeader() {
      return maestro.mutation(function() {
        var h1 = document.querySelector('h1');
        h1.textContent = 'Main List (' + content.length + ')';
      });
    }

    // Edition support
    var button = document.querySelector('button');
    button.addEventListener('click', function() {
      if (editMode) {
        exitEditMode();
        editMode = false;
      } else {
        enterEditMode();
        editMode = true;
      }
    });

    function enterEditMode() {
      changeEditMode('Exit', toggleEditClass.bind(null, true));
      startTouchListeners();
    }

    function exitEditMode() {
      changeEditMode('Edit', toggleEditClass.bind(null, false));
      stopTouchListeners();
    }

    function changeEditMode(text, toggleEditClass) {
      var update = updateText.bind(null, text);

      toggleTransitioning()
        .then(updateViewportItems)
        .then(toggleEditClass)
        .then(update)
        .then(toggleTransitioning);
    }

    function updateText(text) {
      return maestro.mutation(function() {
        button.textContent = text;
      });
    }

    function toggleTransitioning() {
      return maestro.transition(function() {
        button.classList.toggle('transitioning');
      }, button, 'transitionend', 300, true /* feedback */);
    }

    function toggleEditClass(on) {
      return maestro.transition(function() {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.classList.toggle('edit', on);
        }
      }, itemsInDOM[0], 'transitionend');
    }

    function startTouchListeners() {
      list.addEventListener('touchstart', liTouchStart);
      list.addEventListener('touchmove', liTouchMove);
      list.addEventListener('touchend', liTouchEnd);
    }

    function stopTouchListeners() {
      list.removeEventListener('touchstart', liTouchStart);
      list.removeEventListener('touchmove', liTouchMove);
      list.removeEventListener('touchend', liTouchEnd);
    }

    function tweakTransform(item, delta) {
      var position = parseInt(item.dataset.position) + delta;
      item.style.webkitTransform =
        item.style.transform = 'translate3d(0, ' + position + 'px, 0)';
      item.dataset.tweakDelta = delta;
    }

    function resetTransform(item) {
      var position = parseInt(item.dataset.position);
      if (item.dataset.toSlide) {
        item.style.webkitTransform =
          item.style.transform = 'translate3d(-99.9%, ' + position + 'px, 0)';
      } else {
        item.style.webkitTransform =
          item.style.transform = 'translate3d(0, ' + position + 'px, 0)';
      }
      delete item.dataset.tweakDelta;
    }

    var initialY;
    function liTouchStart(evt) {
      if (!evt.target.classList.contains('cursor')) {
        return;
      }
      evt.preventDefault();

      initialY = evt.touches[0].pageY;
      var li = evt.target.parentNode.parentNode;
      toggleDragging(li);
    }

    var quietTimeout = null;
    function liTouchMove(evt) {
      if (!evt.target.classList.contains('cursor')) {
        return;
      }
      evt.preventDefault();

      var target = evt.target;
      var li = target.parentNode.parentNode;
      var position = evt.touches[0].pageY;

      maestro.live(function() {
        if (quietTimeout) {
          clearTimeout(quietTimeout);
          quietTimeout = null;
        }
        var delta = position - initialY;

        quietTimeout = setTimeout(rearrange.bind(null, li, delta), 160);

        tweakTransform(li, delta);
        li.dataset.taintedPosition = delta;

        // TODO: scroll when close to the beginning/end of the viewport
      });
    }

    function liTouchEnd(evt) {
      if (!evt.target.classList.contains('cursor')) {
        return;
      }
      evt.preventDefault();

      if (quietTimeout) {
        clearTimeout(quietTimeout);
        quietTimeout = null;
      }

      var li = evt.target.parentNode.parentNode;

      moveInPlace(li)
        .then(commitToDocument.bind(null, li))
        .then(toggleDragging.bind(null, li));
    }

    function toggleDragging(li) {
      return maestro.mutation(function() {
        li.style.zIndex = li.style.zIndex ? '' : 1000;
      }).then(function() {
        return maestro.transition(function() {
          li.classList.toggle('dragging');
        }, li, 'transitionend');
      });
    }

    function moveInPlace(li) {
      var position = parseInt(li.dataset.position);
      var taintedPosition = position + parseInt(li.dataset.taintedPosition);
      var newPosition = position;
      itemsInDOM.forEach(function(item) {
        if (item.dataset.taint == 'down') {
          newPosition -= itemHeight;
        }
        if (item.dataset.taint == 'up') {
          newPosition += itemHeight;
        }
      });
      var duration = (Math.abs(taintedPosition - newPosition) / itemHeight) * 250;

      li.style.transition = 'transform ' + duration + 'ms linear';
      li.style.webkitTransition = '-webkit-transform ' + duration + 'ms linear';
      return maestro.transition(function() {
        tweakTransform(li, (newPosition - position));
      }, li, 'transitionend', duration)
    }

    function commitToDocument(li) {
      return maestro.mutation(function() {
        var index = items.indexOf(li);

        var firstDown = items.filter(function(item) {
          if (!item) {
            return false;
          }
          return item.dataset.taint == 'down';
        })[0];
        if (firstDown) {
          items.splice(index, 1);
          var c = content.splice(index, 1)[0];
          var newIndex = items.indexOf(firstDown);
          items.splice(newIndex, 0, li);
          content.splice(newIndex, 0, c);
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
          var c = content.splice(index, 1)[0];
          items.splice(index, 1);
          items.splice(nextIndex, 0, li);
          content.splice(nextIndex, 0, c);
        }

        delete li.dataset.taintedPosition;

        itemsInDOM.forEach(function(item) {
          item.style.transition = '';
          item.style.webkitTransition = '';
          resetTransform(item);
          delete item.dataset.taint;
        });
        placeItems();
      });
    }

    function rearrange(li, delta) {
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

        maestro.transition(function() {
          work.items.forEach(function(item) {
            item.style.transition = 'transform 0.25s ease';
            item.style.webkitTransition = '-webkit-transform 0.25s ease';
            tweakTransform(item, work.transform);
            if (!work.taint) {
              delete item.dataset.taint;
            } else {
              item.dataset.taint = work.taint;
            }
          });
        }, work.items[0], 'transitionend').then(function() {
          work.items.forEach(function(item) {
            item.style.transition = '';
            item.style.webkitTransition = '';
          });
        });
      });
    }
  });
})();
