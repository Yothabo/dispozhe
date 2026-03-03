# Driflly - Ephemeral, Encrypted Conversations That Vanish

Driflly is a privacy-first communication platform where conversations are ephemeral by design. No data stored. No identity required. End-to-end encrypted. Built entirely on mobile devices using Termux, Driflly proves that complex web applications can be developed anywhere, on any device.

## About

Driflly was born from a simple principle: privacy is not a feature, it is the foundation. Every line of code, every design decision, every system we build starts with the idea that your conversation belongs to no one but you. The platform is designed to facilitate private communication without storing any conversation data. Messages are encrypted end-to-end using AES-256-GCM, with keys generated on users' devices that are never transmitted to servers. The server relays encrypted data without accessing plaintext.

The application offers six conversation modes. Duo provides private two-person ephemeral chats. Group enables small multi-participant sessions with anonymous handles. Live Board is designed for classroom and meeting engagement with anonymous Q&A. Broadcast handles one-to-many ephemeral announcements. Drop enables self-destructing file and text transfer. Whisper offers micro-messages that disappear after reading.

## Features

The platform includes automatic session destruction with configurable timers. When the timer expires, the session and all associated data are permanently deleted from memory. Participants may also end sessions manually before timer expiration, which immediately deletes all session data and notifies the other participant.

Access methods include one-time links, QR codes, and six-digit codes that expire after first use. The service does not require email addresses, phone numbers, names, or any form of personal identification. Privacy Guard provides blur protection when the tab or window loses focus, preventing accidental exposure of sensitive conversations.

Read receipts show message status through visual indicators. A single tick appears when the message is sent to the server. Double ticks appear when the message is delivered to the recipient. Blue double ticks indicate the message has been read. Messages are queued when the recipient is offline and delivered automatically upon reconnection.

## Architecture

The frontend is built with React 18 and TypeScript, using Vite 5 for fast development and optimized builds. Styling is handled by Tailwind CSS 3, with routing provided by React Router 6. Icons come from React Icons, and testing uses Vitest 4 with Testing Library. Code quality is maintained through ESLint and Prettier.

The backend runs on FastAPI 0.115 with Python, using SQLite for database storage. WebSocket connections are managed through FastAPI's built-in WebSocket support. Authentication uses short-lived tokens with 60-second expiry. Testing uses pytest, and deployment targets include Render and Vercel.

The database schema is minimal. Sessions are stored with an ID, creation timestamp, expiry timestamp, duration in minutes, participant count, status, and link active flag. Codes are stored with the code itself, associated session ID, encryption key, expiry timestamp, and redeemed flag. No message content is ever stored.

## Development Environment

Driflly is uniquely engineered to be developed, built, and run entirely on mobile devices using Termux. This is not an afterthought but the primary development environment that has shaped every architectural decision. The entire codebase is optimized for memory-constrained environments with limited RAM and storage.

Memory limitations are addressed by splitting build processes into smaller chunks, configuring development servers with lower memory footprints, avoiding heavy dependencies, and optimizing WebSocket connections to use minimal memory per connection. Storage constraints are managed through a minimal dependency philosophy, efficient caching strategies, regular cleanup scripts, and SQLite with automatic VACUUM operations.

CPU limitations on mobile processors are handled by prioritizing asynchronous operations over synchronous ones, optimizing and minimizing CPU-intensive tasks like encryption, throttling background jobs to prevent UI thread blocking, using efficient WebSocket heartbeat intervals of 25 seconds, and carefully tuning polling intervals to 2 seconds for status updates.

Network constraints on mobile networks with variable latency are addressed through exponential backoff for reconnection attempts, message queuing for offline scenarios, optimized WebSocket frame sizes, compression for large messages like images and files, and graceful degradation when connections are slow.

## Installation

To set up the frontend, clone the repository and navigate to the frontend directory. Install dependencies using npm install. Create a .env file with VITE_API_URL set to http://localhost:8080 and VITE_WS_URL set to ws://localhost:8080. Start the development server with npm run dev.

To set up the backend, navigate to the backend directory and create a Python virtual environment using python -m venv venv. Activate the virtual environment with source venv/bin/activate on Unix systems or venv\Scripts\activate on Windows. Install dependencies with pip install -r requirements.txt. Start the server with python app.py.

The frontend will be available at http://localhost:3000 and the backend at http://localhost:8080.

## Testing

Frontend tests are run with npm test from the frontend directory. Specific test suites can be run with npm run test:api for API tests, npm run test:ws for WebSocket tests, and npm run test:encryption for encryption tests. Backend tests are run with pytest from the backend directory.

## API Documentation

The API provides endpoints for session management. Create a new session with a POST request to /session/create, including a JSON body with the desired duration in minutes. Join a session using a code with a POST request to /session/code/{code}. Check session status with a GET request to /session/{sessionId}/status. Terminate a session with a DELETE request to /session/{sessionId}.

WebSocket connections are established at ws://localhost:8080/ws/{sessionId}. Once connected, messages can be sent as JSON objects containing a type field, data field with base64-encoded content, timestamp, and unique ID. The server forwards messages to the other participant without storing them.

## Security

All messages are encrypted with AES-256-GCM. Keys are generated and stored on participant devices. The server never receives encryption keys. Session metadata exists only in memory during active sessions. No message content is stored. Upon termination, all data is permanently deleted.

Room access is secured through one-time links and codes that expire after use. Access methods cannot be reused. The server relays encrypted data between participants without accessing plaintext. The codebase is publicly available for independent security audits.

Connection limits are enforced with a maximum of two participants per session. Codes have a 30-second validity period. Tokens have a 60-second validity period. Links expire immediately after first use. Connections are rejected with HTTP 403 or WebSocket close codes 1008 and 4003 when sessions are full.

## Deployment

The frontend can be deployed to Vercel by running vercel --prod from the frontend directory. The backend can be deployed to Render by pushing code to GitHub, creating a new Web Service, connecting the repository, setting the build command to pip install -r requirements.txt, and setting the start command to uvicorn app:app --host 0.0.0.0 --port $PORT.

## Contributing

Contributions are welcome. Please read the Contributing Guidelines and Code of Conduct first. Fork the repository, create a feature branch, commit your changes, push to your fork, and open a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For questions or support, email contact@driflly.app. For security issues, email security@driflly.app. Follow on Twitter at @driflly. Visit the GitHub repository at github.com/Yothabo/dispozhe.

## Acknowledgments

Built with privacy as the primary requirement. Inspired by the need for truly ephemeral communication. Thanks to all contributors and privacy advocates. Special thanks to the open source community.

Driflly is proof that complex web applications can be developed entirely on mobile devices. Every architectural decision was made with Termux constraints in mind, resulting in a lean, efficient, and privacy-focused application that runs anywhere. The Termux-first approach has forced us to write better code, use fewer dependencies, and think carefully about every byte. This discipline has made Driflly not just a mobile-first application, but a truly portable one that can be developed and run anywhere, on any device, with minimal resources.
