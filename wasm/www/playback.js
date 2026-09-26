const createPlayback = ({
  playPauseButton,
  tickCounter,
  universe,
  redraw,
  requestFrame,
  cancelFrame,
}) => {
  let animationId = null;
  let tickCount = 0;

  const isPaused = () => animationId === null;

  const setButtonState = (icon, label) => {
    playPauseButton.textContent = icon;
    playPauseButton.setAttribute("aria-label", label);
  };

  const updateTickCounter = () => {
    tickCounter.textContent = String(tickCount);
  };

  const tickAndRedraw = () => {
    universe.tick();
    tickCount += 1;
    updateTickCounter();
    redraw();
  };

  const renderLoop = () => {
    tickAndRedraw();
    animationId = requestFrame(renderLoop);
  };

  const play = () => {
    setButtonState("⏸", "Pause");
    renderLoop();
  };

  const pause = () => {
    setButtonState("▶", "Play");
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
    redraw();
  };

  const clear = () => {
    universe.clear();
    tickCount = 0;
    updateTickCounter();
    redraw();
  };

  setButtonState("▶", "Play");
  updateTickCounter();
  return { clear, isPaused, reset, step, togglePlayPause };
};

module.exports = { createPlayback };
