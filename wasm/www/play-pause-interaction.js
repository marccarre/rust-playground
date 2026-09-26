const attachPlayPauseInteractionHandlers = ({
  button,
  keyboardTarget,
  toggle,
}) => {
  button.addEventListener("click", toggle);

  keyboardTarget.addEventListener("keydown", (event) => {
    if (event.key !== " ") {
      return;
    }

    event.preventDefault();
    if (!event.repeat) {
      toggle();
    }
  });
};

module.exports = { attachPlayPauseInteractionHandlers };
