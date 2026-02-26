# Driflly - Ephemeral, Encrypted Conversations That Vanish

![Driflly](https://driflly.vercel.app/og-main.png)

Driflly is a privacy-first communication platform where conversations are ephemeral by design. No data stored. No identity required. End-to-end encrypted.

## 🚀 Features

### Core Modes
- **Duo** - Private two-person ephemeral chats
- **Group** - Small multi-participant sessions with anonymous handles
- **Live Board** - Classroom and meeting engagement with anonymous Q&A
- **Broadcast** - One-to-many ephemeral announcements
- **Drop** - Self-destructing file and text transfer
- **Whisper** - Micro-messages that disappear after reading

### Security & Privacy
- **End-to-end AES-256 encryption** - Keys generated client-side, never transmitted
- **Zero data retention** - No messages stored, no history kept
- **No identity required** - No emails, phone numbers, or personal info
- **One-time access** - Links, QR codes, and 6-digit codes expire after first use
- **Auto-destruction** - Sessions terminate when timer expires or manually
- **Privacy Guard** - Blur protection when tab/window loses focus

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: FastAPI, Python 3.11+, SQLite, WebSockets
- **Deployment**: Vercel (frontend), Render (backend)

### Project Structure
```

dispozhe/
├── frontend/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Route pages
│   │   ├── services/   # API and WebSocket services
│   │   ├── styles/     # CSS and animations
│   │   ├── tests/      # Test suite
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
│
├── backend/            # FastAPI backend
│   ├── app.py         # Main application
│   ├── models/        # Database models
│   └── utils/         # Utilities (code gen, expiry, WebSocket)
│
└── .github/           # GitHub Actions workflows

```

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Environment Variables

Create .env in the frontend directory:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

🧪 Testing

Run all tests:

```bash
cd frontend
npm test
```

Run specific test suites:

```bash
npm run test:api      # API tests
npm run test:ws       # WebSocket tests
npm run test:encryption # Encryption tests
```

📦 Building for Production

Frontend

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Backend

```bash
cd backend
# Deploy to Render or your preferred hosting
```

🚢 Deployment

Frontend (Vercel)

```bash
vercel --prod
```

Backend (Render)

1. Push to GitHub
2. Connect repository to Render
3. Set build command: pip install -r requirements.txt
4. Set start command: uvicorn app:app --host 0.0.0.0 --port $PORT

📊 API Endpoints

Method Endpoint Description
POST /session/create Create new session
POST /session/code/{code} Join via code
GET /session/{id}/status Get session status
DELETE /session/{id} Terminate session
WebSocket /ws/{id} Real-time communication

🔒 Security Features

· Connection limits: Max 2 participants per session
· Code expiration: 30-second validity for join codes
· Token validation: Short-lived connection tokens
· Input sanitization: XSS prevention
· CORS restrictions: Locked to specific domains
· Rate limiting: Protection against abuse
· No localStorage: Only in-memory session data

🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing)
5. Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

· Built with privacy as the primary requirement
· Inspired by the need for truly ephemeral communication
· Thanks to all contributors and privacy advocates

📬 Contact

· Email: contact@driflly.app
· Twitter: @driflly
· GitHub: Yothabo/dispozhe

---

Made with ❤️ for privacy.
