# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-02-13

### Added - Enterprise Features 🚀

#### Advanced Order Management
- **Order Line Items** - Detailed OrderItem records with product information
- **Payment Transaction Details** - Track payment method and transaction IDs
- **Tax & Shipping Breakdown** - Separate tracking of subtotal, tax, and shipping
- **Fulfillment Status** - Track orders with tracking numbers
- Enhanced order data mapping with custom Salesforce fields support

#### Customer Intelligence & Analytics
- **Customer Lifetime Value (CLV)** - Automatic calculation and real-time tracking
- **Customer Segmentation** - 4-tier system (Bronze, Silver, Gold, Platinum) based on spend
- **RFM Analysis** - Behavioral scoring (Recency, Frequency, Monetary) with "555" format
- **Automatic Customer Tagging** - VIP, First-Time Buyer, At-Risk based on behavior
- **Real-time Analytics Updates** - Analytics recalculated on each order
- **Average Order Value** - Automatic calculation per account
- **Last Order Date Tracking** - Maintained on Account and Contact

#### Smart Cart Recovery
- **High-Value Opportunity Creation** - Create opportunities for carts ≥ $100 (configurable)
- **Low-Value Lead Creation** - Create leads for carts below threshold
- **Automatic Follow-up Tasks** - Recovery tasks with priority based on cart value
- **Cart Expiration Logic** - Auto-close opportunities after 30 days (configurable)
- **Value-Based Routing** - Smart routing based on configurable thresholds

#### Sales Process Automation
- **Platform Events Publishing** - Event-driven architecture support:
  - `BigCommerce_Order_Created__e`
  - `BigCommerce_Order_Updated__e`
  - `BigCommerce_Order_Shipped__e`
  - `BigCommerce_Cart_Abandoned__e`
- Enables Process Builder, Flow, and Apex trigger integrations

#### Data Quality & Governance
- **Comprehensive Audit Trail** - Log all sync operations
- **Operation Tracking** - Track success/failure, duration, errors
- **Field History Tracking** - Support documentation for key fields
- **Sync Operation Logging** - Complete visibility into all operations

### Added - Configuration & Flexibility

#### Feature Flags System (50+ flags)
- Granular feature control via environment variables
- No code changes required to enable/disable features
- Per-feature configuration for optimal performance
- Default configurations for common scenarios

#### Configuration Management
- **Configurable Thresholds**:
  - Customer tier thresholds ($1K Silver, $5K Gold, $10K Platinum)
  - Cart value thresholds (opportunity vs lead)
  - Cart expiration period (default 30 days)
  - Churn risk threshold (default 90 days)
- **Custom Field Mapping** - Map to your own Salesforce custom fields
- **Environment-Specific Settings** - Sandbox and production configurations

#### New Services Architecture
- `src/services/orderService.js` - Enhanced order processing with line items
- `src/services/customerAnalytics.js` - Customer intelligence and segmentation
- `src/services/cartRecovery.js` - Smart cart recovery and routing
- `src/services/platformEvents.js` - Event publishing infrastructure
- `src/services/auditLog.js` - Comprehensive audit trail management
- `src/config/features.js` - Centralized feature flag management

### Added - Documentation (60KB+ of documentation)

#### Comprehensive Setup Guides
- **Salesforce Setup Guide** (12KB) - Complete configuration walkthrough:
  - Custom objects (BC_Sync_Log__c, BC_Order_Line_Item__c)
  - Custom fields on Order, Account, Contact, Lead, Opportunity
  - Platform Events definitions
  - Connected App setup
  - Permission Sets configuration
  - Reports and Dashboards setup
  - Validation Rules examples
  - Field History Tracking setup

#### Feature Documentation
- **Features Guide** (12KB) - Detailed feature documentation:
  - Configuration examples
  - Feature flag descriptions
  - Performance considerations
  - Optimization tips
  - Integration patterns

#### Technical Documentation
- **Field Mapping Reference** (16KB) - Complete mapping documentation:
  - BigCommerce to Salesforce field mappings
  - Data type conversions
  - Status mappings
  - Default values
  - Validation rules
  - External ID fields

- **Architecture Guide** (18KB) - Technical architecture:
  - System overview and diagrams
  - Component descriptions
  - Data flow documentation
  - Error handling strategies
  - Performance optimization
  - Scalability considerations
  - Security best practices
  - Monitoring and observability

### Enhanced - Core Services

#### Salesforce Service Enhancements
- `createRecord()` - Generic record creation method
- `updateRecord()` - Generic record update method
- `createBulk()` - Bulk record creation (multiple records at once)
- `updateBulk()` - Bulk record updates (multiple records at once)
- `upsertRecord()` - Upsert with external ID field support

#### Webhook Handler Enhancements
- Integrated customer analytics updates
- Added platform event publishing
- Implemented audit logging
- Added feature flag checks
- Enhanced error handling and reporting

### Changed

#### Data Mapping
- Enhanced order mapping with all custom fields
- Improved customer data extraction with better defaults
- Added customer analytics calculations
- Better handling of missing/null data

#### Error Handling
- More detailed error messages
- Better error categorization
- Comprehensive error logging
- Improved retry logic feedback

### Environment Variables

#### New Configuration (50+ new variables)
- Feature flags for all enterprise features
- Customer tier thresholds
- Cart value thresholds
- Custom field API name mappings
- Expiration and risk period thresholds

See `.env.example` for complete list and descriptions.

### Technical Improvements

#### Architecture
- Modular service-based architecture
- Clear separation of concerns
- Dependency injection pattern
- Extensible plugin architecture
- Event-driven design patterns

#### Performance
- Bulk operation support for line items
- Efficient API usage (3-6 calls per order, 1-4 per cart)
- Stateless design for horizontal scaling
- Connection pooling and reuse
- Optimized query patterns

#### Code Quality
- Comprehensive inline documentation
- Consistent error handling
- Feature flag pattern implementation
- Modular and testable code structure
- Detailed logging at all levels

### Security
- Maintained HMAC webhook signature validation
- OAuth 2.0 authentication with auto-refresh
- Secure credential management
- Security best practices documentation
- Permission set configurations

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

[2.0.0]: https://github.com/mgrandusky/bigcommerce2salesforce/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/mgrandusky/bigcommerce2salesforce/releases/tag/v1.0.0

