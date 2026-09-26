#[cfg(target_arch = "wasm32")]
extern crate web_sys;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {{
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!( $( $t )* ).into());

        #[cfg(not(target_arch = "wasm32"))]
        eprintln!($( $t )*);
    }}
}
