# Driflly Internal Dossier

## Development Environment: Termux-First Architecture

Driflly is uniquely engineered to be developed, built, and run entirely on mobile devices using Termux. This is not an afterthought — it is the primary development environment that has shaped every architectural decision.

### Termux Constraints and Solutions

#### Memory Limitations
Mobile devices have limited RAM compared to traditional development machines. The entire codebase is optimized for memory-constrained environments:

* Build processes are split into smaller chunks
* Development servers are configured with lower memory footprints
* Heavy dependencies are avoided or replaced with lighter alternatives
* WebSocket connections are optimized to use minimal memory per connection

#### Storage Constraints
Termux environments have limited storage space. The project addresses this through:

* Minimal dependency philosophy — only essential packages
* Efficient caching strategies to reduce disk usage
* Regular cleanup scripts to remove temporary files
* SQLite database with automatic VACUUM operations
* Compressed asset delivery and optimized bundle sizes

#### CPU Limitations
Mobile processors, especially on Android, have different performance characteristics:

* Asynchronous operations are prioritized over synchronous ones
* CPU-intensive tasks (encryption) are optimized and minimized
* Background jobs are throttled to prevent UI thread blocking
* WebSocket heartbeats use efficient intervals (25 seconds)
* Polling intervals are carefully tuned (2 seconds for status)

#### Network Constraints
Mobile networks can be unreliable with variable latency:

* Exponential backoff for reconnection attempts
* Message queuing for offline scenarios
* Optimized WebSocket frame sizes
* Compression for large messages (images, files)
* Graceful degradation when connections are slow

### Tech Stack Influenced by Environment

#### Frontend: React + TypeScript + Vite
Vite was chosen specifically for its fast development server startup and hot module replacement, which works exceptionally well on Termux. React was selected for its component model that allows for efficient code splitting and lazy loading — crucial for memory-constrained environments.

#### Backend: FastAPI + Python
Python was chosen because it runs reliably on Termux. FastAPI was selected for its async capabilities, allowing the server to handle multiple connections efficiently without spawning many threads (which would consume memory). The async/await pattern is particularly well-suited for the I/O-bound nature of WebSocket applications.

#### Database: SQLite
SQLite is the only database that makes sense in this environment:
* No separate database server process — saves memory
* File-based — easy to backup and restore on mobile
* Zero configuration — works out of the box in Termux
* ACID compliant — ensures data integrity without complexity
* Lightweight — minimal storage and memory footprint

#### Build Tools: Vite over Webpack
Vite was chosen over Webpack because:
* Faster cold starts in Termux
* ESBuild for lightning-fast transforms
* Smaller node_modules footprint
* Better memory management during builds

### Mobile-First Design Philosophy

#### Responsive by Default
Every component is designed mobile-first, then scaled up for larger screens. This ensures that the Termux development experience matches the production user experience.

#### Touch-Friendly Interactions
* All interactive elements are at least 44x44px
* Gestures are simple and intuitive
* Modal bottom sheets for mobile interactions
* Back button handling for Android devices

#### Offline-First Mentality
* Messages queue when connection drops
* Session state persists in memory
* Reconnection logic with exponential backoff
* Graceful degradation of features when offline

#### Performance Budgets
* Initial JS bundle: < 250KB gzipped
* CSS bundle: < 50KB gzipped
* Time to interactive: < 3 seconds on mobile
* Memory usage: < 100MB per session
* WebSocket frame size: < 1KB for text messages

### Development Workflow in Termux

#### Terminal-Based Development
All development happens in the Termux terminal:
* Vim/Neovim for code editing
* Git for version control
* Python virtual environments
* Node.js/npm for frontend builds
* Screen/tmux for process management

#### Testing Strategy
Tests are optimized to run on mobile:
* Unit tests run quickly with minimal memory
* Integration tests use mocked services where possible
* WebSocket tests use local connections
* Load tests are scaled for mobile hardware

#### Deployment Pipeline
Builds are optimized for mobile environments:
* Assets are compressed before bundling
* Source maps are generated but not deployed
* Production builds use aggressive minification
* Tree shaking eliminates dead code

### Architectural Decisions Influenced by Termux

#### WebSocket Manager
The WebSocket manager is designed to handle connection instability common on mobile networks:
* Automatic reconnection with exponential backoff
* Message queuing when disconnected
* Heartbeat every 25 seconds to keep connections alive
* Connection pooling to manage resources

#### Code Generator
The 6-digit code system was chosen over complex URLs because:
* Easier to type on mobile keyboards
* Shorter, more memorable
* Works even when links can't be shared
* Expires quickly (30 seconds) for security

#### Session Management
Sessions are designed to be lightweight:
* In-memory only — no disk writes for active sessions
* Automatic cleanup on expiry
* Manual termination with visual feedback
* Participant tracking without storing identities

#### File Handling
File transfers are optimized for mobile:
* 10MB size limit (mobile network friendly)
* Base64 encoding for WebSocket transport
* View-once option for sensitive files
* Automatic cleanup after viewing

### Monitoring and Observability

#### Performance Monitoring
* Custom hooks track component render times
* WebSocket latency monitoring
* Memory usage tracking per session
* Build time analytics

#### Error Tracking
* Error boundaries catch component errors
* WebSocket errors are logged and retried
* API failures trigger fallback behaviors
* User-friendly error messages

#### Analytics
Anonymized usage data:
* Session duration
* Message count
* File transfer sizes
* Connection stability metrics

No personal data is ever collected or stored.

### Future Optimizations

#### Planned Improvements
* WebAssembly modules for encryption (faster, lower memory)
* Service workers for offline support
* IndexedDB for better offline queuing
* WebRTC for peer-to-peer file transfer
* React Native for native mobile apps

#### Ongoing Challenges
* Balancing memory usage with features
* Maintaining fast builds in Termux
* Handling diverse Android versions
* Supporting different screen sizes
* Ensuring consistent WebSocket behavior

### Lessons Learned

#### What Worked Well
* Vite + React + TypeScript on Termux
* FastAPI with async/await for WebSockets
* SQLite for lightweight data storage
* Exponential backoff for reconnections
* Message queuing for offline scenarios

#### What We'd Do Differently
* More aggressive code splitting earlier
* Better test isolation from the start
* Simpler state management
* Fewer dependencies from the beginning
* More comprehensive error tracking

### Conclusion

Driflly is proof that complex web applications can be developed entirely on mobile devices. Every architectural decision was made with Termux constraints in mind, resulting in a lean, efficient, and privacy-focused application that runs anywhere.

The Termux-first approach has forced us to write better code, use fewer dependencies, and think carefully about every byte. This discipline has made Driflly not just a mobile-first application, but a truly portable one — it can be developed and run anywhere, on any device, with minimal resources.

The result is an application that respects not only user privacy but also device constraints, making it accessible to anyone with a smartphone, regardless of its age or capabilities.
