const getCellCoordinate = (offset, length, cellSize) => {
  const index = Math.floor(offset / (cellSize + 1));
  return Math.max(0, Math.min(index, length - 1));
};

module.exports = { getCellCoordinate };
