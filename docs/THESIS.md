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

