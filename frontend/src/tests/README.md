# Driflly Test Suite

This directory contains comprehensive tests for the Driflly chat application.

## Test Structure

tests/
├── api.test.ts          # REST API endpoint tests
├── websocket.test.ts     # WebSocket connection tests
├── encryption.test.ts    # Encryption/decryption tests
└── README.md            # This file

## Prerequisites

Before running tests, ensure:

1. Backend server is running on port 8080:
   cd ~/chatie/backend
   source venv/bin/activate
   uvicorn app:app --reload --port 8080

2. All dependencies are installed:
   cd ~/chatie/frontend
   npm install

## Running Tests

### Run all tests
cd ~/chatie/frontend
npx vitest

### Run specific test suites
npx vitest src/tests/api.test.ts
npx vitest src/tests/websocket.test.ts
npx vitest src/tests/encryption.test.ts

### Run with UI
npx vitest --ui

## Test Files

`api.test.ts - REST API endpoint tests

C

Copy

- WebSocket connection and messaging tests

websocket.test.ts`

encryption.test.ts - Client-side encryption/decryption tests

load.test.ts - Basic load testing

Uber →

## Running Tests

bash

# Run all tests

npm run test:all

# Run specific test suites

npm run test:api

npm run test:ws

npm run test:encryption

# Run with watch mode npm run test:watch

# Run with UI

npm run test:ui

## Test Descriptions

### API Tests (api.test.ts)
| Test | Description | Expected Result |
|---|---|---|
| Create session | POST /session/create | Returns session_id and code |
| Get status | GET /session/{id}/status | Returns participant count |
| Join with code | POST /session/code/{code} | Returns keys |
| Terminate | DELETE /session/{id} | Returns success status |

### WebSocket Tests (websocket.test.ts)
| Test | Description | Validation |
|---|---|---|
| Connection | Participant 1 connects | ReadyState = OPEN |
| Message A to B | Send from p1 | Received by p2 |
| Typing | Send typing event | Received by other |
| Termination | DELETE session | Connections closed |

### Encryption Tests (encryption.test.ts)
| Test Input | Validation |
|---|---|
| Basic text | decrypt(encrypt(text)) = text |
| Unicode | decrypt(encrypt(text)) = text |
| Long message | decrypt(encrypt(text)) = text |

## Manual Testing
Serve the frontend:
cd ~/chatie/frontend
npm run dev

Open: http://localhost:3000/websocket-test.html

## Test Configuration
Configured in vitest.config.ts:

import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})

## Troubleshooting
- Connection Refused: Check if backend uvicorn is running.
- Timeout: Increase timeout in it('test', { timeout: 10000 }).
- Encryption: Verify TextEncoder is available.

## Test Coverage Goals
- API endpoints: 100%
- WebSocket flows: 90%
- Encryption: 100%
