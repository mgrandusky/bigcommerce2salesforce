# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-02-13

### Added
- Initial release of BigCommerce to Salesforce integration
- Real-time order synchronization from BigCommerce to Salesforce
- Abandoned cart tracking as Salesforce Leads
- Webhook validation using HMAC signatures
- OAuth 2.0 authentication for Salesforce
- Automatic retry logic with exponential backoff
- Comprehensive logging system using Winston
- Data transformation utilities for BigCommerce to Salesforce mapping
- Express.js server with RESTful webhook endpoints
- Docker support with Dockerfile and docker-compose.yml
- Webhook registration script for easy setup
- Environment-based configuration management
- Health check endpoint for monitoring
- Error handling middleware
- Graceful shutdown handling
- Complete documentation including:
  - README with setup and deployment guides
  - API documentation
  - Quick start guide
  - Contributing guide
  - Example webhook payloads

### Security
- Timing-safe webhook signature comparison to prevent timing attacks
- Environment variable validation on startup
- Secure credential management
- No sensitive data in error responses (production mode)

### Features
- Completed order sync with customer Account/Contact creation
- Order line items and totals mapping
- Abandoned cart sync as Leads with cart details
- Duplicate prevention using upsert operations
- Configurable retry attempts and delays
- Configurable shutdown timeout
- Support for BigCommerce API v3
- Support for Salesforce API v57.0

[1.0.0]: https://github.com/mgrandusky/bigcommerce2salesforce/releases/tag/v1.0.0
