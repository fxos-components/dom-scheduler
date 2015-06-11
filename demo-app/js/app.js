(function() {
  var debug = false;
  var headerHeight = 50;
  var maxItemCount = 28;

  window.addEventListener('load', function() {
    var listContainer = document.querySelector('section');

    var maestro = new DomScheduler();
    var source = new BaconSource();
    var list = new ScheduledList(listContainer, source, maestro);
    var dialog = document.querySelector('gaia-dialog-alert');

    function updateHeader() {
      return maestro.mutation(function() {
        var h1 = document.querySelector('h1');
        h1.textContent = 'Main List (' + source.fullLength() + ')';
        h1.scrollTop; // flush
      });
    }
    updateHeader();

    function clearNewIndicator() {
      var h1After = document.querySelector('#h1-after');

      if (h1After.dataset.anim == 'reveal') {
        maestro.transition(function() {
          h1After.dataset.anim = 'hide';
        }, h1After, 'animationend');
      }
    }
    listContainer.addEventListener('top-reached', clearNewIndicator);

    function updateNewIndicator() {
      var h1After = document.querySelector('#h1-after');
      if (h1After.dataset.anim == 'reveal') {
        return;
      }

      maestro.transition(function() {
        h1After.dataset.anim = 'reveal';
      }, h1After, 'animationend');
    }
    listContainer.addEventListener('hidden-new-content', updateNewIndicator);

    function openGaiaDialog(evt) {
      var detail = evt.detail;
      var li = source.getRecordAt(detail.index);
      dialog.textContent = li.title + ' item clicked!';
      dialog.open(detail.clickEvt);
    }
    list.list.addEventListener('item-selected', openGaiaDialog);

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
    button.addEventListener('touchend', function() {
      Promise.all([toggleTransitioning(), list.toggleEditMode()])
        .then(updateText)
        .then(toggleTransitioning);
    });

    function updateText(text) {
      return maestro.mutation(function() {
        button.textContent = list.editing ? 'Exit' : 'Edit';
      });
    }

    function toggleTransitioning() {
      return maestro.feedback(function() {
        button.classList.toggle('transitioning');
      }, button, 'transitionend');
    }

    var dependencies = ['gaia-dialog/gaia-dialog.js',
      'gaia-dialog/gaia-dialog-alert.js'];

    function loadDependecies() {
      LazyLoader.load(dependencies, () => {
        var gaiaDialogElements = document.querySelectorAll('gaia-dialog-alert');
        Array.prototype.forEach.call(gaiaDialogElements, elm => {
            elm.attachBehavior(maestro);
        });
      });
    }

    loadDependecies();
  });
})();
