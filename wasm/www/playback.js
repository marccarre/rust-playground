const createPlayback = ({
  playPauseButton,
  universe,
  redraw,
  requestFrame,
  cancelFrame,
}) => {
  let animationId = null;

  const isPaused = () => animationId === null;

  const setButtonState = (icon, label) => {
    playPauseButton.textContent = icon;
    playPauseButton.setAttribute("aria-label", label);
  };

  const tickAndRedraw = () => {
    universe.tick();
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
    redraw();
  };

  setButtonState("▶", "Play");
  return { isPaused, reset, step, togglePlayPause };
};

module.exports = { createPlayback };
