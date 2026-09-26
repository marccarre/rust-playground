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

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        if !self.contains(row, column) {
            return;
        }
        let idx = self.get_index(row, column);
        let cell = self.cells[idx];
        self.cells.set(idx, !cell);
    }
}

impl Universe {
    // Rust-facing methods:

    /// Set the universe width and reset every cell to dead.
    ///
    /// Return `false` when the resulting cell count exceeds the supported size.
    pub fn set_width(&mut self, width: u32) -> bool {
        let Some(size) = Self::cell_count(width, self.height) else {
            return false;
        };

        self.width = width;
        self.cells = FixedBitSet::with_capacity(size);
        true
    }

    /// Set the universe height and reset every cell to dead.
    ///
    /// Return `false` when the resulting cell count exceeds the supported size.
    pub fn set_height(&mut self, height: u32) -> bool {
        let Some(size) = Self::cell_count(self.width, height) else {
            return false;
        };

        self.height = height;
        self.cells = FixedBitSet::with_capacity(size);
        true
    }

    /// Get the state of every cell in the universe.
    pub fn get_cells(&self) -> &FixedBitSet {
        &self.cells
    }

    /// Set the cells at the given coordinates to alive.
    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        for &(row, col) in cells {
            if self.contains(row, col) {
                let idx = self.get_index(row, col);
                self.cells.insert(idx);
            }
        }
    }

    fn cell_count(width: u32, height: u32) -> Option<usize> {
        width.checked_mul(height).map(|size| size as usize)
    }

    fn contains(&self, row: u32, column: u32) -> bool {
        row < self.height && column < self.width
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

    #[test]
    fn toggle_cell_makes_a_dead_cell_alive() {
        // Given:
        let mut universe = empty_universe(2, 2);
        assert_eq!(universe.cells.count_ones(..), 0);

        // When:
        universe.toggle_cell(1, 1);

        // Then:
        assert!(universe.cells[3]);
        assert_eq!(universe.cells.count_ones(..), 1);
    }

    #[test]
    fn toggle_cell_makes_a_live_cell_dead() {
        // Given:
        let mut universe = empty_universe(2, 2);
        assert_eq!(universe.cells.count_ones(..), 0);
        universe.set_cells(&[(0, 1), (1, 1)]);
        assert_eq!(universe.cells.count_ones(..), 2);

        // When:
        universe.toggle_cell(1, 1);

        // Then:
        assert!(universe.cells[1]);
        assert!(!universe.cells[3]);
        assert_eq!(universe.cells.count_ones(..), 1);
    }

    #[test]
    fn toggle_cell_ignores_coordinates_outside_the_universe() {
        // Given:
        let invalid_coordinates = [(2, 0), (0, 2), (u32::MAX, 0), (0, u32::MAX)];

        // When:
        let live_cell_counts = invalid_coordinates.map(|(row, column)| {
            let mut universe = empty_universe(2, 2);
            universe.toggle_cell(row, column);
            universe.cells.count_ones(..)
        });

        // Then:
        assert_eq!(live_cell_counts, [0; 4]);
    }

    #[test]
    fn set_cells_ignores_coordinates_outside_the_universe() {
        // Given:
        let mut universe = empty_universe(2, 2);

        // When:
        universe.set_cells(&[(0, 1), (2, 0), (0, 2)]);

        // Then:
        assert_eq!(universe.cells.count_ones(..), 1);
        assert!(universe.cells[1]);
    }

    #[test]
    fn set_width_ignores_a_dimension_that_overflows_the_cell_count() {
        // Given:
        let mut universe = empty_universe(2, 2);
        universe.set_cells(&[(0, 1)]);

        // When:
        let changed = universe.set_width(u32::MAX);

        // Then:
        assert!(!changed);
        assert_eq!(universe.width, 2);
        assert_eq!(universe.cells.count_ones(..), 1);
    }

    #[test]
    fn set_height_ignores_a_dimension_that_overflows_the_cell_count() {
        // Given:
        let mut universe = empty_universe(2, 2);
        universe.set_cells(&[(0, 1)]);

        // When:
        let changed = universe.set_height(u32::MAX);

        // Then:
        assert!(!changed);
        assert_eq!(universe.height, 2);
        assert_eq!(universe.cells.count_ones(..), 1);
    }
}
