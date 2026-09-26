const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { createPlayback } = require("./playback");

const createHarness = () => {
  const attributes = new Map();
  const playPauseButton = {
    textContent: "",
    getAttribute(name) {
      return attributes.get(name);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };
  const calls = { canceledFrames: [], events: [], requestedFrames: [] };
  const playback = createPlayback({
    playPauseButton,
    universe: {
      randomize() {
        calls.events.push("randomize");
      },
      tick() {
        calls.events.push("tick");
      },
    },
    redraw: () => {
      calls.events.push("redraw");
    },
    requestFrame: (callback) => {
      calls.requestedFrames.push(callback);
      return calls.requestedFrames.length;
    },
    cancelFrame: (animationId) => {
      calls.canceledFrames.push(animationId);
    },
  });

  return { calls, playback, playPauseButton };
};

describe("playback", () => {
  it("exposes each playback state through the button label", () => {
    // Given:
    const { playback, playPauseButton } = createHarness();
    const initialState = [
      playPauseButton.textContent,
      playPauseButton.getAttribute("aria-label"),
    ];

    // When:
    playback.togglePlayPause();
    const playingState = [
      playPauseButton.textContent,
      playPauseButton.getAttribute("aria-label"),
    ];
    playback.togglePlayPause();
    const pausedState = [
      playPauseButton.textContent,
      playPauseButton.getAttribute("aria-label"),
    ];
    playback.step();
    const steppedState = [
      playPauseButton.textContent,
      playPauseButton.getAttribute("aria-label"),
    ];

    // Then:
    assert.deepEqual(initialState, ["▶", "Play"]);
    assert.deepEqual(playingState, ["⏸", "Pause"]);
    assert.deepEqual(pausedState, ["▶", "Play"]);
    assert.deepEqual(steppedState, ["▶", "Play"]);
  });

  it("advances one generation and remains paused when stepping from pause", () => {
    // Given:
    const { calls, playback, playPauseButton } = createHarness();

    // When:
    playback.step();

    // Then:
    assert.deepEqual(calls.events, ["tick", "redraw"]);
    assert.deepEqual(calls.canceledFrames, []);
    assert.equal(playback.isPaused(), true);
    assert.equal(playPauseButton.textContent, "▶");
  });

  it("pauses and advances exactly one generation when stepping during play", () => {
    // Given:
    const { calls, playback, playPauseButton } = createHarness();
    playback.togglePlayPause();
    calls.events.length = 0;

    // When:
    playback.step();

    // Then:
    assert.deepEqual(calls.events, ["tick", "redraw"]);
    assert.deepEqual(calls.canceledFrames, [1]);
    assert.equal(playback.isPaused(), true);
    assert.equal(playPauseButton.textContent, "▶");
  });

  it("replaces and redraws a paused universe without starting playback", () => {
    // Given:
    const { calls, playback } = createHarness();

    // When:
    playback.reset();

    // Then:
    assert.deepEqual(calls.events, ["randomize", "redraw"]);
    assert.equal(playback.isPaused(), true);
  });

  it("replaces and redraws a playing universe without pausing it", () => {
    // Given:
    const { calls, playback } = createHarness();
    playback.togglePlayPause();
    calls.events.length = 0;

    // When:
    playback.reset();

    // Then:
    assert.deepEqual(calls.events, ["randomize", "redraw"]);
    assert.deepEqual(calls.canceledFrames, []);
    assert.equal(playback.isPaused(), false);
  });
});
