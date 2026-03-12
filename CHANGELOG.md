# Changelog

All notable changes to Driflly are documented in this file.

## 1.0.0 - 2026-03-12

### Added
- End-to-end encryption with AES-256-GCM using Web Crypto API
- Zero-knowledge message relay architecture
- Replay protection with HMAC signing, sequence numbers, and nonce tracking
- Comprehensive test suite with forty-eight passing tests
- Stress tests validating one hundred concurrent sessions
- Session creation with configurable duration from one minute to twenty-four hours
- Six-digit access codes with thirty-second expiry
- One-time shareable links
- WebSocket real-time communication
- Typing indicators and read receipts
- Image sharing up to ten megabytes
- Manual and automatic session termination
- Background expiry scheduler running every sixty seconds
- Connection pooling with fifty connections and one hundred overflow
- Admin API for feature flag toggling
- Documentation including API reference, architecture overview, and security policy
- Docker and Docker Compose configurations
- GitHub Actions CI pipeline
- Production deployment configurations for Render and Vercel

### Changed
- Connection pool increased from five to fifty with overflow one hundred
- Message format extended to include sequence, nonce, and HMAC fields
- Backend validation now checks message integrity before forwarding
- Documentation updated to reflect current codebase state

### Security
- Added HMAC-SHA256 signing to all messages ensuring integrity
- Implemented sequence number tracking preventing replay attacks
- Added nonce tracking with five-minute expiry window
- Session cleanup removes all tracking data on termination
- Rate limiting for code redemption attempts

## 0.9.0 - 2026-02-15

### Added
- Zero-knowledge message relay implementation
- Backend now treats all messages as opaque blobs without inspection
- Message queuing for offline recipients
- Delivery status tracking with sent, delivered, and read states
- Heartbeat mechanism at twenty-five second intervals to detect stale connections

### Changed
- WebSocket endpoint separates system messages from encrypted content
- Message handler no longer validates encrypted content structure
- Queue system stores encrypted messages as-is without transformation

### Fixed
- Connection pooling issues under load
- WebSocket reconnection logic with exponential backoff

## 0.8.0 - 2026-02-01

### Added
- End-to-end encryption with AES-256-GCM
- Client-side key generation using Web Crypto API
- Key exchange protocol for link-based joins
- Encrypted message format with IV and ciphertext
- Key ID system for session identification

### Security
- Encryption keys never leave participant devices
- Server has zero visibility into message content
- Each session uses unique encryption keys
- Keys stored only in memory, discarded on session end

## 0.7.0 - 2026-01-15

### Added
- Initial session management system
- Six-digit code generation with thirty-second expiry
- One-time link sharing
- Basic WebSocket communication
- Participant tracking with two-user limit
- Timer display with configurable durations

### Changed
- Database schema for session and code storage
- API endpoints for session creation and joining

### Fixed
- Connection limit enforcement
- Session cleanup on termination

## 0.6.0 - 2026-01-01

### Added
- Project initialization
- Basic React frontend structure
- FastAPI backend foundation
- Termux development environment setup
- Initial documentation framework
