const createPlayback = ({
  playPauseButton,
  universe,
  redraw,
  requestFrame,
  cancelFrame,
}) => {
  let animationId = null;

  const isPaused = () => animationId === null;

  const tickAndRedraw = () => {
    universe.tick();
    redraw();
  };

  const renderLoop = () => {
    tickAndRedraw();
    animationId = requestFrame(renderLoop);
  };

  const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
  };

  const pause = () => {
    playPauseButton.textContent = "▶";
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

  return { isPaused, step, togglePlayPause };
};

module.exports = { createPlayback };
