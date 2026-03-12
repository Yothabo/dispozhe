# Contributing to Driflly Frontend

Thank you for your interest in contributing to the Driflly frontend. This document provides guidelines and instructions for contributing effectively.

## Development Environment

### Prerequisites

The frontend requires Node.js 20 or later and npm 10 or later. Development is primarily done in Termux on Android, but any environment with Node.js works. Install Node.js through your system package manager or Node Version Manager.

### Setup

Clone the repository and navigate to the frontend directory. Install dependencies with npm install. Copy .env.example to .env and adjust settings as needed. Start the development server with npm run dev and access the application at http://localhost:3000.

### Development Tools

The project uses ESLint for code linting and Prettier for code formatting. Run npm run lint to check for issues and npm run format to automatically fix formatting problems. These tools run as pre-commit hooks to ensure code quality.

## Code Style

### TypeScript Standards

Use TypeScript for all new code with strict mode enabled. Define interfaces for all props and state shapes. Use explicit typing rather than relying on type inference for function returns. Avoid using any type except in rare circumstances with proper justification.

### React Guidelines

Use functional components with hooks instead of class components. Keep components focused on a single responsibility. Extract reusable logic into custom hooks. Use React.memo for expensive components that render frequently with the same props.

### Component Structure

Organize components in the src/components directory by feature. Each component should have its own file named with PascalCase. Export components as named exports for better tree-shaking. Include prop type definitions above the component.

### Styling

Use Tailwind CSS classes for styling following the utility-first approach. Avoid custom CSS unless absolutely necessary. Maintain consistent spacing and color schemes using theme values. Ensure all components are responsive and work on mobile devices.

## Testing Requirements

### Unit Tests

Write unit tests for all new components and utilities using Vitest. Place test files next to the component they test with the .test.tsx extension. Test component rendering, user interactions, and edge cases. Aim for at least 80 percent coverage.

### Integration Tests

Test component interactions and data flows with integration tests. Verify that components work together correctly and that state updates propagate as expected. Mock external dependencies like API calls and WebSocket connections.

### Encryption Tests

All encryption-related code must have comprehensive tests verifying that encryption and decryption work correctly, that different keys produce different ciphertext, that tampered messages are rejected, and that key import and export functions properly.

## Pull Request Process

### Branch Naming

Create branches with descriptive names following the pattern feature/description, bugfix/description, or docs/description. Include the issue number if applicable, for example feature/123-add-file-sharing.

### Commit Messages

Write commit messages in the imperative mood. Start with a short summary line under 50 characters describing the change. Add detailed explanation after a blank line if needed. Reference issues and pull requests in the description.

### PR Description

Complete the pull request template with details about the change. Describe what the change does, why it is needed, and how it was tested. Include screenshots for UI changes. Link related issues using GitHub keywords.

### Code Review

All pull requests require review from at least one maintainer. Address review comments promptly. Keep discussions focused and constructive. Update the PR with requested changes and re-request review when ready.

## Security Considerations

### Vulnerability Reporting

Report security vulnerabilities through email to security@driflly.app rather than public GitHub issues. Security issues are handled confidentially and receive priority attention.

### Secure Coding Practices

Validate all user input before processing. Sanitize data before rendering to prevent XSS attacks. Use the Web Crypto API for all cryptographic operations. Never store sensitive data in localStorage or sessionStorage. Clear sensitive data from memory when sessions end.

### Encryption Requirements

Use AES-256-GCM through the Web Crypto API for all encryption. Generate random IVs for each message using cryptographically secure random number generators. Never reuse IVs with the same key. Clear keys from memory when sessions end.

## Performance

### Bundle Size

Keep the initial bundle size under 250KB gzipped. Use dynamic imports for code splitting. Lazy load components that are not needed immediately. Monitor bundle size with tools like bundlephobia.

### Render Performance

Avoid unnecessary re-renders by using React.memo and useMemo appropriately. Keep component hierarchies shallow. Virtualize long lists of messages to maintain performance with many messages.

### Network Efficiency

Minimize WebSocket message size by sending only necessary data. Batch updates when possible. Use compression for large messages like files. Implement exponential backoff for reconnection attempts.

## Documentation

### Code Documentation

Document complex functions and custom hooks with JSDoc comments. Explain the purpose, parameters, and return values. Include examples for non-obvious usage. Keep comments up to date as code evolves.

### Component Documentation

Document component props with TypeScript interfaces. Include descriptions of what each prop does and any constraints. Document side effects and dependencies. Provide usage examples for complex components.

### README Updates

Update the frontend README when adding significant features or changing setup procedures. Keep installation instructions accurate and up to date. Document any new environment variables or configuration options.

## Release Process

### Versioning

Follow semantic versioning for releases. Major versions for breaking changes, minor versions for new features, patch versions for bug fixes. Update version in package.json and documentation.

### Changelog

Document all changes in CHANGELOG.md under the appropriate version heading. Include a summary of changes, links to issues, and credit to contributors. Keep the changelog readable and organized.

### Build Process

Run npm run build to create production builds. Verify that the build completes without errors and that all assets are generated correctly. Test the production build locally with npm run preview before releasing.
