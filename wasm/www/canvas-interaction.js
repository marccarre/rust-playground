const { getCellCoordinate } = require("./cell-coordinate");

const DUPLICATE_EVENT_WINDOW_MS = 500;

const getTargetCell = (event, canvas, width, height, cellSize) => {
  const boundingRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;
  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  return {
    row: getCellCoordinate(canvasTop, height, cellSize),
    column: getCellCoordinate(canvasLeft, width, cellSize),
  };
};

const isDuplicateGesture = (event, target, previousGesture) => {
  if (previousGesture === null) {
    return false;
  }

  const elapsed = event.timeStamp - previousGesture.timeStamp;
  return (
    elapsed >= 0 &&
    elapsed <= DUPLICATE_EVENT_WINDOW_MS &&
    target.row === previousGesture.row &&
    target.column === previousGesture.column
  );
};

const attachCanvasInteractionHandlers = ({
  canvas,
  universe,
  width,
  height,
  cellSize,
  redraw,
}) => {
  let previousContextMenuGesture = null;

  const targetCell = (event) =>
    getTargetCell(event, canvas, width, height, cellSize);

  const insertGlider = (event, target) => {
    event.preventDefault();
    universe.insert_glider(target.row, target.column);
    redraw();
  };

  const insertPulsar = (event, target) => {
    event.preventDefault();
    universe.insert_pulsar(target.row, target.column);
    redraw();
  };

  canvas.addEventListener("click", (event) => {
    const target = targetCell(event);

    if (event.ctrlKey) {
      if (isDuplicateGesture(event, target, previousContextMenuGesture)) {
        event.preventDefault();
      } else {
        insertGlider(event, target);
      }
      previousContextMenuGesture = null;
      return;
    }

    if (event.shiftKey) {
      previousContextMenuGesture = null;
      insertPulsar(event, target);
      return;
    }

    previousContextMenuGesture = null;
    universe.toggle_cell(target.row, target.column);
    redraw();
  });

  canvas.addEventListener("contextmenu", (event) => {
    if (!event.ctrlKey) {
      return;
    }

    const target = targetCell(event);
    previousContextMenuGesture = { ...target, timeStamp: event.timeStamp };
    insertGlider(event, target);
  });
};

module.exports = { attachCanvasInteractionHandlers };
