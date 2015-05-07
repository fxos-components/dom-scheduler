(function(exports) {
  var itemHeight = 87;
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

  // TODO: instantiante and pass this to a list component
  exports.datasource = {
    recordAtIndex: function(i) {
      return content[i];
    },

    indexAtPosition: function(pos) {
      return Math.min(content.length - 1,
                      Math.max(0,
                               Math.floor(pos / itemHeight)));
    },

    positionForIndex: function(i) {
      return i * itemHeight;
    },

    fullLength: function() {
      return content.length;
    },

    fullHeight: function() {
      return content.length * itemHeight;
    },

    insertAtIndex: function(index, record) {
      content.splice(index, 0, record);
    },

    replaceAtIndex: function(index, record) {
      content.splice(index, 1, record);
    },

    removeAtIndex: function(index) {
      return content.splice(index, 1)[0];
    }
  };
})(window);

