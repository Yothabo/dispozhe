# Contributing to Driflly

First off, thank you for considering contributing to Driflly. It's people like you that make Driflly such a great tool for private, ephemeral communication.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@driflly.app.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title for the issue to identify the problem.
* Describe the exact steps which reproduce the problem in as many details as possible.
* Provide specific examples to demonstrate the steps. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
* Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
* Explain which behavior you expected to see instead and why.
* Include screenshots and animated GIFs which show you following the described steps and clearly demonstrate the problem.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title for the issue to identify the suggestion.
* Provide a step-by-step description of the suggested enhancement in as many details as possible.
* Provide specific examples to demonstrate the steps. Include copy/pasteable snippets which you use in those examples.
* Describe the current behavior and explain which behavior you expected to see instead and why.
* Explain why this enhancement would be useful to most Driflly users.
* List some other applications where this enhancement exists.

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript/React styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### TypeScript Styleguide

* Use 2 spaces for indentation
* Use semicolons
* Use single quotes for strings
* Prefer const over let
* Use template literals for string concatenation
* Use explicit accessibility modifiers (public, private, protected)
* Use interfaces over types when possible
* Use interface for objects, type for unions
* Use meaningful variable names
* Add JSDoc comments for public APIs

### React Styleguide

* Use functional components with hooks
* Use React.FC for component typing
* Use useState for local state
* Use useEffect for side effects
* Use useCallback for function memoization
* Use useMemo for expensive computations
* Use custom hooks for reusable logic
* Keep components small and focused
* Use Tailwind CSS for styling

### Test Styleguide

* Use Vitest for testing
* Place tests next to the files they test
* Name test files as *.test.ts or *.test.tsx
* Use descriptive test names
* Test behavior, not implementation
* Mock external dependencies
* Use beforeEach and afterEach for setup/cleanup
* Keep tests isolated and independent

## Additional Notes

### Issue and Pull Request Labels

| Label | Description |
|-------|-------------|
| bug | Something isn't working |
| enhancement | New feature or request |
| documentation | Improvements or additions to documentation |
| good first issue | Good for newcomers |
| help wanted | Extra attention is needed |
| security | Security-related issues |
| performance | Performance-related issues |
| dependencies | Dependency updates |

## Getting Started

1. Fork the repository
2. Clone your fork
3. Set up the development environment
4. Create a branch for your changes
5. Make your changes
6. Run tests
7. Commit your changes
8. Push to your fork
9. Open a pull request

Thank you for contributing to Driflly!
