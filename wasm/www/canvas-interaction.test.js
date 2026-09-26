const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { attachCanvasInteractionHandlers } = require("./canvas-interaction");

const createCanvas = () => {
  const listeners = new Map();
  return {
    width: 61,
    height: 61,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event) {
      listeners.get(type)(event);
    },
    getBoundingClientRect() {
      return { left: 10, top: 20, width: 61, height: 61 };
    },
  };
};

const createEvent = (overrides = {}) => {
  let defaultPrevented = false;
  return {
    button: 0,
    clientX: 23,
    clientY: 39,
    ctrlKey: true,
    shiftKey: false,
    timeStamp: 100,
    preventDefault() {
      defaultPrevented = true;
    },
    get defaultPrevented() {
      return defaultPrevented;
    },
    ...overrides,
  };
};

const createHarness = () => {
  const canvas = createCanvas();
  const calls = { gliders: [], pulsars: [], toggles: [], redraws: 0 };
  const universe = {
    insert_glider(row, column) {
      calls.gliders.push([row, column]);
    },
    insert_pulsar(row, column) {
      calls.pulsars.push([row, column]);
    },
    toggle_cell(row, column) {
      calls.toggles.push([row, column]);
    },
  };

  attachCanvasInteractionHandlers({
    canvas,
    universe,
    width: 10,
    height: 10,
    cellSize: 5,
    redraw: () => {
      calls.redraws += 1;
    },
  });

  return { canvas, calls };
};

describe("canvas interactions", () => {
  it("inserts one glider for a Ctrl-click context menu event", () => {
    // Given:
    const { canvas, calls } = createHarness();
    const event = createEvent();

    // When:
    canvas.dispatch("contextmenu", event);

    // Then:
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(calls.gliders, [[3, 2]]);
    assert.deepEqual(calls.toggles, []);
    assert.equal(calls.redraws, 1);
  });

  it("retains the Ctrl-click click-event path", () => {
    // Given:
    const { canvas, calls } = createHarness();
    const event = createEvent();

    // When:
    canvas.dispatch("click", event);

    // Then:
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(calls.gliders, [[3, 2]]);
    assert.deepEqual(calls.toggles, []);
    assert.equal(calls.redraws, 1);
  });

  it("toggles one cell for a click without the Control key", () => {
    // Given:
    const { canvas, calls } = createHarness();
    const event = createEvent({ ctrlKey: false });

    // When:
    canvas.dispatch("click", event);

    // Then:
    assert.equal(event.defaultPrevented, false);
    assert.deepEqual(calls.gliders, []);
    assert.deepEqual(calls.toggles, [[3, 2]]);
    assert.equal(calls.redraws, 1);
  });

  it("inserts one pulsar for a Shift-click event", () => {
    // Given:
    const { canvas, calls } = createHarness();
    const event = createEvent({ ctrlKey: false, shiftKey: true });

    // When:
    canvas.dispatch("click", event);

    // Then:
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(calls.pulsars, [[3, 2]]);
    assert.deepEqual(calls.gliders, []);
    assert.deepEqual(calls.toggles, []);
    assert.equal(calls.redraws, 1);
  });

  it("ignores a context menu event without the Control key", () => {
    // Given:
    const { canvas, calls } = createHarness();
    const event = createEvent({ ctrlKey: false });

    // When:
    canvas.dispatch("contextmenu", event);

    // Then:
    assert.equal(event.defaultPrevented, false);
    assert.deepEqual(calls.gliders, []);
    assert.deepEqual(calls.toggles, []);
    assert.equal(calls.redraws, 0);
  });

  it("does not insert twice when one gesture emits both events", () => {
    // Given:
    const { canvas, calls } = createHarness();
    const contextMenuEvent = createEvent({ timeStamp: 100 });
    const clickEvent = createEvent({ timeStamp: 101 });

    // When:
    canvas.dispatch("contextmenu", contextMenuEvent);
    canvas.dispatch("click", clickEvent);

    // Then:
    assert.equal(contextMenuEvent.defaultPrevented, true);
    assert.equal(clickEvent.defaultPrevented, true);
    assert.deepEqual(calls.gliders, [[3, 2]]);
    assert.equal(calls.redraws, 1);
  });
});
