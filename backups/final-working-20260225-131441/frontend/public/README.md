# Driflly Test Suite

This directory contains comprehensive tests for the Driflly chat application.

## Test Structure

```text
tests/
├── api.test.ts          # REST API endpoint tests
├── websocket.test.ts    # WebSocket connection tests
├── encryption.test.ts   # Encryption/decryption tests
└── README.md            # This file

Prerequisites
Before running tests, ensure:
 * Backend server is running on port 8080
   cd ~/chatie/backend
source venv/bin/activate
uvicorn app:app --reload --port 8080

 * All dependencies are installed
   cd ~/chatie/frontend
npm install

Running Tests
Run all tests
cd ~/chatie/frontend
npx vitest

Run specific test suites
# API tests only
npx vitest src/tests/api.test.ts

# WebSocket tests only
npx vitest src/tests/websocket.test.ts

# Encryption tests only
npx vitest src/tests/encryption.test.ts

Run with UI
npx vitest --ui

Watch mode
npx vitest --watch

Test Descriptions
API Tests (api.test.ts)
Tests all REST endpoints:
| Test | Description | Expected Result |
|---|---|---|
| Create session | POST /session/create | Returns session_id and code |
| Get status | GET /session/{id}/status | Returns participant count and time left |
| Join with code | POST /session/code/{code} | Returns session_id and encryption_key |
| Invalid code | POST /session/code/123456 | Returns 404 |
| Duplicate join | Second POST with same code | Returns 400 |
| Terminate session | DELETE /session/{id} | Returns {"status":"terminated"} |
| Terminated session | GET after DELETE | Returns 404 |
WebSocket Tests (websocket.test.ts)
Tests WebSocket connections and messaging:
| Test | Description | Validation |
|---|---|---|
| First connection | Participant 1 connects | ReadyState = OPEN |
| Connection count | First participant message | connection_count = 1 |
| Second connection | Participant 2 connects | ReadyState = OPEN |
| Both connected | Second participant message | connection_count = 2 |
| Message A→B | Send from participant 1 | Received by participant 2 |
| Message B→A | Send from participant 2 | Received by participant 1 |
| Typing indicator | Send typing event | Received by other participant |
| Third connection | Attempt third connection | Closed with code 1008 |
| Participant leaving | Close participant 2 | Participant 1 notified |
| Termination | DELETE session | Both connections closed |
Encryption Tests (encryption.test.ts)
Tests client-side encryption:
| Test Input | Validation |
|---|---|
| Basic text "Hello, World!" | decrypt(encrypt(text)) = text |
| Special characters "!@#$%^&*()_+" | decrypt(encrypt(text)) = text |
| Unicode "Hello 世界" | decrypt(encrypt(text)) = text |
| Empty string "" | decrypt(encrypt(text)) = "" |
| Long message 1000 'A' characters | decrypt(encrypt(text)) = text |
| Key uniqueness | Two random keys are different |
Manual Testing
For manual step-by-step testing, use the HTML test page:
# Serve the frontend
cd ~/chatie/frontend
npm run dev

Then open: http://localhost:3000/websocket-test.html
Test Configuration
Tests are configured in vitest.config.ts at the project root:
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})

Troubleshooting
Tests fail with connection refused
 * Ensure backend is running on port 8080.
 * Check no firewall is blocking local connections.
WebSocket tests timeout
 * Increase timeout in test options: it('test', { timeout: 10000 }).
 * Check WebSocket server logs for errors.
Encryption tests fail
 * Verify TextEncoder/TextDecoder are available in the environment.
 * Check for Unicode normalization issues.
Adding New Tests
Follow this pattern for new tests:
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', async () => {
    // Setup
    const input = 'test data';
    
    // Execute
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expectedOutput);
  });
});

Continuous Integration
Example GitHub Actions workflow:
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

Test Coverage Goals
 * API endpoints: 100% coverage
 * WebSocket flows: 90% coverage
 * Encryption utilities: 100% coverage
 * Error scenarios: 80% coverage
 * Edge cases: 70% coverage
   EOF
<!-- end list -->

### Documentation Meta-Information
| Component | Description |
| :--- | :--- |
| **Path** | `~/chatie/frontend/src/tests/README.md` |
| **Purpose** | Documentation for Vitest-based testing suite |
| **Format** | Markdown via Shell Redirect |

