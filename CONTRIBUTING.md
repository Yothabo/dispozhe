# Contributing to Driflly

Thank you for your interest in contributing to Driflly. This document provides guidelines and instructions for contributing effectively to the project.

## Code of Conduct

This project and everyone participating in it is governed by the Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@driflly.app.

## How Can I Contribute

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible. Use a clear and descriptive title for the issue to identify the problem. Describe the exact steps which reproduce the problem in as many details as possible. Provide specific examples to demonstrate the steps. Include links to files or GitHub projects, or copy-pasteable snippets which you use in those examples. Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior. Explain which behavior you expected to see instead and why. Include screenshots and animated GIFs which show you following the described steps and clearly demonstrate the problem.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include a clear and descriptive title for the issue to identify the suggestion. Provide a step-by-step description of the suggested enhancement in as many details as possible. Provide specific examples to demonstrate the steps. Include copy-pasteable snippets which you use in those examples. Describe the current behavior and explain which behavior you expected to see instead and why. Explain why this enhancement would be useful to most Driflly users. List some other applications where this enhancement exists.

### Pull Requests

Fill in the required template. Do not include issue numbers in the PR title. Follow the TypeScript and React styleguide. Include thoughtfully-worded, well-structured tests. Document new code. End all files with a newline.

## Development Setup

### Prerequisites

The backend requires Python 3.13 and uses SQLite for data storage. Development is primarily done in Termux on Android, but any Unix-like environment works. Install Python and pip through your system package manager.

The frontend requires Node.js 20 or later and npm 10 or later. Install Node.js through your system package manager or Node Version Manager.

### Backend Setup

Clone the repository and navigate to the backend directory. Create a virtual environment with python -m venv venv and activate it with source venv/bin/activate. Install dependencies with pip install -r requirements.txt and pip install -r requirements-dev.txt for development dependencies including testing tools.

Copy .env.example to .env and adjust settings as needed. The default configuration works for local development with SQLite database. Set ENVIRONMENT=development to enable debug features and detailed logging.

### Frontend Setup

Navigate to the frontend directory and install dependencies with npm install. Copy .env.example to .env and adjust settings as needed. Start the development server with npm run dev and access the application at http://localhost:3000.

## Code Style

### Python Standards

Follow PEP 8 for code formatting. Use 4 spaces for indentation, not tabs. Maximum line length is 88 characters as enforced by Black. Use descriptive variable names and add type hints for all function parameters and return values.

### TypeScript Standards

Use TypeScript for all new code with strict mode enabled. Define interfaces for all props and state shapes. Use explicit typing rather than relying on type inference for function returns. Avoid using any type except in rare circumstances with proper justification.

### React Guidelines

Use functional components with hooks instead of class components. Keep components focused on a single responsibility. Extract reusable logic into custom hooks. Use React.memo for expensive components that render frequently with the same props.

### Styling

Use Tailwind CSS classes for styling following the utility-first approach. Avoid custom CSS unless absolutely necessary. Maintain consistent spacing and color schemes using theme values. Ensure all components are responsive and work on mobile devices.

### Imports

Organize imports in the following order: standard library modules, third-party packages, local application modules. Use absolute imports within the package. Remove unused imports before committing.

### Documentation

All modules should have docstrings describing their purpose. Classes should document their responsibilities and usage. Functions should describe parameters, return values, and any exceptions raised. Complex algorithms need inline comments explaining the logic.

## Testing Requirements

### Unit Tests

All new features must include unit tests. Place tests in the appropriate directory under tests. Test files should be named test_*.py and contain test classes inheriting from unittest.TestCase or using pytest style. Aim for at least eighty percent coverage for new code.

### Integration Tests

Features involving multiple components need integration tests. These should verify that components work together correctly. Use pytest fixtures to set up test data and clean up after tests.

### Stress Tests

Performance-critical features should include stress tests in the tests/load directory. These tests verify that the system handles expected load without degradation. Run stress tests against a real server instance, not the test client.

### Frontend Tests

Write unit tests for all new components and utilities using Vitest. Place test files next to the component they test with the .test.tsx extension. Test component rendering, user interactions, and edge cases. Aim for at least eighty percent coverage.

### Encryption Tests

All encryption-related code must have comprehensive tests verifying that encryption and decryption work correctly, that different keys produce different ciphertext, that tampered messages are rejected, and that key import and export functions properly.

## Pull Request Process

### Branch Naming

Create branches with descriptive names following the pattern feature/description, bugfix/description, or security/description. Include the issue number if applicable, for example feature/123-add-replay-protection.

### Commit Messages

Write commit messages in the imperative mood. Start with a short summary line under fifty characters describing the change. Add detailed explanation after a blank line if needed. Reference issues and pull requests in the description.

### PR Description

Complete the pull request template with details about the change. Describe what the change does, why it is needed, and how it was tested. Include screenshots for UI changes. Link related issues using GitHub keywords.

### Code Review

All pull requests require review from at least one maintainer. Address review comments promptly. Keep discussions focused and constructive. Update the PR with requested changes and re-request review when ready.

## Security Considerations

### Vulnerability Reporting

Do not report security vulnerabilities through public GitHub issues. Email security@driflly.app with details. Security issues receive priority attention and are fixed before public disclosure.

### Secure Coding Practices

Validate all input from external sources. Use parameterized queries to prevent SQL injection. Escape output to prevent XSS attacks. Follow the principle of least privilege for database access. Keep dependencies updated to avoid known vulnerabilities.

### Encryption Requirements

All cryptographic operations must use established libraries, not custom implementations. Key material must never be logged or exposed in error messages. Use secure random number generators for all cryptographic randomness.

## Release Process

### Versioning

Follow semantic versioning for releases. Major versions for breaking changes, minor versions for new features, patch versions for bug fixes. Update version in app.py and documentation.

### Changelog

Document all changes in CHANGELOG.md under the appropriate version heading. Include a summary of changes, links to issues, and credit to contributors.

### Release Checklist

Before releasing, ensure all tests pass, documentation is updated, and the changelog is complete. Tag the release commit with the version number and push tags to GitHub. Deploy to staging environment for final validation before production release.
