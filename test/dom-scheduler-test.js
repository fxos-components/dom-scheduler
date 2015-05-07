/*global sinon, suite, setup, teardown, test, DomScheduler */
suite('DomScheduler', function() {
  'use strict';

  var rafID = 42;

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.clock = this.sinon.useFakeTimers();
    this.subject = new DomScheduler();

    this.sinon.stub(window, 'requestAnimationFrame').returns(rafID);
    this.sinon.stub(window, 'cancelAnimationFrame', function() {
      window.requestAnimationFrame.restore();
      this.sinon.stub(window, 'requestAnimationFrame').returns(rafID + 1);
    }.bind(this));

    var clock = this.clock;
    this.fakeDirect = function(callback) {
      return function() {
        callback();
        clock.tick(10);
      };
    };

    this.fakeTransition = function(callback, elm, transition) {
      return function() {
        callback();
        clock.tick(1);
        if (transition) {
          setTimeout(function() {
            elm.dispatchEvent(new CustomEvent('transitionend'));
          }, 250);
        }
      };
    };

    this.fakeMutation = function(callback) {
      return function() {
        callback();
        clock.tick(100);
      };
    };
  });

  teardown(function() {
    this.clock.restore();
    this.sinon.restore();
  });

  suite('Direct blocks', function() {
    test('should be scheduled inside a requestAnimationFrame', function() {
      var spy = this.sinon.spy();
      this.subject.direct(this.fakeDirect(spy));

      sinon.assert.notCalled(spy);
      window.requestAnimationFrame.yield();
      sinon.assert.calledOnce(spy);
    });

    test('should be coallesced', function() {
      var spyOne = this.sinon.spy();
      var spyTwo = this.sinon.spy();
      this.subject.direct(this.fakeDirect(spyOne));
      this.subject.direct(this.fakeDirect(spyTwo));

      sinon.assert.calledWith(window.cancelAnimationFrame, rafID);
      window.requestAnimationFrame.yield();
      sinon.assert.notCalled(spyOne);
      sinon.assert.calledOnce(spyTwo);
    });
  });

  suite('Transition blocks', function() {
    test('should resolve after transitionend', function(done) {
      var elm = document.createElement('div');
      var spy = this.sinon.spy();
      var thenSpy = this.sinon.spy();
      var block = this.fakeTransition(spy, elm, false);

      this.subject.transition(block, elm, 'transitionend')
        .then(thenSpy)
        .then(function() {
          sinon.assert.calledOnce(thenSpy);
          done();
        });

      sinon.assert.calledOnce(spy);
      sinon.assert.notCalled(thenSpy);
      elm.dispatchEvent(new CustomEvent('transitionend'));
    });

    test('should resolve after a timeout', function(done) {
      var elm = document.createElement('div');
      var spy = this.sinon.spy();
      var thenSpy = this.sinon.spy();
      var block = this.fakeTransition(spy, elm, false);

      this.subject.transition(block, elm, 'transitionend')
        .then(thenSpy)
        .then(function() {
          sinon.assert.calledOnce(thenSpy);
          done();
        });

      sinon.assert.calledOnce(spy);
      sinon.assert.notCalled(thenSpy);
      this.clock.tick(350);
    });
  });

  suite('Mutation blocks', function() {
    test('should resolve after execution', function(done) {
      var spy = this.sinon.spy();
      var block = this.fakeMutation(spy);
      this.subject.mutation(block)
        .then(function() {
          sinon.assert.calledOnce(spy);
          done();
        });
    });
  });
});
