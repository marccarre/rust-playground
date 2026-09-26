mod common;

use wasm_bindgen_test::{wasm_bindgen_test, wasm_bindgen_test_configure};

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn tick_moves_spaceship() {
    common::assert_tick_moves_spaceship();
}
