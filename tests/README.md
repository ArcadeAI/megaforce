# Megaforce Testing Suite

🚀 **API DEPLOYED & TESTED**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/

This directory contains tests for the Megaforce project. **Manual testing via API docs is recommended** for the deployed API.

## 🎯 Current Testing Status

✅ **Manual API Testing** - All endpoints tested and working  
✅ **Production Deployment** - Live on Heroku  
✅ **Authentication Flow** - JWT tokens working  
✅ **CRUD Operations** - All entities functional  
✅ **Twitter Integration** - Arcade tools operational

## Available Tests

```
tests/
├── test_production_end_to_end.py    # Complete production API testing
├── test_personas_api.py             # Persona CRUD endpoint tests
├── test_style_references_api.py     # StyleReference CRUD endpoint tests
├── test_style_agent.py              # Style transfer and content generation
├── test_password_update.py          # Password update functionality
└── README.md                        # This file
```

### Test Descriptions
- **test_production_end_to_end.py** - Comprehensive testing against live Heroku deployment
- **test_personas_api.py** - CRUD operations for persona management with authentication
- **test_style_references_api.py** - CRUD operations for style reference management
- **test_style_agent.py** - Style transfer functionality and content generation
- **test_password_update.py** - User password update and security features

## Quick Start

### Environment Setup
Set these environment variables in your `.env` file:

```bash
ARCADE_API_KEY=your_arcade_api_key
USER_ID=your_user_id
ARCADE_PROVIDER_ID=x
```

## 📝 Recommended Testing Approach

### **1. Manual API Testing (Primary)**
Use the interactive API documentation for comprehensive testing:
- **API Docs**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/docs
- **Health Check**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/health

### **2. Automated Tests (Secondary)**
For development and CI/CD:
```bash
# Run production end-to-end test
python tests/test_production_end_to_end.py

# Run specific API tests
python tests/test_personas_api.py
python tests/test_style_references_api.py
uv run pytest tests/test_style_references_api.py -v
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
