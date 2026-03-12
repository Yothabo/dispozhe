# Changelog

All notable changes to Driflly are documented in this file.

## [Unreleased]

### Added
- Day 9 documentation updates to align with current codebase state
- Backend README with comprehensive architecture documentation
- Frontend README with detailed component and encryption documentation
- Root README updates removing references to unimplemented features

### Changed
- Documentation now accurately reflects working features only
- Removed references to Rust, WebAssembly, and other unimplemented technologies
- Updated architecture documentation to match current implementation

## [1.0.0] - 2026-03-01

### Added
- Day 7 replay protection system with HMAC signing, sequence numbers, and nonce tracking
- Feature flags for gradual rollout of security features without breaking existing clients
- Admin API endpoints for toggling replay protection at runtime
- Comprehensive replay protection tests with 14 passing test cases

### Changed
- Message format extended to include sequence, nonce, and HMAC fields
- Backend validation now checks message integrity before forwarding
- Connection pool increased from 5 to 50 with overflow 100 to handle concurrent load

### Security
- Added HMAC-SHA256 signing to all messages ensuring integrity
- Implemented sequence number tracking preventing replay attacks
- Added nonce tracking with 5-minute expiry window
- Session cleanup now removes all tracking data on termination

## [0.9.0] - 2026-02-15

### Added
- Day 3 zero-knowledge message relay implementation
- Backend now treats all messages as opaque blobs without inspection
- Message queuing for offline recipients
- Delivery status tracking with sent, delivered, and read states
- Heartbeat mechanism at 25-second intervals to detect stale connections

### Changed
- WebSocket endpoint now separates system messages from encrypted content
- Message handler no longer validates encrypted content structure
- Queue system stores encrypted messages as-is without transformation

### Fixed
- Connection pooling issues under load
- WebSocket reconnection logic with exponential backoff

## [0.8.0] - 2026-02-01

### Added
- Days 1-2 end-to-end encryption with AES-256-GCM
- Client-side key generation using Web Crypto API
- Key exchange protocol for link-based joins
- Encrypted message format with IV and ciphertext
- Key ID system for session identification

### Security
- Encryption keys never leave participant devices
- Server has zero visibility into message content
- Each session uses unique encryption keys
- Keys stored only in memory, discarded on session end

## [0.7.0] - 2026-01-15

### Added
- Initial session management system
- Six-digit code generation with 30-second expiry
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

## [0.6.0] - 2026-01-01

### Added
- Project initialization
- Basic React frontend structure
- FastAPI backend foundation
- Termux development environment setup
- Initial documentation framework
