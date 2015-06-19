/*global sinon, suite, setup, teardown, test, DomScheduler, assert */

suite('DomScheduler >', function() {
  'use strict';

  var rafID = 42;

  var fakeTransitionCost = 1;
  var fakeTransitionDuration = 250;
  var fakeDirectCost = 10;
  var fakeMutationCost = 100;
  var directProtectionDuration = 260;

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
    suite('Attaching', function() {
      test('should add the event listener for the first block', function() {
        var elm = document.createElement('div');
        var addEventSpy = this.sinon.spy(elm, 'addEventListener');

        this.subject.attachDirect(elm, 'touchmove', this.sinon.spy());
        this.subject.attachDirect(elm, 'touchmove', this.sinon.spy());

        sinon.assert.calledOnce(addEventSpy);
        sinon.assert.calledWith(addEventSpy, 'touchmove', this.subject);
      });

      test('should be scheduled inside a requestAnimationFrame', function() {
        var elm = document.createElement('div');
        var spy = this.sinon.spy();

        this.subject.attachDirect(elm, 'touchmove', spy);

        elm.dispatchEvent(new CustomEvent('touchmove'));

        sinon.assert.notCalled(spy);
        window.requestAnimationFrame.yield();
        sinon.assert.calledOnce(spy);
      });

      test('should pass the event as parameter to the block', function() {
        var elm = document.createElement('div');
        var spy = this.sinon.spy();

        this.subject.attachDirect(elm, 'touchmove', spy);

        var evt = new CustomEvent('touchmove');
        elm.dispatchEvent(evt);
        window.requestAnimationFrame.yield();

        sinon.assert.calledWith(spy, evt);
      });

      test('should be triggered by a bubbling event', function() {
        var elm = document.createElement('div');
        var child = document.createElement('span');
        elm.appendChild(child);
        document.body.appendChild(elm);
        var spy = this.sinon.spy();

        this.subject.attachDirect(elm, 'touchmove', spy);

        child.dispatchEvent(new CustomEvent('touchmove', {
          bubbles: true
        }));
        window.requestAnimationFrame.yield();

        sinon.assert.calledOnce(spy);
      });

      test('should be coallesced', function() {
        var elm = document.createElement('div');
        var clock = this.sinon.clock;

        var directCallCount = 0;
        this.subject.attachDirect(elm, 'scroll', fakeDirect(clock, function() {
          directCallCount++;
        }));

        elm.dispatchEvent(new CustomEvent('scroll'));
        elm.dispatchEvent(new CustomEvent('scroll'));

        sinon.assert.calledWith(window.cancelAnimationFrame, rafID);
        window.requestAnimationFrame.yield();

        assert.equal(directCallCount, 1);
      });

      test('should support multiple handlers for the same event', function() {
        var elm = document.createElement('div');
        var scrollSpy = this.sinon.spy();
        var otherScrollSpy = this.sinon.spy();

        this.subject.attachDirect(elm, 'scroll', scrollSpy);
        this.subject.attachDirect(elm, 'scroll', otherScrollSpy);

        elm.dispatchEvent(new CustomEvent('scroll'));
        elm.dispatchEvent(new CustomEvent('scroll'));

        sinon.assert.calledOnce(window.cancelAnimationFrame);

        window.requestAnimationFrame.yield();
        sinon.assert.calledOnce(scrollSpy);
        sinon.assert.calledOnce(otherScrollSpy);
      });

      test('should not coallesce different handlers together', function() {
        var elm = document.createElement('div');
        var moveSpy = this.sinon.spy();
        var scrollSpy = this.sinon.spy();

        this.subject.attachDirect(elm, 'scroll', scrollSpy);
        this.subject.attachDirect(elm, 'touchmove', moveSpy);

        elm.dispatchEvent(new CustomEvent('scroll'));
        elm.dispatchEvent(new CustomEvent('touchmove'));

        sinon.assert.notCalled(window.cancelAnimationFrame);

        window.requestAnimationFrame.yield();
        sinon.assert.calledOnce(scrollSpy);
        sinon.assert.calledOnce(moveSpy);
      });
    });

    suite('Detaching', function() {
      test('should remove the event listener when the last block is removed',
      function() {
        var elm = document.createElement('div');
        var removeEventSpy = this.sinon.spy(elm, 'removeEventListener');
        var spyOne = this.sinon.spy();
        var spyTwo = this.sinon.spy();

        this.subject.attachDirect(elm, 'touchmove', spyOne);
        this.subject.attachDirect(elm, 'touchmove', spyTwo);

        this.subject.detachDirect(elm, 'touchmove', spyOne);
        sinon.assert.notCalled(removeEventSpy);
        this.subject.detachDirect(elm, 'touchmove', spyTwo);
        sinon.assert.calledOnce(removeEventSpy);
        sinon.assert.calledWith(removeEventSpy, 'touchmove', this.subject);
      });

      test('should cancel any pending animation frames requests', function() {
        var elm = document.createElement('div');
        var spy = this.sinon.spy();

        this.subject.attachDirect(elm, 'touchmove', spy);

        elm.dispatchEvent(new CustomEvent('touchmove'));
        sinon.assert.notCalled(spy);

        this.subject.detachDirect(elm, 'touchmove', spy);
        sinon.assert.calledOnce(window.cancelAnimationFrame, 42);
      });

      test('should continue triggering after a remove', function() {
        var elm = document.createElement('div');
        var scrollSpy = this.sinon.spy();
        var otherScrollSpy = this.sinon.spy();

        this.subject.attachDirect(elm, 'scroll', scrollSpy);
        this.subject.attachDirect(elm, 'scroll', otherScrollSpy);

        elm.dispatchEvent(new CustomEvent('scroll'));
        window.requestAnimationFrame.yield();

        sinon.assert.calledOnce(scrollSpy);
        sinon.assert.calledOnce(otherScrollSpy);

        this.subject.detachDirect(elm, 'scroll', otherScrollSpy);

        elm.dispatchEvent(new CustomEvent('scroll'));
        window.requestAnimationFrame.yield();

        sinon.assert.calledTwice(scrollSpy);
        sinon.assert.calledOnce(otherScrollSpy);
      });
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
      clock.tick(500);
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

      var directCallCount = 0;
      this.subject.attachDirect(elm, 'touchmove', fakeDirect(clock, function() {
        switch (directCallCount) {
          case 0:
            assert.equal(0, Date.now(), 'first direct executed right away');
            break;
          case 1:
            assert.equal(fakeDirectCost, Date.now(),
                         'second direct executed after');
            break;
        }
        directCallCount++;
      }));

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();

      var tr = fakeTransition(clock, function() {
        assert.equal(fakeDirectCost + directProtectionDuration, Date.now(),
                     'transition block executed last');
        assert.equal(directCallCount, 2);
        done();
      }, elm, true);
      this.subject.transition(tr, elm, 'transitionend');

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();

      clock.tick(directProtectionDuration);
    });

    test('should stop direct protection on detach', function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      var directCallCount = 0;
      var directHandler = fakeDirect(clock, function() {
        switch (directCallCount) {
          case 0:
            assert.equal(0, Date.now(), 'first direct executed right away');
            break;
          case 1:
            assert.equal(fakeDirectCost, Date.now(),
                         'second direct executed after');
            break;
        }
        directCallCount++;
      });

      this.subject.attachDirect(elm, 'touchmove', directHandler);

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();

      var tr = fakeTransition(clock, function() {
        assert.equal(fakeDirectCost * 2, Date.now(),
                     'transition block executed last');
        assert.equal(directCallCount, 2);
        done();
      }, elm, true);
      this.subject.transition(tr, elm, 'transitionend');

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();

      this.subject.detachDirect(elm, 'touchmove', directHandler);
    });

    test('should give feedbacks the same priority than direct blocks',
    function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      var directCallCount = 0;
      this.subject.attachDirect(elm, 'touchmove', fakeDirect(clock, function() {
        switch (directCallCount) {
          case 0:
            assert.equal(0, Date.now(), 'first direct executed right away');
            break;
          case 1:
            assert.isTrue(feedbackExecuted);
            assert.equal(fakeDirectCost + fakeTransitionCost, Date.now(),
                         'second direct executed last');
            done();
            break;
        }
        directCallCount++;
      }));

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();

      var feedbackExecuted = false;
      var tr = fakeTransition(clock, function() {
        assert.equal(fakeDirectCost, Date.now(),
                     'feedback block executed next');
        feedbackExecuted = true;
      }, elm, true);
      this.subject.feedback(tr, elm, 'transitionend');

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();
    });

    test('should protect direct blocks from mutations', function(done) {
      var clock = this.sinon.clock;
      var elm = document.createElement('div');

      var directCallCount = 0;
      this.subject.attachDirect(elm, 'touchmove', fakeDirect(clock, function() {
        switch (directCallCount) {
          case 0:
            assert.equal(0, Date.now(), 'first direct executed right away');
            break;
          case 1:
            assert.equal(fakeDirectCost, Date.now(),
                         'second direct executed after');
            break;
        }
        directCallCount++;
      }));

      elm.dispatchEvent(new CustomEvent('touchmove'));
      window.requestAnimationFrame.yield();

      this.subject.mutation(fakeMutation(clock, function() {
        assert.equal(fakeDirectCost + directProtectionDuration, Date.now(),
                     'mutation block executed last');
        assert.equal(directCallCount, 2);
        done();
      }));

      elm.dispatchEvent(new CustomEvent('touchmove'));
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

      subject.attachDirect(elm, 'touchmove', fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      elm.dispatchEvent(new CustomEvent('touchmove'));
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

      this.subject.attachDirect(elm, 'scroll', fakeDirect(clock, function() {
        assert.equal(0, Date.now(), 'first direct block executed right away');
      }));
      elm.dispatchEvent(new CustomEvent('scroll'));
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
