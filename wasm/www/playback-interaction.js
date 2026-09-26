const SPACE_DRIVEN_ARIA_ROLES = [
  "button",
  "checkbox",
  "combobox",
  "grid",
  "gridcell",
  "link",
  "listbox",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "radiogroup",
  "scrollbar",
  "searchbox",
  "separator",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "tablist",
  "textbox",
  "tree",
  "treegrid",
  "treeitem",
];

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
  ...SPACE_DRIVEN_ARIA_ROLES.map((role) => `[role~="${role}"]`),
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

const attachPlaybackInteractionHandlers = ({
  button,
  clearButton,
  resetButton,
  stepButton,
  keyboardTarget,
  clear,
  reset,
  step,
  togglePlayPause,
}) => {
  button.addEventListener("click", togglePlayPause);
  clearButton.addEventListener("click", clear);
  resetButton.addEventListener("click", reset);
  stepButton.addEventListener("click", step);

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

module.exports = { attachPlaybackInteractionHandlers };
