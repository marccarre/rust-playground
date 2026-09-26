const INTERACTIVE_ELEMENT_SELECTOR = [
  "a[href]",
  "audio[controls]",
  "button",
  "input",
  "select",
  "summary",
  "textarea",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="textbox"]',
].join(", ");

const isInteractiveTarget = (target) =>
  typeof target?.closest === "function" &&
  Boolean(target.closest(INTERACTIVE_ELEMENT_SELECTOR));

const isGlobalSpaceShortcut = (event) =>
  event.key === " " &&
  !event.defaultPrevented &&
  !event.isComposing &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  !isInteractiveTarget(event.target);

const attachPlayPauseInteractionHandlers = ({
  button,
  keyboardTarget,
  togglePlayPause,
}) => {
  button.addEventListener("click", togglePlayPause);

  keyboardTarget.addEventListener("keydown", (event) => {
    if (!isGlobalSpaceShortcut(event)) {
      return;
    }

    event.preventDefault();
    if (!event.repeat) {
      togglePlayPause();
    }
  });
};

module.exports = { attachPlayPauseInteractionHandlers };
