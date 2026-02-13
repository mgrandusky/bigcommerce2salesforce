# Contributing to BigCommerce to Salesforce Integration

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Relevant logs (sanitize sensitive data)

### Suggesting Features

1. Check if the feature has been suggested
2. Open a new issue with:
   - Clear use case description
   - Expected behavior
   - Potential implementation approach
   - Benefits and impact

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/mgrandusky/bigcommerce2salesforce.git
   cd bigcommerce2salesforce
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm install
   npm start
   # Test functionality manually
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub.

## Development Guidelines

### Code Style

- Use ES6+ JavaScript features
- Follow existing naming conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

### Project Structure

```
src/
├── config/          # Configuration management
├── middleware/      # Express middleware
├── services/        # API clients (BigCommerce, Salesforce)
├── utils/          # Utilities (logger, mapper)
├── webhooks/       # Webhook handlers
└── server.js       # Main application entry point
```

### Logging

Use the Winston logger for all logging:

```javascript
const logger = require('./utils/logger');

logger.info('Information message', { context: 'value' });
logger.warn('Warning message', { context: 'value' });
logger.error('Error message', { error: error.message });
```

### Error Handling

Always handle errors gracefully:

```javascript
try {
  // Your code
} catch (error) {
  logger.error('Error description', { error: error.message });
  throw error; // or return error response
}
```

### Async/Await

Use async/await for asynchronous operations:

```javascript
async function myFunction() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed', { error: error.message });
    throw error;
  }
}
```

## Testing

### Manual Testing

1. Set up test environment with test credentials
2. Start the server in development mode
3. Use ngrok to expose local server
4. Register webhooks pointing to ngrok URL
5. Trigger events in BigCommerce
6. Verify data in Salesforce

### Test Checklist

- [ ] Configuration validation works
- [ ] Salesforce authentication succeeds
- [ ] Webhook signature validation works
- [ ] Order webhook creates records in Salesforce
- [ ] Abandoned cart webhook creates leads
- [ ] Retry logic works on failures
- [ ] Logging captures important events
- [ ] Error handling works correctly

## Documentation

Update documentation when:
- Adding new features
- Changing configuration options
- Modifying API endpoints
- Updating dependencies
- Fixing bugs

Files to update:
- `README.md` - Main documentation
- `API.md` - API documentation
- `QUICKSTART.md` - Quick start guide
- Code comments - Inline documentation

## Commit Message Guidelines

Use conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(webhooks): add support for order refund events
fix(mapper): correct abandoned cart value calculation
docs(readme): update Salesforce setup instructions
```

## Adding New Features

### Adding a New Webhook Handler

1. Add handler function in `src/webhooks/bigcommerce.js`
2. Map webhook in `src/server.js`
3. Add example payload in `examples/`
4. Update API documentation
5. Update README with new webhook scope

### Adding New Salesforce Objects

1. Create mapping function in `src/utils/mapper.js`
2. Add service method in `src/services/salesforce.js`
3. Update webhook handler to use new mapping
4. Document custom field requirements
5. Update README with setup instructions

### Adding New Configuration Options

1. Add to `.env.example`
2. Update `src/config/index.js`
3. Document in README
4. Update validation if required

## Getting Help

- Review existing code and documentation
- Ask questions in GitHub Discussions
- Open an issue for clarification
- Reach out to maintainers

## Security

- Never commit sensitive data (credentials, tokens)
- Always validate webhook signatures
- Use environment variables for secrets
- Follow security best practices
- Report security issues privately

## Review Process

1. Automated checks will run on your PR
2. Maintainer will review code and provide feedback
3. Address any requested changes
4. Once approved, PR will be merged
5. Your contribution will be acknowledged

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).

## Questions?

Feel free to:
- Open a GitHub issue
- Start a discussion
- Contact the maintainers

Thank you for contributing! 🎉
