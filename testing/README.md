# Testing Directory Structure

This directory contains all testing-related files organized for better project readability and maintainability.

## Directory Structure

```
testing/
├── unit-tests/          # Unit tests (.test.ts, .spec.ts files)
├── integration-tests/   # Integration and API tests
├── scripts/            # Testing scripts and automation
├── manual-tests/       # Manual testing files (HTML, etc.)
├── mock-servers/       # Mock servers and related files
├── debug-tools/        # Debug utilities and tools
├── data/              # Test data and fixtures
└── README.md          # This file
```

## Directory Descriptions

### `unit-tests/`
Contains formal unit tests using testing frameworks like Jest.
- `*.test.ts` - TypeScript unit tests
- `*.spec.ts` - Specification tests

### `integration-tests/`
Contains integration tests that test multiple components together.
- API integration tests
- End-to-end workflow tests
- Cross-service communication tests

### `scripts/`
Contains automated testing scripts and utilities.
- Token testing scripts
- Concurrent testing scripts
- Load testing scripts
- Test setup and teardown scripts

### `manual-tests/`
Contains files for manual testing.
- HTML test pages
- Manual test procedures
- Interactive testing tools

### `mock-servers/`
Contains mock servers and related configuration.
- WebSocket mock servers
- API mock servers
- Server configuration files

### `debug-tools/`
Contains debugging utilities and tools.
- Debug scripts
- Diagnostic tools
- Development utilities

### `data/`
Contains test data, fixtures, and test configurations.
- Test user data
- Mock data files
- Test configuration files

## Usage

### Running Unit Tests
```bash
# From project root
npm test
# or
jest testing/unit-tests/
```

### Running Testing Scripts
```bash
# From project root
node testing/scripts/[script-name].js
```

### Using Manual Tests
Open HTML files in `manual-tests/` directory in a browser for interactive testing.

## Migration Notes

All testing files have been moved from their original locations:
- `__tests__/` → `testing/unit-tests/`
- `scripts/` (testing files) → `testing/scripts/`
- Root test files → `testing/integration-tests/`
- `public/test-*.html` → `testing/manual-tests/`
- Mock servers → `testing/mock-servers/`
- `test-data/` → `testing/data/`

## Configuration Updates

Package.json scripts have been updated to reflect the new file locations.
