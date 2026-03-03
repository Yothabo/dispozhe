# Driflly API Documentation

## Base URL

The API is accessible at https://api.driflly.app for production use. For local development, the API runs at http://localhost:8080. WebSocket connections use the same host with the ws or wss protocol accordingly.

All endpoints return JSON responses and accept JSON request bodies where applicable. The API uses standard HTTP status codes to indicate success or failure. Successful requests return 200 OK, while client errors return 4xx status codes and server errors return 5xx status codes.

## Session Management Endpoints

### Create a New Session

This endpoint creates a new chat session and returns the session identifier and access code. The session is created in a waiting state with a participant count of one. The link for sharing is constructed by appending the session ID to the base URL.

A POST request to /session/create requires a JSON body with a duration field specifying the session lifetime in minutes. The duration must be between one minute and twenty-four hours. Values outside this range result in a 400 Bad Request response.

The response includes the session ID, the selected duration, the expiration timestamp in ISO 8601 format, the sharing link, the session status, a six-digit access code, and the time left in seconds. The session status will be waiting until a second participant joins.

Example request:

POST /session/create
Content-Type: application/json

{
  "duration": 5
}

Example response:

{
  "session_id": "abc123def456",
  "duration": 5,
  "expires_at": "2026-03-03T12:34:56Z",
  "link": "https://driflly.app/c/abc123def456",
  "status": "waiting",
  "code": "123456",
  "time_left_seconds": 300
}

### Join a Session Using a Code

This endpoint allows a second participant to join an existing session using the six-digit access code. The code must be valid, not expired, and associated with a session that has not reached its participant limit.

A POST request to /session/code/{code} requires no body. The code is included in the URL path. If successful, the response includes the session ID, an encryption key for secure communication, and the updated session status which will be active.

The code is valid for only thirty seconds after generation. After this window, the code expires and cannot be used even if it has not been redeemed. Each code can only be used once, regardless of whether the join attempt succeeds.

Example request:

POST /session/code/123456

Example response:

{
  "session_id": "abc123def456",
  "encryption_key": "base64-encoded-key",
  "status": "active"
}

Error responses include 404 when the code is invalid or expired, 410 when the session has expired, and 400 when the session is already full with two participants.

### Join a Session Using a Link

This endpoint provides an alternative method for joining a session using the direct link instead of a code. It is typically used when users click on shared links rather than entering codes manually.

A POST request to /session/{sessionId}/join requires the session ID in the URL path and no body. The endpoint validates that the session exists, is not expired, and has not reached its participant limit before allowing the join.

Upon success, the session participant count is updated to two and the status becomes active. The response confirms the session ID and status.

Example request:

POST /session/abc123def456/join

Example response:

{
  "session_id": "abc123def456",
  "status": "active",
  "message": "Joined successfully"
}

### Get Session Status

This endpoint returns the current status of a session, including participant count, expiration information, and time remaining. It is used by clients to monitor session state and by the waiting page to detect when a second participant has joined.

A GET request to /session/{sessionId}/status requires the session ID in the URL path. The response includes comprehensive information about the session's current state, allowing clients to react appropriately to changes.

If the session has expired, the status field will be set to expired and the link_active flag will be false. Clients should handle this by redirecting users to appropriate error pages or offering to start a new session.

Example request:

GET /session/abc123def456/status

Example response:

{
  "session_id": "abc123def456",
  "participant_count": 1,
  "status": "waiting",
  "expires_at": "2026-03-03T12:34:56Z",
  "time_left_seconds": 240,
  "created_at": "2026-03-03T12:30:00Z"
}

### Terminate a Session

This endpoint immediately terminates an active session, deleting all associated data and notifying any connected participants. Termination can be initiated by either participant at any time.

A DELETE request to /session/{sessionId} requires the session ID in the URL path. No body is required. The operation is synchronous and returns a success response only after all cleanup operations have completed.

Upon successful termination, the session is removed from the database, any associated codes are invalidated, and all WebSocket connections are closed. Connected clients receive a session_terminated message before their connections are closed.

Example request:

DELETE /session/abc123def456

Example response:

{
  "status": "terminated"
}

## WebSocket Connection

### Establish a WebSocket Connection

WebSocket connections are used for real-time communication between participants. The connection is established at /ws/{sessionId} where the session ID is included in the URL path. The WebSocket protocol allows for bidirectional, full-duplex communication with low latency.

Before accepting a connection, the server validates that the session exists, is not expired, and has not reached its participant limit of two. If any validation fails, the connection is rejected with an appropriate close code. Successful connections receive a connected message with current session information.

Example connection URL:

ws://localhost:8080/ws/abc123def456

### Connection Lifecycle

When a client successfully connects, the server immediately sends a connected message. This message includes the session ID, participant count, connection count, time left in seconds, and a timestamp. The client can use this information to initialize its state and display appropriate UI elements.

The server maintains a heartbeat mechanism to detect stale connections. Every twenty-five seconds, the server sends a ping message. Clients should respond with a pong message to keep the connection alive. If a client fails to respond, the connection is considered dead and is closed.

When a participant disconnects intentionally or due to network issues, the remaining participant receives a participant_left message. This message includes the updated participant count. If the disconnecting participant was the last one, the session data is cleaned up after a brief grace period.

Example connected message:

{
  "type": "connected",
  "session_id": "abc123def456",
  "participant_count": 1,
  "connection_count": 1,
  "time_left": 300,
  "timestamp": "2026-03-03T12:34:56Z"
}

### Sending Messages

Clients send messages as JSON objects over the WebSocket connection. Each message must include a type field indicating the message kind. Additional fields depend on the message type. The server validates each message before processing and silently ignores invalid messages.

Text messages are sent with type message and include a data field containing the base64-encoded encrypted content, a timestamp, and a unique ID for tracking delivery status. The server relays these messages to the other participant without modification.

Example text message:

{
  "type": "message",
  "data": "SGVsbG8gV29ybGQ=",
  "timestamp": 1741018496000,
  "id": "msg-123456"
}

### Receiving Messages

When the server relays a message from one participant to another, the receiving client receives the same JSON structure. The receiving client can use the ID field to detect duplicates and the timestamp field for ordering messages.

File messages are sent with type file and include additional fields for the file name, MIME type, size, and the base64-encoded file data. The viewOnce field indicates whether the file should self-destruct after viewing.

Example file message:

{
  "type": "file",
  "id": "file-123456",
  "name": "image.png",
  "mimeType": "image/png",
  "size": 1024,
  "data": "base64-encoded-data",
  "viewOnce": false,
  "timestamp": 1741018496000
}

### Typing Indicators

Typing indicators allow participants to see when the other person is composing a message. Clients send typing messages when the user starts typing and when they stop. The frequency of typing messages is throttled to prevent network congestion.

Typing messages include a type field set to typing and an isTyping boolean field indicating whether the user is currently typing. The server relays these messages to the other participant without storing them.

Example typing indicator:

{
  "type": "typing",
  "isTyping": true,
  "timestamp": 1741018496000
}

### Delivery Status

When messages are sent, the sender receives delivery status updates. These updates indicate whether the message was queued for offline delivery, delivered to the recipient, or failed to send. Status updates help clients provide appropriate visual feedback to users.

Delivery status messages include the message ID that the status refers to and the current status which can be queued, delivered, or failed. Clients can use this information to update message status indicators in the UI.

Example delivery status:

{
  "type": "delivery_status",
  "message_id": "msg-123456",
  "status": "delivered",
  "timestamp": 1741018496000
}

### Read Receipts

When a recipient views a message, the client can send a read receipt to notify the sender. This is particularly important for view-once files which should self-destruct after being viewed. Read receipts help maintain the ephemeral nature of conversations.

Read receipts include the message ID that was viewed and a timestamp. The server relays these receipts to the original sender but does not store them. Senders can use this information to update message status to read in their UI.

Example read receipt:

{
  "type": "read_receipt",
  "message_id": "msg-123456",
  "timestamp": 1741018496000
}

### File Viewed Notifications

For view-once files, the recipient sends a file_viewed notification after successfully viewing the file. This notification triggers the server to permanently delete the file data and notify the sender that the file has been viewed.

File viewed notifications include the file ID and a timestamp. Upon receiving this notification, the server immediately deletes any stored file data and relays the notification to the sender. The file becomes permanently inaccessible.

Example file viewed notification:

{
  "type": "file_viewed",
  "file_id": "file-123456",
  "timestamp": 1741018496000
}

### Participant Leaving

When a participant intentionally disconnects or closes their browser, the remaining participant receives a participant_left message. This message includes the updated participant count, allowing the remaining user to know they are now alone in the session.

The participant_left message is sent by the server when it detects a disconnection. It is not triggered by session termination, which has its own message type. This distinction allows clients to handle normal disconnections differently from session terminations.

Example participant left message:

{
  "type": "participant_left",
  "participant_count": 1,
  "timestamp": 1741018496000
}

### Session Termination

When a session is terminated either by user action or by timer expiration, all connected participants receive a session_terminated message. This message indicates that the session has been permanently deleted and no further communication is possible.

Upon receiving this message, clients should immediately close their WebSocket connections and redirect users to an appropriate page. The SessionDestroyedView component handles this gracefully, offering options to start a new chat or return to the home page.

Example session terminated message:

{
  "type": "session_terminated",
  "timestamp": 1741018496000
}

## Error Handling

### HTTP Status Codes

The API uses standard HTTP status codes to indicate the outcome of requests. 200 OK indicates success. 400 Bad Request indicates invalid input such as duration out of range or malformed JSON. 404 Not Found indicates that the requested session or code does not exist. 410 Gone indicates that the session has expired and is no longer available. 500 Internal Server Error indicates an unexpected server condition.

### WebSocket Close Codes

WebSocket connections may be closed with specific codes to indicate the reason. Code 1000 indicates normal closure. Code 1008 indicates policy violation such as attempting to connect to an expired session. Code 4003 is used to indicate that the session already has two participants and the connection is rejected.

### Error Response Format

Error responses include a detail field explaining the error condition. Clients should display this information to users when appropriate, though technical details may be hidden in production environments to prevent information leakage.

Example error response:

{
  "detail": "Session not found"
}

## Rate Limiting

The API implements rate limiting to prevent abuse. Session creation is limited to ten requests per minute per IP address. Code redemption attempts are limited to five attempts per minute per IP address to prevent brute force attacks. Exceeding these limits results in a 429 Too Many Requests response.

## Versioning

The API is versioned through the URL path. The current version is v1 and is accessible at /api/v1/ endpoints. Future versions will be introduced at new paths to maintain backward compatibility for existing clients.

## Authentication

The API does not require authentication for any endpoints. This design choice aligns with the privacy-focused philosophy of the application. No API keys, tokens, or user credentials are ever required to use the service.
