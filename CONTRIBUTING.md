# Contributing to ReactFlow

Thank you for your interest in contributing to ReactFlow! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/reactflow.git
   cd reactflow
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. Make your changes
2. Run tests to ensure everything works:
   ```bash
   npm test
   # or
   yarn test
   ```
3. Run linting to ensure code quality:
   ```bash
   npm run lint
   # or
   yarn lint
   ```
4. Build the project to ensure it compiles correctly:
   ```bash
   npm run build
   # or
   yarn build
   ```
5. Run the examples to test your changes in a real application:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Pull Request Process

1. Update the README.md and/or USAGE_GUIDE.md with details of changes if appropriate
2. Update the tests if necessary
3. Ensure all tests pass and linting passes
4. Submit a pull request to the main repository

## Coding Standards

- Follow the existing code style
- Write tests for new features
- Keep pull requests focused on a single topic
- Document new functions, classes, and components
- Use meaningful commit messages

## Adding New Features

When adding new features, please consider the following:

1. Does this feature align with the library's philosophy?
2. Is it generally useful for most users?
3. Can it be implemented without significantly increasing the bundle size?
4. Is it well-tested?
5. Does it provide migration paths from other libraries if applicable?

## Migration Guides

ReactFlow aims to make it easy for users to migrate from other state management libraries. When contributing to migration guides:

1. Ensure examples are clear and show equivalent code patterns
2. Cover basic usage, component integration, middleware, and async patterns
3. Highlight ReactFlow's advantages without disparaging other libraries
4. Test migration examples to ensure they work as expected
5. Consider common patterns from the source library that users might need to migrate

## Reporting Bugs

When reporting bugs, please include:

- A clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (browser, OS, React version, etc.)
- Code samples or test cases if possible

## Feature Requests

Feature requests are welcome. Please provide:

- A clear description of the feature
- The motivation for adding this feature
- Examples of how it would be used

## Documentation

Improvements to documentation are always welcome. This includes:

- Fixing typos
- Improving explanations
- Adding examples
- Updating API documentation

## License

By contributing to ReactFlow, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).