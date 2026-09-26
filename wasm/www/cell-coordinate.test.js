const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { getCellCoordinate } = require("./cell-coordinate");

describe("getCellCoordinate", () => {
  it("clamps offsets before the canvas to the first cell", () => {
    // Given:
    const offset = -1;

    // When:
    const coordinate = getCellCoordinate(offset, 128, 5);

    // Then:
    assert.equal(coordinate, 0);
  });

  it("clamps offsets after the canvas to the last cell", () => {
    // Given:
    const offset = Number.MAX_SAFE_INTEGER;

    // When:
    const coordinate = getCellCoordinate(offset, 128, 5);

    // Then:
    assert.equal(coordinate, 127);
  });
});
