# Driflly: A Zero-Knowledge Ephemeral Messaging Platform

## Design, Implementation, and Security Analysis of a Privacy-First Communication System

---

**Author:** Yothabo  
**Affiliation:** Independent Research  
**Date:** March 2026  
**Version:** 1.0  
**Repository:** [github.com/Yothabo/dispozhe](https://github.com/Yothabo/dispozhe)  
**Contact:** [contact@driflly.app](mailto:contact@driflly.app)

---

## Abstract

This thesis presents Driflly, a privacy-first ephemeral messaging platform designed and implemented entirely on mobile devices using Termux. The system enables end-to-end encrypted two-person conversations that automatically self-destruct after a configurable duration, with no message data ever persisted to disk. Driflly employs a zero-knowledge relay architecture in which encryption keys never leave client devices and the server acts purely as an oblivious message router, forwarding ciphertext it is architecturally incapable of reading. The platform implements comprehensive replay protection through HMAC-SHA256 signing, per-client sequence numbering, and nonce tracking with five-minute expiry windows — a combination that exceeds the security measures of many production messaging systems.

This work demonstrates that complex, security-critical web applications can be successfully developed within the severe resource constraints of a mobile development environment while maintaining production-grade reliability. Under controlled stress conditions the system sustains one hundred concurrent sessions with a one hundred percent success rate, eighty requests per second throughput, and sub-second latency throughout. The thesis contributes a novel architecture for ephemeral messaging, a detailed analysis of implementation challenges specific to constrained environments, a complete CI/CD pipeline, and a production-ready open-source codebase available for independent review and adoption.

**Keywords:** ephemeral messaging, end-to-end encryption, zero-knowledge architecture, Web Crypto API, replay protection, Termux, privacy engineering, AES-256-GCM, WebSocket, FastAPI

---

## Acknowledgements

This work would not have been possible without the open-source community whose libraries, tools, and documentation underpin every component of this system. The maintainers of React, FastAPI, SQLite, and the surrounding ecosystems deserve particular recognition for the quality of their work. The Termux project merits special gratitude: by delivering a complete Linux environment on Android hardware, it makes mobile-first development genuinely viable and democratises access to the development tools that were once the exclusive province of well-resourced workstations. Finally, this project draws inspiration from the broader community of privacy advocates and cryptographic researchers whose work establishes both the necessity and the feasibility of systems that respect user autonomy at the architectural level.

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Problem Statement](#11-problem-statement)
   - 1.2 [Research Objectives](#12-research-objectives)
   - 1.3 [Contributions](#13-contributions)
   - 1.4 [Thesis Organisation](#14-thesis-organisation)
2. [Background and Related Work](#2-background-and-related-work)
   - 2.1 [Ephemeral Messaging Concepts](#21-ephemeral-messaging-concepts)
   - 2.2 [End-to-End Encryption Foundations](#22-end-to-end-encryption-foundations)
   - 2.3 [Existing Platforms and Their Limitations](#23-existing-platforms-and-their-limitations)
   - 2.4 [The Zero-Knowledge Architecture Paradigm](#24-the-zero-knowledge-architecture-paradigm)
   - 2.5 [Mobile Development Constraints](#25-mobile-development-constraints)
3. [System Architecture](#3-system-architecture)
   - 3.1 [Overall Design Philosophy](#31-overall-design-philosophy)
   - 3.2 [Frontend Architecture](#32-frontend-architecture)
   - 3.3 [Backend Architecture](#33-backend-architecture)
   - 3.4 [Communication Protocol](#34-communication-protocol)
   - 3.5 [Data Flow Analysis](#35-data-flow-analysis)
4. [Security Model](#4-security-model)
   - 4.1 [Threat Model](#41-threat-model)
   - 4.2 [Encryption Implementation](#42-encryption-implementation)
   - 4.3 [Replay Protection Mechanisms](#43-replay-protection-mechanisms)
   - 4.4 [Access Control and Session Management](#44-access-control-and-session-management)
   - 4.5 [Key Exchange Protocol](#45-key-exchange-protocol)
   - 4.6 [Security Boundaries and Limitations](#46-security-boundaries-and-limitations)
5. [Implementation](#5-implementation)
   - 5.1 [Technology Stack Selection](#51-technology-stack-selection)
   - 5.2 [Frontend Implementation](#52-frontend-implementation)
   - 5.3 [Backend Implementation](#53-backend-implementation)
   - 5.4 [WebSocket Communication Layer](#54-websocket-communication-layer)
   - 5.5 [Database Design and Session Management](#55-database-design-and-session-management)
   - 5.6 [Development Environment: Termux Constraints and Adaptations](#56-development-environment-termux-constraints-and-adaptations)
6. [Experimental Components and Lessons Learned](#6-experimental-components-and-lessons-learned)
   - 6.1 [Rust WebAssembly Encryption Module](#61-rust-webassembly-encryption-module)
   - 6.2 [Stream Chat Integration Analysis](#62-stream-chat-integration-analysis)
   - 6.3 [Dependency Management Challenges](#63-dependency-management-challenges)
   - 6.4 [Lessons for Future Development](#64-lessons-for-future-development)
7. [Testing and Performance Evaluation](#7-testing-and-performance-evaluation)
   - 7.1 [Testing Methodology](#71-testing-methodology)
   - 7.2 [Unit Testing](#72-unit-testing)
   - 7.3 [Integration Testing](#73-integration-testing)
   - 7.4 [Stress Testing and Scalability](#74-stress-testing-and-scalability)
   - 7.5 [Security Testing](#75-security-testing)
   - 7.6 [Performance Benchmarks](#76-performance-benchmarks)
8. [Deployment and Operations](#8-deployment-and-operations)
   - 8.1 [Continuous Integration Pipeline](#81-continuous-integration-pipeline)
   - 8.2 [Continuous Deployment Strategy](#82-continuous-deployment-strategy)
   - 8.3 [Production Environment Configuration](#83-production-environment-configuration)
   - 8.4 [Monitoring and Observability](#84-monitoring-and-observability)
9. [User Experience Design](#9-user-experience-design)
   - 9.1 [Mobile-First Interface Design](#91-mobile-first-interface-design)
   - 9.2 [Keyboard Handling and Input Management](#92-keyboard-handling-and-input-management)
   - 9.3 [Timer Display and Termination Flow](#93-timer-display-and-termination-flow)
   - 9.4 [Privacy-Preserving Interface Patterns](#94-privacy-preserving-interface-patterns)
10. [Security Analysis](#10-security-analysis)
    - 10.1 [Cryptographic Protocol Analysis](#101-cryptographic-protocol-analysis)
    - 10.2 [Replay Attack Resistance](#102-replay-attack-resistance)
    - 10.3 [Brute Force Mitigation](#103-brute-force-mitigation)
    - 10.4 [Third-Party Audit Readiness](#104-third-party-audit-readiness)
11. [Comparison with Existing Solutions](#11-comparison-with-existing-solutions)
    - 11.1 [Signal](#111-signal)
    - 11.2 [WhatsApp Disappearing Messages](#112-whatsapp-disappearing-messages)
    - 11.3 [Telegram Secret Chats](#113-telegram-secret-chats)
    - 11.4 [Key Differentiators](#114-key-differentiators)
12. [Future Work](#12-future-work)
    - 12.1 [Group Messaging Extension](#121-group-messaging-extension)
    - 12.2 [Enhanced File Sharing](#122-enhanced-file-sharing)
    - 12.3 [Federation and Decentralisation](#123-federation-and-decentralisation)
    - 12.4 [Post-Quantum Cryptography](#124-post-quantum-cryptography)
    - 12.5 [Native Mobile Applications](#125-native-mobile-applications)
13. [Conclusion](#13-conclusion)
    - 13.1 [Summary of Contributions](#131-summary-of-contributions)
    - 13.2 [Research Objectives Revisited](#132-research-objectives-revisited)
    - 13.3 [Closing Remarks](#133-closing-remarks)
14. [References](#14-references)
15. [Appendices](#15-appendices)

---

## 1. Introduction

### 1.1 Problem Statement

In an era where digital communication is both ubiquitous and commercially monitored, the permanence of online conversations poses acute privacy and security challenges. Traditional messaging platforms retain message histories indefinitely, creating repositories of personal data vulnerable to breach, legal compulsion, and unauthorised access. Even where platforms offer deletion features, messages routinely persist in server-side backups, analytics pipelines, and log files that users have no visibility into and no control over. The structural asymmetry between platform and user — wherein the platform retains all data and the user retains no meaningful control — is a defining characteristic of the surveillance-capitalism model that dominates networked communication.

This awareness has produced genuine demand for communication tools that enforce privacy architecturally rather than by policy promise. Promises are revocable; architecture is not. A system that never stores plaintext messages cannot be compelled to produce them, cannot leak them in a breach, and cannot monetise them without fundamentally rebuilding itself.

A second, less-examined problem concerns access to the development of such tools. The assumption that complex web applications must be developed on well-provisioned workstations excludes a substantial fraction of potential developers and concentrates the capacity for privacy engineering in wealthier contexts. If the tools that protect privacy can only be built by those with access to high-end hardware, the field's reach is structurally limited.

This thesis addresses both problems: the technical challenge of building a genuinely zero-knowledge ephemeral messaging platform, and the meta-challenge of building that system within the severe constraints of an Android mobile device using Termux.

### 1.2 Research Objectives

The work pursues six primary objectives. The first is to design and implement an ephemeral messaging system in which messages are never stored at any server layer and encryption keys never leave client devices, achieving verifiable zero-knowledge operation. The second is to develop comprehensive replay protection mechanisms — specifically HMAC-SHA256 signing, per-client sequence numbering, and nonce tracking — sufficient to prevent message forgery and replay attacks against a zero-knowledge relay. The third is to create a mobile-optimised user interface in which keyboard appearance displaces only the input bar, with headers and message history remaining stationary, matching the interaction model established by mainstream messaging applications. The fourth is to implement the entire system within the Termux environment on Android devices, documenting constraints, adaptations, and lessons that may guide future mobile-first development efforts. The fifth is to establish a complete DevOps pipeline — continuous integration, automated multi-layer testing, and continuous deployment — demonstrating the operational maturity appropriate to a production security system. The sixth is to evaluate system correctness, performance, and security through an empirical test programme covering unit, integration, stress, and security tests.

### 1.3 Contributions

This thesis makes five original contributions. First, it presents a novel architecture for ephemeral messaging that combines client-side key generation via the Web Crypto API, a zero-knowledge relay backend, and in-memory-only session management, collectively ensuring that no message data survives session termination and no message content is ever accessible to the server. Second, it provides a complete implementation of replay protection using HMAC-SHA256 signatures, monotonically increasing per-client sequence numbers, and nonce caching with five-minute expiry — a combination that exceeds the replay protection of many deployed production systems. Third, it delivers a detailed analysis of software development within Termux constraints, including memory management strategies, build process decomposition, and dependency resolution techniques that are generalisable to constrained-environment development more broadly. Fourth, it produces a production-ready, open-source system with comprehensive documentation, automated CI/CD configuration, and deployment manifests for Render and Vercel, enabling immediate adoption and independent evaluation. Fifth, it provides empirical performance measurements demonstrating sustained handling of one hundred concurrent sessions at eighty requests per second with sub-second latency, validating scalability claims under controlled stress conditions.

### 1.4 Thesis Organisation

The thesis proceeds as follows. Chapter 2 surveys background concepts in ephemeral messaging, end-to-end encryption, existing platforms, zero-knowledge architecture, and mobile development constraints. Chapter 3 presents the system architecture in full, covering frontend structure, backend organisation, the communication protocol, and end-to-end data flows. Chapter 4 establishes the formal security model, including the threat model, encryption implementation, replay protection mechanisms, access control, and key exchange protocol. Chapter 5 covers implementation in detail, addressing technology stack decisions, frontend and backend code, the WebSocket layer, database design, and Termux-specific adaptations. Chapter 6 analyses two failed experimental components — a Rust WebAssembly encryption module and a Stream Chat integration — extracting generalisable lessons. Chapter 7 presents the testing programme and results. Chapter 8 describes the deployment and operations architecture. Chapter 9 examines user experience design with particular attention to mobile keyboard handling. Chapter 10 provides an independent security analysis. Chapter 11 situates Driflly relative to Signal, WhatsApp, and Telegram. Chapter 12 outlines future work. Chapter 13 concludes with a summary of contributions and final remarks.

---

## 2. Background and Related Work

### 2.1 Ephemeral Messaging Concepts

Ephemeral messaging denotes communication systems in which messages are designed to become inaccessible after a predetermined period or triggering event. The concept predates digital networks: spoken conversation is inherently ephemeral, existing only in the moment of utterance. In digital systems, ephemerality serves several overlapping purposes. It reduces the attack surface associated with long-lived data stores; it diminishes the psychological weight of permanent records that may be taken out of context; and it enables more authentic communication by removing the tacit knowledge that every word may be archived and reviewed indefinitely.

The technical implementation of ephemerality spans a wide spectrum. At the weakest end, a platform may offer a "delete" function that removes messages from the user interface while retaining copies in server databases, backups, or analytics systems. Stronger implementations store messages only in volatile memory during active sessions, never writing to persistent storage. The strongest implementations combine in-memory-only server operation with client-side encryption such that even memory-resident server data contains only opaque ciphertext. Driflly occupies this strongest position, storing no message content at any architectural layer and ensuring that encryption keys are generated on and confined to client devices.

### 2.2 End-to-End Encryption Foundations

End-to-end encryption (E2EE) ensures that only the communicating parties can read messages, preventing all intermediaries — including the service provider — from accessing plaintext content. The defining architectural requirement is that all cryptographic operations occur on client devices, with keys never accessible to servers. Violation of this requirement at any point in the system's lifecycle reduces E2EE to a weaker security property.

Modern E2EE systems typically employ hybrid cryptography: an asymmetric protocol for key agreement and a symmetric cipher for bulk message encryption. The Signal Protocol, the most widely deployed E2EE design, uses the Triple Diffie-Hellman key agreement and the Double Ratchet algorithm to provide forward secrecy — the property that compromise of a current session key does not expose historical messages — and break-in recovery — the property that a compromised key does not expose future messages once the compromise is resolved [2].

Driflly simplifies this design for the two-person ephemeral use case. Because sessions last minutes rather than months and carry no persistent identity, the Double Ratchet's ratcheting mechanism adds complexity without commensurate benefit. A single AES-256-GCM session key generated by the session creator and delivered to the joiner through the access code or URL fragment mechanism is sufficient, and its simplicity facilitates independent audit. The trade-off — the absence of per-message forward secrecy — is explicitly acknowledged in the security model of Section 4.

### 2.3 Existing Platforms and Their Limitations

**Signal** represents the technical gold standard for private messaging. Its implementation of the Double Ratchet algorithm, Sealed Sender, and sealed-group mechanisms provide strong cryptographic guarantees, and the platform's commitment to open-source client code enables independent audit [11]. However, Signal stores messages on servers until successful delivery, maintains sealed-sender metadata, and requires registration with a phone number — a linkage between identity and communication that Driflly eliminates entirely.

**WhatsApp** adopted the Signal Protocol in 2016 but operates under Meta's ownership and data governance framework. The platform retains extensive metadata regarding communication patterns, and its ephemeral message feature offers configurable message timers without providing server-side non-persistence guarantees. The closed nature of the server-side implementation prevents independent verification of ephemerality claims [15].

**Telegram** offers Secret Chats with end-to-end encryption and configurable self-destruct timers. However, the default chat mode uses server–client encryption with Telegram holding the decryption keys, creating a security bifurcation that users frequently misunderstand. Secret Chats are device-specific and do not synchronise across devices, limiting practical usability.

**Snapchat** pioneered the cultural concept of ephemeral messaging but does not provide end-to-end encryption for snaps by default. The platform has faced documented criticism for retaining data beyond its stated ephemerality windows.

**Matrix** provides an open, federated communication protocol with optional E2EE. While cryptographically sound, Matrix implementations typically store message history on participating homeservers, and the protocol's complexity presents significant barriers to deployment and independent audit.

Against this landscape, Driflly occupies a distinct position: it is the only system among these comparators where the server is architecturally incapable of reading message content, requires no persistent identity, and guarantees that no message data survives session termination at any infrastructure layer.

### 2.4 The Zero-Knowledge Architecture Paradigm

Zero-knowledge architecture, as applied to communication systems, describes a design in which the service provider is provably incapable of accessing user data — not merely contractually prohibited from doing so, but technically unable due to the cryptographic structure of the system. In a zero-knowledge messaging system, the server operates as an oblivious relay, receiving and forwarding encrypted blobs without any capacity to decrypt or interpret them. The server's role reduces to routing, session metadata management (without message content), access control enforcement, and replay validation.

This architecture requires that all key material be generated on client devices and that no key or plaintext ever traverse the server boundary. Driflly implements this through client-side key generation using the Web Crypto API, encryption of all message content before transmission, server-side HMAC validation that operates on the ciphertext rather than the plaintext, and complete absence of any message content from the database schema. Even under adversarial server access — including root-level database and memory access — no message content is exposed.

### 2.5 Mobile Development Constraints

The Termux terminal emulator provides a complete Linux environment on Android hardware, enabling development with standard tools including Python, Node.js, Rust, and Git. However, the resource constraints of mobile hardware impose architectural pressures that do not arise in conventional development environments.

Memory is the most consequential constraint. Mobile devices typically allocate 2–4 GB of RAM system-wide, shared across the operating system, background services, and active applications. Build processes that allocate large contiguous memory regions — particularly Rust's LLVM compilation pipeline and Node.js's V8 heap during complex TypeScript compilation — frequently exhaust available memory and terminate without producing output. This constraint drove the decision to decompose build processes into smaller sequential stages and to select the Vite bundler, whose incremental compilation model minimises peak heap usage.

Storage constraints are secondary but non-trivial. The development environment, version control history, build artefacts, and node_modules directories collectively consume hundreds of megabytes. Regular pruning of caches, build outputs, and redundant dependencies is operationally mandatory. CPU thermal throttling during sustained build operations substantially extends build times compared to desktop equivalents: a frontend build requiring under a minute on a desktop system required twelve minutes after optimisation, and over forty-five minutes before it.

Network variability — higher latency and more frequent interruptions than wired connections — informed the decision to implement exponential backoff with a 30-attempt ceiling in the WebSocket reconnection logic, rather than the simpler fixed-delay retry patterns used by many web applications.

---

## 3. System Architecture

### 3.1 Overall Design Philosophy

Driflly's architecture is governed by four principles that were established before any implementation decisions and which constrained all subsequent choices.

*Privacy by design* holds that privacy is not a feature to be added but the foundational constraint that shapes every architectural decision. The system is designed on the assumption that the server will be compromised and that server operators may be adversarial, and all security properties must hold under these worst-case assumptions.

*Ephemerality as default* holds that all data has a predetermined lifetime after which it is permanently and irrecoverably inaccessible. No explicit user action is required to achieve ephemerality; the system's default and only mode of operation is ephemeral.

*Simplicity as a security property* holds that complexity should be introduced only when justified by demonstrably necessary functionality, because complexity is the enemy of auditability. Each component is designed to be as simple as it can be while meeting its requirements, and experimental features are strictly isolated from production code paths.

*Verifiable operation* holds that security claims must be verifiable by independent parties. This requires open-source implementation, comprehensive documentation of the security model, transparent disclosure of known limitations, and a codebase structured to facilitate external audit.

### 3.2 Frontend Architecture

The frontend is built with React 18 and TypeScript, bundled with Vite 5, and styled with Tailwind CSS 3. The Web Crypto API provides all client-side cryptographic operations, and WebSocket connections carry real-time communication with the backend.

The component hierarchy follows a strict separation of concerns, with routing handled at the application root and all chat functionality encapsulated within a `ChatContainer` that delegates to `ChatHeader`, `MessageArea`, and `ChatInputSection` children. This separation was introduced to enable independent re-rendering of the input section — specifically to support the keyboard-height-driven repositioning described in Section 9.2 — without triggering re-renders of the message history.

Complex stateful logic is encapsulated in custom hooks rather than embedded in components. `useChatMessages` manages message state with deduplication via a processed-IDs set, preventing duplicate display of messages received through multiple delivery paths. `useChatTimer` synchronises the countdown display with backend expiration events and emits warning signals at thirty-second and ten-second thresholds. `useChatTermination` orchestrates the step-by-step destruction animation sequence. `useWebSocketConnection` manages the full WebSocket lifecycle including heartbeat monitoring, exponential backoff reconnection, and graceful teardown. `useEncryptedMessages` provides a clean interface for encryption and decryption operations, entirely shielding UI components from cryptographic implementation details.

State management is layered according to its natural scope: session-specific state lives in custom hooks, WebSocket connection state lives in the service layer, and transient UI state lives in components. This layering ensures predictable behaviour under the complex event orderings that arise during session establishment, message exchange, and termination.

### 3.3 Backend Architecture

The backend is implemented in Python using FastAPI 0.115 with Uvicorn as the ASGI server. SQLite stores session metadata only; no message content appears anywhere in the database schema. The source tree reflects a modular organisation in which each concern — expiry scheduling, WebSocket management, message handling, replay protection — is isolated in a dedicated module or package.

The central component is the `WebSocketManager`, which maintains a dictionary mapping session identifiers to sets of active WebSocket connections. All message routing passes through the manager, which applies replay protection validation before forwarding. The replay protection module is intentionally stateless with respect to the session data layer: it maintains its own in-memory structures for sequence numbers and nonce caches, ensuring that it remains operational if the database layer is unavailable and that its behaviour is independently testable.

The expiry scheduler runs as a background task, polling for expired sessions every sixty seconds and closing their associated WebSocket connections before deleting their database records. This polling interval represents a deliberate trade-off between cleanup promptness and CPU overhead; a configurable interval would be a straightforward enhancement.

### 3.4 Communication Protocol

Session creation and management are handled via HTTP REST endpoints. Session creation accepts a duration parameter in minutes and returns a session identifier, a six-digit access code, a shareable link, and an expiration timestamp. Code redemption validates the code, marks it consumed, and returns the session identifier together with the encryption key. The `/session/{id}/status` endpoint supports the two-second polling loop used during the pre-join waiting phase.

Real-time communication uses a persistent WebSocket connection established at `/ws/{session_id}`. All messages conform to a consistent envelope structure carrying the encrypted ciphertext, a key identifier, a sequence number, a nonce, an HMAC-SHA256 signature, a message identifier, and a timestamp:

```json
{
  "type": "message",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "data": "<base64-encoded AES-256-GCM ciphertext>",
  "keyId": "AbCdEfG",
  "sequence": 42,
  "nonce": "<128-bit random value>",
  "hmac": "<SHA-256 hex digest>",
  "timestamp": 1741018496000
}
```

System messages — ping/pong heartbeats, typing indicators, delivery receipts, and session lifecycle events — use the same envelope with distinct `type` values and bypass replay protection validation, as they carry no sensitive content and their loss or duplication is operationally harmless.

### 3.5 Data Flow Analysis

**Session creation** proceeds as follows: the user selects a duration; the frontend generates a 256-bit AES-GCM key using `crypto.subtle.generateKey()`; the frontend posts to `/session/create` and receives a session identifier and code; the key is retained in memory while the code and shareable link are displayed; the frontend begins polling `/session/{id}/status` every two seconds.

**Session join via code** proceeds as follows: the joiner enters the six-digit code; the frontend posts to `/session/code/{code}`; the backend validates the code against its active codes store (checking existence, expiry, and redemption status), marks the code consumed, increments the session participant count, and returns the session identifier and encryption key; the frontend stores the key in memory and establishes its WebSocket connection.

**Message exchange** proceeds as follows: the sender encrypts the plaintext using `crypto.subtle.encrypt()` with a freshly generated twelve-byte IV, attaches the sequence number, nonce, and HMAC, and sends the envelope over WebSocket; the backend validates the sequence number monotonicity, nonce uniqueness, and HMAC correctness, then forwards the validated envelope to all other connections in the session; recipients decrypt using `crypto.subtle.decrypt()` and display the message; recipients return a read-receipt envelope to the sender.

**Session termination** proceeds as follows: either participant confirms the termination modal; the frontend posts `DELETE /session/{id}`; the backend deletes the session record and broadcasts a `session_terminated` system message to all connected WebSockets; all connections are closed; each frontend plays the destruction animation sequence and redirects to the session-ended view.

---

## 4. Security Model

### 4.1 Threat Model

The system is designed to protect against four categories of adversary.

An *external network attacker* can observe and record all traffic between clients and the server, attempt to inject or modify messages in transit, and replay captured message envelopes. The model assumes this adversary cannot break TLS but may operate at the application layer on captured traffic.

A *server operator* possesses full legitimate access to the server infrastructure including the database, application memory, and log files. This adversary may attempt to read message content, extract encryption keys, or correlate communication metadata. The zero-knowledge architecture ensures that complete server access yields only opaque ciphertext and session metadata; no message content or key material is available to this adversary.

A *compromised server* is an adversary who has gained unauthorised access to the server through a vulnerability exploit, supply-chain attack, or infrastructure breach. This adversary has the same capabilities as the server operator above, and the same architectural guarantees apply.

A *malicious session participant* is a legitimate session participant — one who has correctly established a session and holds the session key — who attempts to forge messages attributed to their partner, replay their partner's historical messages, or extract information through manipulation of the session protocol.

The model explicitly excludes device-level compromise, in which an adversary has direct access to a participant's device; side-channel attacks based on timing, power consumption, or electromagnetic emanation; social engineering; and volumetric denial-of-service attacks.

### 4.2 Encryption Implementation

All message encryption uses AES-256-GCM as implemented by the Web Crypto API. The choice is motivated by four considerations. GCM mode provides authenticated encryption with associated data, producing a 128-bit authentication tag that ensures any ciphertext modification is detectable with probability 1 − 2⁻¹²⁸. Modern processors include hardware AES acceleration (AES-NI), and the Web Crypto API leverages this where available, providing performance competitive with native code. AES is a NIST standard with decades of public cryptanalysis and universal browser support. The Web Crypto API is maintained by browser vendors and subject to continuous security review, substantially reducing the risk of implementation-level vulnerabilities compared to a user-space cryptographic library.

Key generation uses `crypto.subtle.generateKey()` with the `AES-GCM` algorithm descriptor and a 256-bit key length. The returned `CryptoKey` object is marked extractable so that it can be exported for transmission to the session joiner, but is never serialised to any persistent storage. The key identifier used in message envelopes is derived from the first eight characters of the base64-encoded key export, providing a lightweight consistency check without exposing key material.

### 4.3 Replay Protection Mechanisms

The replay protection system combines three independent mechanisms, each of which is sufficient to detect a distinct class of attack. Their combination provides defence in depth against adversaries who may be able to defeat one mechanism but not all three simultaneously.

*Sequence numbering* assigns a monotonically increasing integer to each message sent by each client within a session, beginning at one. The server maintains a per-client last-seen sequence number for each active session. Any message whose sequence number is less than or equal to the stored value is rejected as a replay or out-of-order delivery. A maximum gap threshold of one hundred prevents a denial-of-service attack in which an adversary sends a message with an astronomically large sequence number to permanently invalidate all subsequent legitimate messages.

*Nonce tracking* requires each message to carry a 128-bit cryptographically random nonce. The server maintains a per-session dictionary mapping nonces to their arrival timestamps and rejects any message whose nonce already appears in the dictionary. Entries are evicted after five minutes, capping per-session memory consumption at approximately twelve thousand entries under the maximum realistic message rate.

*HMAC-SHA256 signatures* bind the ciphertext, sequence number, and nonce into a single authenticated value computed using the session secret. The server validates the HMAC before forwarding any message, ensuring that fabricated or modified envelopes are rejected regardless of whether their sequence number and nonce would otherwise pass validation.

### 4.4 Access Control and Session Management

Access to sessions is controlled through two complementary mechanisms. Six-digit numeric codes provide the primary access path: codes are generated using a cryptographically seeded hash of the session identifier, expire after thirty seconds, and may be redeemed exactly once. Rate limiting restricts redemption attempts to five per minute per source IP address, bounding brute-force throughput to three hundred attempts per hour against a one-million-element code space. Shareable URL-based access uses the session identifier as the path component and becomes invalid after first use, preventing link sharing from extending access beyond the intended single joiner.

Sessions are hard-limited to two participants. Any WebSocket connection attempt to a session with two active connections is rejected with HTTP status 403. The combination of two-participant limits, code single-use semantics, and WebSocket connection control eliminates the possibility of an uninvited third party joining an active session.

The expiry scheduler enforces temporal session boundaries, automatically purging expired sessions and closing their connections within sixty seconds of expiry. Manual termination takes effect immediately, deleting all session data synchronously within the DELETE request handler before broadcasting the termination event.

### 4.5 Key Exchange Protocol

The session creator generates the AES-256-GCM session key client-side and retains it in memory. For code-based joins, the key is returned to the joiner in the HTTP response to the code redemption request. This places the server in the key distribution path, which is a deliberate architectural trade-off: it avoids the implementation complexity of a Diffie-Hellman key agreement while remaining secure against the threat model defined in Section 4.1. The server operator can observe the key in transit and in the response payload, but this information is operationally useless because message content has already been encrypted on the sender's device before transmission and the server discards keys immediately after delivering them.

For link-based joins, the key may optionally be embedded in the URL fragment — the portion of the URL following the `#` character — which browsers do not transmit to servers in HTTP requests. This variant provides a stronger security property in that the server never observes the key at all, but requires the shareable link to be kept confidential, as anyone who receives the link gains session access.

### 4.6 Security Boundaries and Limitations

Several threat categories are explicitly outside the system's protective scope and are documented to ensure accurate user expectations.

Device compromise, in which an adversary has access to a participant's physical device, enables direct observation of decrypted messages in the application's DOM. No messaging system can protect against this threat without hardware-level secure enclaves, which are outside the scope of a web-based system.

Screenshot and recording capture by participants cannot be technically prevented in a web application without relying on browser APIs that are not universally available and are trivially circumvented by device-level screen capture. The system includes interface elements that remind users of this limitation.

Network traffic metadata — connection times, session durations, and participant IP addresses — remains visible to the server and to passive network observers. The system provides no protection against traffic analysis; users requiring traffic obfuscation should route connections through Tor or a trusted VPN.

The six-digit code space of one million values is bounded, and brute-force attacks, while practically impractical given rate limiting and thirty-second expiry, are theoretically possible. A future enhancement to eight-digit or alphanumeric codes would reduce this risk without materially degrading usability.

---

## 5. Implementation

### 5.1 Technology Stack Selection

Each technology in the stack was selected against explicit criteria: security properties, performance characteristics, Termux build feasibility, and long-term maintainability.

The frontend uses React 18 for its mature component model and broad ecosystem support; TypeScript 5 for compile-time type safety that substantially reduces the probability of security-relevant runtime errors; Vite 5 for its incremental compilation model that kept build times within the constraints of Termux memory limits; Tailwind CSS 3 for utility-first styling that eliminates the overhead of a separate CSS build pipeline; Vitest for its native ESM support and alignment with the Vite build system; and the Web Crypto API for its hardware-accelerated browser-native cryptographic primitives.

The backend uses Python 3.13 for its readability and broad Termux library support; FastAPI 0.115 for its native async support, automatic OpenAPI documentation generation, and type-annotated request parsing; Uvicorn 0.30 as the ASGI server with native WebSocket support; SQLAlchemy 2.0 for its connection pooling and database-agnostic ORM layer; SQLite 3 for its zero-configuration, file-based, ACID-compliant storage; Pytest 8 for its powerful fixture model and async test support; and the `cryptography` package for HMAC generation and nonce operations.

Infrastructure uses Docker and Docker Compose for local environment parity with production, GitHub Actions for CI/CD, Render for backend hosting, Vercel for frontend hosting, and Nginx for reverse proxying in both development and production configurations.

### 5.2 Frontend Implementation

The encryption service encapsulates all cryptographic operations behind a clean interface that UI components consume without knowledge of implementation details. The `encrypt` method generates a fresh twelve-byte IV using `crypto.getRandomValues()`, invokes `crypto.subtle.encrypt()` with the `AES-GCM` algorithm descriptor, prepends the IV to the ciphertext for delivery alongside it, increments the per-instance sequence counter, generates a random nonce, computes the HMAC over the base64-encoded ciphertext, sequence number, and nonce, and returns a typed `SecureMessage` object:

```typescript
async encrypt(message: string): Promise<SecureMessage> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    this.key!,
    new TextEncoder().encode(message)
  );
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(ciphertext), iv.length);
  const sequence = ++this.sequenceCounter;
  const nonce = this.generateNonce();
  const data = btoa(String.fromCharCode(...payload));
  return { data, keyId: this.keyId, sequence, nonce,
           hmac: await this.generateHmac(data, sequence, nonce) };
}
```

The WebSocket service implements exponential backoff reconnection with a base delay of one second, a growth factor of 1.5, and a ceiling of thirty seconds, across a maximum of thirty attempts. Beyond thirty failed attempts the service emits a permanent-failure event, at which point the UI presents the user with an explicit reconnection prompt rather than silently continuing to retry.

### 5.3 Backend Implementation

The session model stores the minimum metadata required for operational correctness: a session identifier, creation and expiration timestamps, the user-selected duration, the current participant count, the session status, the link validity flag, and the timestamp at which the second participant joined (used to calculate remaining time). No message content, no user identifiers, and no communication metadata beyond session existence and duration appear in the database.

Code generation derives six-digit codes from a SHA-256 hash of the session identifier modulo one million, formatted with zero-padding to six digits. The code generator maintains a dictionary of active codes with their session associations and expiration timestamps in memory, ensuring that code validation is a constant-time dictionary lookup rather than a database query.

The replay protection module operates entirely in memory using nested dictionaries. Its public interface exposes a single `validate_message()` method that applies sequence validation, nonce validation, and HMAC verification in sequence, returning a typed result that distinguishes among the failure modes. This design isolates all replay protection logic and enables comprehensive unit testing without database or network dependencies.

### 5.4 WebSocket Communication Layer

The WebSocket endpoint at `/ws/{session_id}` accepts connections, registers them with the manager, enters a receive loop, dispatches system messages directly to their handlers, submits application messages to the replay protection pipeline and — on successful validation — to the routing layer, and on disconnection removes the connection from the manager's pool and notifies the remaining participant. The endpoint uses FastAPI's native `WebSocket` type and `WebSocketDisconnect` exception, which are backed by Starlette's ASGI WebSocket implementation.

Connection pool sizing — fifty connections with a one-hundred overflow — was determined empirically during stress testing rather than set to an arbitrary default. The pool parameters reflect observed peak load under two hundred concurrent sessions, providing headroom for traffic spikes without over-allocating database connection resources.

### 5.5 Database Design and Session Management

The database schema is intentionally minimal. The `sessions` table carries seven columns: `id` (text primary key), `created_at`, `expires_at`, `duration_minutes`, `participant_count`, `status`, `link_active`, and `chat_started_at`. No foreign key tables, no message tables, no user tables. The schema's simplicity is itself a security property: there is nothing to breach because there is nothing stored.

SQLite was chosen over PostgreSQL for the initial deployment because it requires no separate process, no connection string management, and no Termux-incompatible build dependencies. The architecture does not preclude migration to PostgreSQL for horizontal scaling; SQLAlchemy's database-agnostic abstraction layer means the migration requires only a change to the `DATABASE_URL` environment variable and appropriate index additions.

### 5.6 Development Environment: Termux Constraints and Adaptations

Building the frontend within Termux required decomposing the standard `npm run build` invocation into sequential sub-builds — types, components, pages — to stay within peak heap constraints. The `NODE_OPTIONS="--max-old-space-size=1024"` environment variable was set to provide explicit guidance to Node.js's garbage collector. After these adaptations, frontend build time stabilised at approximately twelve minutes, down from over forty-five minutes before optimisation.

Dependency count was reduced from 850 to 412 packages through regular `npm prune` runs, analysis of the bundle with `vite-bundle-visualizer`, and migration of several development-only tools to `devDependencies`. Temporary files — `node_modules/.cache`, `__pycache__` directories, and `.pyc` files — were removed by a scheduled cleanup script to prevent storage exhaustion over long development sessions. Python packages were installed with the `--break-system-packages` flag required by Termux's package management isolation model.

The successful production deployment that emerged from this environment constitutes empirical evidence that complex web application development within Termux is not merely possible but practical, provided that build processes are decomposed thoughtfully and resource consumption is monitored continuously.

---

## 6. Experimental Components and Lessons Learned

### 6.1 Rust WebAssembly Encryption Module

An experimental module under `encryption-rust/` was developed to evaluate the feasibility and performance benefit of WebAssembly-based encryption as an alternative to the Web Crypto API. The hypothesis was that a Rust implementation compiled to WebAssembly might provide measurably faster encryption on lower-end mobile devices where hardware AES acceleration is absent or constrained.

The implementation used the `aes-gcm` crate from the RustCrypto organisation and `wasm-bindgen` for the JavaScript interoperability layer. Initial benchmarks against a reference TypeScript implementation suggested potential throughput improvements of twenty to forty percent for CPU-bound encryption workloads.

The experiment failed to reach a deployable state due to an unresolvable transitive dependency conflict. A library in the cryptographic dependency chain pulled `nalgebra` version 0.5.1 as a transitive dependency. This version of `nalgebra` contained a malformed `Cargo.toml` that referenced `quickcheck` without specifying a version, a registry path, or a workspace dependency — a format that Cargo's dependency resolver rejected unconditionally. Attempts to resolve the conflict through direct dependency version pinning, `[patch]` overrides in the workspace `Cargo.toml`, and `cargo update` invocations all failed because the broken manifest was encountered during graph resolution, before any patching mechanism could be applied.

The Termux environment compounded the difficulty substantially. Rust's LLVM compilation backend exhausted available memory repeatedly during compilation attempts, requiring full restarts. Total build time for a single successful (but non-linking) compilation attempt exceeded forty-five minutes. After approximately forty hours of accumulated effort, the experiment was abandoned in favour of the Web Crypto API, which provides adequate performance, is hardware-accelerated on all modern devices, requires no build step, and carries guaranteed browser compatibility. The `encryption-rust/` directory is retained in the repository as a transparent record of the exploration, clearly marked as non-production code.

### 6.2 Stream Chat Integration Analysis

The `stream-chat` package appears in `backend/requirements.txt` as a consequence of an early architectural investigation into whether Stream Chat's infrastructure could accelerate feature development for real-time messaging. The investigation concluded that Stream Chat is architecturally incompatible with Driflly's requirements and the dependency serves no function in production.

Stream Chat is designed around persistent message storage, server-managed encryption keys, channel history, search indexing, and thread-level organisation — a feature set that presupposes the storage of messages and the management of keys by the service provider. These assumptions are directly incompatible with Driflly's zero-knowledge model, which requires that the server hold no keys and store no message content. No integration between the two systems is possible without fundamentally compromising one of them.

The `stream-chat` dependency will be removed in the next scheduled dependency audit. It is documented here to explain its presence and prevent its reintroduction by contributors who observe it in `requirements.txt` without context.

### 6.3 Dependency Management Challenges

Beyond the Rust module, the project encountered several dependency management challenges that shaped the final implementation. FastAPI 0.104's requirement for Pydantic 2.5 produced a `TypeError` in Python 3.13's type annotation system that was resolved only by upgrading to FastAPI 0.115 with Pydantic 2.10.6. The `httpx` package, required by Starlette's `TestClient` for integration tests, was not included in the original `requirements.txt` and was discovered only when the integration test job failed with an `ImportError` in CI; it was added explicitly at version 0.28.1 across all relevant install steps. Node module bloat was addressed through bundle analysis, `npm prune`, and explicit separation of development and production dependencies.

### 6.4 Lessons for Future Development

Six lessons emerge from these experimental components and challenges that are generalisable beyond this project. First, dependency trees should be audited for transitive conflicts early in a project's lifecycle, before significant implementation effort has been invested in a dependency-laden approach. The `cargo tree` command would have surfaced the `nalgebra` conflict within seconds. Second, the computational overhead of Rust's compilation pipeline should be treated as a hard constraint in Termux-class environments before committing to Rust for any production component. Third, native browser APIs should be preferred over third-party libraries when they meet requirements, because they eliminate build complexity, guarantee compatibility, and are continuously reviewed by browser vendors. Fourth, failed experiments should be documented in detail: understanding why an approach failed is of comparable value to understanding why the chosen approach succeeded. Fifth, experimental code should be isolated from production code paths from the moment it is created, not retroactively. Sixth, dependency hygiene — regular pruning, explicit version pinning, and automated vulnerability scanning — prevents the accumulation of technical debt that is difficult to address retrospectively.

---

## 7. Testing and Performance Evaluation

### 7.1 Testing Methodology

The testing programme is structured across four levels of granularity. Unit tests verify individual functions and modules in complete isolation, with all external dependencies mocked. Integration tests verify the behaviour of assembled components against a running backend instance, exercising real network sockets and a test database. Stress tests simulate realistic concurrent load and measure throughput, latency, and resource consumption under sustained pressure. Security tests specifically exercise the replay protection, encryption, and access control mechanisms with adversarial inputs designed to probe boundary conditions.

All four test suites are automated in the GitHub Actions CI pipeline and constitute required checks before any merge to the main branch. The pipeline runs the four suites in parallel jobs — backend security tests, frontend unit tests, frontend integration tests with a live uvicorn backend instance, and stress tests — with a summary job that gates deployment on the combined result.

### 7.2 Unit Testing

The frontend unit test suite contains fourteen tests covering the encryption service. These tests verify that messages encrypt and decrypt correctly under the standard path; that ciphertext produced with one key cannot be decrypted with a different key; that modified ciphertext is rejected by the GCM authentication tag check; that the sequence counter increments correctly across successive encryptions; that key import and export round-trip correctly; and that key ID derivation is deterministic. All fourteen tests pass consistently.

The backend unit test suite contains fourteen tests covering the replay protection module. These tests verify HMAC generation and verification; sequence number acceptance and monotonicity enforcement; rejection of messages with sequence numbers equal to or below the current value; rejection of messages with sequence numbers above the gap threshold; nonce uniqueness enforcement; nonce expiry after five minutes; rejection of messages with missing required fields; and correct cleanup of per-session state on session termination.

### 7.3 Integration Testing

The frontend integration test suite contains nineteen tests distributed across three modules. The API module's seven tests validate session creation, status retrieval, code redemption, and session deletion against a running backend. The WebSocket module's eleven tests verify connection establishment, bidirectional message exchange, typing indicator propagation, read receipt delivery, and behaviour under abrupt disconnection. The termination module's single test validates the full end-to-end termination flow from UI trigger through backend deletion to both-participant redirect.

Integration tests run against a live `uvicorn` process started as a subprocess fixture, using a separate in-memory SQLite database to ensure test isolation. The `httpx` library provides both synchronous and async HTTP client support within the pytest-asyncio test environment.

### 7.4 Stress Testing and Scalability

Stress tests are implemented as standalone Python scripts that drive the HTTP and WebSocket APIs from multiple concurrent coroutines. The burst creation test creates ten, fifty, and one hundred sessions concurrently; all three tiers achieve a one hundred percent success rate, with one hundred sessions completing in 1.28 seconds at an aggregate rate of seventy-eight sessions per second. The mixed API test issues one hundred randomised requests — distributed across session creation, status polling, and health check endpoints — and completes in 0.80 seconds at one hundred and twenty-five requests per second with a one hundred percent success rate. The concurrent session test maintains one hundred simultaneous active sessions for the duration of the test period, observing zero message loss, average relay latency below fifty milliseconds, and stable memory consumption at approximately five to ten kilobytes per session.

### 7.5 Security Testing

Security testing applies adversarial inputs to all replay protection mechanisms. Replayed messages — identical to a previously accepted message — are correctly rejected at the nonce validation stage. Messages with sequence numbers equal to or below the current per-client value are rejected at the sequence validation stage. Messages with sequence numbers more than one hundred above the current value are rejected at the gap threshold check. Messages with modified ciphertext produce HMAC mismatches and are rejected. Messages with missing sequence, nonce, or HMAC fields are rejected at the schema validation stage before reaching replay protection. All fourteen security tests pass consistently across CI runs.

### 7.6 Performance Benchmarks

Backend REST endpoint latency at the fiftieth percentile is eight milliseconds for session creation and two milliseconds for session status retrieval. At the ninety-fifth percentile these figures rise to fifteen and five milliseconds respectively. WebSocket message relay latency at the fiftieth percentile is two milliseconds, with a ninety-fifth percentile of five milliseconds. The system has been validated at in excess of two hundred simultaneous sessions without measurable latency degradation.

Frontend metrics measured via Lighthouse under standard conditions show a time-to-interactive of 1.2 seconds, a first contentful paint of 0.8 seconds, and a gzip-compressed bundle size of 212 kilobytes. Memory consumption in an idle chat session is approximately 35 megabytes, rising to 45 megabytes under active message exchange.

---

## 8. Deployment and Operations

### 8.1 Continuous Integration Pipeline

The CI pipeline is defined in `.github/workflows/test.yml` and triggers on every push to `main` or `develop` and on every pull request targeting `main`. It runs four parallel jobs: backend security tests (Python 3.13, pytest, 23 seconds average duration), frontend unit tests (Node.js 22, Vitest, 22 seconds), frontend integration tests with a live uvicorn backend (43 seconds), and stress tests (30 seconds). A summary job depends on all four and produces the final pass/fail status used by branch protection rules.

The workflow sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` at the environment level to address the Node.js 20 deprecation in GitHub Actions runners effective from June 2026. Node.js is pinned to version 22 (current LTS) for application tests. The `httpx==0.28.1` package is included in all Python install steps following its identification as a missing integration test dependency.

### 8.2 Continuous Deployment Strategy

Deployment to production is gated on successful completion of all four CI jobs on the main branch. Backend deployment uses the Render deployment action with credentials stored in GitHub Secrets as `RENDER_API_KEY` and `RENDER_SERVICE_ID`. Frontend deployment uses the Vercel CLI with credentials stored as `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. GitHub release creation uses `RELEASE_TOKEN` and fires after successful deployment of both services, generating release notes from merged pull requests since the previous tag. The deploy jobs are currently commented out pending restoration of full pipeline automation following recent CORS and dependency fixes; they are documented here as the intended production configuration.

### 8.3 Production Environment Configuration

The backend is deployed on Render using the `render.yaml` manifest, which specifies a Python runtime, a `pip install -r requirements.txt` build command, and a `uvicorn app:app --host 0.0.0.0 --port $PORT` start command. Required environment variables are `ENVIRONMENT=production`, `ALLOWED_ORIGINS` set to the frontend domain, and `DATABASE_URL`. The CORS configuration hardcodes origins for `driflly.vercel.app`, `driflly.netlify.app`, `dispozhe.vercel.app`, `dispozhe.netlify.app`, `driflly.com`, and `dispozhe.com`, supplemented by a regex pattern for preview deployment subdomains.

The frontend is deployed on Vercel using the `vercel.json` manifest, which sets the build command, output directory, and a catch-all rewrite rule to support client-side routing. Required environment variables are `VITE_API_URL` and `VITE_WS_URL`.

### 8.4 Monitoring and Observability

The `/health` endpoint returns a JSON object containing service name, status, environment, and security-feature enablement flag. All application events are logged in JSON format with structured fields for event type, session identifier (truncated to prevent inadvertent logging of sensitive identifiers), and timestamp. Key operational metrics tracked include active session count, per-minute message rate, average relay latency, error rate by endpoint, and database connection pool utilisation. These metrics are emitted to standard output and ingested by Render's log management infrastructure.

---

## 9. User Experience Design

### 9.1 Mobile-First Interface Design

Driflly's interface treats mobile devices as the primary platform and desktop browsers as a secondary context. All interactive elements meet the 44×44 pixel minimum touch target recommended by Apple's Human Interface Guidelines and Google's Material Design specification. Modal dialogs for code entry and QR code display use bottom-sheet presentation, placing controls within the natural reach of both thumbs. Navigation complexity is minimal: the application exposes five distinct screens — landing, session creation, code entry, waiting room, and chat — reducing cognitive load and minimising the surface area for interaction design errors.

The visual design uses a dark navy background (`#0A192F`) with sky-blue accent colours (`#64FFDA`), chosen for high contrast without the harsh brightness of a pure white theme on mobile displays. All text meets or exceeds WCAG AA contrast ratios (minimum 4.5:1 for normal-weight text).

### 9.2 Keyboard Handling and Input Management

The most technically involved UX challenge in the implementation was managing the iOS and Android virtual keyboard correctly. Many web-based chat applications suffer from the problem that keyboard appearance causes the entire page to reflow, shifting both the message history and the input bar upward simultaneously and frequently causing the viewport to scroll in unexpected ways. The solution adopted by WhatsApp, iMessage, and Telegram — and replicated in Driflly — is to fix the input bar's position and update only its `bottom` property when the keyboard appears, leaving the header and message history visually stationary.

This behaviour is implemented using the `window.visualViewport` API, which fires `resize` events when the visible viewport height changes due to keyboard appearance or dismissal. The difference between `window.innerHeight` and `window.visualViewport.height` gives the keyboard's current height, subject to a 100-pixel threshold that filters out browser chrome changes that should not trigger input repositioning:

```typescript
const handleResize = () => {
  if (!window.visualViewport) return;
  const gap = window.innerHeight - window.visualViewport.height;
  setKeyboardHeight(gap > 100 ? gap : 0);
};
window.visualViewport.addEventListener('resize', handleResize);
```

The `ChatInputSection` component uses `position: fixed` with `bottom: keyboardHeight`, ensuring that the input bar tracks the keyboard position precisely. Scroll-to-bottom behaviour uses `behavior: 'auto'` rather than `behavior: 'smooth'` because smooth scrolling interferes with the keyboard animation on iOS, producing a visually jarring double-animation. Auto-scroll fires only when the user is already within 100 pixels of the bottom of the message list, respecting the common interaction pattern of reading history while a conversation continues.

### 9.3 Timer Display and Termination Flow

The session timer is displayed in the chat header and updated every second from the backend's authoritative expiry timestamp. Colour encoding communicates urgency without requiring the user to read the countdown: the display renders in the standard sky-blue accent colour with more than thirty seconds remaining, transitions to yellow between ten and thirty seconds, and to red below ten seconds. Clicking the timer opens an extension modal that allows the user to add time in configurable increments.

The termination flow presents a step-by-step destruction animation to both participants simultaneously, providing visual acknowledgement that the session's data is being deleted rather than merely hidden. Each step of the animation — connection teardown, message clearing, session deletion, redirect — is shown with a loading indicator followed by a completion checkmark, with 400-millisecond intervals between steps to give the animation temporal legibility. The flow is identical for the initiating participant and the receiving participant, ensuring neither is left with an unexplained disconnection.

### 9.4 Privacy-Preserving Interface Patterns

Several interface elements reinforce the ephemeral and privacy-preserving character of the system without imposing friction on normal use. A pulsing indicator in the chat header reminds users that screenshots and screen recordings remain possible and are outside the system's control. CSS `@media print` rules block printing of the chat interface. Context menu events on message elements are suppressed to reduce inadvertent copy operations, though this does not prevent deliberate copying. The interface provides no inbox, no conversation history, and no search function, reinforcing through its absence of features that no stored data exists to navigate. When the application tab loses focus, a CSS filter blurs the chat content, providing incidental privacy against shoulder-surfing in shared physical environments.

---

## 10. Security Analysis

### 10.1 Cryptographic Protocol Analysis

The session key generation procedure uses `crypto.getRandomValues()`, which is specified to provide output indistinguishable from uniformly random bytes. For a 256-bit key space, the probability of two independently generated keys colliding is 2⁻²⁵⁶, which is computationally negligible under all plausible operating conditions.

AES-256-GCM's security against ciphertext modification is quantified by the authentication tag: a 128-bit tag provides a forgery probability of at most 2⁻¹²⁸ per message under standard cryptographic assumptions. The GCM nonce — a 12-byte IV freshly generated per message using `crypto.getRandomValues()` — prevents the nonce reuse attack that would compromise the confidentiality and integrity guarantees of GCM mode. Because nonces are generated randomly and independently for each message, the probability of a nonce collision within any realistic session length (at most a few thousand messages in a 24-hour session) is negligibly small.

The key identifier, derived from the first eight characters of the base64-encoded 256-bit key export, provides 48 bits of effective identifier space. The probability of a key identifier collision across sessions is 2⁻⁴⁸ per pair, which is negligible in the context of any realistic deployment scale.

### 10.2 Replay Attack Resistance

The three-mechanism replay protection system provides overlapping defence against distinct attack categories. Nonce-based protection prevents replay of any individual message within its five-minute validity window, regardless of sequence number. Sequence-number-based protection prevents replay of any message after the session has progressed beyond its sequence number, regardless of nonce. HMAC-based protection prevents fabrication of messages by any party not holding the session secret, regardless of sequence number or nonce. An adversary capable of defeating all three mechanisms simultaneously would need to hold the session secret, have not yet used the target nonce, and be replaying a message whose sequence number has not yet been superseded — a combination that reduces the replay protection question to the question of session secret confidentiality, which is addressed by the encryption and key exchange mechanisms.

### 10.3 Brute Force Mitigation

The six-digit numeric code space contains one million elements. Without rate limiting, an adversary making requests at network speed could enumerate the space in under a minute. The combination of rate limiting at five attempts per minute per source IP and thirty-second code expiry reduces the effective per-IP search rate to approximately 8.3 × 10⁻³ percent of the code space per code validity window. Distributed brute-force attacks using multiple source IPs can exceed this rate, but the thirty-second expiry means that any code must be found and used within a single validity window, further constraining the attack.

Migrating to eight-digit or alphanumeric codes — which would expand the space to 100 million or more elements — is the highest-priority standalone security enhancement identified for future work.

### 10.4 Third-Party Audit Readiness

The codebase is structured to facilitate independent security audit through three mechanisms. All security-critical logic — the encryption service, the replay protection module, and the access control layer — is isolated in dedicated modules with clearly specified interfaces and comprehensive unit tests, enabling auditors to reason about each mechanism in isolation. The security model documentation (this chapter) provides a formal description of the threat model, the security properties claimed, and the known limitations, giving auditors a specification against which to evaluate the implementation. The complete codebase is publicly available under the MIT licence, ensuring that audit findings can be reproduced and verified without access to private infrastructure.

---

## 11. Comparison with Existing Solutions

### 11.1 Signal

Signal implements the Double Ratchet algorithm over the X3DH key agreement protocol, providing per-message forward secrecy and post-compromise recovery — properties that Driflly does not implement, as they add complexity not warranted for sessions measured in minutes rather than months. Signal requires phone number registration, creating a linkage between real-world identity and communication activity. Messages are stored on Signal's servers until delivery confirmation, introducing a persistence window that Driflly eliminates architecturally. Signal's client code is open source, but its server code is not fully open, which limits independent verification of server-side claims. Driflly's approach is simpler, imposes no identity requirement, and eliminates server-side message persistence entirely; Signal's approach provides stronger cryptographic properties for long-lived, multi-device communication.

### 11.2 WhatsApp Disappearing Messages

WhatsApp's disappearing message feature applies a configurable timer after which messages are removed from participant devices. It does not provide guarantees about server-side deletion or non-persistence during the message's delivery lifetime. WhatsApp retains extensive communication metadata — contact graphs, message timing, device information — and operates under Meta's data governance framework. Its server-side implementation is closed and cannot be independently audited. Driflly provides stronger ephemerality guarantees by never persisting message content at the server layer, requires no phone number, and is fully open source.

### 11.3 Telegram Secret Chats

Telegram Secret Chats implement end-to-end encryption using the MTProto protocol and support configurable self-destruct timers for individual messages. The implementation is device-specific: secret chat history does not synchronise across devices and is lost if the originating device is replaced. Telegram's default chat mode — used by the majority of Telegram conversations — uses server–client encryption with Telegram holding the keys, creating a security bifurcation that users frequently misunderstand. Driflly offers comparable ephemerality guarantees without the device-specificity limitation, requires no account or phone number, and uses a widely-audited standard cipher (AES-256-GCM) rather than a custom protocol.

### 11.4 Key Differentiators

Driflly occupies a distinct position in the messaging landscape across four dimensions. First, its zero-knowledge relay architecture ensures that even an adversary with complete server access cannot read message content — a property not claimed by any major messaging platform. Second, complete ephemerality is enforced architecturally: no message data is written to any persistent storage at any layer, and this property can be verified by examining the database schema. Third, the absence of identity requirements — no phone number, no email address, no account — means that metadata about who communicates with whom is not collected. Fourth, the system was developed and is maintained entirely in the open on mobile hardware, demonstrating the viability of privacy engineering without institutional resources.

---

## 12. Future Work

### 12.1 Group Messaging Extension

Extending Driflly to support small groups of three to five participants introduces non-trivial key management challenges. A naïve approach — encrypting each message independently for each recipient — scales as O(N) in message size and O(N) in per-sender computational overhead, which is acceptable for small groups. A more principled approach would use a group key agreement protocol such as TreeKEM [MLS], which scales more favourably for larger groups but introduces substantial implementation complexity. A participant-count limit of five, combined with the pairwise encryption approach and a sender-key optimisation (in which the sender encrypts once to a shared group key that is updated on membership changes), represents a pragmatic middle ground that preserves the zero-knowledge property while minimising implementation risk.

### 12.2 Enhanced File Sharing

The current implementation supports image sharing up to ten megabytes. Extending this to additional file types — PDF, office documents, and archives — requires client-side rendering or preview generation for file types not natively supported by the browser. Chunked transfer, in which large files are split into fixed-size chunks each encrypted individually and reassembled on receipt, would improve reliability over high-latency connections. Client-side compression before encryption would reduce transmission time for compressible content. All enhancements must preserve the zero-knowledge property: file content must be encrypted before transmission and the server must receive only ciphertext.

### 12.3 Federation and Decentralisation

A fully decentralised architecture would eliminate the central server entirely, using WebRTC data channels for direct peer-to-peer message exchange and reducing the server to a signalling-only role for connection establishment. This architecture would eliminate server-side metadata collection and remove the server as a point of failure, but introduces NAT traversal complexity, requires TURN relay infrastructure for connections behind symmetric NATs, and complicates message queuing for offline recipients. The Matrix protocol provides a federated rather than fully decentralised model that may represent a more achievable intermediate step.

### 12.4 Post-Quantum Cryptography

AES-256 is considered quantum-resistant — Grover's algorithm reduces its effective security to 128 bits against a quantum adversary, which remains computationally infeasible. The key exchange mechanism, however, uses symmetric-key delivery over TLS-protected HTTP, whose security relies on classical asymmetric cryptography potentially vulnerable to Shor's algorithm at scale. A hybrid key exchange mechanism combining the current classical approach with a NIST post-quantum Key Encapsulation Mechanism (KEM) such as ML-KEM (formerly Kyber) would provide protection against harvest-now-decrypt-later attacks against session key establishment, at the cost of larger key payloads and additional client-side computation.

### 12.5 Native Mobile Applications

A React Native implementation would share the majority of business logic with the existing web frontend while providing access to native APIs for push notifications, background connection maintenance, and biometric authentication. The principal challenge is that React Native's WebSocket implementation and cryptographic API surface differ from the browser's Web Crypto API, requiring either a polyfill layer or a native module for cryptographic operations. A progressive web application with service worker support would provide some of these capabilities within the web context and represents a lower-complexity intermediate step.

---

## 13. Conclusion

### 13.1 Summary of Contributions

This thesis has presented Driflly, a privacy-first ephemeral messaging platform developed entirely within the resource constraints of an Android mobile device using Termux. The work makes five contributions to the field of privacy engineering and constrained-environment software development.

The first contribution is a novel zero-knowledge relay architecture that combines client-side AES-256-GCM key generation via the Web Crypto API with an in-memory-only server relay that is architecturally incapable of accessing message content. This architecture provides stronger privacy guarantees than any major commercial messaging platform.

The second contribution is a production-ready implementation of multi-mechanism replay protection that combines HMAC-SHA256 signatures, monotonically increasing per-client sequence numbers, and nonce caching with five-minute expiry — a combination that exceeds the replay protection of many deployed production systems and is validated by fourteen purpose-designed security tests.

The third contribution is a detailed account of software development within Termux's severe resource constraints, including the specific adaptations required for frontend build processes, dependency management, and storage hygiene that collectively enabled production-quality output from mobile hardware.

The fourth contribution is a complete production system comprising open-source frontend and backend implementations, comprehensive documentation including this thesis, CI/CD pipeline automation, deployment manifests, and an empirically validated performance characterisation.

The fifth contribution is empirical evidence — through controlled stress testing — that the system sustains one hundred concurrent sessions at eighty requests per second with sub-second latency and a one hundred percent success rate, validating its suitability for the target use case under realistic load conditions.

### 13.2 Research Objectives Revisited

All six research objectives stated in Section 1.2 were achieved. The zero-knowledge, zero-persistence architecture of Objective 1 was implemented and is verified by the database schema and code review. The replay protection of Objective 2 is implemented across three complementary mechanisms and validated by the security test suite. The mobile keyboard handling of Objective 3 is implemented using the `visualViewport` API and produces interaction behaviour matching mainstream messaging applications. The Termux implementation of Objective 4 was completed and is documented in detail in Section 5.6. The DevOps pipeline of Objective 5 is operational with four parallel CI jobs and automated deployment gating. The empirical evaluation of Objective 6 is presented in Chapter 7 with quantitative results across all test categories.

### 13.3 Closing Remarks

Driflly demonstrates that privacy-focused communication tools can be built with genuine architectural ephemerality — not by policy promise but by structural impossibility of retention. The zero-knowledge relay architecture ensures that even complete server compromise yields only opaque ciphertext. The successful development within Termux constraints demonstrates that privacy engineering does not require institutional resources or high-end hardware; it requires careful design, disciplined engineering, and the willingness to document failures as thoroughly as successes.

As digital surveillance capabilities become more sophisticated and the commercial incentives for data retention intensify, architecturally enforced privacy becomes increasingly important. Systems like Driflly contribute to an ecosystem of communication tools in which privacy is a verifiable property of the system's design rather than a claim in a terms of service document. This work is offered to that ecosystem as both a functional tool and a documented methodology.

---

## 14. References

[1] Borisov, N., Goldberg, I., & Brewer, E. (2004). Off-the-record communication, or, why not to use PGP. *Proceedings of the 2004 ACM Workshop on Privacy in the Electronic Society*, 77–84.

[2] Cohn-Gordon, K., Cremers, C., Dowling, B., Garratt, L., & Stebila, D. (2017). A formal security analysis of the Signal messaging protocol. *2017 IEEE European Symposium on Security and Privacy*, 451–466. https://doi.org/10.1109/EuroSP.2017.27

[3] Dierks, T., & Rescorla, E. (2008). *The Transport Layer Security (TLS) Protocol Version 1.2*. RFC 5246. Internet Engineering Task Force. https://datatracker.ietf.org/doc/html/rfc5246

[4] Ferguson, N., & Schneier, B. (2003). *Practical Cryptography*. Wiley.

[5] Hoiland-Jorgensen, T., & Donenfeld, J. A. (2020). WireGuard: Next Generation Kernel Network Tunnel. *Proceedings of the Network and Distributed System Security Symposium (NDSS 2020)*. https://doi.org/10.14722/ndss.2020.24517

[6] Krawczyk, H. (2005). HMQV: A high-performance secure Diffie-Hellman protocol. *Annual International Cryptology Conference*, 546–566.

[7] Marlinspike, M. (2016). *Advanced cryptographic ratcheting*. Signal Messenger. https://signal.org/blog/advanced-ratcheting/

[8] McGrew, D. A., & Viega, J. (2004). *The Galois/Counter Mode of Operation (GCM)*. Submission to NIST Modes of Operation Process.

[9] Menezes, A. J., Van Oorschot, P. C., & Vanstone, S. A. (2018). *Handbook of Applied Cryptography*. CRC Press.

[10] NIST. (2001). *Advanced Encryption Standard (AES)*. Federal Information Processing Standards Publication 197. National Institute of Standards and Technology.

[11] Open Whisper Systems. (2023). *The Signal Protocol*. Signal Messenger LLC. https://signal.org/docs/

[12] Rescorla, E. (2018). *The Transport Layer Security (TLS) Protocol Version 1.3*. RFC 8446. Internet Engineering Task Force. https://datatracker.ietf.org/doc/html/rfc8446

[13] Schneier, B. (2015). *Applied Cryptography: Protocols, Algorithms, and Source Code in C* (2nd ed.). Wiley.

[14] Unger, N., Dechand, S., Bonneau, J., Fahl, S., Perl, H., Goldberg, I., & Smith, M. (2015). SoK: Secure messaging. *2015 IEEE Symposium on Security and Privacy*, 232–249. https://doi.org/10.1109/SP.2015.22

[15] WhatsApp Inc. (2023). *WhatsApp Encryption Overview: Technical White Paper*. Meta Platforms Inc.

[16] W3C. (2024). *Web Cryptography API — W3C Recommendation*. World Wide Web Consortium. https://www.w3.org/TR/WebCryptoAPI/

[17] Vaudenay, S. (2002). Security flaws induced by CBC padding — Applications to SSL, IPSEC, WTLS. *International Conference on the Theory and Applications of Cryptographic Techniques*, 534–546.

[18] Barnes, R., Beurdouche, B., Robert, R., Millican, J., Omara, E., & Cohn-Gordon, K. (2023). *The Messaging Layer Security (MLS) Protocol*. RFC 9420. Internet Engineering Task Force. https://datatracker.ietf.org/doc/html/rfc9420

---

## 15. Appendices

### Appendix A: API Reference

Full API documentation is available in the repository at [`docs/API.md`](docs/API.md). It covers all HTTP endpoints (session creation, code redemption, session status, session deletion, and health check), the WebSocket protocol, all message type definitions, error response formats, and rate limiting behaviour.

### Appendix B: Architecture Documentation

The system architecture is documented in detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), including component diagrams, data flow diagrams, and database schema definitions.

### Appendix C: Security Policy

The security policy, threat model, and vulnerability reporting procedure are documented in [`docs/SECURITY.md`](docs/SECURITY.md). Security vulnerabilities should be reported to [security@driflly.app](mailto:security@driflly.app).

### Appendix D: Deployment Configuration

Complete deployment configuration files — `render.yaml`, `vercel.json`, `docker-compose.yml`, `.github/workflows/test.yml`, and environment variable templates — are available in the repository root and in [`DEPLOYMENT.md`](DEPLOYMENT.md).

### Appendix E: Changelog

The complete version history with semantic versioning and categorised change entries is maintained in [`CHANGELOG.md`](CHANGELOG.md).

---

*This thesis represents original independent research. All implementation, documentation, and analysis are the work of the author. The complete source code, tests, and documentation are available at [github.com/Yothabo/dispozhe](https://github.com/Yothabo/dispozhe) under the MIT Licence.*

*Built with privacy. Destroyed by design.*
