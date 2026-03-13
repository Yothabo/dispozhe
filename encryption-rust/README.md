```markdown
# Experimental Rust Encryption Module

This directory contains experimental Rust code for potential WebAssembly-based encryption performance improvements. The goal was to evaluate whether native Rust compilation could provide faster encryption operations compared to the Web Crypto API, particularly on lower-end mobile devices. This document explains the rationale, the implementation challenges encountered, the specific reasons for failure, and the lessons learned for future reference.

## Advantages of Rust Migration

Rust offers several theoretical advantages for cryptographic operations in web applications. Memory safety guarantees without garbage collection overhead could provide more predictable performance compared to JavaScript's dynamic memory management. The ability to compile to WebAssembly allows near-native execution speeds in the browser, potentially reducing encryption latency. Rust's zero-cost abstractions and fine-grained control over memory layout could optimize tight cryptographic loops. The extensive cryptographic libraries available in the Rust ecosystem, such as the RustCrypto project, provide audited and well-maintained implementations of various algorithms.

### Performance Expectations

Initial benchmarks suggested that Rust/WASM could outperform JavaScript implementations by margins of twenty to forty percent for CPU-intensive operations like AES-256-GCM encryption. For large messages or sessions with high message volume, this could translate to noticeable improvements in perceived responsiveness. The Web Crypto API, while hardware-accelerated in many browsers, still incurs JavaScript bridge overhead that Rust/WASM could potentially eliminate.

### Memory Safety

Rust's ownership model eliminates entire classes of memory vulnerabilities at compile time. For cryptographic code, where timing attacks and memory leaks can have security implications, this provides stronger guarantees than JavaScript's garbage-collected environment. The ability to write safe abstractions without runtime overhead is particularly valuable for implementing cryptographic primitives.

### Ecosystem Maturity

The Rust ecosystem includes well-maintained cryptographic libraries through the RustCrypto organization. These crates provide implementations of AES-GCM, SHA-256, HMAC, and other primitives needed for Driflly's security model. Many of these crates have undergone security audits and are used in production systems, providing confidence in their correctness.

## Why Rust Failed: Dependency Resolution Hell

The migration effort encountered significant compilation difficulties that ultimately proved insurmountable within the Termux development environment. The root cause was a classic Rust dependency resolution failure involving outdated transitive dependencies that could not be resolved without modifying upstream crates.

### The Specific Error

The build error that blocked progress was:

```

error: failed to parse manifest at /path/to/nalgebra-0.5.1/Cargo.toml
Caused by: dependency (quickcheck) specified without providing a local path, Git repository, version, or workspace dependency to use

```

This error revealed that an older version of the nalgebra linear algebra library (version 0.5.1) was being pulled in as a transitive dependency by one of the cryptographic crates. This version of nalgebra had a malformed Cargo.toml that failed to properly specify its quickcheck development dependency, making it impossible for Cargo to resolve the dependency graph.

### The Dependency Chain

The problematic dependency chain looked approximately like this:

```toml
# Direct dependency in our Cargo.toml
crypto-library = "0.8.2"

# crypto-library's dependencies
crypto-library/Cargo.toml:
[dependencies]
matrix-ops = "1.2.0"

# matrix-ops's dependencies
matrix-ops/Cargo.toml:
[dependencies]
nalgebra = "0.5.1"

# The broken nalgebra version
nalgebra-0.5.1/Cargo.toml:
[dev-dependencies]
quickcheck =  # Missing version specification!
```

The nalgebra crate is a linear algebra library used by some cryptographic crates for mathematical operations. Version 0.5.1, released in 2018, had a malformed development dependency specification that prevented Cargo from parsing its manifest. Normally this would not affect production builds because dev-dependencies are optional, but the malformed syntax broke manifest parsing entirely.

Attempted Fixes That Failed

Several approaches were attempted to resolve this issue, each encountering its own obstacles.

Updating Direct Dependencies

Updating the direct cryptographic crates to their latest versions did not eliminate the problematic nalgebra version because multiple transitive dependencies still required it through different paths. The resolver could not find a consistent set of versions that satisfied all constraints. Running cargo update would succeed superficially but the broken version remained in the lock file because it was pinned by transitive requirements.

Patching with Cargo's Patch Section

Adding a patch section to override the broken nalgebra version:

```toml
[patch.crates-io]
nalgebra = { git = "https://github.com/dimforge/nalgebra", branch = "master" }
```

This introduced further compatibility issues because the patched version had API changes that broke the cryptographic crates expecting specific nalgebra interfaces. The version mismatch resulted in type errors:

```
error[E0308]: mismatched types
   --> /path/to/crate/src/matrix.rs:120:25
    |
120 |     let m = Matrix::from(data);
    |                         ^^^^ expected struct `nalgebra::Matrix`, found struct `nalgebra::base::Matrix`
```

The API had evolved significantly between version 0.5 and the current release, making the patch incompatible with the dependent crates.

Version Override in Cargo.toml

Attempting to force a specific version using the resolver:

```toml
[workspace.dependencies]
nalgebra = "0.32"
```

This failed because the cryptographic crates were not written to be generic over nalgebra versions. They expected specific types and traits that changed between versions.

Forking and Patching Dependencies

Forking the problematic cryptographic crates and updating their nalgebra dependencies was considered but deemed too time-consuming. Each fork would require maintaining patches against upstream, and the dependency tree contained multiple crates with nalgebra dependencies, creating a cascade of required forks.

Compounding Challenges in Termux

The Termux environment compounded these difficulties with additional constraints that made debugging and iteration impractical.

Memory Exhaustion

Rust's compilation process, particularly LLVM backend operations, required more memory than available on mobile devices. Compilation would proceed for ten to fifteen minutes, consuming all available RAM, before failing with out-of-memory errors. This made iterative debugging prohibitively time-consuming, as each attempted fix required a full rebuild.

Typical memory usage during compilation:

· Cargo dependency resolution: 200-300 MB
· LLVM IR generation: 400-600 MB
· Optimization passes: 800 MB to 1.2 GB
· Linking: 200-400 MB

Total memory usage frequently exceeded the 2-3 GB typically available on mobile devices, causing the kernel's out-of-memory killer to terminate the build process.

Cross-Compilation Complexity

Compiling from ARM-based Termux to WebAssembly targets introduced additional configuration complexity. The standard Rust toolchain supports cross-compilation, but the WebAssembly target requires specific LLVM backend configurations that were difficult to debug on the mobile platform. Error messages from the linker were often cryptic and unhelpful.

Common cross-compilation errors included:

```
error: linking with `rust-lld` failed: exit status: 1
  = note: rust-lld: error: unknown argument: -znoexecstack
```

These errors required research and trial-and-error to resolve, with each attempt taking thirty to sixty minutes on the constrained hardware.

Build Times

A clean build of the dependency tree required forty-five to sixty minutes on the Termux environment. This made the edit-compile-debug cycle impossibly slow. Incremental builds were faster but still required ten to fifteen minutes for even minor changes due to LLVM re-optimization of unchanged code.

Toolchain Limitations

The Rust toolchain available through Termux repositories sometimes lagged behind the latest stable release. Features needed for certain cryptographic crates were unavailable, requiring workarounds or alternative implementations. Building the toolchain from source was not feasible due to the resource constraints described above.

Current Status

Development on this module has been abandoned due to the unresolvable dependency conflict and compounding Termux constraints. The Web Crypto API provides adequate performance for current needs with hardware acceleration where available. The team has prioritized stability and feature development over the potential marginal gains from Rust migration.

The code remains in the repository for reference only. It is not used in production, not maintained, and should be considered experimental at best. No active development is planned for this module.

Lessons Learned

This experience provided valuable insights for future development efforts.

Dependency Auditing

Future Rust experiments should begin with a thorough audit of the entire dependency tree before committing to an implementation path. The cargo tree command reveals transitive dependencies that can introduce unexpected constraints:

```bash
cargo tree --invert nalgebra
```

This shows which crates depend on nalgebra and their version requirements, allowing early identification of potential conflicts.

Version Pinning

When working with cryptographic libraries, pinning to specific versions and testing compatibility before deeper integration is essential. The Cargo.lock file should be committed to ensure reproducible builds and to prevent unexpected dependency updates from breaking the build.

Termux Limitations

The Rust ecosystem's approach of recompiling all dependencies from source makes it poorly suited for resource-constrained environments like Termux. Precompiled binaries would be preferable, but the WebAssembly target and the need for optimization make precompilation impractical. Future Rust work should be conducted on development machines with adequate resources, with Termux used only for deployment testing.

Alternative Approaches

If Rust integration is reconsidered in the future, alternative approaches should be evaluated:

Precompiled WebAssembly Modules: Compile Rust to WebAssembly on a development machine and distribute the binary module. This avoids compilation on the target device but complicates the build pipeline and version management.

FFI to System Libraries: Use Rust's C FFI to call into system cryptographic libraries, reducing the dependency tree. This trades dependency complexity for platform-specific integration work.

Limited Scope: Restrict Rust usage to a small, audited set of cryptographic primitives with minimal dependencies, rather than attempting to replace the entire encryption layer.

Ecosystem Maturity

The Rust cryptographic ecosystem, while robust, still experiences dependency churn and API evolution. Projects requiring long-term stability should carefully evaluate dependency update policies and consider vendoring dependencies to prevent unexpected breakage.

Conclusion

The Rust experiment demonstrated both the potential and the practical challenges of integrating Rust into a Termux-developed web application. While the performance and safety benefits remain attractive, the dependency resolution failures and compilation constraints proved insurmountable in this context. The Web Crypto API, with its guaranteed compatibility and zero build time, remains the pragmatic choice for this project. Future work may revisit Rust integration if toolchain improvements or reduced dependency complexity make it feasible, but no immediate plans exist.


```
