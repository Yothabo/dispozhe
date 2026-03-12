# Driflly Backend

The Driflly backend is a FastAPI application that manages session creation, participant coordination, and WebSocket message routing. It follows a zero-knowledge architecture, meaning it never sees plaintext message content.

## Architecture

### Core Components

The WebSocket Manager handles all real-time communication, maintaining connection pools per session and enforcing the two-participant limit. It uses in-memory storage only with no message persistence, and features connection tracking with session isolation, message relaying without inspection, automatic cleanup on disconnection, a heartbeat mechanism at twenty-five second intervals, and exponential backoff for reconnection attempts.

The Message Handler implements the zero-knowledge relay pattern by validating message structure without inspecting content, forwarding encrypted payloads between participants, and queuing messages for offline delivery when recipients are disconnected.

The Replay Protection module adds security through HMAC-SHA256 signing of messages, sequence number tracking per client, nonce tracking with five-minute expiry, and configurable feature flags for gradual rollout without breaking existing clients.

The Session Management system follows a defined lifecycle where sessions begin in waiting state with one participant, transition to active when both participants connect, and terminate either through timer expiration or manual user action.

## Database Schema

The database uses SQLite with two primary tables. The sessions table stores session identifiers, creation and expiration timestamps, duration in minutes, participant counts, status flags, and link activity indicators. The codes table manages six-digit access codes with their associated session identifiers, encryption keys, expiration timestamps, and redeemed status. No message content is ever stored in the database.

## API Endpoints

### Session Management

The session creation endpoint at POST /session/create accepts a JSON body with a duration field between one and fourteen hundred forty minutes, and returns a session identifier, access code, sharing link, and expiration information.

The code redemption endpoint at POST /session/code/{code} validates the six-digit code, checks expiration and usage status, and returns the session identifier and encryption key for the joining participant.

The direct join endpoint at POST /session/{sessionId}/join allows joining via link without a code, performing the same validation and returning session confirmation.

The status endpoint at GET /session/{sessionId}/status returns current participant count, session status, expiration time, and time remaining.

The extension endpoint at POST /session/{sessionId}/extend allows participants to add time to an active session, broadcasting the update to all connected clients.

The termination endpoint at DELETE /session/{sessionId} immediately ends the session, deletes all associated data, and closes any open WebSocket connections.

## WebSocket Protocol

### Connection Establishment

Clients connect to ws://localhost:8080/ws/{sessionId} and upon successful connection receive a connected message containing the session identifier, participant count, connection count, time remaining, and timestamp.

### Message Types

Text messages are sent with type message and include a unique identifier, base64-encoded encrypted data, and timestamp. The server relays these messages to the other participant without modification.

Typing indicators use type typing with an isTyping boolean field, allowing participants to see when the other person is composing a message.

Delivery status messages of type delivery_status inform senders when messages are queued, delivered, or failed.

Read receipts with type read_receipt notify senders when messages have been viewed by recipients.

File messages use type file and include filename, MIME type, size, base64-encoded data, and an optional viewOnce flag for self-destructing files.

File viewed notifications of type file_viewed trigger immediate deletion of view-once files after they are seen.

Participant left messages inform remaining users when the other participant disconnects.

Session terminated messages notify all connected clients when a session ends, after which the connection is closed.

## Security Features

### Replay Protection

The replay protection system validates every message against sequence numbers and nonces before forwarding. Each client maintains an increasing sequence number per session, and any message with a sequence number less than or equal to the last seen is rejected. Nonces are tracked for five minutes to prevent replay attacks within that window. HMAC-SHA256 signatures ensure message integrity and authenticity.

### Connection Limits

Sessions are strictly limited to two participants. Any attempt to establish a third connection is rejected with HTTP 403 for API requests or WebSocket close code 4003 for connection attempts.

### Rate Limiting

The API implements rate limiting to prevent abuse, with session creation limited to ten requests per minute per IP address and code redemption attempts limited to five per minute per IP address to prevent brute force attacks.

### Input Validation

All input is validated at multiple levels. Session creation requires duration within allowed range. Code redemption expects exactly six digits. Message data must be properly formatted base64 within size limits. Invalid inputs are rejected with appropriate error responses.

## Testing

### Unit Tests

The test suite includes comprehensive unit tests for all components. Run pytest tests/ -v from the backend directory to execute all tests. Security-specific tests are in tests/test_security and validate replay protection, HMAC generation, sequence validation, and nonce tracking.

### Stress Tests

Stress tests against the real server validate system performance under load. The tests in tests/load/real_api_stress.py verify that the system handles one hundred concurrent sessions with one hundred percent success rate and maintains performance metrics.

## Deployment

### Environment Configuration

Create a .env file with required environment variables including DATABASE_URL for the database connection, ENVIRONMENT for environment-specific settings, and ALLOWED_ORIGINS for CORS configuration.

### Render Deployment

The render.yaml file configures deployment on Render with build command pip install -r requirements.txt and start command uvicorn app:app --host 0.0.0.0 --port $PORT. Environment variables are configured through the Render dashboard.

### Database Management

SQLite database files are stored locally and should be backed up regularly. Migration scripts are available for schema updates, though the current schema is stable.

## Performance Considerations

The connection pool is configured with size fifty and overflow one hundred to handle concurrent sessions without timeout errors. Pool pre-ping verifies connections before use, and pool recycle refreshes connections after one hour to prevent staleness. These settings were determined through stress testing and have proven effective for handling one hundred concurrent sessions.
