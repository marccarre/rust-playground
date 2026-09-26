const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  attachPlaybackInteractionHandlers,
} = require("./playback-interaction");

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

const createKeyboardTarget = (matchingSelector = null) => ({
  closest(selector) {
    if (matchingSelector === null) {
      return null;
    }
    const selectors = selector.split(", ");
    const isAriaRole = matchingSelector.startsWith("[role~=");
    const isEditable =
      matchingSelector === "[contenteditable]" &&
      selectors.some((candidate) => candidate.startsWith("[contenteditable]"));
    return selectors.includes(matchingSelector) ||
      (isAriaRole && selectors.includes("[role]")) ||
      isEditable
      ? this
      : null;
  },
});

const createKeyboardEvent = (overrides = {}) => {
  let defaultPrevented = false;
  return {
    altKey: false,
    ctrlKey: false,
    isComposing: false,
    key: " ",
    metaKey: false,
    repeat: false,
    shiftKey: false,
    target: createKeyboardTarget(),
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
  const resetButton = createEventTarget();
  const stepButton = createEventTarget();
  const keyboardTarget = createEventTarget();
  let toggles = 0;
  let steps = 0;
  let resets = 0;

  attachPlaybackInteractionHandlers({
    button,
    resetButton,
    stepButton,
    keyboardTarget,
    togglePlayPause: () => {
      toggles += 1;
    },
    step: () => {
      steps += 1;
    },
    reset: () => {
      resets += 1;
    },
  });

  return {
    button,
    keyboardTarget,
    resetButton,
    resets: () => resets,
    stepButton,
    steps: () => steps,
    toggles: () => toggles,
  };
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

  it("steps one generation when the step button is clicked", () => {
    // Given:
    const { stepButton, steps } = createHarness();

    // When:
    stepButton.dispatch("click");

    // Then:
    assert.equal(steps(), 1);
  });

  it("resets the universe when the reset button is clicked", () => {
    // Given:
    const { resetButton, resets } = createHarness();

    // When:
    resetButton.dispatch("click");

    // Then:
    assert.equal(resets(), 1);
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

  it("lets a focused play/pause button handle Space through its native click", () => {
    // Given:
    const { button, keyboardTarget, toggles } = createHarness();
    const event = createKeyboardEvent({
      target: createKeyboardTarget("button"),
    });

    // When:
    keyboardTarget.dispatch("keydown", event);
    button.dispatch("click");

    // Then:
    assert.equal(event.defaultPrevented, false);
    assert.equal(toggles(), 1);
  });

  it("leaves Space available to interactive and editable elements", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const scenarios = [
      ["input", "input"],
      ["checkbox", "input"],
      ["other button", "button"],
      ["editable content", "[contenteditable]"],
      ["ARIA tab", '[role~="tab"]'],
      ["ARIA menu item", '[role~="menuitem"]'],
      ["ARIA menu checkbox", '[role~="menuitemcheckbox"]'],
      ["ARIA menu radio", '[role~="menuitemradio"]'],
      ["ARIA option", '[role~="option"]'],
      ["ARIA tree item", '[role~="treeitem"]'],
    ];
    const events = scenarios.map(([, selector]) =>
      createKeyboardEvent({ target: createKeyboardTarget(selector) }),
    );

    // When:
    for (const event of events) {
      keyboardTarget.dispatch("keydown", event);
    }

    // Then:
    for (const [index, event] of events.entries()) {
      assert.equal(
        event.defaultPrevented,
        false,
        `${scenarios[index][0]} should retain its native Space behavior`,
      );
    }
    assert.equal(toggles(), 0);
  });

  it("toggles play/pause from a non-interactive ARIA region", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const event = createKeyboardEvent({
      target: createKeyboardTarget('[role~="region"]'),
    });

    // When:
    keyboardTarget.dispatch("keydown", event);

    // Then:
    assert.equal(event.defaultPrevented, true);
    assert.equal(toggles(), 1);
  });

  it("ignores a Space event handled by another component", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const event = createKeyboardEvent();
    event.preventDefault();

    // When:
    keyboardTarget.dispatch("keydown", event);

    // Then:
    assert.equal(toggles(), 0);
  });

  it("ignores modified and composing Space events", () => {
    // Given:
    const { keyboardTarget, toggles } = createHarness();
    const events = [
      createKeyboardEvent({ altKey: true }),
      createKeyboardEvent({ ctrlKey: true }),
      createKeyboardEvent({ metaKey: true }),
      createKeyboardEvent({ shiftKey: true }),
      createKeyboardEvent({ isComposing: true }),
    ];

    // When:
    for (const event of events) {
      keyboardTarget.dispatch("keydown", event);
    }

    // Then:
    for (const event of events) {
      assert.equal(event.defaultPrevented, false);
    }
    assert.equal(toggles(), 0);
  });
});
