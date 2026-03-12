# Backend Test Suite

The Driflly backend test suite ensures reliability, security, and performance of all server components. Tests are organized by category and can be run individually or as a complete suite.

## Test Structure

The test suite is organized into several directories reflecting different testing concerns. The test_security directory contains security-focused tests including replay protection validation. The load directory contains stress tests that run against a real server instance. The expiry directory tests automatic session cleanup functionality. The websocket directory validates real-time communication features. The api directory tests REST endpoint behavior.

## Running Tests

### Prerequisites

Before running tests, ensure the test dependencies are installed. From the backend directory, run pip install pytest pytest-asyncio pytest-cov requests httpx websockets. The test suite requires these packages for proper execution.

### Unit Tests

To run all unit tests, execute pytest tests/ -v from the backend directory. The verbose flag provides detailed output about each test case. To run specific test categories, use pytest tests/test_security/ -v for security tests, pytest tests/websocket/ -v for WebSocket tests, or pytest tests/expiry/ -v for expiry tests.

### Security Tests

The replay protection tests validate HMAC generation, sequence number tracking, nonce validation, and session cleanup. Run these with pytest tests/test_security/test_replay_protection.py -v. All 14 security tests should pass in a working system.

### Stress Tests

Stress tests require a running server instance. Start the server with uvicorn app:app --reload --host 0.0.0.0 --port 8000 in a separate terminal. Then run python tests/load/real_api_stress.py to execute burst creation tests and mixed API call tests against the real server. The stress tests validate that the system handles 100+ concurrent sessions with 100% success rate.

### Test Coverage

Generate coverage reports with pytest tests/ --cov=. --cov-report=html. This creates an HTML coverage report in the htmlcov directory showing which lines of code are exercised by tests. Aim to maintain coverage above 80 percent for critical components.

## Test Categories

### Security Tests

The replay protection tests verify that HMAC signatures are generated and verified correctly. They validate that sequence numbers increase monotonically and reject old messages. Nonce tracking ensures that messages cannot be replayed within the 5-minute window. Session cleanup tests confirm that all tracking data is removed when sessions end.

### API Tests

API tests validate session creation with various durations, code redemption with valid and invalid codes, status checking for active and expired sessions, and proper termination handling. Each endpoint is tested with valid inputs, invalid inputs, and edge cases.

### WebSocket Tests

WebSocket tests verify connection establishment, message exchange between two participants, typing indicator propagation, delivery status updates, read receipts, and proper handling of disconnections and reconnections.

### Expiry Tests

Expiry tests validate that sessions expire after their configured duration, that the expiry worker runs correctly, that expired sessions are cleaned up from the database, and that participants receive proper notifications upon expiry.

### Load Tests

Load tests simulate high concurrency scenarios including 1000 concurrent session creations, burst creation patterns, mixed API calls under load, and race conditions during simultaneous join attempts. These tests ensure the system remains stable under stress.

## Adding New Tests

### Test Location

Place new tests in the appropriate directory based on what they test. Security tests go in test_security, API tests in test_api, WebSocket tests in test_websocket, expiry tests in test_expiry, and load tests in test_load.

### Test Structure

Each test file should contain a test class with setup and teardown methods as needed. Individual test methods should be named descriptively starting with test_. Use assertions to verify expected outcomes and include helpful error messages for failures.

### Dependencies

Tests should import required modules at the top of the file. Use pytest fixtures for common setup like creating test clients or database connections. Mock external services where appropriate to keep tests isolated and fast.

### Documentation

Each test should include a docstring explaining what it tests and why. Complex test logic should be commented to aid understanding. Test files should have a module-level docstring describing the test category.

## Continuous Integration

The test suite runs automatically on GitHub Actions for every push and pull request. The CI configuration installs dependencies, runs all tests, generates coverage reports, and uploads results. Tests must pass before pull requests can be merged.

## Troubleshooting

### Connection Refused Errors

If tests fail with connection refused errors, ensure the backend server is running when executing stress tests. Unit tests use a test client and do not require a running server.

### Database Lock Errors

SQLite database lock errors can occur when multiple tests try to access the database simultaneously. Use separate database files for parallel test execution or run tests sequentially with pytest -n 0.

### Timeout Errors

Increase timeouts for slow operations by passing --timeout=30 to pytest or setting individual test timeouts with the @pytest.mark.timeout(30) decorator.
