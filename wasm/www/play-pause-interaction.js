const attachPlayPauseInteractionHandlers = ({
  button,
  keyboardTarget,
  togglePlayPause,
}) => {
  button.addEventListener("click", togglePlayPause);

  keyboardTarget.addEventListener("keydown", (event) => {
    if (event.key !== " ") {
      return;
    }

    event.preventDefault();
    if (!event.repeat) {
      togglePlayPause();
    }
  });
};

module.exports = { attachPlayPauseInteractionHandlers };
