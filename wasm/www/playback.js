const createPlayback = ({
  playPauseButton,
  tickCounter,
  fpsCounter,
  fpsMinCounter,
  fpsMaxCounter,
  fpsMedianCounter,
  universe,
  redraw,
  requestFrame,
  cancelFrame,
  now,
}) => {
  let animationId = null;
  let tickCount = 0;
  let fpsWindowStart = 0;
  let fpsFrameCount = 0;
  let lastFrameTimestamp = 0;
  let fpsSamples = [];

  const isPaused = () => animationId === null;

  const setButtonState = (icon, label) => {
    playPauseButton.textContent = icon;
    playPauseButton.setAttribute("aria-label", label);
  };

  const updateTickCounter = () => {
    tickCounter.textContent = String(tickCount);
  };

  const updateFpsStatistics = () => {
    const sortedSamples = [...fpsSamples].sort((left, right) => left - right);
    if (sortedSamples.length === 0) {
      fpsMinCounter.textContent = "0";
      fpsMaxCounter.textContent = "0";
      fpsMedianCounter.textContent = "0";
      return;
    }

    const middle = Math.floor(sortedSamples.length / 2);
    const median =
      sortedSamples.length % 2 === 0
        ? (sortedSamples[middle - 1] + sortedSamples[middle]) / 2
        : sortedSamples[middle];

    fpsMinCounter.textContent = String(Math.round(sortedSamples[0]));
    fpsMaxCounter.textContent = String(
      Math.round(sortedSamples[sortedSamples.length - 1]),
    );
    fpsMedianCounter.textContent = String(Math.round(median));
  };

  const resetFpsMeasurement = ({ clearSamples = false } = {}) => {
    fpsWindowStart = now();
    lastFrameTimestamp = fpsWindowStart;
    fpsFrameCount = 0;
    fpsCounter.textContent = "0";
    if (clearSamples) {
      fpsSamples = [];
      updateFpsStatistics();
    }
  };

  const updateFps = (timestamp) => {
    const frameDuration = timestamp - lastFrameTimestamp;
    if (frameDuration > 0) {
      fpsSamples.push(1000 / frameDuration);
      if (fpsSamples.length > 100) {
        fpsSamples.shift();
      }
      updateFpsStatistics();
    }
    lastFrameTimestamp = timestamp;

    fpsFrameCount += 1;
    const elapsed = timestamp - fpsWindowStart;
    if (elapsed >= 1000) {
      fpsCounter.textContent = String(Math.round((fpsFrameCount * 1000) / elapsed));
      fpsWindowStart = timestamp;
      fpsFrameCount = 0;
    }
  };

  const tickAndRedraw = () => {
    universe.tick();
    tickCount += 1;
    updateTickCounter();
    redraw();
  };

  const renderLoop = (timestamp) => {
    tickAndRedraw();
    if (typeof timestamp === "number") {
      updateFps(timestamp);
    }
    animationId = requestFrame(renderLoop);
  };

  const play = () => {
    setButtonState("⏸️", "Pause");
    resetFpsMeasurement();
    renderLoop();
  };

  const pause = () => {
    setButtonState("▶️", "Play");
    fpsCounter.textContent = "0";
    if (!isPaused()) {
      cancelFrame(animationId);
      animationId = null;
    }
  };

  const togglePlayPause = () => {
    if (isPaused()) {
      play();
    } else {
      pause();
    }
  };

  const step = () => {
    pause();
    tickAndRedraw();
  };

  const reset = () => {
    universe.randomize();
    tickCount = 0;
    updateTickCounter();
    resetFpsMeasurement({ clearSamples: true });
    redraw();
  };

  const clear = () => {
    universe.clear();
    tickCount = 0;
    updateTickCounter();
    resetFpsMeasurement({ clearSamples: true });
    redraw();
  };

  setButtonState("▶️", "Play");
  updateTickCounter();
  resetFpsMeasurement({ clearSamples: true });
  return { clear, isPaused, reset, step, togglePlayPause };
};

module.exports = { createPlayback };
