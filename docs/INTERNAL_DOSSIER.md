# Driflly Internal Dossier

## Development Environment: Termux-First Architecture

Driflly is uniquely engineered to be developed, built, and run entirely on mobile devices using Termux. This is not an afterthought — it is the primary development environment that has shaped every architectural decision.

### Termux Constraints and Solutions

#### Memory Limitations

Mobile devices have limited RAM compared to traditional development machines. The entire codebase is optimized for memory-constrained environments through several strategies. Build processes are split into smaller chunks to prevent memory exhaustion during compilation. Development servers are configured with lower memory footprints than typical defaults. Heavy dependencies are avoided or replaced with lighter alternatives. WebSocket connections are optimized to use minimal memory per connection, with each active session consuming only a few kilobytes for connection tracking and message queuing.

#### Storage Constraints

Termux environments have limited storage space, often sharing storage with other Android applications. The project addresses this through a minimal dependency philosophy that includes only essential packages. Efficient caching strategies reduce disk usage during development and builds. Regular cleanup scripts remove temporary files and old builds automatically. SQLite is configured with automatic VACUUM operations to prevent database bloat over time. Asset delivery is compressed and optimized to minimize both storage and bandwidth usage.

#### CPU Limitations

Mobile processors, especially on Android, have different performance characteristics than desktop CPUs. Asynchronous operations are prioritized over synchronous ones to prevent UI thread blocking. CPU-intensive tasks like encryption are optimized through the Web Crypto API which provides hardware-accelerated cryptography where available. Background jobs are throttled to prevent interference with the main application. WebSocket heartbeats use efficient intervals of 25 seconds to balance responsiveness with CPU usage. Polling intervals are carefully tuned to 2 seconds for status updates, providing good user experience without excessive CPU consumption.

#### Network Constraints

Mobile networks can be unreliable with variable latency and intermittent connectivity. Exponential backoff is implemented for reconnection attempts, starting with 1-second delays and doubling up to 30 seconds. Message queuing stores up to 100 messages per session for offline recipients, ensuring no messages are lost during temporary disconnections. WebSocket frame sizes are optimized to minimize bandwidth usage, with text messages typically under 1KB. Compression is applied to images before transmission, reducing file sizes by 50-80 percent. The system degrades gracefully on slow connections, with loading indicators and timeout notifications.

### Tech Stack Influenced by Environment

#### Frontend: React + TypeScript + Vite

Vite was chosen specifically for its fast development server startup and hot module replacement, which works exceptionally well on Termux where every second of compilation time matters. React was selected for its component model that allows for efficient code splitting and lazy loading, crucial for memory-constrained environments where loading entire applications at once would cause performance issues. TypeScript adds type safety without runtime overhead, catching errors at compile time rather than during testing on resource-limited devices.

#### Backend: FastAPI + Python

Python was chosen because it runs reliably on Termux with minimal setup requirements. FastAPI was selected for its async capabilities, allowing the server to handle multiple connections efficiently without spawning many threads that would consume memory. The async/await pattern is particularly well-suited for the I/O-bound nature of WebSocket applications, where most time is spent waiting for network operations rather than performing computations.

#### Database: SQLite

SQLite is the only database that makes sense in this environment. There is no separate database server process, saving significant memory compared to PostgreSQL or MySQL. The file-based nature makes backups and restores simple, allowing easy transfer of session data between devices. Zero configuration means it works out of the box in Termux without complex setup procedures. ACID compliance ensures data integrity without the complexity of a full database server. The lightweight design minimizes both storage and memory footprint, with the entire database often under 1MB even with thousands of session records.

#### Build Tools: Vite over Webpack

Vite was chosen over Webpack because it provides faster cold starts in Termux where every second of waiting time matters. ESBuild integration enables lightning-fast transforms, reducing build times from minutes to seconds. The smaller node_modules footprint saves precious storage space on mobile devices. Better memory management during builds prevents out-of-memory errors that were common with Webpack on resource-constrained devices.

### Mobile-First Design Philosophy

#### Responsive by Default

Every component is designed mobile-first, then scaled up for larger screens. This ensures that the Termux development experience matches the production user experience. Components are tested on small screens first, with media queries adding complexity for larger displays rather than removing features for smaller ones.

#### Touch-Friendly Interactions

All interactive elements are at least 44x44 pixels to accommodate finger tapping. Gestures are simple and intuitive, avoiding complex multi-touch sequences that might be difficult on small screens. Modal bottom sheets slide up from the bottom for mobile interactions, placing controls within easy reach of thumbs. Back button handling is implemented for Android devices, allowing users to navigate with hardware buttons as expected.

#### Offline-First Mentality

Messages queue automatically when the WebSocket connection drops, storing up to 100 messages per session in memory. Session state persists in memory during brief disconnections, allowing seamless resumption when connectivity returns. Reconnection logic implements exponential backoff to avoid hammering the server during network outages. Features degrade gracefully when offline, with clear indicators showing connection status and queued messages.

#### Performance Budgets

The initial JavaScript bundle is kept under 250KB gzipped through aggressive code splitting and lazy loading. CSS bundle size is under 50KB gzipped using Tailwind's purging to remove unused styles. Time to interactive is under 3 seconds on mobile devices through optimized loading sequences. Memory usage stays under 100MB per session through careful state management and cleanup. WebSocket frame size for text messages is typically under 1KB, minimizing bandwidth usage on mobile networks.

### Development Workflow in Termux

#### Terminal-Based Development

All development happens in the Termux terminal without graphical IDEs. Vim and Neovim serve as the primary code editors, configured with syntax highlighting and language server support for TypeScript and Python. Git manages version control through command-line operations. Python virtual environments isolate dependencies for the backend. Node.js and npm handle frontend builds and dependency management. Screen or tmux provide process management, allowing multiple terminal sessions for running the backend, frontend, and monitoring simultaneously.

#### Testing Strategy

Tests are optimized to run on mobile hardware with limited resources. Unit tests run quickly with minimal memory overhead, completing in seconds rather than minutes. Integration tests use mocked services where possible to avoid external dependencies. WebSocket tests use local connections to the development server, eliminating network latency. Load tests are scaled appropriately for mobile hardware, typically testing 100 concurrent sessions rather than thousands.

#### Deployment Pipeline

Builds are optimized for mobile environments throughout the pipeline. Assets are compressed before bundling to minimize transfer sizes. Source maps are generated during development but not deployed to production, saving bandwidth and storage. Production builds use aggressive minification with terser to reduce bundle sizes. Tree shaking eliminates dead code automatically, ensuring only used functions are included in the final bundle.

### Architectural Decisions Influenced by Termux

#### WebSocket Manager

The WebSocket manager is designed to handle connection instability common on mobile networks. Automatic reconnection with exponential backoff ensures the system recovers gracefully from temporary outages. Message queuing stores up to 100 messages per session when the recipient is disconnected, preventing data loss. Heartbeat messages every 25 seconds keep connections alive and detect stale connections promptly. Connection pooling manages resources efficiently, with each session consuming minimal memory.

#### Code Generator

The six-digit code system was chosen over complex URLs because codes are easier to type on mobile keyboards. Shorter codes are more memorable than long random strings. Codes work even when links cannot be shared through traditional channels, such as in voice conversations. The 30-second expiry window balances security with usability, giving users enough time to enter codes while limiting brute force opportunities.

#### Session Management

Sessions are designed to be lightweight with minimal resource consumption. Active sessions exist only in memory, with no disk writes for active conversations. Automatic cleanup on expiry ensures resources are freed promptly. Manual termination provides immediate deletion with visual feedback. Participant tracking uses simple counters without storing identities, preserving privacy while maintaining functionality.

#### File Handling

File transfers are optimized for mobile networks with a 10MB size limit that balances usability with bandwidth constraints. Base64 encoding for WebSocket transport avoids binary handling complexity. View-once option enhances privacy for sensitive files. Automatic cleanup after viewing ensures no traces remain. Compression reduces file sizes before transmission, typically achieving 50-80 percent reduction for images.

### Current Limitations

#### Feature Implementation

The current implementation supports only Duo mode for two-person conversations. Other modes described in aspirational documents are not yet implemented due to time and resource constraints. File sharing is limited to images, with other file types planned for future releases.

#### Technology Constraints

Encryption uses the Web Crypto API rather than WebAssembly due to compilation limitations in Termux. The WebAssembly toolchain proved difficult to set up and maintain on mobile devices, so the team opted for the more reliable native browser API. WebRTC peer-to-peer features are not implemented due to complexity and limited mobile support. Native mobile applications are not available, with the web app serving all platforms.

#### Day 4 Challenges

The planned Day 4 features including participant fingerprints, join handshake, and enhanced session metadata were not successfully implemented due to technical complexity and time constraints. The team decided to focus on core functionality and security features that provided immediate value rather than pushing forward with problematic implementations.

### Monitoring and Observability

#### Performance Monitoring

Custom hooks track component render times to identify performance bottlenecks. WebSocket latency monitoring measures round-trip times for heartbeat responses. Memory usage tracking per session helps identify leaks and optimization opportunities. Build time analytics ensure development remains efficient on mobile hardware.

#### Error Tracking

Error boundaries catch component errors gracefully, displaying user-friendly messages instead of blank screens. WebSocket errors are logged and trigger automatic reconnection attempts. API failures return appropriate HTTP status codes and trigger fallback behaviors. All errors are logged with context for debugging without exposing sensitive information.

#### Analytics

Anonymized usage data includes session duration, message count, file transfer sizes, and connection stability metrics. No personally identifiable information is ever collected. Session identifiers are random and cannot be linked to users. IP addresses are not logged. This minimal analytics approach provides operational insights while maintaining the privacy-first philosophy.

### Future Realistic Optimizations

#### Planned Improvements

Code splitting will be further optimized to reduce initial bundle size. Service workers may be evaluated for offline support, though mobile storage constraints are a concern. Message queuing could be enhanced with persistent storage for longer offline periods. Image compression algorithms may be tuned for better quality-to-size ratios.

#### Unplanned Technologies

WebAssembly encryption modules are not currently planned due to Termux compilation difficulties. WebRTC peer-to-peer file transfer is not on the roadmap due to complexity and limited mobile support. React Native mobile apps are not planned, with the web app serving all platforms. These technologies remain aspirational but are not actively being pursued.

### Lessons Learned

#### What Worked Well

Vite combined with React and TypeScript provides an excellent development experience on Termux, with fast builds and reliable hot reloading. FastAPI with async/await handles WebSocket connections efficiently, scaling well within Termux resource limits. SQLite offers lightweight data storage with minimal configuration, perfect for mobile development. Exponential backoff for reconnections handles network instability gracefully. Message queuing ensures no data loss during temporary disconnections.

#### What We Would Do Differently

More aggressive code splitting earlier would have improved initial load times. Better test isolation from the start would make the test suite more reliable. Simpler state management with fewer custom hooks would reduce complexity. Fewer dependencies from the beginning would minimize maintenance burden. More comprehensive error tracking would speed up debugging.

### Conclusion

Driflly demonstrates that complex web applications can be developed entirely on mobile devices. Every architectural decision was made with Termux constraints in mind, resulting in a lean, efficient, and privacy-focused application that runs anywhere. The Termux-first approach has forced the team to write better code, use fewer dependencies, and think carefully about every byte. This discipline has made Driflly not just a mobile-first application, but a truly portable one that can be developed and run anywhere, on any device, with minimal resources. The result is an application that respects not only user privacy but also device constraints, making it accessible to anyone with a smartphone regardless of its age or capabilities.
