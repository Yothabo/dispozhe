# Experimental Rust Encryption Module

This directory contains experimental Rust code for potential WebAssembly-based encryption performance improvements. The goal was to evaluate whether native Rust compilation could provide faster encryption operations compared to the Web Crypto API, particularly on lower-end mobile devices.

## Advantages of Rust Migration

Rust offers several theoretical advantages for cryptographic operations in web applications. Memory safety guarantees without garbage collection overhead could provide more predictable performance. The ability to compile to WebAssembly allows near-native execution speeds in the browser. Rust's zero-cost abstractions and fine-grained control over memory layout could potentially reduce encryption latency, especially for large messages or frequent operations. The extensive cryptographic libraries available in the Rust ecosystem, such as RustCrypto, provide audited and well-maintained implementations of various algorithms.

## Implementation Challenges with Termux

The migration effort encountered significant compilation difficulties within the Termux development environment. The Rust toolchain and WebAssembly compilation targets require substantial memory and build time resources that pushed against Termux limitations on mobile devices. Cross-compilation from ARM-based Termux to WebAssembly targets introduced complexity that proved difficult to manage within the constrained environment. The build process frequently failed due to memory exhaustion or missing dependencies that were not easily resolvable on the mobile platform.

## Current Status

Development on this module has been paused due to the compilation challenges described above. The Web Crypto API provides adequate performance for current needs with hardware acceleration where available, and the team has prioritized stability and feature development over the potential marginal gains from Rust migration. The code remains in the repository for reference and for future reevaluation if the Termux toolchain improves or if performance analysis identifies specific bottlenecks that Rust could address. No active development is planned for this module in the immediate future.
