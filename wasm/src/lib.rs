#[macro_use]
mod utils;

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
        console_error_panic_hook::set_once();
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

    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        if !self.contains(row, col) {
            log!("[{}, {}] is outside of the universe", row, col);
            return;
        }
        let idx = self.get_index(row, col);
        let cell = self.cells[idx];
        self.cells.set(idx, !cell);
    }

    pub fn insert_glider(&mut self, row: u32, col: u32) {
        const LIVE_CELLS: [(usize, usize); 5] = [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)];
        self.insert_pattern::<3>(row, col, &LIVE_CELLS);
    }

    pub fn insert_pulsar(&mut self, row: u32, col: u32) {
        const LIVE_CELLS: [(usize, usize); 48] = [
            (0, 2),
            (0, 3),
            (0, 4),
            (0, 8),
            (0, 9),
            (0, 10),
            (2, 0),
            (2, 5),
            (2, 7),
            (2, 12),
            (3, 0),
            (3, 5),
            (3, 7),
            (3, 12),
            (4, 0),
            (4, 5),
            (4, 7),
            (4, 12),
            (5, 2),
            (5, 3),
            (5, 4),
            (5, 8),
            (5, 9),
            (5, 10),
            (7, 2),
            (7, 3),
            (7, 4),
            (7, 8),
            (7, 9),
            (7, 10),
            (8, 0),
            (8, 5),
            (8, 7),
            (8, 12),
            (9, 0),
            (9, 5),
            (9, 7),
            (9, 12),
            (10, 0),
            (10, 5),
            (10, 7),
            (10, 12),
            (12, 2),
            (12, 3),
            (12, 4),
            (12, 8),
            (12, 9),
            (12, 10),
        ];
        self.insert_pattern::<13>(row, col, &LIVE_CELLS);
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
            } else {
                log!("[{}, {}] is outside of the universe", row, col);
            }
        }
    }

    fn cell_count(width: u32, height: u32) -> Option<usize> {
        width.checked_mul(height).map(|size| size as usize)
    }

    fn contains(&self, row: u32, col: u32) -> bool {
        row < self.height && col < self.width
    }

    fn insert_pattern<const SIZE: usize>(
        &mut self,
        row: u32,
        col: u32,
        live_cells: &[(usize, usize)],
    ) {
        if !self.contains(row, col) || self.width < SIZE as u32 || self.height < SIZE as u32 {
            return;
        }

        let rows = Self::centred_coordinates::<SIZE>(row, self.height);
        let cols = Self::centred_coordinates::<SIZE>(col, self.width);
        for pattern_row in rows {
            for pattern_col in cols {
                let idx = self.get_index(pattern_row, pattern_col);
                self.cells.set(idx, false);
            }
        }
        for &(row_index, col_index) in live_cells {
            let idx = self.get_index(rows[row_index], cols[col_index]);
            self.cells.set(idx, true);
        }
    }

    fn centred_coordinates<const SIZE: usize>(target: u32, length: u32) -> [u32; SIZE] {
        let radius = (SIZE / 2) as u32;
        std::array::from_fn(|index| (target + length - radius + index as u32) % length)
    }

    fn get_index(&self, row: u32, col: u32) -> usize {
        (row * self.width + col) as usize
    }

    fn live_neighbour_count(&self, row: u32, col: u32) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().copied() {
            for delta_col in [self.width - 1, 0, 1].iter().copied() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }
                let neighbour_row = (row + delta_row) % self.height;
                let neighbour_col = (col + delta_col) % self.width;
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
    fn insert_glider_centres_an_exact_glider_on_the_target_cell() {
        // Given:
        let mut universe = empty_universe(5, 5);
        universe.set_cells(&[
            (1, 1),
            (1, 2),
            (1, 3),
            (2, 1),
            (2, 2),
            (2, 3),
            (3, 1),
            (3, 2),
            (3, 3),
        ]);

        // When:
        universe.insert_glider(2, 2);

        // Then:
        let expected = [false, true, false, false, false, true, true, true, true];
        let actual = [
            universe.cells[6],
            universe.cells[7],
            universe.cells[8],
            universe.cells[11],
            universe.cells[12],
            universe.cells[13],
            universe.cells[16],
            universe.cells[17],
            universe.cells[18],
        ];
        assert_eq!(actual, expected);
    }

    #[test]
    fn insert_glider_wraps_around_the_universe_at_edges_and_corners() {
        // Given:
        let scenarios = [
            ((0, 0), [1, 5, 6, 9, 20]),
            ((0, 2), [3, 6, 7, 8, 22]),
            ((0, 4), [0, 5, 8, 9, 24]),
            ((2, 0), [5, 11, 15, 16, 19]),
            ((2, 4), [9, 10, 15, 18, 19]),
            ((4, 0), [0, 1, 4, 15, 21]),
            ((4, 2), [1, 2, 3, 17, 23]),
            ((4, 4), [0, 3, 4, 19, 20]),
        ];

        // When:
        let states = scenarios.map(|((row, col), expected_live_cells)| {
            let mut universe = empty_universe(5, 5);
            universe.insert_glider(row, col);
            (universe.cells, expected_live_cells)
        });

        // Then:
        for (cells, expected_live_cells) in states {
            assert_eq!(cells.count_ones(..), expected_live_cells.len());
            for index in expected_live_cells {
                assert!(cells[index], "cell {index} should be alive");
            }
        }
    }

    #[test]
    fn insert_glider_preserves_cells_outside_its_three_by_three_footprint() {
        // Given:
        let mut universe = empty_universe(5, 5);
        universe.set_cells(&[(0, 0), (4, 4)]);

        // When:
        universe.insert_glider(2, 2);

        // Then:
        assert!(universe.cells[0]);
        assert!(universe.cells[24]);
        assert_eq!(universe.cells.count_ones(..), 7);
    }

    #[test]
    fn insert_glider_ignores_universes_smaller_than_three_cells_in_either_dimension() {
        // Given:
        let dimensions = [(0, 3), (3, 0), (1, 5), (5, 1), (2, 3), (3, 2)];

        // When:
        let states = dimensions.map(|(width, height)| {
            let mut universe = empty_universe(width, height);
            universe.set_cells(&[(0, 0)]);
            let expected = universe.cells.clone();
            universe.insert_glider(0, 0);
            (universe.cells, expected)
        });

        // Then:
        for (cells, expected) in states {
            assert_eq!(cells, expected);
        }
    }

    #[test]
    fn insert_glider_ignores_coordinates_outside_the_universe() {
        // Given:
        let invalid_coordinates = [(5, 0), (0, 5), (u32::MAX, 0), (0, u32::MAX)];

        // When:
        let states = invalid_coordinates.map(|(row, col)| {
            let mut universe = empty_universe(5, 5);
            universe.set_cells(&[(0, 0)]);
            universe.insert_glider(row, col);
            universe.cells
        });

        // Then:
        for cells in states {
            assert_eq!(cells.count_ones(..), 1);
            assert!(cells[0]);
        }
    }

    #[test]
    fn insert_pulsar_centres_an_exact_pulsar_on_the_target_cell() {
        // Given:
        let mut universe = empty_universe(15, 15);
        for row in 1..14 {
            for col in 1..14 {
                universe.set_cells(&[(row, col)]);
            }
        }

        // When:
        universe.insert_pulsar(7, 7);

        // Then:
        let expected = [
            "..XXX...XXX..",
            ".............",
            "X....X.X....X",
            "X....X.X....X",
            "X....X.X....X",
            "..XXX...XXX..",
            ".............",
            "..XXX...XXX..",
            "X....X.X....X",
            "X....X.X....X",
            "X....X.X....X",
            ".............",
            "..XXX...XXX..",
        ];
        for (row_offset, expected_row) in expected.iter().enumerate() {
            for (col_offset, expected_cell) in expected_row.bytes().enumerate() {
                let idx = universe.get_index((row_offset + 1) as u32, (col_offset + 1) as u32);
                assert_eq!(
                    universe.cells[idx],
                    expected_cell == b'X',
                    "unexpected cell at pattern offset ({row_offset}, {col_offset})"
                );
            }
        }
        assert_eq!(universe.cells.count_ones(..), 48);
    }

    #[test]
    fn insert_pulsar_wraps_around_the_universe_edges() {
        // Given:
        let mut universe = empty_universe(13, 13);

        // When:
        universe.insert_pulsar(0, 0);

        // Then:
        let expected = [
            ".............",
            "..XXX....XXX.",
            ".X....XX....X",
            ".X....XX....X",
            ".X....XX....X",
            ".............",
            "..XXX....XXX.",
            "..XXX....XXX.",
            ".............",
            ".X....XX....X",
            ".X....XX....X",
            ".X....XX....X",
            "..XXX....XXX.",
        ];
        for (row, expected_row) in expected.iter().enumerate() {
            for (col, expected_cell) in expected_row.bytes().enumerate() {
                let idx = universe.get_index(row as u32, col as u32);
                assert_eq!(
                    universe.cells[idx],
                    expected_cell == b'X',
                    "unexpected cell at ({row}, {col})"
                );
            }
        }
        assert_eq!(universe.cells.count_ones(..), 48);
    }

    #[test]
    fn insert_pulsar_preserves_cells_outside_its_thirteen_by_thirteen_footprint() {
        // Given:
        let mut universe = empty_universe(15, 15);
        universe.set_cells(&[(0, 0), (14, 14)]);

        // When:
        universe.insert_pulsar(7, 7);

        // Then:
        assert!(universe.cells[0]);
        assert!(universe.cells[224]);
        assert_eq!(universe.cells.count_ones(..), 50);
    }

    #[test]
    fn insert_pulsar_ignores_universes_smaller_than_thirteen_cells_in_either_dimension() {
        // Given:
        let dimensions = [(0, 13), (13, 0), (12, 13), (13, 12)];

        // When:
        let states = dimensions.map(|(width, height)| {
            let mut universe = empty_universe(width, height);
            universe.set_cells(&[(0, 0)]);
            let expected = universe.cells.clone();
            universe.insert_pulsar(0, 0);
            (universe.cells, expected)
        });

        // Then:
        for (cells, expected) in states {
            assert_eq!(cells, expected);
        }
    }

    #[test]
    fn insert_pulsar_ignores_coordinates_outside_the_universe() {
        // Given:
        let invalid_coordinates = [(15, 0), (0, 15), (u32::MAX, 0), (0, u32::MAX)];

        // When:
        let states = invalid_coordinates.map(|(row, col)| {
            let mut universe = empty_universe(15, 15);
            universe.set_cells(&[(0, 0)]);
            universe.insert_pulsar(row, col);
            universe.cells
        });

        // Then:
        for cells in states {
            assert_eq!(cells.count_ones(..), 1);
            assert!(cells[0]);
        }
    }

    #[test]
    fn toggle_cell_ignores_coordinates_outside_the_universe() {
        // Given:
        let invalid_coordinates = [(2, 0), (0, 2), (u32::MAX, 0), (0, u32::MAX)];

        // When:
        let live_cell_counts = invalid_coordinates.map(|(row, col)| {
            let mut universe = empty_universe(2, 2);
            universe.toggle_cell(row, col);
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
