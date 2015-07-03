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

  exports.BaconSource = function BaconSource() {
    this.content = [];

    for (var i = 0; i < listSize; i++) {
      this.content.push(makeContent(i));
    }
  };

  exports.BaconSource.prototype = {
    populateItem: function(item, i) {
      // Simulates the data source not being ready to populate
      if (parseInt(Date.now() / 10) % 8 === 0) {
        return new Promise(function(resolve, reject) {
          setTimeout(resolve, Math.random() * 1000);
        });
      }

      var title = item.firstChild;
      var body = title.nextSibling;
      var record = this.content[i];

      title.firstChild.data = record.title;
      body.firstChild.data = record.body;
    },

    getRecordAt: function(index) {
      return this.content[index];
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

