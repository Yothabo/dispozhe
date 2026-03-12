# Driflly - Ephemeral, Encrypted Conversations That Vanish

Driflly is a privacy-first communication platform where conversations are ephemeral by design. No data stored. No identity required. End-to-end encrypted. Built entirely on mobile devices using Termux, Driflly proves that complex web applications can be developed anywhere, on any device.

## Current Working Features

### Core Functionality

End-to-end encryption is implemented using AES-256-GCM through the Web Crypto API. Keys are generated on user devices and never transmitted to servers, ensuring that message content remains private between participants. The zero-knowledge relay architecture means the server forwards encrypted messages between participants without ever seeing plaintext content. Replay protection is enforced through HMAC signing, sequence numbering, and nonce tracking, preventing attackers from resending captured messages. One-time access is managed through six-digit codes that expire after 30 seconds or single-use links that become invalid immediately after first use. Sessions automatically self-destruct after the configured duration, which can range from 1 minute to 24 hours, and either participant can manually terminate a session at any time, immediately deleting all associated data.

### Current Mode

Duo mode provides private two-person ephemeral chats with complete functionality including message exchange, typing indicators, read receipts, and file sharing for images up to 10MB.

### Performance Metrics

The system handles 100+ concurrent sessions with 100% success rate under stress tests, achieving 80+ requests per second throughput with sub-second response times for mixed API calls. The connection pool is configured for 50 connections with 100 overflow, eliminating previous timeout issues.

## Architecture Overview

The frontend is built with React 18 and TypeScript, using Vite 5 for fast development and optimized builds. Tailwind CSS 3 provides styling, while the Web Crypto API handles client-side encryption. WebSocket connections enable real-time communication with the backend.

The backend runs on FastAPI 0.115 with Python, using SQLite for minimal session metadata storage. No message content is ever written to disk. The WebSocket Manager handles connection pooling and message routing, while the replay protection module ensures message integrity. A background expiry scheduler automatically cleans up expired sessions.

## Development Environment

Driflly is engineered to be developed entirely on mobile devices using Termux. This constraint has shaped every architectural decision to optimize for memory, storage, and network limitations.

Memory optimization is achieved through splitting build processes into smaller chunks, configuring development servers with lower memory footprints, maintaining a minimal dependency philosophy, and optimizing WebSocket connections for memory efficiency. Storage efficiency is maintained through regular cleanup scripts, SQLite with automatic VACUUM operations, and compressed asset delivery. Network resilience is ensured through exponential backoff for reconnection attempts, message queuing for offline scenarios, heartbeat intervals of 25 seconds to detect stale connections, and graceful degradation on slow connections.

## Installation

### Frontend Setup

To set up the frontend, navigate to the frontend directory and install dependencies using npm install. Copy the environment example file to create your configuration with cp .env.example .env and edit the file with your specific settings. Start the development server with npm run dev, which will make the frontend available at http://localhost:3000.

### Backend Setup

For the backend, navigate to the backend directory and create a Python virtual environment using python -m venv venv. Activate the virtual environment with source venv/bin/activate on Unix systems or venv\Scripts\activate on Windows. Install dependencies with pip install -r requirements.txt. Copy the environment example file with cp .env.example .env and edit as needed. Start the server with python app.py, which will run on http://localhost:8080.

## Testing

### Frontend Tests

The frontend test suite can be run from the frontend directory. Use npm test to run all tests, npm run test:api for API endpoint tests, npm run test:ws for WebSocket functionality tests, and npm run test:encryption for encryption and decryption tests. Test coverage reports are generated with npm run test:coverage.

### Backend Tests

Backend tests are run from the backend directory using pytest. Execute pytest tests/ -v to run all tests with verbose output, pytest tests/test_security/ -v for security-specific tests including replay protection, and python tests/load/real_api_stress.py to run stress tests against the real server.

## Project Status

### Implemented Features

Days 1 and 2 established end-to-end encryption with AES-256-GCM, ensuring that all messages are encrypted before leaving the client device. Day 3 implemented the zero-knowledge message relay, transforming the backend into a pure conduit that never inspects message content. Day 7 added comprehensive replay protection including HMAC signing, sequence numbering, and nonce tracking, with feature flags for safe gradual rollout. Day 8 delivered a comprehensive test suite with over 48 passing tests, including stress tests that validate the system handles 100+ concurrent sessions.

### In Progress

Day 9 focuses on documentation alignment and cleanup, ensuring all documentation accurately reflects the current codebase state and removing references to unimplemented features.

### Future Development

Planned enhancements include additional conversation modes such as Group for small multi-participant sessions, Live Board for classroom and meeting engagement, Broadcast for one-to-many announcements, Drop for self-destructing file transfer, and Whisper for micro-messages that disappear after reading. Enhanced file sharing will support all common file types with appropriate preview capabilities. Read receipt enhancements will provide more detailed delivery information. Session extensions and resumption will allow conversations to continue beyond initial time limits and survive brief network interruptions.

## Known Limitations

File sharing is currently limited to images with a maximum size of 10MB. The Termux development environment may experience performance constraints on older or lower-powered Android devices. Some features documented in aspirational documents like the Manifesto and Roadmap are not yet implemented and represent future goals rather than current capabilities.

## Documentation

The project documentation includes an API reference at docs/API.md detailing all available endpoints and WebSocket messages. The architecture overview at docs/ARCHITECTURE.md provides a deep dive into system design decisions. Security policies and practices are documented in docs/SECURITY.md. The development roadmap at docs/ROADMAP.md outlines planned features and timelines. Contribution guidelines are available in docs/CONTRIBUTING.md, and the code of conduct is at docs/CODE_OF_CONDUCT.md.

## License

This project is licensed under the MIT License. See the LICENSE file in the docs directory for complete terms.

## Contact

For general questions and support, email contact@driflly.app. Security issues should be reported to security@driflly.app. The source code is available on GitHub at github.com/Yothabo/dispozhe.
