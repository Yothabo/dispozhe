# Driflly Architecture Documentation

## System Overview

Driflly is a real-time ephemeral messaging application built with a clear separation between frontend and backend components. The architecture is designed around the core principles of privacy, ephemerality, and simplicity. Every design decision supports the goal of creating conversations that leave no trace while maintaining a smooth user experience.

The system consists of a React TypeScript frontend that communicates with a FastAPI Python backend through both REST API calls and WebSocket connections. The frontend handles user interface rendering, encryption, and local state management. The backend manages session creation, participant coordination, and WebSocket connection routing.

Communication between frontend and backend occurs over HTTPS for API requests and WSS for WebSocket connections in production. During development, HTTP and WS are used for simplicity. All messages are encrypted end-to-end, meaning the backend only sees encrypted data and never has access to plaintext message content.

## Frontend Architecture

### Component Hierarchy

The frontend follows a component-based architecture with clear separation of concerns. Pages represent top-level routes and compose sections and components together. The landing page includes hero, features, how it works, why, security, and image sections. The chat interface is composed of header, message list, input area, and various modal components.

Components are organized into logical groups. Chat components handle the core messaging interface. Modal components manage pop-up interactions like code entry and QR code display. Section components build the marketing landing page. This organization makes the codebase navigable and maintains separation of concerns.

State management is handled through React hooks at appropriate levels. Global state like WebSocket connections lives in services. Session-specific state like messages and participant information lives in custom hooks. UI state like modal visibility lives in component local state. This layered approach keeps state management predictable and maintainable.

### Custom Hooks

The application uses custom hooks extensively to encapsulate complex logic. useChatMessages manages message state, deduplication, and viewed file tracking. useChatTimer synchronizes the countdown timer with the backend and handles expiration events. useChatTermination orchestrates the session termination flow with visual feedback.

useWebSocketConnection handles the WebSocket connection lifecycle including reconnection logic and connection state tracking. useSessionPolling periodically checks session status to detect when the second participant joins. useNavigationGuard intercepts device back button presses to trigger appropriate actions.

useFileHandling manages file selection, reading, and sending. It enforces size limits, validates file types, and handles the transition from file selection to message sending. useChatTyping manages typing indicators with appropriate throttling to prevent network spam.

### Service Layer

The WebSocket service manages the real-time communication channel. It handles connection establishment, reconnection with exponential backoff, message queuing when disconnected, and distribution of incoming messages to registered handlers. The service maintains a single WebSocket connection per session and ensures messages are delivered in order.

The API service provides a clean interface to backend REST endpoints. It handles request formatting, response parsing, and error handling. Each API method returns promises that resolve to typed response objects, making the interaction with the backend type-safe and predictable.

### Routing

React Router manages navigation between pages. The main routes include the landing page at the root path, the code entry page for joining with a six-digit code, the waiting page for session creators, and the chat page for active conversations. Short URLs at the c path redirect to the appropriate join flow.

Route protection is implemented through conditional rendering. The waiting page validates that the session exists before rendering. The chat page checks that both a session ID and encryption key are present in the URL. Invalid or expired sessions redirect to the home page.

## Backend Architecture

### Application Structure

The backend follows a modular structure with clear separation between routes, models, and utilities. The main application file sets up middleware, registers routes, and configures the lifespan context for background services. Routes are organized by function with separate handlers for session management and WebSocket connections.

Database models define the schema for sessions and codes using SQLAlchemy. The session model stores metadata about active and expired conversations. The code model tracks six-digit access codes with their associated sessions and encryption keys. Models include methods for checking expiration and updating status.

Utility modules provide specialized functionality. The code generator creates cryptographically secure six-digit codes with configurable expiration. The expiry service runs in the background to clean up expired sessions. The WebSocket manager handles connection pooling, message routing, and participant tracking.

### WebSocket Manager

The ConnectionManager class is the heart of real-time communication. It maintains sets of active WebSocket connections keyed by session ID, maps connections to session IDs for quick lookup, and tracks connection timestamps for monitoring. The manager ensures that each session never exceeds its participant limit of two.

When a client connects, the manager validates the session, checks connection limits, and adds the connection to the active pool. It then broadcasts the updated participant count to all connections in the session. When both participants are connected, the manager logs this event and prepares for message exchange.

Message routing is handled by the send_message method. It determines the set of recipients by excluding the sender from the session's connection set. If no recipients are online, the message is queued for later delivery. If recipients are online, the message is sent immediately with delivery tracking.

The manager also handles disconnections gracefully. When a client disconnects, it removes the connection from the pool and broadcasts a participant_left message to remaining participants. If the session becomes empty, the manager cleans up associated resources after a grace period.

### Session Lifecycle

Sessions progress through a defined lifecycle from creation to termination. When a session is created, it enters the waiting state with a participant count of one. The session has an expiration time calculated from the requested duration and is stored in the database with a unique identifier.

When a second participant joins using either a code or a direct link, the session transitions to the active state. The participant count updates to two, and the status changes from waiting to active. This transition triggers the WebSocket manager to notify both participants that the session is now ready for communication.

Sessions can end in three ways. Automatic expiration occurs when the configured duration elapses without manual termination. Manual termination happens when a participant explicitly ends the session through the UI. Participant departure without explicit termination leaves the other participant alone but the session remains active until expiration.

When a session ends, the WebSocket manager terminates all connections, the database record is deleted, and any associated codes are invalidated. Connected clients receive a session_terminated message before their connections close, allowing them to display appropriate UI.

### Code Generation and Validation

The code generator creates six-digit codes that are cryptographically secure and effectively random. Each code is associated with a specific session and includes an expiration timestamp. Codes are stored in the database with their session ID, encryption key, expiration time, and redeemed status.

Code validation checks multiple conditions. The code must exist in the database, must not be expired based on its timestamp, must not have been previously redeemed, and must be associated with a session that is not already full. If any condition fails, the join request is rejected with an appropriate error.

Successful code redemption updates the database to mark the code as redeemed and increments the session's participant count. The response includes the session ID and encryption key, allowing the joining client to establish a WebSocket connection and begin secure communication.

## Data Flow

### Session Creation Flow

When a user initiates a chat, the frontend generates an encryption key locally using the Web Crypto API. This key never leaves the user's device and is used for all message encryption during the session. The key is stored only in memory and is discarded when the session ends.

The frontend sends a POST request to the backend's session creation endpoint with the requested duration. The backend generates a unique session ID, creates a database record, and generates a six-digit access code. The response includes the session ID, access code, and other session metadata.

The frontend stores the access code in sessionStorage for later reference and navigates to the waiting page. The waiting page displays the shareable link and access code, and begins polling the session status endpoint to detect when the second participant joins.

### Join Flow

When a user enters a six-digit code, the frontend sends a POST request to the code redemption endpoint. The backend validates the code, updates the session participant count, and returns the session ID and encryption key. The frontend stores the encryption key in memory and navigates to the chat page.

The chat page establishes a WebSocket connection using the session ID. The backend accepts the connection, updates the participant count, and sends connected messages to both participants. The original participant receives notification that someone has joined, and the chat interface becomes active.

### Message Flow

When a user sends a message, the frontend encrypts the plaintext using the session key and the Web Crypto API. The encrypted data is converted to base64 for transmission. The message is assigned a unique ID and timestamp before being sent over the WebSocket.

The WebSocket manager receives the message and determines the recipient by excluding the sender from the session's connection set. If the recipient is online, the message is forwarded immediately. If not, the message is queued for later delivery when the recipient reconnects.

The recipient's frontend receives the message, decodes the base64 data, and decrypts it using the shared session key. The decrypted message is added to the message list and displayed to the user. Read receipts are sent automatically when messages become visible in the viewport.

### Termination Flow

When a user initiates termination, the frontend sends a DELETE request to the session endpoint. The backend immediately removes the session from the database and terminates all associated WebSocket connections. Connected clients receive a session_terminated message before their connections close.

The frontend displays a destroying session animation while the backend processes the termination. After the animation completes, the user is shown the session destroyed view with options to start a new chat or return to the home page.

If the other participant is still connected, they receive the session_terminated message and are shown the same destroyed view. This ensures both participants have a consistent understanding that the conversation has ended permanently.

## Database Design

### Session Table

The sessions table stores metadata about each conversation. The id field is a text primary key containing the unique session identifier. created_at stores the timestamp when the session was created. expires_at stores the timestamp when the session will automatically expire.

duration_minutes records the user-selected session length. participant_count tracks how many participants have joined, starting at one and maxing at two. status indicates whether the session is waiting, active, expired, or terminated. link_active is a boolean flag controlling whether the shareable link is still valid.

### Codes Table

The codes table manages six-digit access codes. The code field is the primary key containing the six-digit string. session_id is a foreign key referencing the associated session. encryption_key stores the base64-encoded key for secure communication.

expires_at sets the time after which the code becomes invalid. redeemed is a boolean flag indicating whether the code has already been used. Together, these fields ensure that each code can only be used once within its validity window.

## Security Architecture

### Encryption Layer

All message encryption happens client-side using AES-256-GCM. This authenticated encryption mode provides both confidentiality and integrity, ensuring that messages cannot be tampered with during transit. The Galois Counter Mode also prevents replay attacks by including a unique nonce with each message.

Encryption keys are generated using cryptographically secure random number generators provided by the Web Crypto API. Keys are 256 bits in length, providing strong protection against brute force attacks. Keys exist only in memory and are never persisted to disk or transmitted over the network.

### Access Control

Session access is controlled through multiple mechanisms. Shareable links contain the session ID in the URL path and are one-time use only. Six-digit codes expire after thirty seconds and can only be used once. WebSocket connections are limited to two per session and rejected with appropriate close codes when exceeded.

The backend validates every request against the session's current state. Expired sessions reject all further access attempts. Sessions that have reached their participant limit reject additional join attempts. Codes that have been redeemed or expired return 404 responses.

### Data Retention

The system follows a strict zero-data retention policy. Message content is never stored in the database. Session metadata exists only in memory for active sessions and is deleted upon termination. The only persistent data is session records for expiration tracking, and these contain no message content or user identifiers.

When a session terminates, all associated data is immediately deleted. This includes the database record, any queued messages in memory, and any file data being transferred. The deletion is synchronous and verified to ensure no data remains accessible.

## Performance Considerations

### Connection Management

The WebSocket manager is designed for efficiency with minimal memory overhead. Connection sets are stored as dictionaries keyed by session ID, allowing O(1) lookup for message routing. Each connection maintains minimal metadata including its session ID and connection timestamp.

Heartbeat messages are sent every twenty-five seconds to detect stale connections. This interval balances network overhead with timely detection of disconnected clients. When a client fails to respond to heartbeats, the connection is closed and resources are freed.

### Message Queuing

Offline messages are queued in memory with size limits to prevent resource exhaustion. Each session can queue up to one hundred messages, after which older messages are discarded. Queued messages are delivered in order when the recipient reconnects.

The queuing system uses simple list structures with O(1) append and O(n) removal operations. This is acceptable given the small queue sizes and low message volumes typical of ephemeral conversations.

### Database Optimization

The database uses SQLite with appropriate indexes for performance. The sessions table is indexed on id for fast lookups and on expires_at for efficient cleanup queries. The codes table is indexed on code for rapid redemption validation and on expires_at for expiration sweeps.

Write operations are minimized by design. Session creation requires a single insert. Code redemption updates a single row. Session termination deletes a single row. This minimal write pattern ensures the database remains responsive even under load.

## Scalability

The current architecture scales vertically to handle thousands of concurrent sessions on a single server instance. The stateless nature of the API layer would allow horizontal scaling by adding more instances behind a load balancer, with the WebSocket manager requiring sticky sessions or a distributed pub-sub system.

Session isolation ensures that scaling challenges are contained within individual sessions. Heavy usage in one session does not affect others. Memory usage scales linearly with the number of active sessions, each consuming approximately a few kilobytes for connection tracking and message queuing.

The system is designed to handle typical usage patterns where sessions are short-lived and message volume is low. This aligns with the ephemeral nature of the application and ensures that resource requirements remain modest even as user base grows.

## Development Workflow

### Local Development

The development environment runs entirely on localhost with hot reloading for both frontend and backend. The frontend dev server runs on port 3000 and proxies API requests to the backend on port 8080. WebSocket connections use the same backend port for real-time communication.

Environment variables configure the API and WebSocket URLs. In development, these point to localhost. In production, they point to the deployed backend service. This separation allows the same codebase to run in different environments without modification.

### Testing Strategy

Tests are organized by concern with separate suites for API endpoints, WebSocket functionality, and encryption. API tests verify correct behavior of session management endpoints. WebSocket tests validate connection handling, message routing, and participant management. Encryption tests ensure that messages are properly encrypted and decrypted.

Load tests simulate multiple concurrent sessions to verify system stability under stress. These tests create and destroy sessions rapidly, testing the system's ability to handle connection churn and resource cleanup. All tests run in isolated environments to prevent interference.

## Deployment Architecture

The frontend is deployed as static files to Vercel's global CDN. This provides fast loading times worldwide and automatic SSL termination. The backend is deployed as a service on Render with automatic scaling and managed SSL. Environment variables configure the connection between frontend and backend.

Database persistence is handled by a persistent volume attached to the backend service. SQLite files are stored on this volume, ensuring data survives service restarts. Regular backups are configured through the hosting platform to prevent data loss.

Monitoring is provided through platform dashboards and custom logging. Application logs capture errors and important events without storing personal data. Performance metrics track response times, connection counts, and resource usage to identify potential issues before they affect users.
