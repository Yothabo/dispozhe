# Driflly Frontend

The Driflly frontend is a React 18 application built with TypeScript that provides the user interface for ephemeral, encrypted conversations. It handles client-side encryption, WebSocket communication, and real-time UI updates.

## Architecture

### Component Hierarchy

The frontend follows a component-based architecture organized into logical groups. Pages represent top-level routes including the landing page at the root path, code entry page for joining with six-digit codes, waiting page for session creators, and chat page for active conversations. Components are further organized into chat components for the messaging interface, modal components for pop-up interactions, and section components for the marketing landing page.

### State Management

State is managed through React hooks at appropriate levels. Global state like WebSocket connections lives in service modules. Session-specific state including messages and participant information is managed in custom hooks. UI state such as modal visibility is handled in component local state. This layered approach keeps state management predictable and maintainable.

### Custom Hooks

The useChatMessages hook manages message state, deduplication, and viewed file tracking. useChatTimer synchronizes the countdown timer with the backend and handles expiration events. useChatTermination orchestrates the session termination flow with visual feedback. useWebSocketConnection handles the WebSocket connection lifecycle including reconnection logic with exponential backoff and connection state tracking. useSessionPolling periodically checks session status to detect when the second participant joins. useNavigationGuard intercepts device back button presses to trigger appropriate actions. useFileHandling manages file selection, reading, and sending with size limits and type validation. useChatTyping manages typing indicators with throttling to prevent network spam.

## Encryption Implementation

### Key Generation

When a session is created, the frontend generates a two hundred fifty-six bit AES-GCM key using the Web Crypto API. This key never leaves the user's device and is used for all message encryption during the session. The key is stored only in memory and is discarded when the session ends.

### Message Encryption

Messages are encrypted using AES-256-GCM with a random twelve-byte initialization vector for each message. The IV and ciphertext are combined and base64-encoded for transmission. The encrypted message includes a key identifier allowing recipients to verify they are using the correct session key.

### Replay Protection

Each encrypted message includes a sequence number that increments with every message sent, a unique nonce generated for each message, and an HMAC-SHA256 signature computed over the encrypted data, sequence, and nonce. These fields enable the backend to validate message integrity and detect replay attacks.

### Key Exchange

When a participant joins via code, the encryption key is provided in the join response. For link-based joins, the key is not transmitted and participants must exchange keys through the WebSocket connection using a key exchange protocol.

## WebSocket Integration

### Connection Management

The WebSocket service manages the real-time communication channel, handling connection establishment, reconnection with exponential backoff, message queuing when disconnected, and distribution of incoming messages to registered handlers. The service maintains a single WebSocket connection per session and ensures messages are delivered in order.

### Message Handling

Incoming messages are routed based on their type. Text messages are decrypted and added to the message list. Typing indicators update the UI to show when the other participant is composing. Delivery status updates and read receipts update message status indicators. File messages trigger download or preview based on file type and view-once settings.

### Offline Support

When the WebSocket connection is lost, messages are queued locally with timestamps. Upon reconnection, queued messages are sent in order, and any messages received while offline are processed. This ensures no messages are lost during temporary network interruptions.

## User Interface

### Chat Interface

The chat interface consists of a header showing session information and timer, a message list displaying conversation history, and an input area for composing messages and attaching files. Messages are displayed with sender indicators, timestamps, and delivery status icons.

### Timer Display

A prominent timer shows time remaining in the session, updating in real-time. When less than thirty seconds remain, the timer turns yellow. At ten seconds, it turns red. Users can extend the session by clicking the timer and selecting additional minutes.

### File Sharing

Users can attach images up to ten megabytes by clicking the attachment button. Selected images are compressed if necessary, encrypted, and sent through the WebSocket connection. Recipients see image previews and can click to view full size. View-once images self-destruct after being viewed.

### Termination Flow

When a user initiates termination, a modal appears showing the destruction process with animated steps. The session is deleted from the backend, and both participants are redirected to a session destroyed view with options to start a new chat or return home.

## Mobile Keyboard Handling

The interface implements WhatsApp-style keyboard behavior where only the input bar moves up when the keyboard appears. The header remains fixed at the top, and the messages area stays in place with no layout shifts. This is achieved through fixed positioning of the input bar with a bottom value that matches the keyboard height detected via the visualViewport API.

## Styling

The frontend uses Tailwind CSS 3 for styling with a custom color scheme. The dark theme features navy backgrounds, sky blue accents, and grey text. All components are fully responsive and optimized for mobile devices with touch-friendly interactions.

## Testing

### Test Structure

Tests are organized in the src/tests directory with separate files for API testing, WebSocket functionality, encryption validation, and load testing. The test suite uses Vitest with jsdom environment for component testing.

### API Tests

API tests validate all backend endpoints including session creation, joining, status checking, and termination. Tests verify correct responses for valid requests and appropriate error handling for invalid inputs.

### WebSocket Tests

WebSocket tests verify connection establishment, message exchange between participants, typing indicator propagation, and proper handling of disconnections and reconnections.

### Encryption Tests

Encryption tests validate that messages encrypt and decrypt correctly, that different keys produce different ciphertext, that tampered messages are rejected, and that key import and export work as expected.

### Load Tests

Load tests simulate multiple concurrent users to verify system stability under stress. Tests create and destroy sessions rapidly, validating that the system handles connection churn and resource cleanup properly.

## Build and Development

### Development Server

The development server runs on port 3000 with hot module replacement for rapid development. API requests are proxied to the backend on port 8080. Environment variables configure API and WebSocket URLs for different environments.

### Production Build

Production builds are created with npm run build, generating optimized static files in the dist directory. The build process includes tree shaking, minification, and code splitting for optimal performance.

### Environment Configuration

The .env file configures API endpoints and other environment-specific settings. VITE_API_URL sets the base URL for API requests, and VITE_WS_URL sets the WebSocket connection URL.

## Dependencies

Key dependencies include React 18 for UI components, React Router 6 for navigation, Tailwind CSS 3 for styling, Vitest 4 for testing, and the Web Crypto API for encryption through the browser's native cryptography interfaces.
