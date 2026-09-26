use wasm::Universe;

pub fn assert_tick_moves_spaceship() {
    // Given:
    let mut input_universe = input_spaceship();
    let expected_universe = expected_spaceship();

    // When:
    input_universe.tick();

    // Then:
    assert_eq!(input_universe.get_cells(), expected_universe.get_cells());
}

fn input_spaceship() -> Universe {
    let mut universe = Universe::new();
    universe.set_width(6);
    universe.set_height(6);
    universe.set_cells(&[(1, 2), (2, 3), (3, 1), (3, 2), (3, 3)]);
    universe
}

fn expected_spaceship() -> Universe {
    let mut universe = Universe::new();
    universe.set_width(6);
    universe.set_height(6);
    universe.set_cells(&[(2, 1), (2, 3), (3, 2), (3, 3), (4, 2)]);
    universe
}
