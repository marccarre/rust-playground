# rust-matrices

Micro benchmark of:

- row-major matrix sum (fast, as leveraging CPU cache)
- column-major matrix sum (slow, as trashing CPU cache).

## How to run it?

```console
$ cargo bench
   Compiling rust-matrices v0.1.0 (/rust-playground/rust-matrices)
    Finished `bench` profile [optimized] target(s) in 0.75s
     Running benches/sum.rs (/rust-playground/target/release/deps/sum-b0cc967984f8c688)
Timer precision: 41 ns
sum          fastest       │ slowest       │ median        │ mean          │ samples │ iters
├─ sum_fast                │               │               │               │         │
│  ├─ 100    2.332 µs      │ 22.95 µs      │ 2.416 µs      │ 2.764 µs      │ 100     │ 100
│  ├─ 1000   177 µs        │ 947.4 µs      │ 183.9 µs      │ 195.9 µs      │ 100     │ 100
│  ╰─ 10000  26.29 ms      │ 227.5 ms      │ 27.36 ms      │ 30.14 ms      │ 100     │ 100
╰─ sum_slow                │               │               │               │         │
   ├─ 100    4.624 µs      │ 20.49 µs      │ 4.707 µs      │ 4.985 µs      │ 100     │ 100
   ├─ 1000   503 µs        │ 1.086 ms      │ 516 µs        │ 550.3 µs      │ 100     │ 100
   ╰─ 10000  257.7 ms      │ 443.9 ms      │ 260.6 ms      │ 269.2 ms      │ 100     │ 100
```
