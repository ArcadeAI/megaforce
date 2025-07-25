# Megaforce Testing Suite

This directory contains comprehensive tests for the Megaforce project, covering all agents and API endpoints.

## Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Shared test fixtures and configuration
├── test_common_utils.py        # Tests for common utility functions
├── test_parser_agent.py        # Tests for X/Twitter parser agent
├── test_posting_agent.py       # Tests for X/Twitter posting agent
├── test_api_endpoints.py       # Tests for FastAPI endpoints
├── test_integration.py         # End-to-end integration tests
├── requirements-test.txt       # Testing dependencies
└── README.md                   # This file

### Real Integration Tests
- `test_real_integration.py` - Complete real API testing with actual Arcade calls
- `test_real_api.py` - FastAPI endpoint testing with real application
- `test_parser_agent.py` - Lightweight schema validation tests
- `test_style_agent.py` - Style transfer and content generation tests

## Quick Start

### Environment Setup
Set these environment variables in your `.env` file:

```bash
ARCADE_API_KEY=your_arcade_api_key
USER_ID=your_user_id
ARCADE_PROVIDER_ID=x
```

### Run All Tests
```bash
# Run the complete real test suite
python tests/run_real_tests.py

# Run specific test files
uv run pytest tests/test_real_integration.py -v
uv run pytest tests/test_real_api.py -v
uv run pytest tests/test_parser_agent.py -v
```

### Run Posting Tests (Creates Real Tweets!)
```bash
# Run with explicit confirmation - creates real tweets
python tests/run_real_tests.py --posting
```

## Test Philosophy

### Real Testing Approach
- **No Mocking**: Uses actual Arcade API and FastAPI endpoints
- **Credential-Based**: Automatically skips tests if no API credentials
- **Safe Posting**: Posting tests require explicit confirmation and auto-cleanup
- **Environment-Aware**: Uses your actual `.env` configuration

### Test Coverage
- ✅ **Parser Agent**: Real Twitter/X search functionality
- ✅ **Posting Agent**: Real tweet posting and deletion (optional)
- ✅ **Style Agent**: Content generation and style transfer with LLMs
- ✅ **API Endpoints**: All FastAPI Twitter endpoints
- ✅ **Authorization**: Real Arcade OAuth flow
- ✅ **Error Handling**: Actual failure scenarios
- ✅ **Schema Validation**: Input/output data structures

## Safety Features

- **Credential Checks**: Tests skip gracefully without API keys
- **Posting Safeguards**: Real posting tests require explicit confirmation
- **Auto-Cleanup**: Test tweets are automatically deleted
- **Clear Marking**: Test tweets are clearly marked as automated tests

## Troubleshooting

### Missing Credentials
1. **Import Errors**: Ensure project root is in Python path
2. **Async Errors**: Use `@pytest.mark.asyncio` for async tests
3. **Mock Issues**: Verify mock patches target the correct modules
4. **Coverage Issues**: Check that all modules are included in coverage config

### Debug Mode
```bash
# Run tests with detailed output
pytest tests/ -v -s --tb=long

# Run specific test with debugging
pytest tests/test_parser_agent.py::TestParserAgent::test_get_content_success -v -s
```

## Test Data

### Sample Data
- **Tweet Data**: Realistic but fake tweet data for testing
- **User Data**: Test user accounts and credentials
- **API Responses**: Mocked API responses matching real Arcade responses

### Fixtures
- `mock_arcade_client`: Mocked Arcade client with successful responses
- `sample_tweet_data`: Sample tweet data for testing
- `sample_input_schema`: Valid InputSchema for parser tests
- `test_environment_vars`: Test environment variables

## Contributing

When adding new features:
1. **Write Tests First**: Follow TDD principles
2. **Test All Paths**: Cover success, failure, and edge cases
3. **Update Coverage**: Maintain high test coverage
4. **Document Tests**: Add clear docstrings to test functions
5. **Run Full Suite**: Ensure all tests pass before committing
