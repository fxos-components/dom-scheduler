/*global sinon, suite, setup, teardown, test, DomScheduler, assert */
suite('DomScheduler >', function() {
  'use strict';

  var rafID = 42;

  var fakeTransitionCost = 1;
  var fakeTransitionDuration = 250;
  var fakeDirectCost = 10;
  var fakeMutationCost = 100;
  var directProtectionDuration = 300;

  function fakeTransition(clock, callback, elm, transition) {
    return function() {
      callback();
      clock.tick(fakeTransitionCost);
      if (transition) {
        setTimeout(function() {
          elm.dispatchEvent(new CustomEvent('transitionend'));
        }, fakeTransitionDuration);
      }
    };
  }

  function fakeDirect(clock, callback) {
    return function() {
      callback();
      clock.tick(fakeDirectCost);
    };
  }

  function fakeMutation(clock, callback) {
    return function() {
      callback();
      clock.tick(fakeMutationCost);
    };
  }

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.sinon.useFakeTimers();

    this.subject = new DomScheduler();

    this.sinon.stub(window, 'requestAnimationFrame').returns(rafID);
    this.sinon.stub(window, 'cancelAnimationFrame', function() {
      window.requestAnimationFrame.restore();
      this.sinon.stub(window, 'requestAnimationFrame').returns(rafID + 1);
    }.bind(this));
  });

  teardown(function() {
    this.sinon.clock.restore();
    this.sinon.restore();
  });

  suite('Direct blocks', function() {
    test('should be scheduled inside a requestAnimationFrame', function() {
      var spy = this.sinon.spy();
      this.subject.direct(fakeDirect(this.sinon.clock, spy));

      sinon.assert.notCalled(spy);
      window.requestAnimationFrame.yield();
      sinon.assert.calledOnce(spy);
    });

    test('should be coallesced', function() {
      var clock = this.sinon.clock;
      var spyOne = this.sinon.spy();
      var spyTwo = this.sinon.spy();
      this.subject.direct(fakeDirect(clock, spyOne));
      this.subject.direct(fakeDirect(clock, spyTwo));

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
      var block = fakeTransition(this.sinon.clock, spy, elm, false);

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
      var clock = this.sinon.clock;
      var elm = document.createElement('div');
      var spy = this.sinon.spy();

      var thenSpy = this.sinon.spy();
      var block = fakeTransition(clock, spy, elm, false);

      this.subject.transition(block, elm, 'transitionend')
        .then(thenSpy)
        .then(function() {
          sinon.assert.calledOnce(thenSpy);
          done();
        });

      sinon.assert.calledOnce(spy);
      sinon.assert.notCalled(thenSpy);
      clock.tick(350);
    });
  });

  suite('Mutation blocks', function() {
    test('should resolve after execution', function(done) {
      var spy = this.sinon.spy();
      var block = fakeMutation(this.sinon.clock, spy);
      this.subject.mutation(block)
        .then(function() {
          sinon.assert.calledOnce(spy);
          done();
        });
    });
  });

  suite('Scheduling >', function() {
    test('should protect direct from transitions', function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      window.requestAnimationFrame.yield();

      var tr = fakeTransition(clock, function() {
        assert.equal(fakeDirectCost + directProtectionDuration, Date.now(),
                     'transition block executed last');
        done();
      }, elm, true);
      this.subject.transition(tr, elm, 'transitionend');

      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(fakeDirectCost, Date.now(),
                     'second direct block executed after');
      }));
      window.requestAnimationFrame.yield();

      clock.tick(directProtectionDuration);
    });

    test('should give feedbacks the same priority than direct blocks',
    function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      window.requestAnimationFrame.yield();

      var tr = fakeTransition(clock, function() {
        assert.equal(0, Date.now(), 'feedback block executed next');
      }, elm, true);
      this.subject.transition(tr, elm, 'transitionend', true);

      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(fakeDirectCost, Date.now(),
                     'second direct block executed last');
        done();
      }));
      window.requestAnimationFrame.yield();
    });

    test('should protect direct blocks from mutations', function(done) {
      var clock = this.sinon.clock;
      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      window.requestAnimationFrame.yield();

      this.subject.mutation(fakeMutation(clock, function() {
        assert.equal(fakeDirectCost + directProtectionDuration, Date.now(),
                     'mutation block executed last');
        done();
      }));

      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(fakeDirectCost, Date.now(),
                     'second direct block executed after');
      }));
      window.requestAnimationFrame.yield();
      clock.tick(directProtectionDuration);
    });

    test('should protect transitions from mutations', function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      var firstTransitionBlock = fakeTransition(clock, function() {
        assert.equal(0, Date.now(),
                     'first transition block executed right away');
      }, elm, true);
      this.subject.transition(firstTransitionBlock, elm, 'transitionend');

      this.subject.mutation(fakeMutation(clock, function() {
        assert.equal(fakeTransitionDuration + fakeTransitionCost, Date.now(),
                     'mutation block executed last');
        done();
      }));

      var secondTransitionBlock = fakeTransition(clock, function() {
        assert.equal(fakeTransitionCost, Date.now(),
                     'second transition block executed right after');
      }, elm, true);
      this.subject.transition(secondTransitionBlock, elm, 'transitionend');

      clock.tick(fakeTransitionDuration);
    });

    test('should delay transitions during mutations flush', function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');
      var subject = this.subject;

      subject.direct(fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      window.requestAnimationFrame.yield();

      var tr = fakeTransition(clock, function() {
        assert.equal(directProtectionDuration + fakeMutationCost,
                     Date.now(), 'transition block executed after the flush');
        done();
      }, elm, true);

      subject.mutation(fakeMutation(clock, function() {
        assert.equal(directProtectionDuration, Date.now(),
                     'mutation block executed next');

        subject.transition(tr, elm, 'transitionend');
      })).then(function() {
        clock.tick(1); // to dequeue transitions
      });

      clock.tick(directProtectionDuration);
    });

    test('should dequeue transitions before mutations after a direct',
    function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      this.subject.direct(fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      window.requestAnimationFrame.yield();

      this.subject.mutation(fakeMutation(clock, function() {
        assert.equal(directProtectionDuration + fakeTransitionDuration,
                     Date.now(), 'mutation block executed last');
      })).then(function() {
        clock.tick(1); // to dequeue transitions
      });

      var tr = fakeTransition(clock, function() {
        assert.equal(directProtectionDuration,
                     Date.now(), 'transition block executed next');
        done();
      }, elm, true);
      this.subject.transition(tr, elm, 'transitionend');

      clock.tick(directProtectionDuration);
    });
  });

  suite('Chaining >', function() {
    test('should support sequence chaining', function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      // transition...
      var firstTransitionBlock = fakeTransition(clock, function() {
        assert.equal(0, Date.now(), 'first transition executed right away');
      }, elm, true);

      // transition...mutation...
      var firstMutation = fakeMutation(clock, function() {
        assert.equal(fakeTransitionDuration + 1, Date.now(),
                     'firs mutation executed after transition');
      });

      // transition...mutation...transition...
      var secondTransitionBlock = fakeTransition(clock, function() {
        assert.equal(fakeTransitionDuration + 1 + fakeMutationCost, Date.now(),
                     'seond transition executed after mutation');
      }, elm, true);

      // transition...mutation...transition...mutation
      var secondMutation = fakeMutation(clock, function() {
        assert.equal(fakeTransitionDuration * 2 + 2 + fakeMutationCost,
                     Date.now(),
                     'seond transition executed after mutation');
        done();
      });

      var makeRoom = function() {
        var tr = this.subject.transition(firstTransitionBlock, elm,
                                         'transitionend');
        clock.tick(fakeTransitionDuration);
        return tr;
      }.bind(this);

      var writeToDom = function() {
        return this.subject.mutation(firstMutation);
      }.bind(this);

      var slideIn = function() {
        var tr = this.subject.transition(secondTransitionBlock, elm,
                                         'transitionend');
        clock.tick(fakeTransitionDuration);
        return tr;
      }.bind(this);

      var cleanUp = function() {
        return this.subject.mutation(secondMutation);
      }.bind(this);


      makeRoom()
        .then(writeToDom)
        .then(slideIn)
        .then(cleanUp);
    });
  });
});
