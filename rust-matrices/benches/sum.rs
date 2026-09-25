fn main() {
    divan::main(); // Run registered benchmarks.
}

#[divan::bench(args = [100, 1_000, 10_000])]
fn sum_fast(size: usize) -> u64 {
    let matrix = vec![1_u64; size * size]; // matrix allocated as 1D array on heap.
    let mut sum = 0;
    for i in 0..size {
        for j in 0..size {
            sum += matrix[i * size + j];
        }
    }
    sum
}

#[divan::bench(args = [100, 1_000, 10_000])]
fn sum_slow(size: usize) -> u64 {
    let matrix = vec![1_u64; size * size]; // matrix allocated as 1D array on heap.
    let mut sum = 0;
    for i in 0..size {
        for j in 0..size {
            sum += matrix[j * size + i];
        }
    }
    sum
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_sum_slow() {
        assert_eq!(sum_slow(1), 1u64);
        assert_eq!(sum_slow(10), 100u64);
        assert_eq!(sum_slow(100), 10_000u64);
        assert_eq!(sum_slow(1_000), 1_000_000u64);
        assert_eq!(sum_slow(10_000), 100_000_000u64);
    }

    #[test]
    fn test_sum_fast() {
        assert_eq!(sum_fast(1), 1u64);
        assert_eq!(sum_fast(10), 100u64);
        assert_eq!(sum_fast(100), 10_000u64);
        assert_eq!(sum_fast(1_000), 1_000_000u64);
        assert_eq!(sum_fast(10_000), 100_000_000u64);
    }
}
