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
  });
})();
