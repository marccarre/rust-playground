const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { createPlayback } = require("./playback");

const createHarness = () => {
  const playPauseButton = { textContent: "" };
  const calls = { canceledFrames: [], events: [], requestedFrames: [] };
  const playback = createPlayback({
    playPauseButton,
    universe: {
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
});
