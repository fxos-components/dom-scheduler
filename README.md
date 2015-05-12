# Dom Scheduler

## Disclaimer
This is an early proof of concept to see if the idea has some legs.

## Concept
The DOM is pretty fast, layout is pretty fast, CSS transitions are crazy
fast...but doing any two of them at the same time will cause horrible
performance glitches.

This is why it's easy to demo 60fps on a web app but real-world usage
frequently causes frame drops and other displeasures.

This project has 2 main goals:
  - Prevent trivial DOM changes from ruining transition performance by
    delaying / scheduling them better. Even if they come from different
    parts of the app.
  - Enable developers to easily express the ideal sequence for a change.

### What's a typical ideal sequence?
Let's take a dead-simple example like adding an item at the top of a list. To do
that smoothly we want to:
  - **[transition]** push everything down to make room for the new item
  - **[mutation]** insert the new item into the DOM but outside of the
    viewport (so the item doesn't flash on screen)
  - **[transition]** slide the new item in the viewport

Usually this means
```javascript
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

But of course we'd rather use promises to express this kind of sequence
like
```javascript
  pushDown(elements)
    .then(insertInDocument)
    .then(slideIn)
    .then(cleanUp)
```

Another badass sequence, granted that you use a promise-based storage
system might be something like
```javascript
Promise.all([reflectChangeWithTransitions(), persistChange()])
  .then(reflectChangeInDocument)
  .then(cleanUp)
```

## Demo APP
To illustrate the benefits of the scheduling approach the project comes
with a simple demo app: a re-orderable list where new content comes in
every few seconds.

The interesting part is of course the _"real life"_ behaviors:
  - when new content comes in while scrolling
  - when the edit mode is toggled while the system is busy scrolling
  - when anything happens during a re-order manipulation

_(You can turn on the `naive` flag in `lib/dom-scheduler.js` to disable
scheduling and compare.)_

## API

### Direct blocks
`scheduler.direct(block)`

Direct blocks should be used for direct manipulation (touchevents,
scrollevents...). As such they have the highest priority.

#### Example
```javascript
el.addEventListener('touchmove', (evt) => {
  scheduler.direct(() => {
    el.style.transform = computeTransform(evt);
  });
});
```

### Transition blocks
`scheduler.transition(block, elm, evt, timeout, feedback)`

Transitions blocks should be used to encapsulate CSS
transitions/animations.
They will be protected from DOM mutations to perform smoothly and they
return a promise fulfilled once `evt` is received or after `timeout` for
chaining.

If the `feedback` flag is set the block will have the same priority than
a _direct_ manipulation block.

#### Example
```javascript
scheduler.transition(() => {
  el.style.transition = 'transform 0.25s ease';
  el.classList.remove('new');
}, el, 'transitionend').then(() => {
  el.style.transition = '';
});
```


### Mutation blocks
`scheduler.mutation(block)`

Mutations blocks should be used to write to the DOM or perform
actions requiring a reflow that are not direct manipulations.

**We shoud always aim for the document to be almost visually identical
_before_ and _after_ a mutation block.
Any big change in layout/size will cause a flash/jump.**

Mutation blocks might be delayed (eg. during a transition) and they
return a promise fullfilled once the block got executed for chaining.

#### Example
```javascript
maestro.mutation(() => {
  el.textContent = 'Main List (' + items.length + ')';
});
```

## Scheduling heuristics (TBD)
  - `direct` blocks are encapsulated into `requestAnimationFrame`
  - `direct` blocks and `feedback transition` blocks have the highest
    priority and delay the rest
  - `transition` delays mutations
  - transitions are postponed while delayed mutations are being flushed

## Tests

1. `$ npm install`
2. `$ npm test`

If you would like tests to run on file change use:

`$ npm run test-dev`

## Lint check

Run lint check with command:

`$ npm run lint`
