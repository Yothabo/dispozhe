# Contributing to Driflly Backend

Thank you for your interest in contributing to the Driflly backend. This document provides guidelines and instructions for contributing effectively.

## Development Environment

### Prerequisites

The backend requires Python 3.13 and uses SQLite for data storage. Development is primarily done in Termux on Android, but any Unix-like environment works. Install Python and pip through your system package manager.

### Setup

Clone the repository and navigate to the backend directory. Create a virtual environment with python -m venv venv and activate it with source venv/bin/activate. Install dependencies with pip install -r requirements.txt and pip install -r requirements-dev.txt for development dependencies including testing tools.

### Configuration

Copy .env.example to .env and adjust settings as needed. The default configuration works for local development with SQLite database. Set ENVIRONMENT=development to enable debug features and detailed logging.

## Code Style

### Python Standards

Follow PEP 8 for code formatting. Use 4 spaces for indentation, not tabs. Maximum line length is 88 characters as enforced by Black. Use descriptive variable names and add type hints for all function parameters and return values.

### Imports

Organize imports in the following order: standard library modules, third-party packages, local application modules. Use absolute imports within the package. Remove unused imports before committing.

### Documentation

All modules should have docstrings describing their purpose. Classes should document their responsibilities and usage. Functions should describe parameters, return values, and any exceptions raised. Complex algorithms need inline comments explaining the logic.

## Testing Requirements

### Unit Tests

All new features must include unit tests. Place tests in the appropriate directory under tests/. Test files should be named test_*.py and contain test classes inheriting from unittest.TestCase or using pytest style. Aim for at least 80 percent coverage for new code.

### Integration Tests

Features involving multiple components need integration tests. These should verify that components work together correctly. Use pytest fixtures to set up test data and clean up after tests.

### Stress Tests

Performance-critical features should include stress tests in the tests/load directory. These tests verify that the system handles expected load without degradation. Run stress tests against a real server instance, not the test client.

## Pull Request Process

### Branch Naming

Create branches with descriptive names following the pattern feature/description, bugfix/description, or security/description. Include the issue number if applicable, for example feature/123-add-replay-protection.

### Commit Messages

Write commit messages in the imperative mood. Start with a short summary line under 50 characters, followed by a blank line, then a detailed description if needed. Reference issues and pull requests in the description.

### PR Description

Fill out the pull request template completely. Describe what the change does, why it is needed, and how it was tested. Include screenshots for UI changes. Link related issues using GitHub keywords.

### Code Review

All pull requests require review from at least one maintainer. Address review comments promptly and update the PR as needed. Keep the PR focused on a single change rather than bundling multiple unrelated changes.

## Security Considerations

### Vulnerability Reporting

Do not report security vulnerabilities through public GitHub issues. Email security@driflly.app with details. Security issues receive priority attention and are fixed before public disclosure.

### Secure Coding Practices

Validate all input from external sources. Use parameterized queries to prevent SQL injection. Escape output to prevent XSS attacks. Follow the principle of least privilege for database access. Keep dependencies updated to avoid known vulnerabilities.

### Encryption Requirements

All cryptographic operations must use established libraries like cryptography, not custom implementations. Key material must never be logged or exposed in error messages. Use secure random number generators for all cryptographic randomness.

## Documentation

### Code Documentation

Document all public APIs with docstrings following Google style. Include examples for non-trivial functions. Update existing documentation when changing behavior.

### README Updates

Update the backend README when adding significant features or changing setup procedures. Keep the README concise and focused on getting started quickly.

### API Documentation

Update API.md when adding or modifying endpoints. Document request and response formats, error conditions, and any authentication requirements. Include example requests and responses.

## Release Process

### Versioning

Follow semantic versioning for releases. Major versions for breaking changes, minor versions for new features, patch versions for bug fixes. Update version in app.py and documentation.

### Changelog

Document all changes in CHANGELOG.md under the appropriate version heading. Include a summary of changes, links to issues, and credit to contributors.

### Release Checklist

Before releasing, ensure all tests pass, documentation is updated, and the changelog is complete. Tag the release commit with the version number and push tags to GitHub. Deploy to staging environment for final validation before production release.
