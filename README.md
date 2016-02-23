# dom-scheduler [![](https://travis-ci.org/fxos-components/dom-scheduler.svg)](https://travis-ci.org/fxos-components/dom-scheduler)

The DOM is fast, layout is fast, CSS transitions are smooth; but doing any at the same time can cause nasty performance glitches. This explains why it's easy to demo a 60fps transition, but larger apps are often janky.

`dom-scheduler` helps express the types of operation you're doing, and in which order. Under the hood `dom-scheduler` ensures everything happens with the **best perceived performance**.

## Installation

```bash
$ npm install dom-scheduler
```

## Usage

```html
<script src="node_modules/dom-scheduler/dom-scheduler.js"></script>
```

## Concept

This project has **2 main goals**:

- Preventing trivial DOM changes in some unrelated part of your code from ruining a transition.
- Enabling developers to easily express the ideal sequence for a change happening in phases (with Promise chains).

### Operations types by priority

- `scheduler.attachDirect()` - Responding to long interactions
- `scheduler.feedback()` - Showing feedback to quick interaction
- `scheduler.transition()` - Animations/transitions
- `scheduler.mutation()` - Mutating the DOM

#### What type of operation should I use?

As a rule of thumb

- Anything that takes more than 16ms (including engine work) should be kept out of direct blocks
- `.feedback()` and `.transition()` blocks should mainly contain hardware accelerated CSS transitions/animations
- In mutation blocks, anything goes

Using debug mode with a browser timeline profiler can help you spot issues (eg. a feedback block causing a reflow). You can always refer to the excellent [csstriggers.com](http://csstriggers.com/) while writing new code.

### What's a typical ideal sequence?

Let's take a simple example like adding an item at the top of a list. To do that smoothly we want to:

- `.transition()` everything down to make room for the new item
- `.mutation()` to insert the new item into the DOM (outside of the viewport, so the item doesn't flash on screen)
- `.transition()` the new item in the viewport

Without `dom-scheduler` this means:

```js
setupTransitionOnElements();
container.addEventListener('transitionend', function trWait() {
  container.removeEventListener('transitionend');
  writeToTheDOM();
  setupTransitionOnNewElement();
  el.addEventListener('transitionend', function stillWaiting() {
    el.removeEventListener('transitionend', stillWaiting);
    cleanUp();
  });
});
```

But we'd rather use promises to express this kind of sequence:

```js
pushDown(elements)
  .then(insertInDocument)
  .then(slideIn)
  .then(cleanUp)
```

Another badass sequence, using a promise-based storage system might be
something like

```js
Promise.all([reflectChangeWithTransitions(), persistChange()])
  .then(reflectChangeInDocument)
  .then(cleanUp)
```

- `reflectChangeWithTransition()` is a scheduled transition
- `persitChange()` is your backend call
- `reflectChangeInDocument` is a scheduled mutation
- `cleanUp` is a scheduled mutation

## Adopting dom-scheduler

To reap all the benefits from the scheduled approach you want to

- _"annotate"_ a maximum of your code, especially the mutations
- use the shared scheduler instance (exported as `scheduler`)
- use the debug mode (see below)

## API

### scheduler.attachDirect()

Direct blocks should be used for direct manipulation (touchevents,
scrollevents...). As such they have the **highest priority**.

You _"attach"_ a direct block to a specific event. The scheduler takes care of adding and removing event listeners. The event object will be passed to the `block` as the first parameter.

#### Attaching a handler

```js
scheduler.attachDirect(elm, evt, block)
```

#### Detaching a handler

```js
scheduler.detachDirect(elm, evt, block)
```

#### Example

```js
scheduler.attachDirect(el, 'touchmove', evt => {
  el.style.transform = computeTransform(evt);
});
```

### scheduler.feedback()

```js
scheduler.feedback(block, elm, evt, timeout)
```

Feedback blocks should be used to encapsulate CSS transitions/animations triggered in direct response to a user interaction (eg. button pressed state).

They will be protected from `scheduler.mutation()`s to perform smoothly and
return a promise, fulfilled once `evt` is received on `elm` or after `timeout`ms.

The `scheduler.feedback()` has the same priority as `scheduler.attachDirect()`.

```js
scheduler.feedback(() => {
  el.classList.add('pressed');
}, el, 'transitionend').then(() => {
  el.classList.remove('pressed');
});
```

### scheduler.transition()

```js
scheduler.transition(block, elm, evt, timeout);
```

`scheduler.transition()` should be used to protect CSS transitions/animations. When in progress they prevent any scheduled `scheduler.mutation()` tasks running to maintain a smooth framerate. They return a promise, fulfilled once `evt` is received on `elm` or after `timeout`ms.

```js
scheduler.transition(() => {
  el.style.transition = 'transform 0.25s ease';
  el.classList.remove('new');
}, el, 'transitionend').then(() => {
  el.style.transition = '';
});
```

### scheduler.mutation()

```js
scheduler.mutation(block);
```

Mutations blocks should be used to write to the DOM or perform actions requiring layout to be computed.

**We shoud always aim for the document to be (almost) visually identical _before_ and _after_ a mutation block. Any big change in layout/size will cause a flash/jump.**

`scheduler.mutation()` blocks might be delayed (eg. when a `scheduler.transition()` is in progress). They return a promise, fullfilled once the task is eventually executed; this also allows chaining.

When used for measurement (eg. `getBoundingClientRect()`) a block can `return` a result that will be propagated through the promise chain.

```js
scheduler.mutation(() => {
  el.textContent = 'Main List (' + items.length + ')';
});
```

## Scheduling heuristics (TBD)
  - `.direct()` blocks are called inside `requestAnimationFrame`
  - `.attachDirect()` and `.feedback()` blocks have the highest priority and delay the rest.
  - `.transition()` delays executuon of `.mutation()` tasks.
  - `.transition()`s are postponed while delayed `mutation()`s are being flushed
  - When both `.transition()`s and `.mutation()`s are queued because of `.attachDirect()`
    manipulation, `.transition()`s are run first

## Debug mode

While it can have a negative impact on performance, it's recommended to turn the debug mode on from time to time during development to catch frequent mistakes early on.

Currently the debug mode will warn you about

- Transition block for which we never get an "end" event
- Direct blocks taking longer than 16ms

We're also using `console.time` / `console.timeEnd` to flag the
following in the profiler:
- `animating`, when a feedback or transition is ongoing
- `protecting`, when a direct protection window is ongoing

You can turn on the debug mode by setting `debug` to `true` in [`dom-scheduler.js`](dom-scheduler.js).

## Demo APP

To illustrate the benefits of the scheduling approach the project comes with a demo app: a **big** re-orderable (virtual) list where new content comes in every few seconds. At random, the data source will sometime simulate a case where the content isn't ready. And delay populating the content.

The interesting part is of course the _"real life"_ behaviors:
  - when new content comes in while scrolling
  - when the edit mode is toggled while the system is busy scrolling
  - when anything happens during a re-order manipulation

_(You can turn on the `naive` flag in [`dom-scheduler.js`](dom-scheduler.js) to disable scheduling and compare.)_

### Web page version

The `index.html` at the root of this repository is meant for broad device and browser testing so we try to keep gecko/webkit/blink compatibility.

A (potentially outdated) version of the demo is usually accessible at [http://sgz.fr/ds](http://sgz.fr/ds) and should work on any modern browser.

### Packaged version

The `examples/demo` is a 'certified' packaged-app where we experiment with web components and other stuff.

## Tests

1. `$ npm install`
2. `$ npm test`

If you would like tests to run on file change use:

`$ npm run test-dev`

## Lint check

Run lint check with command:

`$ npm run lint`

## License

Mozilla Public License 2.0

http://mozilla.org/MPL/2.0/
