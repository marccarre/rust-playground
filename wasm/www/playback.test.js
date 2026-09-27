const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { createPlayback } = require("./playback");

const createHarness = () => {
  const attributes = new Map();
  const fpsCounter = { textContent: "" };
  const fpsMinCounter = { textContent: "" };
  const fpsMaxCounter = { textContent: "" };
  const fpsMedianCounter = { textContent: "" };
  const tickCounter = { textContent: "" };
  let currentTime = 0;
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
    fpsCounter,
    fpsMinCounter,
    fpsMaxCounter,
    fpsMedianCounter,
    tickCounter,
    universe: {
      clear() {
        calls.events.push("clear");
      },
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
    now: () => currentTime,
  });

  return {
    calls,
    fpsCounter,
    fpsMinCounter,
    fpsMaxCounter,
    fpsMedianCounter,
    playback,
    playPauseButton,
    setTime: (time) => {
      currentTime = time;
    },
    tickCounter,
  };
};

const runScheduledFrames = (calls, setTime, timestamps) => {
  for (const timestamp of timestamps) {
    setTime(timestamp);
    calls.requestedFrames.at(-1)(timestamp);
  }
};

describe("playback", () => {
  it("tracks min, max, and median over recent frame rates", () => {
    // Given:
    const {
      calls,
      fpsMinCounter,
      fpsMaxCounter,
      fpsMedianCounter,
      playback,
      setTime,
    } = createHarness();

    // When:
    playback.togglePlayPause();
    runScheduledFrames(calls, setTime, [1000, 1250, 1750, 2000]);

    // Then:
    assert.equal(fpsMinCounter.textContent, "1");
    assert.equal(fpsMaxCounter.textContent, "4");
    assert.equal(fpsMedianCounter.textContent, "3");
  });

  it("uses the middle sample as the median for an odd sample count", () => {
    // Given:
    const {
      calls,
      fpsMinCounter,
      fpsMaxCounter,
      fpsMedianCounter,
      playback,
      setTime,
    } = createHarness();

    // When:
    playback.togglePlayPause();
    runScheduledFrames(calls, setTime, [1000, 1250, 1750]);

    // Then:
    assert.equal(fpsMinCounter.textContent, "1");
    assert.equal(fpsMaxCounter.textContent, "4");
    assert.equal(fpsMedianCounter.textContent, "2");
  });

  it("keeps statistics for only the latest 100 frame intervals", () => {
    // Given:
    const {
      calls,
      fpsMinCounter,
      fpsMaxCounter,
      fpsMedianCounter,
      playback,
      setTime,
    } = createHarness();
    playback.togglePlayPause();
    const timestamps = [1000];
    for (let frame = 1; frame <= 100; frame += 1) {
      timestamps.push(1000 + frame * 100);
    }

    // When:
    runScheduledFrames(calls, setTime, timestamps);

    // Then:
    assert.equal(fpsMinCounter.textContent, "10");
    assert.equal(fpsMaxCounter.textContent, "10");
    assert.equal(fpsMedianCounter.textContent, "10");
  });

  it("reports animation frames per second and returns to zero when paused", () => {
    // Given:
    const { calls, fpsCounter, playback, setTime } = createHarness();
    const initialFps = fpsCounter.textContent;

    // When:
    playback.togglePlayPause();
    runScheduledFrames(calls, setTime, [250, 500, 750, 1000]);
    const playingFps = fpsCounter.textContent;
    playback.togglePlayPause();

    // Then:
    assert.equal(initialFps, "0");
    assert.equal(playingFps, "4");
    assert.equal(fpsCounter.textContent, "0");
  });

  it("resets the frame rate for each new game", () => {
    // Given:
    const {
      calls,
      fpsCounter,
      fpsMinCounter,
      fpsMaxCounter,
      fpsMedianCounter,
      playback,
      setTime,
    } = createHarness();
    playback.togglePlayPause();
    runScheduledFrames(calls, setTime, [250, 500, 750, 1000]);
    assert.equal(fpsCounter.textContent, "4");

    // When:
    playback.reset();
    const resetFps = fpsCounter.textContent;
    runScheduledFrames(calls, setTime, [1250, 1500, 1750, 2000, 2250]);
    playback.clear();

    // Then:
    assert.equal(resetFps, "0");
    assert.equal(fpsCounter.textContent, "0");
    assert.equal(fpsMinCounter.textContent, "0");
    assert.equal(fpsMaxCounter.textContent, "0");
    assert.equal(fpsMedianCounter.textContent, "0");
  });

  it("counts ticks in the current game", () => {
    // Given:
    const { calls, playback, tickCounter } = createHarness();
    const initialCount = tickCounter.textContent;

    // When:
    playback.step();
    const steppedCount = tickCounter.textContent;
    playback.reset();
    const resetCount = tickCounter.textContent;
    playback.togglePlayPause();
    calls.requestedFrames[0]();
    const playingCount = tickCounter.textContent;
    playback.clear();
    const clearedCount = tickCounter.textContent;

    // Then:
    assert.equal(initialCount, "0");
    assert.equal(steppedCount, "1");
    assert.equal(resetCount, "0");
    assert.equal(playingCount, "2");
    assert.equal(clearedCount, "0");
  });

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
    assert.deepEqual(initialState, ["▶️", "Play"]);
    assert.deepEqual(playingState, ["⏸️", "Pause"]);
    assert.deepEqual(pausedState, ["▶️", "Play"]);
    assert.deepEqual(steppedState, ["▶️", "Play"]);
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
    assert.equal(playPauseButton.textContent, "▶️");
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
    assert.equal(playPauseButton.textContent, "▶️");
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

  it("clears and redraws a paused universe without starting playback", () => {
    // Given:
    const { calls, playback } = createHarness();

    // When:
    playback.clear();

    // Then:
    assert.deepEqual(calls.events, ["clear", "redraw"]);
    assert.equal(playback.isPaused(), true);
  });

  it("clears and redraws a playing universe without pausing it", () => {
    // Given:
    const { calls, playback } = createHarness();
    playback.togglePlayPause();
    calls.events.length = 0;

    // When:
    playback.clear();

    // Then:
    assert.deepEqual(calls.events, ["clear", "redraw"]);
    assert.deepEqual(calls.canceledFrames, []);
    assert.equal(playback.isPaused(), false);
  });
});
