const createPlayback = ({
  playPauseButton,
  tickCounter,
  fpsCounter,
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

  const isPaused = () => animationId === null;

  const setButtonState = (icon, label) => {
    playPauseButton.textContent = icon;
    playPauseButton.setAttribute("aria-label", label);
  };

  const updateTickCounter = () => {
    tickCounter.textContent = String(tickCount);
  };

  const resetFpsMeasurement = () => {
    fpsWindowStart = now();
    fpsFrameCount = 0;
    fpsCounter.textContent = "0";
  };

  const updateFps = (timestamp) => {
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
    setButtonState("⏸", "Pause");
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
    if (!isPaused()) {
      resetFpsMeasurement();
    }
    redraw();
  };

  const clear = () => {
    universe.clear();
    tickCount = 0;
    updateTickCounter();
    if (!isPaused()) {
      resetFpsMeasurement();
    }
    redraw();
  };

  setButtonState("▶️", "Play");
  updateTickCounter();
  fpsCounter.textContent = "0";
  return { clear, isPaused, reset, step, togglePlayPause };
};

module.exports = { createPlayback };
