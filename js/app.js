(function() {
  const itemHeight = 88;
  const headerHeight = 50;
  const viewPortMargin = 4;

  const listSize = 420;

  window.addEventListener('load', function() {
    var items = [];
    var editMode = false;
    var listContainer = document.querySelector('section');

    // Initial load
    maestro.mutation(() => {
      var list = document.querySelector('ul');
      for (var i = 0; i < listSize; i++) {
        var el = list.appendChild(makeListItem(i));
        el.style.display = 'block';
        items.push(el);
      }
      updateVisibleItems();
      placeItems();
      updateHeader();
      items.forEach(function(item) {
        item.style.display = '';
      });
    });

    // List management
    // TODO: implement full virtual list support
    function placeItems(moved) {
      var list = document.querySelector('ul');
      var elements = list.querySelectorAll('li');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];

        // Simply push down we might have re-ordering pending
        if (editMode && !moved && i > 0) {
          var previousTop = parseInt(el.style.top);
          el.style.top = previousTop + itemHeight + 'px';
        } else {
          el.style.top = (i * itemHeight) + 'px';
        }
      }
      list.style.height = elements.length * itemHeight + 'px';
    }

    var visibleItems;
    var topPosition;
    function updateVisibleItems() {
      topPosition = listContainer.scrollTop;

      var topIndex = Math.max(0, Math.floor(topPosition / itemHeight) -
                                 viewPortMargin);
      var bottomPosition = topPosition + window.innerHeight - headerHeight;
      var bottomIndex = Math.min(items.length,
                                 Math.ceil(bottomPosition / itemHeight) +
                                 viewPortMargin);

      visibleItems = items.slice(topIndex, bottomIndex);

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (i >= topIndex && i <= bottomIndex) {
          item.classList.add('viewport');
        } else {
          item.classList.remove('viewport');
        }
      }
    }

    listContainer.addEventListener('scroll', function(evt) {
      maestro.live(() => {
        updateVisibleItems();
        updateNewIndicator();
      });
    });

    function updateNewIndicator() {
      var list = document.querySelector('ul');
      var first = list.querySelector('li:first-child');
      var h1After = document.querySelector('#h1-after');

      var onTop = topPosition === 0;
      if (onTop) {
        maestro.transition(() => {
          h1After.classList.remove('new');
        }, h1After, 'transitionend');
      }
    }

    // New stuff coming in every 15sec
    setInterval(() => {
      var list = document.querySelector('ul');
      var first = list.querySelector('li:first-child');

      if ((topPosition > 0) || editMode) {
        // No transition needed, just keep the scroll position
        insertOnTop(true);
        return;
      }

      pushDown(visibleItems)
        .then(insertOnTop.bind(null, false))
        .then(cleanInlineStyles.bind(null, visibleItems))
        .then(slideIn);

    }, 15000);

    function pushDown(items) {
      if (!items.length) {
        return Promise.resolve();
      }

      return maestro.transition(() => {
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item.style.transition = 'transform 0.25s ease';
          item.style.transform = 'translateY(' + itemHeight + 'px)';
        }
      }, items[0], 'transitionend');
    }

    function cleanInlineStyles(items) {
      return maestro.mutation(() => {
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item.style.transition = '';
          item.style.transform = '';
        }
      });
    }

    function slideIn() {
      var list = document.querySelector('ul');
      var newEl = list.querySelector('li:first-child');

      return maestro.transition(() => {
        newEl.style.transition = 'transform 0.25s ease';
        newEl.classList.remove('new');
      }, newEl, 'transitionend').then(() => {
        newEl.style.transition = '';
      });
    }

    function insertOnTop(keepScrollPosition) {
      return maestro.mutation(() => {
        var list = document.querySelector('ul');
        var first = list.querySelector('li:first-child');
        var el = makeListItem('NEW');
        if (!keepScrollPosition) {
          el.classList.add('new');
          el.classList.add('viewport');
        }
        el.classList.toggle('edit', editMode);
        list.insertBefore(el, first);
        items.unshift(el);

        placeItems();
        updateVisibleItems();

        if (keepScrollPosition) {
          listContainer.scrollBy(0, itemHeight);
          var h1After = document.querySelector('#h1-after');
          maestro.transition(() => {
            h1After.classList.add('new');
          }, h1After, 'transitionend');
        }

        updateHeader();
      });
    }

    function updateHeader() {
      return maestro.mutation(() => {
        var h1 = document.querySelector('h1');
        h1.textContent = 'Main List (' + items.length + ')';
      });
    }

    // Edit mode
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
      changeEditMode('Exit', toggleEditClass.bind(null, items, true));
      startTouchListeners();
    }

    function exitEditMode() {
      changeEditMode('Edit', toggleEditClass.bind(null, items, false));
      stopTouchListeners();
    }

    function changeEditMode(text, toggleEditClass) {
      var update = updateText.bind(null, text);

      Promise.all([toggleTransitioning(), toggleEditClass()])
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

    function toggleEditClass(items, on) {
      return maestro.transition(() => {
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item.classList.toggle('edit', on);
        }
      }, items[0], 'transitionend');
    }

    function startTouchListeners() {
      var list = document.querySelector('ul');
      list.addEventListener('touchstart', liTouchStart);
      list.addEventListener('touchmove', liTouchMove);
      list.addEventListener('touchend', liTouchEnd);
    }

    function stopTouchListeners() {
      var list = document.querySelector('ul');
      list.removeEventListener('touchstart', liTouchStart);
      list.removeEventListener('touchmove', liTouchMove);
      list.removeEventListener('touchend', liTouchEnd);
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

        li.style.transform = 'translateY(' + delta + 'px)';
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
      var position = parseInt(li.style.top);
      var taintedPosition = position + parseInt(li.dataset.taintedPosition);
      var newPosition = position;
      visibleItems.forEach(function(item) {
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
        li.style.transform = 'translateY(' + (newPosition - position) + 'px)';
      }, li, 'transitionend', duration)
    }

    function commitToDocument(li) {
      return maestro.mutation(() => {
        var index = items.indexOf(li);
        var list = li.parentNode;

        var firstDown = list.querySelector('li[data-taint="down"]');
        if (firstDown) {
          list.insertBefore(li, firstDown);
          items.splice(index, 1);
          var newIndex = items.indexOf(firstDown);
          items.splice(newIndex, 0, li);
        }

        var ups = list.querySelectorAll('li[data-taint="up"]');
        var lastUp = ups.length && ups[ups.length - 1];
        if (lastUp) {
          var nextSibling = lastUp.nextSibling;
          list.insertBefore(li, nextSibling);
          items.splice(index, 1);
          if (nextSibling) {
            var newIndex = items.indexOf(nextSibling);
            items.splice(newIndex, 0, li);
          } else {
            items.push(li);
          }
        }

        li.dataset.taintedPosition = '';

        visibleItems.forEach(function(item) {
          item.style.transition = '';
          item.style.transform = '';
          item.dataset.taint = '';
        });
        placeItems(true /* moved */);
        updateVisibleItems();
      });
    }

    function rearrange(li, delta) {
      var index = visibleItems.indexOf(li);
      if (index < 0) {
        return;
      }

      var position = parseInt(li.style.top) + delta + itemHeight / 2;

      var moveDownTransform = 'translateY(' + itemHeight + 'px)';
      var moveUpTransform = 'translateY(-' + itemHeight + 'px)';
      var toMoveDown = []
      var toMoveUp = [];
      var toReset = [];
      for (var i = 0; i < visibleItems.length; i++) {
        if (i === index) {
          continue;
        }

        var item = visibleItems[i];
        var itemCenter = parseInt(item.style.top) + itemHeight / 2;
        if (item.transform == moveDownTransform) {
          itemCenter += itemHeight;
        }
        if (item.transform == moveUpTransform) {
          itemCenter -= itemHeight;
        }
        if (i < index) {
          if (position < itemCenter) {
            if (item.style.transform != moveDownTransform) {
              toMoveDown.push(item);
            }
          } else {
            if (item.style.transform == moveDownTransform) {
              toReset.push(item);
            }
          }
        }
        if (i > index) {
          if (position > itemCenter) {
            if (item.style.transform != moveUpTransform) {
              toMoveUp.push(item);
            }
          } else {
            if (item.style.transform == moveUpTransform) {
              toReset.push(item);
            }
          }
        }
      }

      var diff = [
        { items: toMoveDown, transform: moveDownTransform, taint: 'down' },
        { items: toMoveUp, transform: moveUpTransform, taint: 'up' },
        { items: toReset, transform: '', taint: '' }
      ]

      diff.forEach(function(work) {
        if (!work.items.length) {
          return
        }

        maestro.transition(() => {
          work.items.forEach(function(item) {
            item.style.transition = 'transform 0.25s ease';
            item.style.transform = work.transform;
            item.dataset.taint = work.taint;
          });
        }, work.items[0], 'transitionend');
      });
    }
  });

  // Template
  function makeListItem(prefix) {
    prefix = prefix || '';
    var li = document.createElement('li');
    var title = document.createElement('h3');
    title.textContent = prefix + ' Bacon ipsum dolor ' +
                        Date.now().toString().slice(7, -1);
    var content = document.createElement('p');
    content.textContent = 'Turkey biltong pig boudin kevin filet mignon drums.';

    li.appendChild(title);
    li.appendChild(content);

    var editOverlay = document.createElement('div');
    editOverlay.classList.add('overlay');
    var cursor = document.createElement('div');
    cursor.classList.add('cursor');
    cursor.textContent = '↕︎';
    editOverlay.appendChild(cursor);

    li.appendChild(editOverlay);

    return li;
  }
})();
