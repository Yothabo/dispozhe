# Driflly - Ephemeral, Encrypted Conversations That Vanish

Driflly is a privacy-first communication platform where conversations are ephemeral by design. No data stored. No identity required. End-to-end encrypted. Built entirely on mobile devices using Termux, Driflly demonstrates that complex web applications can be developed anywhere, on any device, without sacrificing security or performance.

## Current Working Features

### Core Functionality

End-to-end encryption is implemented using AES-256-GCM through the Web Crypto API. Keys are generated on user devices and never transmitted to servers, ensuring that message content remains private between participants. The zero-knowledge relay architecture means the server forwards encrypted messages between participants without ever seeing plaintext content. Replay protection is enforced through HMAC signing, sequence numbering, and nonce tracking, preventing attackers from resending captured messages. One-time access is managed through six-digit codes that expire after thirty seconds or single-use links that become invalid immediately after first use. Sessions automatically self-destruct after the configured duration, which can range from one minute to twenty-four hours, and either participant can manually terminate a session at any time, immediately deleting all associated data.

### Current Mode

Duo mode provides private two-person ephemeral chats with complete functionality including message exchange, typing indicators, read receipts, and file sharing for images up to ten megabytes. The interface is optimized for mobile devices with responsive design and touch-friendly interactions.

### Performance Metrics

The system handles one hundred concurrent sessions with one hundred percent success rate under stress tests, achieving eighty requests per second throughput with sub-second response times for mixed API calls. The connection pool is configured for fifty connections with one hundred overflow, eliminating previous timeout issues. These numbers are verified through real_api_stress.py which runs against a live server instance.

## Architecture Overview

The frontend is built with React 18 and TypeScript, using Vite 5 for fast development and optimized builds. Tailwind CSS 3 provides styling, while the Web Crypto API handles client-side encryption. WebSocket connections enable real-time communication with the backend. Custom hooks encapsulate complex logic such as message handling, timer management, and termination flows. State management is layered appropriately, with session-specific state in custom hooks, WebSocket state in services, and UI state in components.

The backend runs on FastAPI 0.115 with Python, using SQLite for minimal session metadata storage. No message content is ever written to disk. The WebSocket Manager handles connection pooling and message routing, while the replay protection module ensures message integrity. A background expiry scheduler runs every sixty seconds to automatically clean up expired sessions. The connection pool is configured based on stress test results, demonstrating data-driven operations.

## Development Environment

Driflly is engineered to be developed entirely on mobile devices using Termux. This constraint has shaped every architectural decision to optimize for memory, storage, and network limitations. Memory optimization is achieved through splitting build processes into smaller chunks, configuring development servers with lower memory footprints, maintaining a minimal dependency philosophy, and optimizing WebSocket connections for memory efficiency. Storage efficiency is maintained through regular cleanup scripts, SQLite with automatic VACUUM operations, and compressed asset delivery. Network resilience is ensured through exponential backoff for reconnection attempts, message queuing for offline scenarios, heartbeat intervals of twenty-five seconds to detect stale connections, and graceful degradation on slow connections.

## Installation

### Frontend Setup

To set up the frontend, navigate to the frontend directory and install dependencies using npm install. Copy the environment example file to create your configuration with cp .env.example .env and edit the file with your specific settings. Start the development server with npm run dev, which will make the frontend available at http://localhost:3000.

### Backend Setup

For the backend, navigate to the backend directory and create a Python virtual environment using python -m venv venv. Activate the virtual environment with source venv/bin/activate on Unix systems or venv\Scripts\activate on Windows. Install dependencies with pip install -r requirements.txt. Copy the environment example file with cp .env.example .env and edit as needed. Start the server with python app.py, which will run on http://localhost:8080.

## Testing

### Frontend Tests

The frontend test suite can be run from the frontend directory. Use npm test to run all tests, npm run test:api for API endpoint tests, npm run test:ws for WebSocket functionality tests, and npm run test:encryption for encryption and decryption tests. Test coverage reports are generated with npm run test:coverage. All thirty-four tests pass consistently.

### Backend Tests

Backend tests are run from the backend directory using pytest. Execute pytest tests/ -v to run all tests with verbose output, pytest tests/test_security/ -v for security-specific tests including replay protection, and python tests/load/real_api_stress.py to run stress tests against the real server. All fourteen security tests pass consistently.

## Project Status

### Implemented Features

End-to-end encryption with AES-256-GCM ensures that all messages are encrypted before leaving the client device. The zero-knowledge message relay transforms the backend into a pure conduit that never inspects message content. Replay protection includes HMAC signing, sequence numbering, and nonce tracking, with feature flags for safe gradual rollout. The comprehensive test suite includes over forty-eight passing tests, including stress tests that validate the system handles one hundred concurrent sessions.

### In Progress

Documentation alignment ensures all documentation accurately reflects the current codebase state. Mobile user experience improvements focus on keyboard handling and touch interactions. File sharing expansion will add support for additional file types.

### Future Development

Planned enhancements include group mode for small multi-participant sessions, live board for classroom and meeting engagement, broadcast for one-to-many announcements, drop for self-destructing file transfer, and whisper for micro-messages that disappear after reading. Enhanced file sharing will support all common file types with appropriate preview capabilities. Read receipt enhancements will provide more detailed delivery information. Session extensions and resumption will allow conversations to continue beyond initial time limits and survive brief network interruptions.

## Security Considerations

The security model is based on several principles. Encryption keys never leave client devices, preventing server-side decryption. Message content is never stored, eliminating historical data exposure. Access codes expire after thirty seconds and are single-use, limiting brute force opportunities. Rate limiting prevents enumeration attacks. Users should be aware that screenshots can be taken by participants, devices may cache data outside the application, and network traffic metadata may be visible to internet service providers.

## Documentation

The project documentation includes an API reference at docs/API.md detailing all available endpoints and WebSocket messages. The architecture overview at docs/ARCHITECTURE.md provides a deep dive into system design decisions. Security policies and practices are documented in docs/SECURITY.md. The development roadmap at docs/ROADMAP.md outlines planned features and timelines. Contribution guidelines are available in docs/CONTRIBUTING.md, and the code of conduct is at docs/CODE_OF_CONDUCT.md.

## License

This project is licensed under the MIT License. See the LICENSE file in the docs directory for complete terms.

## Contact

For general questions and support, email contact@driflly.app. Security issues should be reported to security@driflly.app. The source code is available on GitHub at github.com/Yothabo/dispozhe.
