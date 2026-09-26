const getCellCoordinate = (offset, length, cellSize) => {
  return Math.max(
    0,
    Math.min(Math.floor(offset / (cellSize + 1)), length - 1),
  );
};

module.exports = { getCellCoordinate };
