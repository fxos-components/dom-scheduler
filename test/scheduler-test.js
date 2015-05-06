/*global sinon, assert, suite, setup, teardown, test */
suite('DomScheduler', function() {
  'use strict';

  setup(function() {
    this.sinon = sinon.sandbox.create();
  });

  teardown(function() {
    this.sinon.restore();
  });

  test('First test', function() {
    assert.isTrue(true);
  });
});
