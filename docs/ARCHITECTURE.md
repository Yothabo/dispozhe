# Driflly Architecture Documentation

## System Overview

Driflly is a real-time ephemeral messaging application built with a clear separation between frontend and backend components. The architecture is designed around the core principles of privacy, ephemerality, and simplicity. Every design decision supports the goal of creating conversations that leave no trace while maintaining a smooth user experience.

The system consists of a React TypeScript frontend that communicates with a FastAPI Python backend through both REST API calls and WebSocket connections. The frontend handles user interface rendering, encryption, and local state management. The backend manages session creation, participant coordination, and WebSocket connection routing.

Communication between frontend and backend occurs over HTTPS for API requests and WSS for WebSocket connections in production. During development, HTTP and WS are used for simplicity. All messages are encrypted end-to-end using AES-256-GCM via the Web Crypto API, meaning the backend only sees encrypted data and never has access to plaintext message content.

## Frontend Architecture

### Component Hierarchy

The frontend follows a component-based architecture with clear separation of concerns. Pages represent top-level routes and compose sections and components together. The landing page includes hero, features, how it works, why, security, and image sections. The chat interface is composed of header, message list, input area, and various modal components.

Components are organized into logical groups. Chat components handle the core messaging interface. Modal components manage pop-up interactions like code entry and QR code display. Section components build the marketing landing page. This organization makes the codebase navigable and maintains separation of concerns.

State management is handled through React hooks at appropriate levels. Global state like WebSocket connections lives in services. Session-specific state like messages and participant information lives in custom hooks. UI state like modal visibility lives in component local state. This layered approach keeps state management predictable and maintainable.

### Custom Hooks

The application uses custom hooks extensively to encapsulate complex logic. useChatMessages manages message state, deduplication, and viewed file tracking. useChatTimer synchronizes the countdown timer with the backend and handles expiration events. useChatTermination orchestrates the session termination flow with visual feedback.

useWebSocketConnection handles the WebSocket connection lifecycle including reconnection logic with exponential backoff and connection state tracking. useSessionPolling periodically checks session status to detect when the second participant joins. useNavigationGuard intercepts device back button presses to trigger appropriate actions.

useFileHandling manages file selection, reading, and sending for images up to ten megabytes. It enforces size limits, validates file types, and handles the transition from file selection to message sending. useChatTyping manages typing indicators with appropriate throttling to prevent network spam.

### Service Layer

The WebSocket service manages the real-time communication channel. It handles connection establishment, reconnection with exponential backoff, message queuing when disconnected, and distribution of incoming messages to registered handlers. The service maintains a single WebSocket connection per session and ensures messages are delivered in order.

The API service provides a clean interface to backend REST endpoints. It handles request formatting, response parsing, and error handling. Each API method returns promises that resolve to typed response objects, making the interaction with the backend type-safe and predictable.

### Encryption Implementation

All encryption operations use the Web Crypto API with AES-256-GCM. When a session is created, the frontend generates a two hundred fifty-six bit encryption key that never leaves the user's device. Each message is encrypted with a random twelve-byte initialization vector, and the IV and ciphertext are combined and base64-encoded for transmission.

Replay protection is implemented through sequence numbers that increment with each message, unique nonces generated per message, and HMAC-SHA256 signatures computed over the encrypted data, sequence, and nonce. These fields enable the backend to validate message integrity without seeing plaintext content.

### Routing

React Router manages navigation between pages. The main routes include the landing page at the root path, the code entry page for joining with six-digit codes, the waiting page for session creators, and the chat page for active conversations. Short URLs at the c path redirect to the appropriate join flow.

Route protection is implemented through conditional rendering. The waiting page validates that the session exists before rendering. The chat page checks that both a session ID and encryption key are present in memory. Invalid or expired sessions redirect to the home page.

## Backend Architecture

### Application Structure

The backend follows a modular structure with clear separation between routes, models, services, and utilities. The main application file sets up middleware, registers routes, and configures the lifespan context for background services. Routes are organized by function with separate handlers for session management and WebSocket connections.

Database models define the schema for sessions using SQLAlchemy. The session model stores metadata about active and expired conversations including creation time, expiration time, duration, participant count, and status. No message content is ever stored in the database.

Utility modules provide specialized functionality. The code generator creates cryptographically secure six-digit codes with configurable expiration. The expiry service runs in the background every sixty seconds to clean up expired sessions. The WebSocket manager handles connection pooling, message routing, and participant tracking.

### WebSocket Manager

The ConnectionManager class is the heart of real-time communication. It maintains sets of active WebSocket connections keyed by session ID, maps connections to session IDs for quick lookup, and tracks connection timestamps for monitoring. The manager ensures that each session never exceeds its participant limit of two.

When a client connects, the manager validates the session, checks connection limits, and adds the connection to the active pool. It then broadcasts the updated participant count to all connections in the session. When both participants are connected, the manager logs this event and prepares for message exchange.

Message routing is handled by the send_message method. It determines the set of recipients by excluding the sender from the session's connection set. If no recipients are online, the message is queued in memory for later delivery. If recipients are online, the message is sent immediately with delivery tracking.

The manager also handles disconnections gracefully. When a client disconnects, it removes the connection from the pool and broadcasts a participant_left message to remaining participants. If the session becomes empty, the manager cleans up associated resources after a fifteen-second grace period.

### Replay Protection

The replay protection module adds security through HMAC-SHA256 signing of messages, sequence number tracking per client, and nonce tracking with a five-minute expiry. The module is implemented with feature flags allowing gradual rollout without breaking existing clients.

When enabled, the module validates every message against sequence numbers and nonces before forwarding. Each client maintains an increasing sequence number per session, and any message with a sequence number less than or equal to the last seen is rejected. Nonces are tracked for five minutes to prevent replay attacks within that window.

### Session Lifecycle

Sessions progress through a defined lifecycle from creation to termination. When a session is created, it enters the waiting state with a participant count of one. The session has an expiration time calculated from the requested duration and is stored in the database with a unique identifier.

When a second participant joins using either a code or a direct link, the session transitions to the active state. The participant count updates to two, and the status changes from waiting to active. This transition triggers the WebSocket manager to notify both participants that the session is now ready for communication.

Sessions end in two ways. Automatic expiration occurs when the configured duration elapses without manual termination. Manual termination happens when a participant explicitly ends the session through the UI. In both cases, the session record is deleted from the database and all WebSocket connections are closed.

### Code Generation and Validation

The code generator creates six-digit codes that are cryptographically secure and effectively random. Each code is associated with a specific session and expires after thirty seconds. Codes are stored in memory with their session ID, encryption key, expiration time, and redeemed status.

Code validation checks multiple conditions. The code must exist in memory, must not be expired based on its timestamp, must not have been previously redeemed, and must be associated with a session that is not already full. If any condition fails, the join request is rejected with an appropriate error.

Successful code redemption updates the in-memory store to mark the code as redeemed and increments the session's participant count in the database. The response includes the session ID and encryption key, allowing the joining client to establish a WebSocket connection and begin secure communication.

## Data Flow

### Session Creation Flow

When a user initiates a chat, the frontend generates an encryption key locally using the Web Crypto API. This key never leaves the user's device and is used for all message encryption during the session. The key is stored only in memory and is discarded when the session ends.

The frontend sends a POST request to the backend's session creation endpoint with the requested duration. The backend generates a unique session ID, creates a database record, and generates a six-digit access code. The response includes the session ID, access code, sharing link, and expiration information.

The frontend displays the access code and sharing link, then begins polling the session status endpoint every two seconds to detect when the second participant joins.

### Join Flow

When a user enters a six-digit code, the frontend sends a POST request to the code redemption endpoint. The backend validates the code, updates the session participant count, and returns the session ID and encryption key. The frontend stores the encryption key in memory and navigates to the chat page.

The chat page establishes a WebSocket connection using the session ID. The backend accepts the connection, updates the participant count, and sends connected messages to both participants. The original participant receives notification that someone has joined, and the chat interface becomes active.

### Message Flow

When a user sends a message, the frontend encrypts the plaintext using the session key with a random twelve-byte initialization vector. The encrypted data is converted to base64 for transmission. The message includes a unique ID, sequence number, nonce, and HMAC signature before being sent over the WebSocket.

The WebSocket manager receives the message and validates it against replay protection rules if enabled. If valid, it determines the recipient by excluding the sender from the session's connection set. If the recipient is online, the message is forwarded immediately. If not, the message is queued in memory for later delivery when the recipient reconnects.

The recipient's frontend receives the message, decodes the base64 data, and decrypts it using the shared session key. The decrypted message is added to the message list and displayed to the user. Read receipts are sent automatically when messages become visible in the viewport.

### Termination Flow

When a user initiates termination, the frontend sends a DELETE request to the session endpoint. The backend immediately removes the session from the database, invalidates any associated codes, and terminates all WebSocket connections. Connected clients receive a session_terminated message before their connections close.

The frontend displays a destroying session animation while the backend processes the termination. After the animation completes, the user is shown the session destroyed view with options to start a new chat or return to the home page.

If the other participant is still connected, they receive the session_terminated message and are shown the same destroyed view. This ensures both participants have a consistent understanding that the conversation has ended permanently.

## Database Design

### Session Table

The sessions table stores metadata about each conversation. The id field is a text primary key containing the unique session identifier. created_at stores the timestamp when the session was created. expires_at stores the timestamp when the session will automatically expire.

duration_minutes records the user-selected session length. participant_count tracks how many participants have joined, starting at one and maxing at two. status indicates whether the session is waiting, active, expired, or terminated. link_active is a boolean flag controlling whether the shareable link is still valid.

No message content is ever stored in the database. The table contains only operational metadata necessary for session management.

### Code Storage

Codes are stored in memory rather than the database for performance and simplicity. Each code entry includes the six-digit code, associated session ID, encryption key, expiration timestamp of thirty seconds from creation, and redeemed status. Codes are automatically removed from memory after expiration or redemption.

## Security Architecture

### Encryption Layer

All message encryption happens client-side using AES-256-GCM via the Web Crypto API. This authenticated encryption mode provides both confidentiality and integrity, ensuring that messages cannot be tampered with during transit. The Galois Counter Mode includes authentication tags that detect any modification to the ciphertext.

Encryption keys are generated using cryptographically secure random number generators provided by the Web Crypto API. Keys are two hundred fifty-six bits in length, providing strong protection against brute force attacks. Keys exist only in memory and are never persisted to disk or transmitted over the network.

### Replay Protection

The replay protection system validates every message against sequence numbers and nonces before forwarding. Each client maintains an increasing sequence number per session, and any message with a sequence number less than or equal to the last seen is rejected. Nonces are tracked for five minutes to prevent replay attacks within that window. HMAC-SHA256 signatures ensure message integrity and authenticity.

The replay protection module is implemented with feature flags, starting disabled by default for backward compatibility. It can be enabled gradually through the admin API without requiring client updates.

### Access Control

Session access is controlled through multiple mechanisms. Shareable links contain the session ID in the URL path and are one-time use only. Six-digit codes expire after thirty seconds and can only be used once. WebSocket connections are limited to two per session and rejected with appropriate close codes when exceeded.

The backend validates every request against the session's current state. Expired sessions reject all further access attempts. Sessions that have reached their participant limit reject additional join attempts. Codes that have been redeemed or expired return 404 responses.

### Data Retention

The system follows a strict zero-data retention policy. Message content is never stored in the database. Session metadata exists in the database only for active sessions and is deleted upon termination. Codes exist only in memory and are removed immediately after use or expiration.

When a session terminates, all associated data is immediately deleted. This includes the database record, any queued messages in memory, and any file data being transferred. The deletion is synchronous and verified to ensure no data remains accessible.

## Performance Considerations

### Connection Management

The WebSocket manager is designed for efficiency with minimal memory overhead. Connection sets are stored as dictionaries keyed by session ID, allowing O(1) lookup for message routing. Each connection maintains minimal metadata including its session ID and connection timestamp.

Heartbeat messages are sent every twenty-five seconds to detect stale connections. This interval balances network overhead with timely detection of disconnected clients. When a client fails to respond to heartbeats, the connection is considered dead and is closed.

### Connection Pooling

The database connection pool is configured with size fifty and overflow one hundred to handle concurrent load without timeout errors. Pool pre-ping verifies connections before use, and pool recycle refreshes connections after one hour to prevent staleness. These settings were determined through stress testing and have proven effective for handling one hundred concurrent sessions.

### Message Queuing

Offline messages are queued in memory with size limits to prevent resource exhaustion. Each session can queue up to one hundred messages, after which older messages are discarded. Queued messages are delivered in order when the recipient reconnects.

The queuing system uses simple list structures with O(1) append and O(n) removal operations. This is acceptable given the small queue sizes and low message volumes typical of ephemeral conversations.

### Database Optimization

The database uses SQLite with appropriate indexes for performance. The sessions table is indexed on id for fast lookups and on expires_at for efficient cleanup queries. Write operations are minimized by design with session creation requiring a single insert and session termination deleting a single row.

## Current Limitations

### Feature Set

The current implementation supports only Duo mode for two-person conversations. Other modes described in aspirational documents are not yet implemented. File sharing is limited to images with a maximum size of ten megabytes.

### Technology Constraints

Encryption uses the Web Crypto API rather than WebAssembly due to Termux compilation limitations. All communication uses WebSockets rather than WebRTC for simplicity and reliability. There are no native mobile or desktop applications.

### Development Environment

The Termux development environment imposes memory and CPU constraints that have shaped architectural decisions. Build processes are split into smaller chunks, development servers use lower memory footprints, and dependencies are minimized.

## Scalability

The current architecture scales vertically to handle thousands of concurrent sessions on a single server instance with the increased connection pool settings. Stress tests confirm that the system handles one hundred concurrent sessions with one hundred percent success rate.

Session isolation ensures that scaling challenges are contained within individual sessions. Heavy usage in one session does not affect others. Memory usage scales linearly with the number of active sessions, each consuming approximately a few kilobytes for connection tracking and message queuing.

## Development Workflow

### Local Development

The development environment runs entirely on localhost with hot reloading for both frontend and backend. The frontend dev server runs on port 3000 and proxies API requests to the backend on port 8080. WebSocket connections use the same backend port for real-time communication.

Environment variables configure the API and WebSocket URLs. In development, these point to localhost. In production, they point to the deployed backend service. This separation allows the same codebase to run in different environments without modification.

### Testing Strategy

Tests are organized by concern with separate suites for API endpoints, WebSocket functionality, and encryption. API tests verify correct behavior of session management endpoints. WebSocket tests validate connection handling, message routing, and participant management. Encryption tests ensure that messages are properly encrypted and decrypted.

Stress tests simulate multiple concurrent sessions to verify system stability under load. These tests create and destroy sessions rapidly, testing the system's ability to handle connection churn and resource cleanup. The stress tests confirm the system handles one hundred concurrent sessions with one hundred percent success rate.

## Deployment Architecture

The frontend is deployed as static files to Vercel's global CDN. This provides fast loading times worldwide and automatic SSL termination. The backend is deployed as a service on Render with automatic scaling and managed SSL. Environment variables configure the connection between frontend and backend.

Database persistence is handled by SQLite files stored on Render's persistent disk. Regular backups are configured to prevent data loss. The connection pool settings are optimized for production load based on stress test results.
