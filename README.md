
# Driflly

[![Tests](https://github.com/Yothabo/dispozhe/actions/workflows/test.yml/badge.svg)](https://github.com/Yothabo/dispozhe/actions/workflows/test.yml)
[![GitHub release](https://img.shields.io/github/v/release/Yothabo/dispozhe)](https://github.com/Yothabo/dispozhe/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

Ephemeral, encrypted two-person conversations that self-destruct. No data stored. No identity required. End-to-end encrypted. Built entirely on mobile devices using Termux.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About

Driflly is a privacy-first communication platform where conversations are ephemeral by design. Messages are encrypted with AES-256-GCM using the Web Crypto API, keys never leave client devices, and the server acts as a zero-knowledge relay that never sees plaintext content. Sessions automatically self-destruct after a configured duration ranging from one minute to twenty-four hours.

The project was developed entirely on Android devices using Termux, which imposed architectural constraints that ultimately made the production system more robust. Memory limitations forced efficient code splitting, storage constraints mandated minimal dependencies, and network variability led to resilient reconnection logic with exponential backoff.

---

## Features

- **End-to-end encryption** with AES-256-GCM using the Web Crypto API
- **Zero-knowledge relay** architecture where servers never see plaintext
- **Replay protection** through HMAC signing, sequence numbers, and nonce tracking
- **One-time access** via six-digit codes (30-second expiry) or single-use links
- **Automatic session destruction** after configurable duration (1 minute to 24 hours)
- **Manual termination** with immediate deletion of all data
- **Image sharing** up to 10MB with view-once option
- **Real-time typing indicators** and read receipts
- **Mobile-optimized** with proper keyboard handling (input only moves, header and messages stay fixed)

---

## Quick Start

### Backend

```bash
git clone https://github.com/Yothabo/dispozhe.git
cd dispozhe/backend

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your configuration

uvicorn app:app --reload --port 8080
```

Frontend

```bash
cd dispozhe/frontend

npm install
cp .env.example .env
# Edit .env with your configuration

npm run dev
```

Visit http://localhost:3000

---

Documentation

Document Description
API Reference Complete API endpoint and WebSocket documentation
Architecture Overview System design, data flow, and component interactions
Security Policy Threat model, encryption standards, and reporting
Roadmap Planned features and development timeline
Contributing Guidelines How to contribute to the project
Code of Conduct Community guidelines and enforcement
Technical Analysis Comprehensive codebase assessment

---

Technology Stack

Frontend

· React 18 with TypeScript
· Vite 5 for fast development and optimized builds
· Tailwind CSS 3 for styling
· Web Crypto API for client-side encryption
· Vitest 4 for testing

Backend

· FastAPI 0.115 with Python 3.13
· SQLite for minimal session metadata (no message storage)
· WebSocket Manager for real-time communication
· Replay protection module for message integrity
· Background expiry scheduler for automatic cleanup
· Pytest for testing

DevOps

· Docker and Docker Compose for containerization
· GitHub Actions for CI/CD
· Render deployment for backend
· Vercel deployment for frontend
· Nginx for reverse proxy configuration

---

Testing

The test suite includes forty-eight passing tests across multiple categories.

Backend Security Tests

```bash
cd backend
PYTHONPATH=. pytest tests/test_security/ -v
```

Frontend Unit Tests

```bash
cd frontend
npm run test:encryption
```

Frontend Integration Tests (with Backend)

```bash
# Terminal 1
cd backend
uvicorn app:app --reload --port 8080

# Terminal 2
cd frontend
npm run test:api
npm run test:ws
```

Stress Tests

```bash
cd backend
python tests/load/real_api_stress.py
```

---

Deployment

Backend (Render)

The backend is configured for deployment on Render using the included render.yaml:

```yaml
buildCommand: pip install -r requirements.txt
startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

· ENVIRONMENT=production
· ALLOWED_ORIGINS=https://your-frontend-domain.com

Frontend (Vercel)

The frontend is configured for deployment on Vercel using the included vercel.json:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Required environment variables:

· VITE_API_URL=https://your-backend-domain.com
· VITE_WS_URL=wss://your-backend-domain.com

GitHub Actions CI/CD

The project includes a complete CI/CD pipeline that:

1. Runs backend security tests
2. Runs frontend unit tests
3. Runs frontend integration tests with a live backend
4. Executes stress tests against a real server
5. Deploys to Render and Vercel on successful main branch builds
6. Creates GitHub releases with auto-generated notes

---

Contributing

Contributions are welcome. Please read the Contributing Guidelines and Code of Conduct first.

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

---

License

This project is licensed under the MIT License. See the LICENSE file for details.

---

Acknowledgments

Built with privacy as the primary requirement. Inspired by the need for truly ephemeral communication. Special thanks to all contributors and the open source community.

---

Contact

· For questions: contact@driflly.app
· For security issues: security@driflly.app
· GitHub: Yothabo/dispozhe

```
