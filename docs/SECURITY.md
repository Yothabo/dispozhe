# Security Policy

## Supported Versions

The Driflly project maintains two active versions. Version 1.0.x is the current stable release and receives priority security updates. Version 2.0.x is in active development. Versions below 1.0 are no longer supported and users should upgrade to a supported version as soon as possible.

## Reporting a Vulnerability

Security is taken seriously at Driflly. If you discover a security vulnerability, please report it immediately. Do not create a public GitHub issue for security vulnerabilities as this could put users at risk before a fix is available.

Reports should be sent via email to security@driflly.app. These addresses are monitored by the core development team and receive priority attention. When reporting, please include the type of vulnerability such as cross-site scripting, cross-site request forgery, injection flaws, or any other classification that helps understand the issue. Include the affected versions if known, as this helps determine which branches need patches. Provide clear and concise steps to reproduce the issue so the team can verify and understand the impact. Describe what an attacker could achieve with the vulnerability to help prioritize the fix. If possible, include a proof of concept, though this is not required. Provide your contact information for any follow-up questions that may arise during investigation.

Reports will be acknowledged within twenty-four hours of receipt. A more detailed response will follow within seventy-two hours indicating whether the report is accepted or rejected. If accepted, an estimated timeline for the fix will be provided. Throughout the process, the reporter will be kept informed of progress.

## Encryption Standards

Driflly uses AES-256-GCM for all message encryption. This algorithm was chosen because it provides both confidentiality and authentication, preventing tampering with encrypted messages. The Galois Counter Mode ensures that any modification to the ciphertext is detected upon decryption.

Key generation occurs entirely on the client side using the Web Crypto API. Keys are two hundred fifty-six bits in length and are generated using cryptographically secure random number generators. These keys are never transmitted to any server and exist only in the memory of the participants' devices. Keys are stored exclusively in memory and are never persisted to disk. When a session ends, either through timer expiration or manual termination, all keys are immediately discarded and become unrecoverable.

Message encryption happens before any data leaves the client device. The plaintext is encrypted with the session key, and only the resulting ciphertext is transmitted over the network. The server never has access to the encryption keys and therefore cannot decrypt any messages it relays.

## Replay Protection

The replay protection system adds security through HMAC-SHA256 signing of messages, sequence number tracking per client, and nonce tracking with a five-minute expiry. The module is implemented with feature flags allowing gradual rollout without breaking existing clients.

When enabled, the system validates every message against sequence numbers and nonces before forwarding. Each client maintains an increasing sequence number per session, and any message with a sequence number less than or equal to the last seen is rejected. Nonces are tracked for five minutes to prevent replay attacks within that window. HMAC-SHA256 signatures ensure message integrity and authenticity.

## Access Control

Sessions are limited to a maximum of two participants. This limit is enforced at both the API level and the WebSocket level. Any attempt to connect a third participant is rejected with an HTTP 403 status code or a WebSocket close code of 1008. This ensures that conversations remain truly private between the intended participants.

Access codes have a validity period of thirty seconds. This short window minimizes the risk of codes being intercepted and used by unauthorized parties. After thirty seconds, the code expires and cannot be used even if it has not been redeemed. Each code can only be used once, regardless of whether the join attempt succeeds.

Rate limiting is implemented to prevent brute force attacks against the six-digit codes. Failed redemption attempts are limited to five per minute per IP address. Session creation is limited to ten requests per minute per IP address to prevent abuse.

One-time links expire immediately after first use. Whether the link is used to join a session or simply accessed, it becomes invalid for any future attempts. This prevents link sharing beyond the intended recipient and ensures that each invitation can only be used once.

## Data Protection

Message content is never stored. When messages are transmitted, they exist only in the memory of the server while being relayed from one participant to another. Once delivered, the server immediately discards any record of the message. There are no databases of messages, no logs of conversations, and no backups that could expose communication history.

Session metadata exists only in memory during active sessions. Information such as participant count, session status, and expiration time is held in RAM and is never written to disk. When a session ends, this metadata is simply discarded and becomes unrecoverable.

The database stores only essential session information. This includes session identifiers, creation and expiration timestamps, duration in minutes, participant counts, status flags, and link activity indicators. Codes are stored with their associated session identifiers, encryption keys, expiration timestamps, and redeemed status. No message content, user identifiers, or any personally identifiable information is ever written to the database.

Upon session termination, all data is permanently deleted. For active sessions, this means clearing all in-memory data structures. For expired sessions, the database records are removed. The deletion process is synchronous and verified to ensure that no data remains accessible after termination.

## Network Security

All communication between clients and servers occurs over encrypted channels. The frontend API uses HTTPS with TLS 1.3 where supported, falling back to TLS 1.2 when necessary. WebSocket connections use WSS, ensuring that all WebSocket traffic is encrypted just like HTTPS traffic.

Certificate validation is strict. Clients verify that server certificates are valid, not expired, and issued by trusted certificate authorities. This prevents man-in-the-middle attacks.

CORS restrictions are strictly enforced. The API only accepts requests from allowed origins, which include localhost for development and the official deployment domains for production. This prevents unauthorized websites from making requests to the Driflly API on behalf of users.

## Threat Model

### In Scope

The system protects against several threat vectors. Server compromise does not expose message content because encryption keys never leave client devices and messages are never stored. Network eavesdroppers cannot read message content because all traffic is encrypted end-to-end. Replay attacks are prevented through sequence numbers and nonce tracking. Brute force attacks against access codes are mitigated through rate limiting and short code expiry windows.

### Out of Scope

Certain threats are outside the system's control. Device compromise where an attacker has access to the user's device cannot be prevented. Screenshots can be taken by participants and cannot be technically blocked. Network traffic metadata such as connection times and IP addresses may be visible to internet service providers. Users are responsible for securely sharing access codes and links with intended recipients.

## Open Source

The codebase is publicly available for independent security auditing. Security researchers are encouraged to examine the code and report findings. The open source nature of the project allows for community review and contributes to the overall security of the system.

## Incident Response

Security incidents are handled according to a defined response plan. Upon confirmation of an incident, the team works to contain the impact, eradicate the cause, and recover normal operations. Throughout the process, affected users are kept informed as appropriate.

Vulnerabilities are patched according to severity. Critical vulnerabilities receive immediate attention with patches released within twenty-four hours. High severity issues are patched within one week. Medium and low severity issues are addressed in regular release cycles.

Disclosure follows responsible disclosure principles. Reporters are given credit for their findings unless they request anonymity. Details are published after users have had reasonable time to apply patches. Full technical details are shared with the security community to improve overall software security.
