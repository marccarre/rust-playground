use wasm_bindgen::prelude::*;

extern crate js_sys;

extern crate fixedbitset;
use fixedbitset::FixedBitSet;

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}

#[wasm_bindgen]
impl Universe {
    // Javascript-facing methods:
    pub fn new() -> Universe {
        let width = 128;
        let height = 128;
        let size = (width * height) as usize;

        let mut cells = FixedBitSet::with_capacity(size);
        for i in 0..size {
            cells.set(i, js_sys::Math::random() < 0.5);
        }

        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> *const usize {
        self.cells.as_slice().as_ptr()
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbours = self.live_neighbour_count(row, col);

                next.set(
                    idx,
                    match (cell, live_neighbours) {
                        // Rule 1: Any live cell with fewer than two live neighbours
                        // dies, as if caused by underpopulation.
                        (true, n) if n < 2 => false,
                        // Rule 2: Any live cell with two or three live neighbours
                        // lives on to the next generation.
                        (true, 2) | (true, 3) => true,
                        // Rule 3: Any live cell with more than three live
                        // neighbours dies, as if by overpopulation.
                        (true, n) if n > 3 => false,
                        // Rule 4: Any dead cell with exactly three live neighbours
                        // becomes a live cell, as if by reproduction.
                        (false, 3) => true,
                        // All other cells remain in the same state.
                        (otherwise, _) => otherwise,
                    },
                );
            }
        }

        self.cells = next;
    }
}

impl Universe {
    // Rust-facing methods:

    /// Get the state of every cell in the universe.
    pub fn get_cells(&self) -> &FixedBitSet {
        &self.cells
    }

    /// Set the cells at the given coordinates to alive.
    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        for &(row, col) in cells {
            let idx = self.get_index(row, col);
            self.cells.insert(idx);
        }
    }

    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    fn live_neighbour_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().copied() {
            for delta_col in [self.width - 1, 0, 1].iter().copied() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }
                let neighbour_row = (row + delta_row) % self.height;
                let neighbour_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbour_row, neighbour_col);
                count += self.cells[idx] as u8;
            }
        }
        count
    }
}

impl Default for Universe {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::{FixedBitSet, Universe};

    fn empty_universe(width: u32, height: u32) -> Universe {
        Universe {
            width,
            height,
            cells: FixedBitSet::with_capacity((width * height) as usize),
        }
    }

    #[test]
    fn get_cells_returns_every_cell_state() {
        // Given:
        let mut universe = empty_universe(2, 2);
        universe.cells.insert(1);

        // When:
        let cells = universe.get_cells();

        // Then:
        assert_eq!(cells.len(), 4);
        assert!(!cells[0]);
        assert!(cells[1]);
        assert!(!cells[2]);
        assert!(!cells[3]);
    }

    #[test]
    fn set_cells_makes_each_coordinate_alive() {
        // Given:
        let mut universe = empty_universe(3, 2);

        // When:
        universe.set_cells(&[(0, 1), (1, 2)]);

        // Then:
        assert!(universe.cells[1]);
        assert!(universe.cells[5]);
        assert_eq!(universe.cells.count_ones(..), 2);
    }
}
