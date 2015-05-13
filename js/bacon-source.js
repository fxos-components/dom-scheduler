(function(exports) {
  var itemHeight = 88;
  var listSize = 1042;

  function makeContent(prefix) {
    return {
      title: prefix + ' Bacon ipsum dolor ' +
             Date.now().toString().slice(7, -1),
      body: 'Turkey biltong pig boudin kevin filet de mignon drums ' + prefix + '.'
    }
  }

  // TODO: instantiante and pass this to a list component
  exports.BaconSource = function BaconSource() {
    this.content = [];

    for (var i = 0; i < listSize; i++) {
      this.content.push(makeContent(i));
    }
  };

  exports.BaconSource.prototype = {
    recordAtIndex: function(i) {
      return this.content[i];
    },

    populateItem: function(item, i) {
      var title = item.firstChild;
      var body = title.nextSibling;
      var record = this.content[i];

      title.firstChild.data = record.title;
      body.firstChild.data = record.body;

      if (record.toSlide) {
        item.dataset.toSlide = true;
      } else if (item.dataset.toSlide) {
        delete item.dataset.toSlide;
      }
    },

    indexAtPosition: function(pos) {
      return Math.min(this.content.length - 1,
                      Math.max(0,
                               Math.floor(pos / itemHeight)));
    },

    positionForIndex: function(i) {
      return i * itemHeight;
    },

    fullLength: function() {
      return this.content.length;
    },

    itemHeight: function() {
      return itemHeight;
    },

    fullHeight: function() {
      return this.content.length * itemHeight;
    },

    insertAtIndex: function(index, record) {
      this.content.splice(index, 0, record);
    },

    replaceAtIndex: function(index, record) {
      this.content.splice(index, 1, record);
    },

    removeAtIndex: function(index) {
      return this.content.splice(index, 1)[0];
    }
  };
})(window);

