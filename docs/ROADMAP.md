# Driflly Roadmap

## Future Technology Migrations

### Next.js Migration

The current React + Vite setup has served the project well, but migrating to Next.js offers several advantages for the future of Driflly. Next.js would provide server-side rendering for improved initial load times and better search engine visibility for the marketing pages. The built-in image optimization would enhance performance for the hero and section images without manual optimization work.

API routes in Next.js could potentially replace some backend functionality, though the WebSocket-based real-time communication would still require a separate service. The hybrid approach would allow static generation for landing pages while maintaining dynamic capabilities for the chat interface. This migration would be incremental, starting with the marketing pages and eventually moving the chat interface.

The App Router in Next.js 14 offers improved routing and layout capabilities. The landing page sections could be organized as server components for better performance, while the chat interface remains a client component for interactivity. This hybrid model would give users the best of both worlds without compromising the real-time nature of conversations.

### WebAssembly for Encryption

The current encryption implementation uses the Web Crypto API, which is fast and well-supported. However, WebAssembly could provide even better performance for encryption operations, especially on lower-end mobile devices. A WebAssembly module written in Rust could handle encryption and decryption with near-native speed.

The encryption module would need to be carefully audited to ensure no security regressions. The WebAssembly module would be loaded asynchronously, falling back to the JavaScript implementation if the module fails to load. This progressive enhancement approach ensures that encryption always works regardless of WebAssembly support.

### WebRTC for Peer-to-Peer Transfer

The current WebSocket-based file transfer works well for small files, but larger files could benefit from peer-to-peer transfer using WebRTC. This would reduce server load and potentially improve transfer speeds, especially when participants are geographically close. WebRTC would also enhance privacy by keeping file data off the server entirely.

The implementation would use WebRTC data channels for direct peer-to-peer communication while maintaining the WebSocket connection for signaling and session management. This hybrid approach would keep the simplicity of the current system while adding optional peer-to-peer capabilities for supported browsers.

### React Native Mobile Apps

Native mobile apps built with React Native would provide a better experience on iOS and Android. Push notifications could alert users when someone joins their session or sends a message. Deep linking would make sharing session links seamless between apps. The shared codebase would reuse most of the existing React components and logic.

The mobile apps would maintain the same privacy-first philosophy with no data collection and end-to-end encryption. The WebSocket connection would work the same way, and the encryption implementation would be identical to the web version. This consistency would ensure that conversations can continue seamlessly between web and mobile clients.

### Tauri Desktop Applications

For desktop users, Tauri offers a lightweight alternative to Electron. Tauri apps use the system webview, resulting in much smaller bundle sizes and lower memory usage. A Tauri desktop app would provide the same functionality as the web version with added features like system tray integration and native notifications.

The Rust backend of Tauri could potentially handle encryption and WebSocket connections more efficiently than JavaScript. The shared codebase would keep the React frontend identical while replacing the browser runtime with a native wrapper. This approach would give desktop users a more integrated experience without sacrificing performance.

## Future Modes

### Group Mode

Group mode will enable conversations with up to five participants. This mode maintains the same ephemeral and encrypted properties as duo mode but adds complexity in participant management and message routing. Each participant will have an anonymous handle generated for the session, ensuring privacy while allowing participants to distinguish between speakers.

The interface will need to adapt to show multiple participants typing indicators and read receipts. Message delivery status will show which participants have received and read each message. Participants will be able to leave the group without terminating the session for others, with the session continuing until the timer expires or the last participant leaves.

Moderator capabilities may be added, allowing designated participants to remove disruptive users or control who can speak. These moderator actions would themselves be ephemeral, lasting only for the duration of the session. The goal is to enable productive group conversations while maintaining the core privacy principles.

### Live Board Mode

Live Board mode transforms Driflly into an interactive classroom or meeting tool. The session creator becomes the host with a display code for participants to join. Participants remain completely anonymous, identified only by randomly assigned emoji avatars or colors. Questions and comments appear in a queue on the host's screen.

The host can pin important questions, mark them as answered, or hide inappropriate content. A presenter mode would allow projecting the board on a large screen while controlling the interface from a separate device. This makes Live Board suitable for classrooms, conferences, and town halls where audience participation is valuable but privacy is paramount.

Polls and reactions can be created on the fly, with results appearing in real-time. All poll data is ephemeral and disappears when the session ends. The host can export anonymized results if needed, but no individual responses are ever stored or associated with specific participants.

### Broadcast Mode

Broadcast mode enables one-to-many announcements where only the host can send messages. Participants can view the announcements and send anonymous reactions or feedback, but cannot send messages visible to other participants. This mode is ideal for emergency notifications, company announcements, or public service messages.

The host can see how many participants have viewed each announcement and can send follow-up messages based on feedback. All viewing data is aggregated and anonymized, with no individual participant tracking. Announcements disappear when the broadcast ends, leaving no record of who saw what.

Emergency broadcast capabilities could include priority delivery and guaranteed viewing confirmation for critical messages. The system would attempt to deliver announcements even if participants have poor connectivity, queuing messages until delivery is confirmed. This makes Broadcast mode suitable for crisis communication scenarios.

### Drop Mode

Drop mode focuses entirely on ephemeral file and text transfer. Users can drop files or notes that self-destruct after being viewed or after a specified time. This is perfect for sharing sensitive documents, temporary access codes, or private information that should not persist.

Files in Drop mode have configurable destruction rules. They can self-destruct after first view, after a certain number of views, or after a time delay. Senders receive notification when their drop has been viewed and destroyed. No trace of the file remains on any server after destruction.

The interface is minimalist, focusing on the drop and retrieval experience. Drops can be protected with an additional code for extra security. Large files are automatically compressed and split into chunks for reliable transfer, then reconstructed on the receiving end.

### Whisper Mode

Whisper mode takes ephemerality to the extreme with messages that disappear seconds after being read. This mode is inspired by Snapchat but with true end-to-end encryption and no data retention. Messages cannot be screenshotted (though this cannot be technically prevented, users are warned).

Messages in Whisper mode have configurable lifespans from one to ten seconds. The sender can see when the message has been read and when it self-destructs. The interface shows a countdown timer on each message, adding tension and urgency to the conversation.

This mode is ideal for sharing sensitive information that should never be recorded, such as passwords, temporary access codes, or private thoughts. The ephemeral nature encourages authentic communication without fear of messages being saved and shared later.

### Encrypted Voice Notes

Voice notes will add audio capabilities to all modes while maintaining end-to-end encryption. Users can record short voice messages that are encrypted and transmitted like text messages. Voice notes inherit the same ephemeral properties as text, disappearing when the session ends.

The implementation will use the Web Audio API for recording and Opus codec for compression. Encrypted voice notes will be significantly smaller than raw audio, making them practical even on slow connections. Playback will be seamless with automatic decryption and decoding.

Voice notes in Whisper mode will self-destruct after playback, playing only once and then disappearing. This adds a new dimension to ephemeral communication, enabling private audio conversations that leave no trace.

### Encrypted Video Calls

Video calling represents the most ambitious future feature. Using WebRTC, participants would establish direct peer-to-peer video connections with end-to-end encryption. The Driflly backend would only handle signaling and session management, never seeing the video content.

Video calls would be fully ephemeral, with no recording capability and no traces left after the call ends. The interface would show connection quality and allow participants to mute audio or disable video. Picture-in-picture mode would let users continue browsing while on the call.

Group video calls would be possible in Group mode, with the interface adapting to show multiple participants. The system would optimize for bandwidth, adjusting video quality based on connection speed. All video data would be encrypted end-to-end, ensuring that even the signaling server cannot access the content.

### End-to-End Encrypted File Sharing for All Types

Current image-only file sharing will expand to support all common file types including PDFs, Word documents, Excel spreadsheets, and archives. Each file type will have appropriate preview capabilities within the browser where possible. Files will inherit the same encryption and ephemeral properties as messages.

PDF previews will be rendered using PDF.js, with text search and navigation controls. Document previews will use browser capabilities or fallback to download links. All previews happen client-side, ensuring that file contents never reach the server unencrypted.

View-once files will work for all types, with appropriate warnings before opening. Large files will be chunked for reliable transfer and reconstructed on the receiving end. Progress indicators will show upload and download status, and transfers can be paused and resumed.

### Read Receipts Enhancements

Read receipts will become more sophisticated, showing exactly when each participant read each message. In Group mode, read receipts will show which participants have read which messages. Senders will know if their message was read by everyone or if some participants are still catching up.

Delivery receipts will show when messages have been successfully delivered to the server and when they have been delivered to each recipient's device. This provides confidence that messages are reaching their intended destinations, even on unreliable networks.

Optional read receipt disabling will be available for users who prefer more privacy. When disabled, senders will only see delivery confirmation, not read status. This respects different privacy preferences while maintaining the core functionality.

### Custom Access Codes

Users will be able to create custom access codes for their sessions instead of random six-digit codes. This is particularly useful for recurring meetings or events where a memorable code makes sharing easier. Custom codes must be at least six characters and can include letters and numbers.

Custom codes will still expire after the session and cannot be reused while a session is active. The system will check for collisions and suggest alternatives if a code is already in use. Users can optionally set a password for additional security on top of the access code.

For enterprise users, custom codes can be integrated with existing systems. A company could use Driflly for internal communications with codes matching their existing naming conventions. This flexibility makes the platform more adaptable to different use cases.

### Message Reactions

Ephemeral reactions will allow participants to respond to messages with emoji without creating new message threads. Reactions appear attached to messages and disappear when the session ends. In Group mode, reactions show who reacted with what, maintaining context while preserving anonymity.

Reactions are themselves ephemeral and encrypted. They follow the same delivery and read receipt rules as messages. The interface will show reaction counts and a list of who reacted when clicked, making it easy to gauge group sentiment at a glance.

Custom reactions could be added in future versions, allowing users to define their own reaction emoji. All reactions remain ephemeral and are deleted when the session ends, ensuring that no permanent record of emotional responses remains.

### Message Editing

Users will be able to edit sent messages within a configurable time window, typically two minutes after sending. Edited messages show an edited indicator but do not reveal the edit history. This allows correction of typos without creating permanent records of mistakes.

Editing works within the encryption model by sending a new encrypted message with the same ID and an edit flag. Recipients receive the edited version and replace the original in their UI. The server never stores the edit history, maintaining the ephemeral nature of conversations.

In Whisper mode, editing is disabled because messages disappear too quickly. In Group mode, edit notifications show which message was edited but not the original content. This balances flexibility with privacy.

### Message Deletion

Users will be able to delete their own messages within a configurable time window. Deleted messages disappear from all participants' interfaces and show a deleted placeholder. The deletion is permanent and cannot be undone.

Deletion works by sending a delete command with the message ID. Recipients remove the message from their UI and show a placeholder indicating a message was deleted. The server never stores that a deletion occurred beyond the temporary delivery queue.

In Whisper mode, deletion is unnecessary because messages disappear naturally. In other modes, deletion provides users with control over their contributions to the conversation, aligning with the ephemeral philosophy.

### Session Extensions

Users will be able to extend session duration before expiration, up to a maximum total duration. This is useful when conversations need more time than originally allocated. Extensions are logged in the session metadata but no permanent record is kept.

The extension interface will show current time remaining and allow adding increments of time. Both participants can extend the session, with the most recent extension determining the new expiration. Extensions are subject to the same maximum total duration limits as initial creation.

Extensions work with the existing timer synchronization system. When a session is extended, all connected clients receive an updated expiration time and adjust their timers accordingly. This keeps all participants in sync without requiring constant polling.

### Session Resumption

Participants will be able to resume sessions after accidental disconnections within a grace period. If a participant loses connection and reconnects within thirty seconds, they rejoin the existing session without triggering participant_left notifications.

The grace period allows for brief network interruptions without disrupting the conversation. During the grace period, messages are queued for the disconnected participant and delivered upon reconnection. After the grace period expires, the participant is considered to have left permanently.

Session resumption maintains the illusion of continuous connection even on unreliable networks. Users experience fewer interruptions and can trust that their messages will be delivered even if their connection drops temporarily.

### Privacy Enhancements

Privacy Guard will be enhanced with additional protection modes. Full blur mode will completely obscure the screen when the tab loses focus. Selective blur mode will blur only message content while leaving the interface visible. Users can configure which mode suits their needs.

Screenshot detection will attempt to notify users when screenshots are taken, though this cannot be prevented. The notification serves as a deterrent and reminds users that they are in a private conversation. Users can disable these notifications if they find them intrusive.

Screen recording detection will similarly attempt to notify participants when recording is detected. This provides awareness of potential privacy violations without falsely claiming to prevent them. All detection runs locally and no data about detection events is transmitted.

### Performance Optimizations

Virtualized message lists will improve performance for long conversations. Only messages visible in the viewport will be rendered, with others rendered as placeholders. This keeps memory usage low even for extended sessions with many messages.

Lazy loading for images ensures that images only load when they scroll into view. This saves bandwidth and improves initial page load time. Progressive image loading shows a blurred preview while the full image loads, maintaining visual continuity.

Code splitting will further reduce initial bundle size by loading only the code needed for the current mode. The large codebase for all modes will be split into chunks loaded on demand. This keeps the initial download small while maintaining full functionality.

These optimizations ensure that Driflly remains fast and responsive even as new features are added, maintaining the performance that users expect from a modern web application.
