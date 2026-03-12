# Driflly Manifesto: Privacy as an Inherent Right

## Why We Built Driflly

Driflly was born from a simple observation: in an era where every conversation is recorded, analyzed, and monetized, there is no digital space where people can simply talk without leaving a trace. Existing communication platforms treat conversation history as a feature to be stored, searched, and sold. We believe that not every conversation needs to be permanent. Some conversations are meant to happen and then disappear, like words spoken in a room that fade the moment they are uttered.

The idea for Driflly crystallized during a conversation between two engineers who were discussing a sensitive matter over a mainstream messaging platform. One of them said, "I'll delete these messages after we're done." The other replied, "Delete doesn't mean gone. It's still on their servers." That moment revealed a fundamental truth: in modern digital communication, there is no real delete button. There is only the illusion of deletion.

We built Driflly to create a space where delete actually means gone. Where conversations exist only in the moment they happen. Where the server is a conduit, not a repository. Where privacy is not a setting you enable but the default state of the system.

## Important Note on Current Implementation

This manifesto represents the philosophical foundation and long-term vision for Driflly. The current implementation focuses on core functionality: end-to-end encrypted two-person chats that disappear after use. Some features described here are aspirational and are not yet implemented. We believe in being transparent about our progress while maintaining our commitment to the principles outlined below.

## The Problem Statement

### The Permanence Problem

Every major communication platform today stores conversations indefinitely. Even when users delete messages, those messages often remain on servers, in backups, or in analytics databases. This creates several issues.

First, there is the privacy concern. Users have no control over their data once it enters these systems. They cannot know how long it will be retained, who will have access to it, or how it might be used in the future. Terms of service change. Companies get acquired. Data gets repurposed.

Second, there is the security concern. Stored conversations are attractive targets for hackers, law enforcement, and malicious insiders. Every message stored is a message that can be leaked, subpoenaed, or exposed. The history of data breaches shows that no system is impervious to attack.

Third, there is the psychological burden. Knowing that every word you type might be permanently recorded changes how you communicate. People self-censor, avoid sensitive topics, and lose the natural flow of conversation that happens when people feel safe to speak freely.

### The Identity Problem

Most platforms require some form of identity to function. Email addresses, phone numbers, or social media profiles are used to create accounts, verify users, and build profiles. This identity requirement creates barriers to entry and exposes users to additional risks.

When you provide an email address to a service, you are creating a permanent link between your identity and your conversations. Even if you delete your account later, the association between your identity and past conversations may persist in logs and backups.

For many people, this identity requirement is more than an inconvenience. For whistleblowers, activists, journalists, and others in sensitive positions, it can be a genuine danger. The simple act of communicating with certain people could put them at risk if those communications were ever discovered.

### The Trust Problem

Users are increasingly aware that they cannot trust the platforms they use. The business model of surveillance capitalism has been exposed. People understand that if a service is free, they are the product. Their conversations, their relationships, their private moments are all being packaged and sold to advertisers.

This erosion of trust has consequences. People share less. They connect less. They retreat into guarded, superficial communication because they cannot be sure who is listening. The spontaneity and authenticity that make human conversation valuable are lost.

## Our Solution

Driflly addresses these problems through a radical approach: we store nothing. No messages. No conversation history. No user identities. No metadata beyond what is absolutely necessary to route messages between participants. And even that metadata exists only temporarily and is purged the moment a session ends.

### Currently Implemented

Our current implementation is built on three pillars. First, end-to-end encryption using AES-256-GCM ensures that only the intended recipients can read messages. Keys are generated on users' devices and never transmitted. The server sees only ciphertext and cannot decrypt anything even if compelled to do so.

Second, in-memory only architecture means that no message data is ever written to disk. Session metadata exists only in RAM while a session is active and disappears when the session ends. There are no backups, no logs, no permanent records of any kind.

Third, zero identity requirement means users never provide any personal information. No email addresses, no phone numbers, no names. Access is controlled through one-time links and six-digit codes that expire after use. There is no account creation, no profile building, no way to link sessions together.

Fourth, ephemeral by design means that conversations have a natural lifespan. Sessions are configured with timers and automatically terminate when time expires. Manual termination is available and immediately deletes all session data. Nothing persists beyond the moment it is needed.

### Future Aspirations

We envision expanding Driflly to include additional conversation modes that serve different needs while maintaining our core privacy principles. Group mode would enable small multi-participant conversations with anonymous handles. Live Board would transform Driflly into an interactive tool for classrooms and meetings. Broadcast would enable one-to-many announcements. Drop would focus on self-destructing file transfer. Whisper would offer messages that disappear seconds after being read.

These features remain aspirational and are not yet implemented. We share them to illustrate our vision and invite community input on priorities.

### The User Experience

Using Driflly feels like walking into a room, having a conversation, and walking out. The room forgets you were ever there. The conversation exists only in the memory of the participants. There is no transcript, no recording, no evidence that anything happened.

The interface is clean and minimal, designed to get out of the way and let people communicate. There are no profiles, no status updates, no permanent friend lists. Each session is a fresh start, a clean slate, a new room where anything can be said and nothing will remain.

## Target Audience

Driflly is not an everyday chat app. It is a tool for specific moments when privacy matters more than convenience, when the conversation itself is more important than the record of it.

### Journalists and Their Sources

For journalists, protecting sources is not just ethical but often legal. Driflly allows sources to share information without creating a permanent record that could be subpoenaed or leaked. The one-time access and zero-identity approach means that even if a source's device is later examined, there is no evidence of the communication.

### Whistleblowers

Whistleblowers face extraordinary risks when exposing wrongdoing. Driflly provides a channel where whistleblowers can share information with journalists, lawyers, or advocacy groups without creating evidence that could be used against them. The absence of identity requirements means whistleblowers do not need to provide any personal information to communicate.

### Activists and Human Rights Workers

In many parts of the world, activists and human rights workers operate under constant surveillance. Driflly provides a space where they can coordinate, share information, and plan without leaving a digital trail. The ephemeral nature means that even if a device is confiscated, there is no history of conversations to examine.

### Therapists and Counselors

Mental health professionals often encourage patients to be completely honest about their thoughts and feelings. Driflly provides a space where patients can speak freely, knowing that their words will disappear when the session ends. This encourages authentic communication without fear of permanent records.

### Lawyers and Clients

Attorney-client privilege is fundamental to the legal profession. Driflly provides a channel for confidential communication that leaves no digital trail. There are no emails to be subpoenaed, no message histories to be discovered. The communication exists only in the moment it happens.

### Healthcare Providers and Patients

Many healthcare conversations involve sensitive information that patients may not want permanently recorded. Driflly allows for quick consultations, follow-up questions, and information sharing without adding to permanent medical records.

### Personal Relationships

Sometimes people need to have difficult conversations that should not linger. Relationship discussions, family conflicts, and personal revelations can be shared in Driflly with the knowledge that they will not be saved and replayed later.

## Current Limitations

### Feature Scope

The current implementation supports only two-person conversations. Multi-participant modes are not yet available. File sharing is limited to images up to 10MB. These limitations reflect our focus on core functionality first.

### Technical Constraints

Our development environment in Termux imposes memory and CPU limitations that have shaped our technology choices. We use Web Crypto API rather than WebAssembly for encryption due to compilation constraints. WebSockets rather than WebRTC provide reliable communication without complexity. These choices prioritize stability over cutting-edge features.

### Development Transparency

We are transparent about our progress. The Day 4 features described in our roadmap were not successfully implemented due to technical complexity. We chose to focus on security features like replay protection that provide immediate value rather than pushing forward with problematic implementations.

## Critics and Concerns

### Positive Critiques

Supporters of Driflly appreciate its uncompromising approach to privacy. In a world where every interaction is tracked, Driflly offers a rare space where users can be confident that nothing is being recorded. This radical transparency about data practices builds trust that is increasingly rare in technology.

The technical implementation receives praise for its simplicity and effectiveness. By focusing on a narrow set of features and executing them well, Driflly avoids the complexity and bloat that plague larger platforms. The codebase is clean, auditable, and accessible to security researchers.

The zero-identity approach is celebrated by privacy advocates who have long argued that identity requirements create unnecessary risks and barriers. Driflly proves that meaningful communication can happen without collecting personal information.

### Negative Critiques

Some critics argue that Driflly enables harmful behavior by providing a platform for communication that leaves no trace. We acknowledge this concern but believe it is outweighed by the legitimate needs of the users we serve. Every tool can be misused, but that does not justify eliminating tools that serve important purposes.

Other critics point out that Driflly does not prevent screenshots or other forms of recording on the recipient's device. This is true and unavoidable. We cannot control what users do on their own devices. However, we make the ephemeral nature clear and provide visual indicators when messages are delivered and read.

Some question whether true ephemerality is possible given network logs, ISP records, and other external tracking. We acknowledge that Driflly cannot protect against surveillance at the network level. We can only control our own systems. We recommend that users combine Driflly with other privacy tools like VPNs for complete protection.

## Competitive Advantages

### Architectural Purity

Driflly was designed from the ground up for ephemerality. Every decision, from the database schema to the WebSocket manager, reinforces this principle. There are no legacy features to maintain, no backward compatibility with permanent storage to preserve. The entire system is optimized for conversations that vanish.

### Zero Data Collection

We collect nothing. No email addresses, no phone numbers, no names, no device identifiers, no usage analytics. There is no data to sell, no data to leak, no data to subpoena. This is not a marketing claim but a technical reality enforced by the architecture.

### Open Source Transparency

Every line of code is publicly available for inspection. Security researchers can audit the implementation. Users can verify for themselves that the system works as claimed. There are no secrets, no hidden features, no undisclosed data collection.

### Simplicity

Driflly does one thing and does it well. There are no distractions, no extra features to configure, no settings to manage. The interface is minimal and focused. Users can start communicating in seconds without reading documentation or watching tutorials.

## Conclusion

Driflly exists because we believe that privacy is not a feature but a right. In a world where every digital interaction is increasingly permanent, tracked, and monetized, we offer a space where conversations can simply happen and then disappear.

We do not claim that Driflly is for everyone or for every conversation. It is a tool for specific moments when privacy matters more than permanence, when the conversation itself is more important than the record of it. For journalists protecting sources, activists organizing for change, therapists building trust, or anyone who needs to speak freely without leaving a trace, Driflly provides a solution.

We are transparent about our current limitations while maintaining our commitment to our principles. The Day 4 features remain unfulfilled, but our core functionality works as intended. We continue to develop and improve within the constraints of our Termux environment, prioritizing stability and security over ambitious but unimplemented features.

Driflly is our contribution to a world where privacy is possible. We hope it serves you well.
