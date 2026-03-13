```
# Driflly

[![Tests](https://github.com/Yothabo/dispozhe/actions/workflows/test.yml/badge.svg)](https://github.com/Yothabo/dispozhe/actions/workflows/test.yml)
[![GitHub release](https://img.shields.io/github/v/release/Yothabo/dispozhe)](https://github.com/Yothabo/dispozhe/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Yothabo/dispozhe/blob/main/CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/Yothabo/dispozhe/blob/main/CODE_OF_CONDUCT.md)
[![GitHub issues](https://img.shields.io/github/issues/Yothabo/dispozhe)](https://github.com/Yothabo/dispozhe/issues)
[![GitHub stars](https://img.shields.io/github/stars/Yothabo/dispozhe)](https://github.com/Yothabo/dispozhe/stargazers)

Ephemeral, encrypted two-person conversations that self-destruct. No data stored. No identity required. End-to-end encrypted. Built entirely on mobile devices using Termux.

[Documentation](docs/README.md) • [API Reference](docs/API.md) • [Architecture](docs/ARCHITECTURE.md) • [Security](docs/SECURITY.md) • [Roadmap](docs/ROADMAP.md) • [Contributing](CONTRIBUTING.md)

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Experimental Components](#experimental-components)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## About

Driflly is a privacy-first communication platform where conversations are ephemeral by design. Messages are encrypted with AES-256-GCM using the Web Crypto API, keys never leave client devices, and the server acts as a zero-knowledge relay that never sees plaintext content. Sessions automatically self-destruct after a configured duration ranging from one minute to twenty-four hours.

The project was developed entirely on Android devices using Termux, which imposed architectural constraints that ultimately made the production system more robust. Memory limitations forced efficient code splitting, storage constraints mandated minimal dependencies, and network variability led to resilient reconnection logic with exponential backoff. The system handles one hundred concurrent sessions with one hundred percent success rate under stress tests, achieving eighty requests per second throughput with sub-second response times.

---

## Features

### Core Functionality

- **End-to-end encryption** with AES-256-GCM using the Web Crypto API. Keys are generated on user devices and never transmitted to servers, ensuring that message content remains private between participants. The zero-knowledge relay architecture means the server forwards encrypted messages between participants without ever seeing plaintext content.

- **Replay protection** enforced through HMAC signing, sequence numbering, and nonce tracking. Each message includes a sequence number that increments with every message sent, a unique nonce generated per message, and an HMAC-SHA256 signature computed over the encrypted data, sequence, and nonce. These fields enable the backend to validate message integrity and detect replay attacks.

- **One-time access** via six-digit codes that expire after thirty seconds or single-use links that become invalid immediately after first use. Access codes are cryptographically secure and effectively random, with a thirty-second validity window that limits brute force opportunities.

- **Automatic session destruction** after configurable duration ranging from one minute to twenty-four hours. Sessions terminate automatically when the timer expires, permanently deleting all associated data from memory. Manual termination is also available and immediately deletes all session data, notifying the other participant.

### User Experience

- **Duo mode** provides private two-person ephemeral chats with complete functionality including message exchange, typing indicators, read receipts, and file sharing for images up to ten megabytes. The interface is optimized for mobile devices with responsive design and touch-friendly interactions.

- **Mobile keyboard handling** ensures that when the keyboard appears, only the input bar moves upward while the header and message list remain stationary, providing a smooth experience identical to WhatsApp and other modern messaging applications. This is achieved through fixed positioning of the input bar with a bottom value that matches the keyboard height detected via the visualViewport API.

- **Timer display** shows time remaining in the session, updating in real-time. When less than thirty seconds remain, the timer turns yellow. At ten seconds, it turns red. Users can extend the session by clicking the timer and selecting additional minutes.

- **Termination flow** includes a modal showing the destruction process with animated steps when a user initiates termination. The session is deleted from the backend, and both participants are redirected to a session destroyed view with options to start a new chat or return home.

---

## Architecture Overview

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite 5 for fast development and optimized builds. Tailwind CSS 3 provides styling, while the Web Crypto API handles client-side encryption. WebSocket connections enable real-time communication with the backend.

Custom hooks encapsulate complex logic throughout the application:

```typescript
// Message management with deduplication and status tracking
const { messages, addMessage, updateMessageStatus } = useChatMessages(sessionId);

// Timer synchronization with backend
const { timeLeft, formatTime } = useChatTimer(initialDuration);

// Termination flow with visual feedback
const { isTerminating, handleTerminate } = useChatTermination(sessionId);

// WebSocket connection lifecycle with exponential backoff
useWebSocketConnection({ sessionId, onConnected, onReconnecting });
```

State management is layered appropriately, with session-specific state in custom hooks, WebSocket state in services, and UI state in components. This separation ensures predictable behavior and maintainable code.

Backend Architecture

The backend runs on FastAPI 0.115 with Python, using SQLite for minimal session metadata storage. No message content is ever written to disk. The WebSocket Manager handles connection pooling and message routing with the following core implementation:

```python
class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.message_handler = MessageHandler()
        self.connection_handler = ConnectionHandler()

    async def send_message(self, session_id: str, message_data: dict, sender: WebSocket):
        recipients = self.connections.get(session_id, set()) - {sender}
        for recipient in recipients:
            await recipient.send_text(json.dumps(message_data))
```

The replay protection module ensures message integrity through HMAC validation, sequence number tracking, and nonce deduplication:

```python
class ReplayProtection:
    def validate_message(self, session_id: str, client_id: str, message: dict) -> bool:
        # Check sequence number monotonicity
        if message.sequence <= self.sequences[session_id][client_id]:
            return False
        
        # Verify nonce uniqueness within expiry window
        if message.nonce in self.seen_nonces[session_id]:
            return False
        
        # Validate HMAC signature
        expected = self.generate_hmac(session_id, message.data, message.sequence, message.nonce)
        return hmac.compare_digest(message.hmac, expected)
```

A background expiry scheduler runs every sixty seconds to automatically clean up expired sessions. The connection pool is configured for fifty connections with one hundred overflow, settings derived from stress testing rather than guesswork.

---

Quick Start

Backend Setup

```bash
git clone https://github.com/Yothabo/dispozhe.git
cd dispozhe/backend

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your configuration

uvicorn app:app --reload --port 8080
```

The backend will be available at http://localhost:8080 with API documentation at http://localhost:8080/docs.

Frontend Setup

```bash
cd dispozhe/frontend

npm install
cp .env.example .env
# Edit .env with your configuration (defaults to localhost:8080)

npm run dev
```

The frontend will be available at http://localhost:3000.

Production Configuration

For production deployment, additional environment variables should be configured.

Backend environment variables:

```bash
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
DATABASE_URL=sqlite:///./chatlly.db  # Or PostgreSQL URL
```

Frontend environment variables:

```bash
VITE_API_URL=https://your-backend-domain.com
VITE_WS_URL=wss://your-backend-domain.com
VITE_STREAM_API_KEY=your-stream-key-if-used
```

---

Documentation

Core Documentation

Document Description Link
API Reference Complete API endpoint and WebSocket documentation with examples docs/API.md
Architecture Overview System design, data flow, and component interactions docs/ARCHITECTURE.md
Security Policy Threat model, encryption standards, and vulnerability reporting docs/SECURITY.md
Roadmap Planned features, timelines, and technology evaluations docs/ROADMAP.md

Development Documentation

Document Description Link
Contributing Guidelines How to contribute, code standards, and PR process CONTRIBUTING.md
Code of Conduct Community guidelines and enforcement CODE_OF_CONDUCT.md
Changelog Version history and release notes CHANGELOG.md
Deployment Guide Production deployment instructions DEPLOYMENT.md

Analysis and Design

Document Description Link
Technical Analysis Comprehensive codebase assessment docs/ANALYSIS.md
Internal Dossier Termux-first architecture deep dive docs/INTERNAL_DOSSIER.md
Manifesto Privacy philosophy and design principles docs/MANIFESTO.md

---

Technology Stack

Frontend Technologies

https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white
https://img.shields.io/badge/Web_Crypto_API-FF6C2C?style=for-the-badge&logo=webcryptoapi&logoColor=white

Backend Technologies

https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white
https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white
https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white
https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white

DevOps & Infrastructure

https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white
https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white
https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white
https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white

Development Tools

https://img.shields.io/badge/Termux-000000?style=for-the-badge&logo=terminal&logoColor=white
https://img.shields.io/badge/Vim-019733?style=for-the-badge&logo=vim&logoColor=white
https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white
https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white
https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=white
https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white

---

Testing

Backend Security Tests

```bash
cd backend
PYTHONPATH=. pytest tests/test_security/ -v
```

All fourteen replay protection tests pass consistently, validating HMAC generation, sequence number tracking, nonce validation, and session cleanup.

Frontend Unit Tests

```bash
cd frontend
npm run test:encryption
```

Fourteen encryption tests verify that messages encrypt and decrypt correctly, different keys produce different ciphertext, tampered messages are rejected, and key import/export functions properly.

Frontend Integration Tests

```bash
# Terminal 1: Start backend server
cd backend
uvicorn app:app --reload --port 8080

# Terminal 2: Run integration tests
cd frontend
npm run test:api
npm run test:ws
npm run test:termination
```

Nineteen integration tests validate API endpoints, WebSocket connections, message exchange, typing indicators, and session termination flows.

Stress Tests

```bash
cd backend
python tests/load/real_api_stress.py
```

Stress tests verify that the system handles one hundred concurrent sessions with one hundred percent success rate, achieving eighty requests per second throughput with sub-second response times.

---

Deployment

Backend Deployment on Render

The backend is configured for deployment on Render using the included render.yaml:

```yaml
services:
  - type: web
    name: dispozhe
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

· ENVIRONMENT=production
· ALLOWED_ORIGINS=https://your-frontend-domain.com
· DATABASE_URL=sqlite:///./chatlly.db (or PostgreSQL URL for production)

Frontend Deployment on Vercel

The frontend is configured for deployment on Vercel using the included vercel.json:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Required environment variables:

· VITE_API_URL=https://your-backend-domain.com
· VITE_WS_URL=wss://your-backend-domain.com

GitHub Actions CI/CD

The project includes a complete CI/CD pipeline in .github/workflows/test.yml that:

1. Runs backend security tests (14 tests)
2. Runs frontend unit tests (14 tests)
3. Runs frontend integration tests with a live backend (19 tests)
4. Executes stress tests against a real server
5. Deploys to Render on successful main branch builds
6. Deploys to Vercel on successful main branch builds
7. Creates GitHub releases with auto-generated release notes

Required secrets for GitHub Actions:

· RENDER_API_KEY and RENDER_SERVICE_ID for Render deployment
· VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID for Vercel deployment
· RELEASE_TOKEN for GitHub releases

---

Security Considerations

In Scope

The system protects against several threat vectors:

· Server compromise does not expose message content because encryption keys never leave client devices and messages are never stored
· Network eavesdroppers cannot read message content because all traffic is encrypted end-to-end
· Replay attacks are prevented through sequence numbers and nonce tracking with five-minute expiry windows
· Brute force attacks against access codes are mitigated through rate limiting (five attempts per minute per IP) and short code expiry windows (thirty seconds)

Out of Scope

Certain threats are outside the system's control:

· Device compromise where an attacker has access to the user's device cannot be prevented
· Screenshots can be taken by participants and cannot be technically blocked
· Network traffic metadata such as connection times and IP addresses may be visible to internet service providers
· Code enumeration is theoretically possible within the one million code space, though rate limiting and expiry windows make this impractical

Replay Protection Implementation

Each message includes security fields validated by the server before forwarding:

```json
{
  "type": "message",
  "id": "unique-message-id",
  "data": "base64-encrypted-content",
  "keyId": "key-identifier",
  "sequence": 42,
  "nonce": "unique-nonce-value",
  "hmac": "sha256-signature",
  "timestamp": 1741018496000
}
```

The server validates:

· Sequence numbers are strictly increasing per client
· Nonces are unique within the five-minute expiry window
· HMAC signatures match the computed value using the session secret

---

Experimental Components

Rust Encryption Module

The encryption-rust/ directory contains experimental Rust code for potential WebAssembly-based encryption performance improvements. This module is not used in production and is maintained for research purposes only.

Read the detailed analysis →

Why it failed: The experiment encountered unresolvable dependency conflicts with older versions of the nalgebra library being pulled in as transitive dependencies. Version 0.5.1 of nalgebra had a malformed Cargo.toml that prevented Cargo from resolving the dependency graph. Attempts to patch or update the dependencies were unsuccessful due to API compatibility issues. The Termux development environment compounded these difficulties with memory exhaustion during compilation, cross-compilation complexity, and build times exceeding forty-five minutes per attempt.

Stream Chat Integration

The stream-chat dependency appears in requirements.txt but is not used in production. Stream Chat is architecturally incompatible with Driflly's zero-knowledge, ephemeral messaging model because it requires message persistence and server-managed encryption keys.

Read the detailed analysis →

Why it's not used: Stream Chat is designed around message persistence and history, which directly contradicts Driflly's ephemeral architecture. The platform stores messages on its servers to enable search, channel history, and thread replies. Stream Chat's encryption model uses server-managed keys, which violates Driflly's zero-knowledge promise where keys never leave client devices. Integrating Stream Chat would require fundamental compromises to the security model.

---

Contributing

Contributions are welcome. Please read the Contributing Guidelines and Code of Conduct first.

Development Workflow

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Make your changes
4. Run tests to ensure everything passes
5. Commit your changes (git commit -m 'Add amazing feature')
6. Push to the branch (git push origin feature/amazing-feature)
7. Open a Pull Request

Code Standards

· Python: Follow PEP 8 with Black formatting (88 character line limit)
· TypeScript: Use strict mode, no any types, explicit interfaces
· React: Use functional components with hooks, extract complex logic into custom hooks
· Styling: Use Tailwind CSS classes, avoid custom CSS
· Testing: Include tests for new features, maintain coverage above eighty percent

---

License

This project is licensed under the MIT License. See the LICENSE file for details.

```
MIT License

Copyright (c) 2026 Yothabo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

Acknowledgments

Built with privacy as the primary requirement. Inspired by the need for truly ephemeral communication. Special thanks to all contributors and the open source community.

The project was developed entirely on Android devices using Termux, demonstrating that complex web applications can be built anywhere, on any device, without sacrificing security or performance.

---

Contact

· General questions: contact@driflly.app
· Security issues: security@driflly.app
· GitHub: Yothabo/dispozhe
· Documentation: docs/README.md

---

Quick Links

https://img.shields.io/badge/Documentation-4285F4?style=for-the-badge&logo=readthedocs&logoColor=white
https://img.shields.io/badge/API_Reference-FF6F00?style=for-the-badge&logo=swagger&logoColor=white
https://img.shields.io/badge/Security-FF0000?style=for-the-badge&logo=security&logoColor=white
https://img.shields.io/badge/Contributing-28A745?style=for-the-badge&logo=git&logoColor=white
https://img.shields.io/badge/License-FFD700?style=for-the-badge&logo=open-source-initiative&logoColor=black

---

Built with privacy. Destroyed by design.

```


