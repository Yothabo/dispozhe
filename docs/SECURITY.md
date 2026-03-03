# Security Policy

## Supported Versions

The Driflly project maintains two active versions. Version 1.0.x is in active development and receives regular security updates. Version 2.0.x is the current stable release and receives priority security updates. Versions below 1.0 are no longer supported and users should upgrade to a supported version as soon as possible.

## Reporting a Vulnerability

Security is taken seriously at Driflly. If you discover a security vulnerability, please report it immediately. Do not create a public GitHub issue for security vulnerabilities as this could put users at risk before a fix is available.

Reports should be sent via email to security@driflly.app with a backup to security@yothabo.com. These addresses are monitored by the core development team and receive priority attention.

When reporting, please include the type of vulnerability such as cross-site scripting, cross-site request forgery, injection flaws, or any other classification that helps understand the issue. Include the affected versions if known, as this helps determine which branches need patches. Provide clear and concise steps to reproduce the issue so the team can verify and understand the impact. Describe what an attacker could achieve with the vulnerability to help prioritize the fix. If possible, include a proof of concept, though this is not required. Finally, provide your contact information for any follow-up questions that may arise during investigation.

Reports will be acknowledged within 24 hours of receipt. A more detailed response will follow within 72 hours indicating whether the report is accepted or rejected. If accepted, an estimated timeline for the fix will be provided. Throughout the process, the reporter will be kept informed of progress.

## Encryption Standards

Driflly uses AES-256-GCM for all message encryption. This algorithm was chosen because it provides both confidentiality and authentication, preventing tampering with encrypted messages. The Galois Counter Mode ensures that any modification to the ciphertext is detected upon decryption.

Key generation occurs entirely on the client side using the Web Crypto API. Keys are 256 bits in length and are generated using cryptographically secure random number generators. These keys are never transmitted to any server and exist only in the memory of the participants' devices.

Keys are stored exclusively in memory and are never persisted to disk. When a session ends, either through timer expiration or manual termination, all keys are immediately discarded and become unrecoverable. There are no backups, no copies, and no way to retrieve keys after a session ends.

Message encryption happens before any data leaves the client device. The plaintext is encrypted with the session key, and only the resulting ciphertext is transmitted over the network. The server never has access to the encryption keys and therefore cannot decrypt any messages it relays.

## Access Control

Sessions are limited to a maximum of two participants. This limit is enforced at both the API level and the WebSocket level. Any attempt to connect a third participant is rejected with an HTTP 403 status code or a WebSocket close code of 1008 or 4003. This ensures that conversations remain truly private between the intended participants.

Access codes have a validity period of 30 seconds. This short window minimizes the risk of codes being intercepted and used by unauthorized parties. After 30 seconds, the code expires and cannot be used even if it has not been redeemed. New codes must be generated for new access attempts.

Connection tokens are valid for 60 seconds. When a client establishes a WebSocket connection, it receives a token that must be used for subsequent requests. This token expires after one minute, requiring a new token for continued communication. This limits the window of opportunity for token theft and replay attacks.

One-time links expire immediately after first use. Whether the link is used to join a session or simply accessed, it becomes invalid for any future attempts. This prevents link sharing beyond the intended recipient and ensures that each invitation can only be used once.

When a session reaches its participant limit, all further connection attempts are rejected. The rejection includes clear error messages and appropriate HTTP status codes or WebSocket close codes, allowing clients to handle the rejection gracefully and inform users appropriately.

## Data Protection

Message content is never stored. When messages are transmitted, they exist only in the memory of the server while being relayed from one participant to another. Once delivered, the server immediately discards any record of the message. There are no databases of messages, no logs of conversations, and no backups that could expose communication history.

Session metadata exists only in memory during active sessions. Information such as participant count, session status, and expiration time is held in RAM and is never written to disk. When a session ends, this metadata is simply discarded and becomes unrecoverable.

The database stores only essential session information. This includes session identifiers, creation and expiration timestamps, duration in minutes, participant counts, status flags, and link activity indicators. Codes are stored with their associated session identifiers, encryption keys, expiration timestamps, and redeemed status. No message content, user identifiers, or any personally identifiable information is ever written to the database.

Upon session termination, all data is permanently deleted. For active sessions, this means clearing all in-memory data structures. For expired sessions, the database records are removed. The deletion process is synchronous and verified to ensure that no data remains accessible after termination.

## Network Security

All communication between clients and servers occurs over encrypted channels. The frontend API uses HTTPS with TLS 1.3 where supported, falling back to TLS 1.2 when necessary. WebSocket connections use WSS, ensuring that all WebSocket traffic is encrypted just like HTTPS traffic.

Certificate validation is strict. Clients verify that server certificates are valid, not expired, and issued by trusted certificate authorities. Certificate pinning is not used, allowing for normal certificate rotation while maintaining security through standard PKI infrastructure.

CORS restrictions are strictly enforced. The API only accepts requests from allowed origins, which include localhost for development and the official deployment domains for production. This prevents unauthorized websites from making requests to the Driflly API on behalf of users.

Rate limiting is implemented at multiple levels. The API limits the number of session creation requests per IP address to prevent abuse. WebSocket connections are limited per session to prevent resource exhaustion. Code redemption attempts are rate limited to prevent brute force attacks against the six-digit codes.

## Input Validation

All input is validated before processing. Session creation requests must include a duration within the allowed range of one minute to twenty-four hours. Code redemption requests must include exactly six digits. Message data must be properly formatted base64 and within size limits.

Sanitization is applied to all user-provided content. Text messages are escaped to prevent cross-site scripting attacks. File names are sanitized to prevent path traversal attacks. Metadata is stripped from uploaded files to prevent information leakage.

Validation occurs at multiple layers. The API layer validates request format and parameters. The WebSocket layer validates message structure. The application layer validates business logic constraints. This defense-in-depth approach ensures that invalid data is rejected at the earliest possible point.

## Session Management

Session identifiers are randomly generated using cryptographically secure random number generators. They are long enough to be unguessable and unique enough to prevent collisions. Session IDs are never reused, even after sessions expire.

Session expiry is enforced both actively and passively. Active enforcement checks each request against the session's expiration time and rejects any access to expired sessions. Passive enforcement runs a background process that periodically marks expired sessions and cleans up associated resources.

Manual termination is available to users and is treated with the same priority as automatic expiration. When a user terminates a session, all connections are immediately closed, all in-memory data is cleared, and the database records are deleted. The other participant receives immediate notification of the termination.

## Code Generation

Access codes are six digits for ease of use while maintaining security. With one million possible combinations and a thirty-second validity window, brute force attacks are impractical. Each failed attempt increments a counter, and after five failed attempts, the code is invalidated.

Code generation uses cryptographically secure random numbers. The random number generator is seeded from system entropy and produces uniformly distributed values. Codes are checked for collisions before being assigned, though the probability of collision is extremely low given the one million code space.

Code redemption is a one-time operation. Once a code is used, it is immediately marked as redeemed and cannot be used again. The redemption timestamp is recorded for audit purposes, but no other information about the redemption is stored.

## WebSocket Security

WebSocket connections are authenticated using session identifiers. When a client connects, the session ID is included in the URL path. The server validates that the session exists, is active, and has not exceeded its participant limit before accepting the connection.

Connection limits are strictly enforced. The WebSocket manager tracks active connections per session and rejects any attempt to exceed the limit of two participants. Rejected connections receive a close code indicating the reason for rejection, allowing clients to handle the situation appropriately.

Heartbeat messages are exchanged every twenty-five seconds to detect stale connections. If a client fails to respond to heartbeats, the connection is considered dead and is closed. This prevents zombie connections from consuming resources and ensures that participant counts remain accurate.

Message validation occurs on every received message. Messages must be valid JSON, contain a type field, and include any required fields for that message type. Invalid messages are silently ignored, preventing malformed data from affecting the application state.

## File Security

File uploads are limited to ten megabytes. This limit prevents denial of service attacks through large file uploads and ensures that file transfers complete quickly even on slow mobile connections. Files larger than the limit are rejected before any processing begins.

Only image files are currently supported. This limitation reduces the attack surface by limiting the types of files that can be uploaded. When support for other file types is added, each will be carefully evaluated for security implications before inclusion.

View-once files are automatically deleted after viewing. When a recipient views a view-once file, the server immediately discards the file data and notifies the sender. The file cannot be viewed again, even if the recipient attempts to access it through other means.

File data is stored only in memory during transfer. Files are never written to disk, not even temporarily. The file data exists in the server's memory only long enough to be relayed to the recipient, after which it is immediately discarded.

## Privacy Features

No personally identifiable information is ever collected. The service does not require email addresses, phone numbers, names, or any other identifying information. Users remain completely anonymous throughout their interaction with the service.

Session data is isolated between sessions. There is no cross-session tracking, no user profiles, and no way to correlate activity across different sessions. Each session is a completely independent context with no connection to any other.

Privacy Guard blurs the screen when the tab loses focus. This prevents visual eavesdropping when switching away from the tab or when the device is left unattended. The blur effect is applied immediately and removed only when the tab regains focus.

Read receipts provide message status without compromising privacy. Senders know when their messages are delivered and read, but no additional information about the recipient's device or location is exposed.

## Incident Response

Security incidents are handled according to a defined response plan. Upon confirmation of an incident, the team works to contain the impact, eradicate the cause, and recover normal operations. Throughout the process, affected users are kept informed as appropriate.

Vulnerabilities are patched according to severity. Critical vulnerabilities receive immediate attention with patches released within twenty-four hours. High severity issues are patched within one week. Medium and low severity issues are addressed in regular release cycles.

Disclosure follows responsible disclosure principles. Reporters are given credit for their findings unless they request anonymity. Details are published after users have had reasonable time to apply patches. Full technical details are shared with the security community to improve overall software security.

## Compliance

The service complies with relevant privacy regulations by design. By collecting no personal data, Driflly avoids the complex compliance requirements that come with data collection. There are no data processing agreements to sign, no privacy impact assessments to conduct, and no data protection officers to appoint.

International data transfer considerations are minimal because no data is stored. Even if data passes through servers in different jurisdictions, the encrypted nature of the communication means that no meaningful data is exposed. The zero-data approach provides the highest possible level of compliance.

Audit trails are intentionally absent. There are no logs of who communicated with whom, when they communicated, or what they said. This design choice prioritizes privacy over auditability and ensures that no records exist that could be subpoenaed or leaked.

## Future Security Enhancements

Planned improvements include WebAssembly modules for encryption to improve performance and reduce memory usage. Service workers will enable better offline support while maintaining security boundaries. WebRTC may be added for peer-to-peer file transfer, reducing server exposure to file data.

Ongoing challenges include balancing security with usability, maintaining fast performance on mobile devices, and staying ahead of emerging threats. The team continuously monitors security research and updates practices accordingly.

Regular security reviews are conducted on the codebase. Automated tools scan dependencies for known vulnerabilities. Manual code reviews focus on security-critical areas. External security researchers are encouraged to examine the code and report findings.
