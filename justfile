setup:
    bin/setup
    rustup component add clippy
    cargo install --locked cargo-deny
    cargo install --locked cargo-nextest

build:
    cargo build

lint:
    prek run --all-files

test:
    cargo nextest run --workspace

ci:
    act pull_request --job check_all
