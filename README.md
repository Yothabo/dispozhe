```markdown
# Driflly - Ephemeral, Encrypted Conversations That Vanish

Driflly is a privacy-first communication platform where conversations are ephemeral by design. No data stored. No identity required. End-to-end encrypted. Built entirely on mobile devices using Termux, Driflly demonstrates that complex web applications can be developed anywhere, on any device without sacrificing security or performance.

## Current Working Features

End-to-end encryption is implemented using AES-256-GCM through the Web Crypto API. Keys are generated on user devices and never transmitted to servers, ensuring that message content remains private between participants. The zero-knowledge relay architecture means the server forwards encrypted messages between participants without ever seeing plaintext content. Replay protection is enforced through HMAC signing, sequence numbering, and nonce tracking, preventing attackers from resending captured messages. One-time access is managed through six-digit codes that expire after thirty seconds or single-use links that become invalid immediately after first use. Sessions automatically self-destruct after the configured duration, which can range from one minute to twenty-four hours, and either participant can manually terminate a session at any time, immediately deleting all associated data.

Duo mode provides private two-person ephemeral chats with complete functionality including message exchange, typing indicators, read receipts, and file sharing for images up to ten megabytes. The interface is optimized for mobile devices with responsive design and touch-friendly interactions. When the keyboard appears on mobile, only the input bar moves upward while the header and message list remain stationary, providing a smooth experience identical to WhatsApp and other modern messaging applications.

The system handles one hundred concurrent sessions with one hundred percent success rate under stress tests, achieving eighty requests per second throughput with sub-second response times for mixed API calls. The connection pool is configured for fifty connections with one hundred overflow, eliminating previous timeout issues. These numbers are verified through `real_api_stress.py` which runs against a live server instance.

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

Development Environment

Driflly is engineered to be developed entirely on mobile devices using Termux. This constraint has shaped every architectural decision to optimize for memory, storage, and network limitations.

Memory Optimization

Memory optimization is achieved through splitting build processes into smaller chunks, configuring development servers with lower memory footprints, maintaining a minimal dependency philosophy, and optimizing WebSocket connections for memory efficiency. Each active session consumes approximately five to ten kilobytes for connection tracking and message queuing.

Storage Efficiency

Storage efficiency is maintained through regular cleanup scripts, SQLite with automatic VACUUM operations, and compressed asset delivery. The database stores only session metadata, never message content, keeping the total database size under one megabyte even with thousands of session records.

Network Resilience

Network resilience is ensured through exponential backoff for reconnection attempts, message queuing for offline scenarios, heartbeat intervals of twenty-five seconds to detect stale connections, and graceful degradation on slow connections. The reconnection logic follows this pattern:

```typescript
const attemptReconnect = () => {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
  
  setTimeout(() => {
    if (shouldReconnect) {
      connect(sessionId)
        .then(() => reconnectAttempts = 0)
        .catch(() => attemptReconnect());
    }
  }, delay);
};
```

Installation

Backend Setup

To set up the backend, navigate to the backend directory and create a Python virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies with pip install -r requirements.txt:

```bash
pip install -r requirements.txt
```

Copy the environment example file to create your configuration:

```bash
cp .env.example .env
```

Edit the .env file with your specific settings. The default configuration works for local development.

Start the server with python app.py:

```bash
python app.py
```

The backend will be available at http://localhost:8080 with API documentation at http://localhost:8080/docs.

Frontend Setup

To set up the frontend, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Copy the environment example file to create your configuration:

```bash
cp .env.example .env
```

Edit the .env file with your specific settings. For local development, the defaults point to localhost:8080.

Start the development server with npm run dev:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000.

Production Configuration

For production deployment, additional environment variables should be configured. The backend requires:

```bash
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
DATABASE_URL=sqlite:///./chatlly.db  # Or PostgreSQL URL
```

The frontend requires:

```bash
VITE_API_URL=https://your-backend-domain.com
VITE_WS_URL=wss://your-backend-domain.com
VITE_STREAM_API_KEY=your-stream-key-if-used
```

Testing

Frontend Tests

The frontend test suite can be run from the frontend directory. Use npm test to run all tests with Vitest:

```bash
cd frontend
npm test
```

Specific test suites are available:

```bash
npm run test:api        # API endpoint tests
npm run test:ws         # WebSocket functionality tests
npm run test:encryption # Encryption and decryption tests
```

Test coverage reports are generated with:

```bash
npm run test:coverage
```

All thirty-four frontend tests pass consistently.

Backend Tests

Backend tests are run from the backend directory using pytest:

```bash
cd backend
PYTHONPATH=. pytest tests/ -v
```

Security-specific tests, including replay protection validation, can be run with:

```bash
PYTHONPATH=. pytest tests/test_security/ -v
```

Stress tests against a real server instance require the backend to be running:

```bash
# Terminal 1: Start the server
uvicorn app:app --reload --port 8000

# Terminal 2: Run stress tests
python tests/load/real_api_stress.py
```

All fourteen security tests pass consistently, and stress tests achieve one hundred percent success rates with up to one hundred concurrent sessions.

Deployment

Backend Deployment on Render

The backend is configured for deployment on Render using the included render.yaml file. The service uses Python 3.13 with the following build and start commands:

```yaml
buildCommand: pip install -r requirements.txt
startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

Required environment variables for production:

```
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

Frontend Deployment on Vercel

The frontend is configured for deployment on Vercel using the included vercel.json file:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Required environment variables for production:

```
VITE_API_URL=https://your-backend-domain.com
VITE_WS_URL=wss://your-backend-domain.com
```

GitHub Actions CI/CD

The project includes a complete CI/CD pipeline in .github/workflows/test.yml that:

1. Runs backend security tests
2. Runs frontend unit tests
3. Runs frontend integration tests with a live backend
4. Executes stress tests against a real server
5. Deploys to Render and Vercel on successful main branch builds
6. Creates GitHub releases with auto-generated release notes

All secrets must be configured in the GitHub repository for deployment to work:

· RENDER_API_KEY and RENDER_SERVICE_ID for Render deployment
· VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID for Vercel deployment
· RELEASE_TOKEN for GitHub releases

Security Considerations

The security model is based on several principles. Encryption keys never leave client devices, preventing server-side decryption. Message content is never stored, eliminating historical data exposure. Access codes expire after thirty seconds and are single-use, limiting brute force opportunities. Rate limiting prevents enumeration attacks with five attempts per minute per IP address.

Users should be aware of inherent limitations:

· Screenshots can be taken by participants and cannot be technically blocked
· Devices may cache data outside the application at the operating system level
· Network traffic metadata such as connection times and IP addresses may be visible to internet service providers
· The six-digit code space of one million combinations is theoretically brute-forceable, though rate limiting and short expiry windows mitigate this risk

The replay protection implementation provides defense against captured message reuse through sequence numbers, nonce tracking, and HMAC signatures. Each message includes:

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

The server validates all fields before forwarding messages to recipients, rejecting any message with invalid sequence numbers, replayed nonces, or incorrect HMAC signatures.

Documentation

The API reference at docs/API.md details all available endpoints and WebSocket messages with example requests and responses. The architecture overview at docs/ARCHITECTURE.md provides a deep dive into system design decisions, component interactions, and data flows. Security policies and practices, including the threat model and incident response procedures, are documented in docs/SECURITY.md. The development roadmap at docs/ROADMAP.md outlines planned features, timelines, and technology evaluations. Contribution guidelines are available in docs/CONTRIBUTING.md, and the code of conduct is at docs/CODE_OF_CONDUCT.md. A comprehensive technical analysis is available at docs/ANALYSIS.md.

Experimental Components

Rust Encryption Module

The encryption-rust directory contains experimental Rust code for potential WebAssembly-based encryption performance improvements. This module is not used in production and is maintained for research purposes only. The experiment failed due to unresolvable dependency conflicts and Termux compilation constraints. See encryption-rust/README.md for a detailed explanation of the challenges encountered and lessons learned.

Stream Chat Integration

The stream-chat dependency appears in requirements.txt but is not used in production. Stream Chat is architecturally incompatible with Driflly's zero-knowledge, ephemeral messaging model because it requires message persistence and server-managed encryption keys. See stream-chat-issue.md for a detailed analysis of the incompatibility.

License

This project is licensed under the MIT License. See the LICENSE file in the docs directory for complete terms.

Contact

For general questions and support, email contact@driflly.app. Security issues should be reported to security@driflly.app. The source code is available on GitHub at github.com/Yothabo/dispozhe.

```
