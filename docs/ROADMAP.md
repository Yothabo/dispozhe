# Driflly Roadmap

## Important Note

This roadmap represents our current development priorities and aspirations. Timelines are estimates and may change based on resources, technical challenges, and community feedback. Some features described here are planned but not yet implemented. For a complete list of currently working features, see the README.md file.

## Recently Completed

### Day 7 - Replay Protection (Completed March 2026)

The replay protection system adds security through HMAC-SHA256 signing of messages, sequence number tracking per client, and nonce tracking with 5-minute expiry. The module is implemented with feature flags allowing gradual rollout without breaking existing clients. When enabled, the system validates every message against sequence numbers and nonces before forwarding, preventing replay attacks and ensuring message integrity.

### Day 8 - Comprehensive Test Suite (Completed March 2026)

The test suite now includes 48 passing tests covering API endpoints, WebSocket functionality, encryption validation, and load testing. Stress tests confirm the system handles 100+ concurrent sessions with 100% success rate and 80+ requests per second throughput. Security tests validate replay protection with 14 passing test cases.

### Day 9 - Documentation Alignment (In Progress)

Documentation is being updated to accurately reflect the current codebase state, removing references to unimplemented features and adding transparency about development status. This includes updates to the Manifesto, Roadmap, and Internal Dossier to clearly distinguish between working features and aspirational goals.

## Near-Term Priorities (Next 3-6 Months)

### Enhanced File Sharing

File sharing will be expanded beyond images to support additional file types including PDFs, Word documents, Excel spreadsheets, and archives. Each file type will have appropriate preview capabilities within the browser where possible. Files will inherit the same encryption and ephemeral properties as messages. PDF previews will be rendered using PDF.js with text search and navigation controls. Document previews will use browser capabilities or fallback to download links. All previews will happen client-side, ensuring file contents never reach the server unencrypted.

### Message Reactions

Ephemeral reactions will allow participants to respond to messages with emoji without creating new message threads. Reactions will appear attached to messages and disappear when the session ends. Reactions will themselves be ephemeral and encrypted, following the same delivery rules as messages. The interface will show reaction counts and who reacted when clicked, maintaining context while preserving anonymity.

### Read Receipt Enhancements

Read receipts will become more sophisticated, showing exactly when each participant read each message. Delivery receipts will show when messages have been successfully delivered to the server and when they have been delivered to each recipient's device. Optional read receipt disabling will be available for users who prefer more privacy. When disabled, senders will only see delivery confirmation, not read status.

### Session Extensions

Users will be able to extend session duration before expiration, up to a maximum total duration. The extension interface will show current time remaining and allow adding increments of time. Both participants can extend the session, with the most recent extension determining the new expiration. Extensions will be subject to the same maximum total duration limits as initial creation.

### Session Resumption

Participants will be able to resume sessions after accidental disconnections within a 30-second grace period. If a participant loses connection and reconnects within this window, they will rejoin the existing session without triggering participant_left notifications. During the grace period, messages will be queued for the disconnected participant and delivered upon reconnection.

## Medium-Term Goals (6-12 Months)

### Group Mode

Group mode will enable conversations with up to five participants. This mode will maintain the same ephemeral and encrypted properties as duo mode while adding complexity in participant management and message routing. Each participant will have an anonymous handle generated for the session, ensuring privacy while allowing participants to distinguish between speakers. The interface will adapt to show multiple participants with typing indicators and read receipts showing which participants have read which messages.

### Custom Access Codes

Users will be able to create custom access codes for their sessions instead of random six-digit codes. This will be particularly useful for recurring meetings or events where a memorable code makes sharing easier. Custom codes must be at least six characters and can include letters and numbers. They will still expire after the session and cannot be reused while a session is active.

### Message Editing

Users will be able to edit sent messages within a configurable time window, typically two minutes after sending. Edited messages will show an edited indicator but will not reveal the edit history. This allows correction of typos without creating permanent records of mistakes. Editing will work within the encryption model by sending a new encrypted message with the same ID and an edit flag.

### Message Deletion

Users will be able to delete their own messages within a configurable time window. Deleted messages will disappear from all participants' interfaces and show a deleted placeholder. The deletion will be permanent and cannot be undone. Deletion will work by sending a delete command with the message ID, and recipients will remove the message from their UI.

## Long-Term Vision (12+ Months)

### Live Board Mode

Live Board mode will transform Driflly into an interactive tool for classrooms, meetings, and events. The session creator becomes the host with a display code for participants to join. Participants remain completely anonymous, identified only by randomly assigned emoji avatars or colors. Questions and comments appear in a queue on the host's screen. The host can pin important questions, mark them as answered, or hide inappropriate content. Polls and reactions can be created on the fly with results appearing in real-time.

### Broadcast Mode

Broadcast mode will enable one-to-many announcements where only the host can send messages. Participants can view announcements and send anonymous reactions or feedback, but cannot send messages visible to other participants. This mode will be ideal for emergency notifications, company announcements, or public service messages. The host will be able to see how many participants have viewed each announcement and can send follow-up messages based on feedback.

### Drop Mode

Drop mode will focus entirely on ephemeral file and text transfer. Users can drop files or notes that self-destruct after being viewed or after a specified time. This will be perfect for sharing sensitive documents, temporary access codes, or private information that should not persist. Files in Drop mode will have configurable destruction rules including after first view, after a certain number of views, or after a time delay.

### Whisper Mode

Whisper mode will take ephemerality to the extreme with messages that disappear seconds after being read. Messages in Whisper mode will have configurable lifespans from one to ten seconds. The sender will be able to see when the message has been read and when it self-destructs. The interface will show a countdown timer on each message, adding urgency to the conversation. This mode will be ideal for sharing sensitive information like passwords or temporary access codes.

## Technology Evaluations

### WebAssembly for Encryption

We have evaluated WebAssembly for encryption performance improvements but encountered compilation difficulties in the Termux development environment. The Web Crypto API provides adequate performance for current needs with hardware acceleration where available. We will continue to monitor WebAssembly toolchain improvements in Termux but have no immediate plans to migrate.

### WebRTC for Peer-to-Peer Transfer

WebRTC has been evaluated for peer-to-peer file transfer to reduce server load. The complexity of signaling server implementation and limited mobile browser support have led us to prioritize WebSocket-based transfers for now. We may revisit this decision as WebRTC support matures.

### Native Mobile Applications

Native mobile applications for iOS and Android have been considered but are not currently planned. The web application works well on mobile browsers and maintains the same privacy guarantees. Native apps would require additional maintenance without significant privacy benefits.

## Development Transparency

### Completed Features

The following features from earlier roadmaps have been completed: end-to-end encryption with AES-256-GCM, zero-knowledge message relay, replay protection, comprehensive test suite, and stress testing validation.

### Partially Implemented

The Day 4 features including participant fingerprints, join handshake, and enhanced session metadata were not successfully implemented due to technical complexity. We have focused our efforts on security features that provide immediate value.

### Delayed Features

Some features originally planned for earlier releases have been delayed including group mode, file sharing for all types, and message reactions. These remain priorities but have been rescheduled based on resource availability.

## Release Cadence

### Version 1.0.x

The 1.0.x series focuses on stability and security of core functionality. Releases include bug fixes, security updates, and minor enhancements to existing features. We aim for monthly patch releases as needed.

### Version 1.1.x

The 1.1.x series will introduce enhanced file sharing and message reactions. This release is targeted for Q2 2026 with beta testing beginning in April.

### Version 1.2.x

The 1.2.x series will add session extensions, resumption, and read receipt enhancements. This release is targeted for Q3 2026.

### Version 2.0.x

The 2.0.x series will introduce group mode and custom access codes. This represents a major expansion of functionality and is targeted for Q1 2027.

## Community Input

We welcome community feedback on roadmap priorities. Feature requests and suggestions can be submitted through GitHub issues. We evaluate all suggestions based on alignment with privacy principles, technical feasibility, and development resources.

## Conclusion

This roadmap represents our current plans and aspirations. We are committed to transparency about our progress and limitations. Features may be added, delayed, or removed based on technical challenges and user feedback. The core principle of privacy-first ephemeral communication guides all our decisions.
