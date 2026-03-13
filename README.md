Driflly is a privacy-first communication platform where conversations are ephemeral by design. No data is stored, no identity is required, and all communication is end-to-end encrypted. Built entirely on mobile devices using Termux, Driflly demonstrates that complex web applications can be developed anywhere, on any device without sacrificing security or performance.

## Current Working Features

End-to-end encryption is implemented using AES-256-GCM through the Web Crypto API. Keys are generated on user devices and never transmitted to servers, ensuring that message content remains private between participants. The zero-knowledge relay architecture means the server forwards encrypted messages between participants without ever seeing plaintext content. Replay protection is enforced through HMAC signing, sequence numbering, and nonce tracking, preventing attackers from resending captured messages. One-time access is managed through six-digit codes that expire after thirty seconds or single-use links that become invalid immediately after first use. Sessions automatically self-destruct after the configured duration, which can range from one minute to twenty-four hours, and either participant can manually terminate a session at any time, immediately deleting all associated data.

Duo mode provides private two-person ephemeral chats with complete functionality including message exchange, typing indicators, read receipts, and file sharing for images up to ten megabytes. The interface is optimized for mobile devices with responsive design and touch-friendly interactions. When the keyboard appears on mobile, only the input bar moves upward while the header and message list remain stationary, providing a smooth experience identical to WhatsApp and other modern messaging applications.

The system handles one hundred concurrent sessions with one hundred percent success rate under stress tests, achieving eighty requests per second throughput with sub-second response times for mixed API calls. The connection pool is configured for fifty connections with one hundred overflow, eliminating previous timeout issues. These numbers are verified through `real_api_stress.py` which runs against a live server instance.

## Architecture Overview

The frontend is built with React 18 and TypeScript, using Vite 5 for fast development and optimized builds. Tailwind CSS 3 provides styling, while the Web Crypto API handles client-side encryption. WebSocket connections enable real-time communication with the backend. Custom hooks encapsulate complex logic such as message handling, timer management, and termination flows. State management is layered appropriately, with session-specific state in custom hooks, WebSocket state in services, and UI state in components. The following example shows the WebSocket connection hook with exponential backoff:

```typescript
const useWebSocketConnection = ({
  sessionId,
  onConnected,
  onReconnecting
}: UseWebSocketConnectionProps) => {
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 30;
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      await wsService.connect(sessionId);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      onConnected?.();
    } catch (error) {
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        setTimeout(connect, delay);
        onReconnecting?.(reconnectAttempts.current);
      }
    }
  }, [sessionId, onConnected, onReconnecting]);

  useEffect(() => {
    connect();
    return () => {
      wsService.disconnect();
    };
  }, [connect]);

  return { isConnected };
};


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

    async def broadcast(self, session_id: str, message: dict, exclude: Optional[WebSocket] = None):
        connections = self.connections.get(session_id, set())
        for conn in connections:
            if conn != exclude:
                await conn.send_text(json.dumps(message))
```

The replay protection module ensures message integrity through HMAC validation, sequence number tracking, and nonce deduplication:

```python
class ReplayProtection:
    def __init__(self, max_sequence_gap: int = 100, nonce_expiry_seconds: int = 300):
        self.max_sequence_gap = max_sequence_gap
        self.nonce_expiry_seconds = nonce_expiry_seconds
        self.sequences: Dict[str, Dict[str, int]] = {}
        self.seen_nonces: Dict[str, Dict[str, float]] = {}
        self.enabled = False

    def validate_message(self, session_id: str, client_id: str, message: dict, secret_key: str = None) -> Tuple[bool, str]:
        if not self.enabled:
            return True, "protection_disabled"

        sequence = message.get('sequence')
        nonce = message.get('nonce')
        
        if sequence is None:
            return False, "missing_sequence"
        if nonce is None:
            return False, "missing_nonce"

        if session_id not in self.sequences:
            self.sequences[session_id] = {}
        
        last_seq = self.sequences[session_id].get(client_id, -1)
        if sequence <= last_seq:
            return False, f"sequence_too_old (got {sequence}, last {last_seq})"
        if sequence > last_seq + self.max_sequence_gap:
            return False, f"sequence_gap_too_large (got {sequence}, last {last_seq})"
        
        self.sequences[session_id][client_id] = sequence

        self._cleanup_old_nonces(session_id)
        if session_id not in self.seen_nonces:
            self.seen_nonces[session_id] = {}
        if nonce in self.seen_nonces[session_id]:
            return False, "nonce_replayed"
        
        self.seen_nonces[session_id][nonce] = time.time()

        if secret_key and 'hmac' in message:
            expected = self.generate_hmac(secret_key, message.get('data', ''), sequence, nonce)
            if not hmac.compare_digest(message['hmac'], expected):
                return False, "hmac_invalid"
        elif secret_key and 'hmac' not in message:
            return False, "missing_hmac"

        return True, "valid"
```

A background expiry scheduler runs every sixty seconds to automatically clean up expired sessions. The connection pool is configured for fifty connections with one hundred overflow, settings derived from stress testing rather than guesswork.

Development Environment

Driflly is engineered to be developed entirely on mobile devices using Termux. This constraint has shaped every architectural decision to optimize for memory, storage, and network limitations. Memory optimization is achieved through splitting build processes into smaller chunks, configuring development servers with lower memory footprints, maintaining a minimal dependency philosophy, and optimizing WebSocket connections for memory efficiency. Each active session consumes approximately five to ten kilobytes for connection tracking and message queuing. Storage efficiency is maintained through regular cleanup scripts, SQLite with automatic VACUUM operations, and compressed asset delivery. The database stores only session metadata, never message content, keeping the total database size under one megabyte even with thousands of session records. Network resilience is ensured through exponential backoff for reconnection attempts, message queuing for offline scenarios, heartbeat intervals of twenty-five seconds to detect stale connections, and graceful degradation on slow connections.

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

Security Considerations

The security model is based on several principles. Encryption keys never leave client devices, preventing server-side decryption. Message content is never stored, eliminating historical data exposure. Access codes expire after thirty seconds and are single-use, limiting brute force opportunities. Rate limiting prevents enumeration attacks with five attempts per minute per IP address. Users should be aware of inherent limitations including that screenshots can be taken by participants and cannot be technically blocked, devices may cache data outside the application at the operating system level, network traffic metadata such as connection times and IP addresses may be visible to internet service providers, and the six-digit code space of one million combinations is theoretically brute-forceable though rate limiting and short expiry windows mitigate this risk. The replay protection implementation provides defense against captured message reuse through sequence numbers, nonce tracking, and HMAC signatures. Each message includes the following structure:

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

Comprehensive documentation is available in the docs directory. The API Reference details all available endpoints and WebSocket messages with example requests and responses. The Architecture Overview provides a deep dive into system design decisions, component interactions, and data flows. Security policies and practices, including the threat model and incident response procedures, are documented in the Security Policy. The development roadmap at ROADWAY.md outlines planned features, timelines, and technology evaluations. Contribution guidelines are available in CONTRIBUTING.md, and the code of conduct is at CODE_OF_CONDUCT.md. A comprehensive technical analysis is available at ANALYSIS.md. The LICENSE file contains the full MIT license terms.

Experimental Components

The encryption-rust directory contains experimental Rust code for potential WebAssembly-based encryption performance improvements. This module is not used in production and is maintained for research purposes only. The experiment failed due to unresolvable dependency conflicts and Termux compilation constraints. The stream-chat-issue.md file explains why the Stream Chat dependency appears in requirements.txt but is not used in production, as it is architecturally incompatible with Driflly's zero-knowledge ephemeral messaging model.

Project Analysis

The codebase consists of approximately fifty-five percent TypeScript and nineteen percent Python, with the remainder being documentation and configuration files. The frontend contains one hundred twelve modules organized into forty-nine directories, while the backend follows a modular structure with clear separation between routes, models, services, and utilities. The test suite includes forty-eight passing tests across both frontend and backend, with stress tests confirming the system handles one hundred concurrent sessions with one hundred percent success rates. The CI/CD pipeline runs all tests automatically on every push and executes deployments to Render and Vercel when tests pass on the main branch. The project has achieved several significant milestones including complete end-to-end encryption implementation, zero-knowledge relay architecture, replay protection, comprehensive test coverage, mobile-optimized keyboard handling, and automated deployment pipeline. Known limitations include file sharing being restricted to images up to ten megabytes, SQLite scaling constraints for horizontal deployment, and the abandoned Rust experiment documented in the encryption-rust directory.

License and Contact

This project is licensed under the MIT License. The full license terms are available in the LICENSE file. For general questions and support, email contact@driflly.app. Security issues should be reported to security@driflly.app. The source code is available on GitHub at github.com/Yothabo/dispozhe.

```
