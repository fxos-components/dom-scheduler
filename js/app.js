(function() {
  var debug = false;
  var headerHeight = 50;
  var maxItemCount = 28;

  window.addEventListener('load', function() {
    var listContainer = document.querySelector('section');

    var maestro = new DomScheduler();
    var source = new BaconSource();
    var list = new ScheduledList(listContainer, source, maestro);

    function updateHeader() {
      return maestro.mutation(function() {
        var h1 = document.querySelector('h1');
        h1.textContent = 'Main List (' + source.fullLength() + ')';
      });
    }
    updateHeader();

    function clearNewIndicator() {
      var h1After = document.querySelector('#h1-after');

      if (h1After.classList.contains('new')) {
        maestro.transition(function() {
          h1After.classList.remove('new');
        }, h1After, 'transitionend');
      }
    }
    listContainer.addEventListener('top-reached', clearNewIndicator);

    function updateNewIndicator() {
      var h1After = document.querySelector('#h1-after');
      maestro.transition(function() {
        h1After.classList.add('new');
      }, h1After, 'transitionend');
    }
    listContainer.addEventListener('hidden-new-content', updateNewIndicator);

    function newContentHandler() {
      var newContent = {
        title: 'NEW Bacon ' + Date.now().toString().slice(7, -1),
        body: 'Turkey BLT please.'
      };

      source.insertAtIndex(0, newContent);
      list.insertedAtIndex(0);

      updateHeader();
    }

    setInterval(newContentHandler, 15000);
    window.addEventListener('new-content', newContentHandler);

    window.pushNewContent = function() {
      window.dispatchEvent(new CustomEvent('new-content'));
    };

    var button = document.querySelector('button');
    button.addEventListener('click', function() {
      toggleTransitioning()
        .then(list.toggleEditMode.bind(list))
        .then(updateText)
        .then(toggleTransitioning);
    });

    function updateText(text) {
      return maestro.mutation(function() {
        button.textContent = list.editing ? 'Exit' : 'Edit';
      });
    }

    function toggleTransitioning() {
      return maestro.transition(function() {
        button.classList.toggle('transitioning');
      }, button, 'transitionend', 300, true /* feedback */);
    }

    return;
    // TODO

    // Reordering support
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

      maestro.direct(function() {
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
