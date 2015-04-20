(function() {
  const debug = false;
  const headerHeight = 50;
  const maxItemCount = 22;

  const listSize = 1042;
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

    var topPosition = 0;
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
    maestro.mutation(() => {
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
      updateVisibleItems(0, viewPortHeight);
    }

    window.addEventListener('resize', placeItems);

    function updateVisibleItems(top, height) {
      top = top || topPosition;
      height = height || viewPortHeight;

      var startIndex = Math.max(0, Math.floor(top / itemHeight));
      var endIndex = Math.min(content.length - 1, Math.ceil((top + height) /
                                                        itemHeight));

      var recyclableItems = [];
      for (var i in items) {
        if (i < startIndex || i >= endIndex) {
          recyclableItems.push(i);
        }
      }

      // Put the items that are furthest away from the displayport at the end of
      // the array.
      function distanceFromDisplayPort(i) {
        return i < startIndex ? startIndex - 1 - i : i - endIndex;
      }
      recyclableItems.sort(function(a, b) {
        return distanceFromDisplayPort(a) - distanceFromDisplayPort(b);
      });

      var toPlace = Math.abs(endIndex - startIndex);
      var inDOM = itemsInDOM.length;
      var recyclables = recyclableItems.length;

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
          item.style.transform = 'translate(0, ' + (i * itemHeight +
                                                  parseInt(tweakedBy)) + 'px)';
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
      return maestro.mutation(() => {
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

    listContainer.addEventListener('displayportchange', function(evt) {
      maestro.live(() => {
        var d = evt.detail;
        topPosition = d.scrollOffset.y;
        viewPortHeight = d.criticalDisplayPort.height

        var vpTop = Math.min(topPosition, topPosition + d.margins.height);
        var vpHeight = Math.max(viewPortHeight, window.innerHeight);

        updateVisibleItems(vpTop, vpHeight);
        updateNewIndicator();
      });
    });

    function updateNewIndicator() {
      var h1After = document.querySelector('#h1-after');

      if (topPosition === 0 && h1After.classList.contains('new')) {
        maestro.transition(() => {
          h1After.classList.remove('new');
        }, h1After, 'transitionend');
      }
    }

    // New stuff coming in every 15sec
    function newContentHandler() {
      if ((topPosition > 0) || editMode) {
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

      return maestro.transition(() => {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.style.transition = 'transform 0.25s ease';
          tweakTransform(item, itemHeight);
        }
      }, itemsInDOM[0], 'transitionend');
    }

    function cleanInlineStyles() {
      return maestro.mutation(() => {
        for (var i = 0; i < itemsInDOM.length; i++) {
          var item = itemsInDOM[i];
          item.style.transition = '';
          resetTransform(item);
        }
        listContainer.scrollTop; // flushing
      });
    }

    function slideIn() {
      var newEl = list.querySelector('li[data-to-slide]');

      return maestro.transition(() => {
        delete newEl.dataset.toSlide;
        setTimeout(() => {
          newEl.style.transition = 'transform 0.25s ease';
          resetTransform(newEl);
        });
      }, newEl, 'transitionend').then(() => {
        newEl.style.transition = '';
        delete content[0].toSlide;
      });
    }

    function insertOnTop(keepScrollPosition) {
      return maestro.mutation(() => {
        var newContent = makeContent('NEW');
        newContent.toSlide = !keepScrollPosition;
        content.unshift(newContent);

        items.unshift(null);
        delete items[0]; // keeping it sparse

        if (keepScrollPosition) {
          listContainer.scrollBy(0, itemHeight);

          var h1After = document.querySelector('#h1-after');
          maestro.transition(() => {
            h1After.classList.add('new');
          }, h1After, 'transitionend');
        }

        updateVisibleItems();
        updateHeader();
      });
    }

    function updateHeader() {
      return maestro.mutation(() => {
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
      return maestro.mutation(() => {
        button.textContent = text;
      });
    }

    function toggleTransitioning() {
      return maestro.transition(() => {
        button.classList.toggle('transitioning');
      }, button, 'transitionend', 300, true /* feedback */);
    }

    function toggleEditClass(on) {
      return maestro.transition(() => {
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
      item.style.transform = 'translate(0, ' + position + 'px)';
      item.dataset.tweakDelta = delta;
    }

    function resetTransform(item) {
      var position = parseInt(item.dataset.position);
      if (item.dataset.toSlide) {
        item.style.transform = 'translate(-99.9%, ' + position + 'px)';
      } else {
        item.style.transform = 'translate(0, ' + position + 'px)';
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

      maestro.live(() => {
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
      return maestro.mutation(() => {
        li.style.zIndex = li.style.zIndex ? '' : 1000;
      }).then(() => {
        return maestro.transition(() => {
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
      return maestro.transition(() => {
        tweakTransform(li, (newPosition - position));
      }, li, 'transitionend', duration)
    }

    function commitToDocument(li) {
      return maestro.mutation(() => {
        var index = items.indexOf(li);

        var firstDown = items.find(function(item) {
          if (!item) {
            return false;
          }
          return item.dataset.taint == 'down';
        });
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

        maestro.transition(() => {
          work.items.forEach(function(item) {
            item.style.transition = 'transform 0.25s ease';
            tweakTransform(item, work.transform);
            if (!work.taint) {
              delete item.dataset.taint;
            } else {
              item.dataset.taint = work.taint;
            }
          });
        }, work.items[0], 'transitionend').then(() => {
          work.items.forEach(function(item) {
            item.style.transition = '';
          });
        });
      });
    }
  });
})();
