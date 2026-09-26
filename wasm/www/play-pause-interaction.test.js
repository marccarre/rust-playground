const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  attachPlayPauseInteractionHandlers,
} = require("./play-pause-interaction");

const createEventTarget = () => {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event = {}) {
      listeners.get(type)(event);
    },
  };
};

const createKeyboardEvent = (overrides = {}) => {
  let defaultPrevented = false;
  return {
    key: " ",
    repeat: false,
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
  const button = createEventTarget();
  const keyboardTarget = createEventTarget();
  let toggles = 0;

  attachPlayPauseInteractionHandlers({
    button,
    keyboardTarget,
    toggle: () => {
      toggles += 1;
    },
  });

  return { button, keyboardTarget, toggles: () => toggles };
};

describe("play/pause interactions", () => {
  it("toggles play/pause when the button is clicked", () => {
    // Given:
    const { button, toggles } = createHarness();

    // When:
    button.dispatch("click");

    // Then:
    assert.equal(toggles(), 1);
  });

  it("toggles play/pause when Space is pressed", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const event = createKeyboardEvent();

    // When:
    keyboardTarget.dispatch("keydown", event);

    // Then:
    assert.equal(event.defaultPrevented, true);
    assert.equal(toggles(), 1);
  });

  it("ignores keys other than Space", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const event = createKeyboardEvent({ key: "Enter" });

    // When:
    keyboardTarget.dispatch("keydown", event);

    // Then:
    assert.equal(event.defaultPrevented, false);
    assert.equal(toggles(), 0);
  });

  it("ignores repeated Space events from one key press", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const event = createKeyboardEvent({ repeat: true });

    // When:
    keyboardTarget.dispatch("keydown", event);

    // Then:
    assert.equal(event.defaultPrevented, true);
    assert.equal(toggles(), 0);
  });
});
