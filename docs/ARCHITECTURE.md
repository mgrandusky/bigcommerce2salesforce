# Architecture Guide

This document describes the technical architecture of the BigCommerce to Salesforce integration.

## System Overview

```
┌─────────────────────┐         ┌──────────────────────────┐         ┌─────────────────┐
│   BigCommerce       │ Webhook │  Node.js/Express         │  API    │   Salesforce    │
│   E-commerce        ├────────>│  Integration Server      ├────────>│   CRM Platform  │
│   Platform          │         └──────────────────────────┘         └─────────────────┘
└─────────────────────┘                     │
                                           ├─ Webhook Validation
                                           ├─ Data Transformation
                                           ├─ Feature Management
                                           ├─ Customer Analytics
                                           ├─ Error Handling
                                           ├─ Retry Logic
                                           ├─ Audit Logging
                                           └─ Platform Events
```

## Technology Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)

### External Services
- **BigCommerce API**: RESTful API (v2/v3)
- **Salesforce API**: REST API via jsforce
- **OAuth 2.0**: Salesforce authentication

### Key Libraries
- `express` - Web framework
- `jsforce` - Salesforce integration
- `axios` - HTTP client for BigCommerce API
- `winston` - Logging
- `dotenv` - Environment configuration

## Application Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│             API Layer (Express)                 │
│  - Webhook endpoints                            │
│  - Request validation                           │
│  - Error handling middleware                    │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│           Business Logic Layer                  │
│  - Webhook handlers                             │
│  - Order processing                             │
│  - Cart recovery                                │
│  - Customer analytics                           │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│            Service Layer                        │
│  - BigCommerce Service                          │
│  - Salesforce Service                           │
│  - Order Service                                │
│  - Customer Analytics Service                   │
│  - Cart Recovery Service                        │
│  - Platform Events Service                      │
│  - Audit Log Service                            │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│           Utility Layer                         │
│  - Data mapping                                 │
│  - Logging                                      │
│  - Configuration management                     │
│  - Feature flags                                │
└─────────────────────────────────────────────────┘
```

## Directory Structure

```
bigcommerce2salesforce/
├── src/
│   ├── config/              # Configuration management
│   │   ├── index.js         # Main config (env vars)
│   │   └── features.js      # Feature flags & thresholds
│   │
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js  # Error handling
│   │   └── webhookValidator.js # Webhook signature validation
│   │
│   ├── services/            # Business logic services
│   │   ├── bigcommerce.js   # BigCommerce API client
│   │   ├── salesforce.js    # Salesforce API client
│   │   ├── orderService.js  # Order processing
│   │   ├── customerAnalytics.js # Customer intelligence
│   │   ├── cartRecovery.js  # Cart recovery logic
│   │   ├── platformEvents.js # Event publishing
│   │   └── auditLog.js      # Audit trail
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.js        # Winston logger
│   │   └── mapper.js        # Data transformation
│   │
│   ├── webhooks/            # Webhook handlers
│   │   └── bigcommerce.js   # BigCommerce webhook handlers
│   │
│   └── server.js            # Express app & server setup
│
├── docs/                    # Documentation
│   ├── SALESFORCE_SETUP.md
│   ├── FEATURES.md
│   ├── FIELD_MAPPING.md
│   └── ARCHITECTURE.md
│
├── examples/                # Example payloads
│   ├── order-webhook-payload.json
│   └── abandoned-cart-webhook-payload.json
│
├── scripts/                 # Utility scripts
│   └── register-webhooks.js
│
├── .env.example             # Environment template
├── package.json
└── README.md
```

## Core Components

### 1. Configuration Management

**Location**: `src/config/`

**Responsibilities**:
- Load and validate environment variables
- Manage feature flags
- Define thresholds and settings
- Provide configuration to services

**Key Features**:
- Feature flag system for enabling/disabling features
- Threshold configuration for business rules
- Custom field mappings for Salesforce
- Environment-based configuration

### 2. Webhook Handling

**Location**: `src/webhooks/bigcommerce.js`

**Flow**:
```
Incoming Webhook → Validation → Processing → Response
       ↓               ↓            ↓            ↓
   Signature      Extract Data   Transform    Success/Error
   Validation     from BC API     to SF       JSON Response
```

**Key Features**:
- HMAC signature validation
- Payload schema validation
- Async processing with retry logic
- Error handling and logging

### 3. Service Layer

#### BigCommerce Service
**Location**: `src/services/bigcommerce.js`

**Responsibilities**:
- API client for BigCommerce
- Fetch order details
- Fetch cart details
- Fetch customer information
- Webhook registration

**API Endpoints Used**:
- `GET /stores/{hash}/v2/orders/{id}`
- `GET /stores/{hash}/v2/orders/{id}/products`
- `GET /stores/{hash}/v3/carts/{id}`
- `GET /stores/{hash}/v3/customers?id:in={id}`

#### Salesforce Service
**Location**: `src/services/salesforce.js`

**Responsibilities**:
- OAuth 2.0 authentication
- CRUD operations on Salesforce objects
- SOQL queries
- Bulk operations
- Connection management

**Key Methods**:
- `authenticate()` - Establish connection
- `query(soql)` - Execute SOQL
- `createRecord(object, data)` - Create single record
- `updateRecord(object, data)` - Update single record
- `createBulk(object, records)` - Bulk create
- `updateBulk(object, records)` - Bulk update
- `upsertRecord(object, externalId, data)` - Upsert operation

#### Order Service
**Location**: `src/services/orderService.js`

**Responsibilities**:
- Create orders with line items
- Map order data to Salesforce format
- Handle order status updates
- Track fulfillment information

**Key Methods**:
- `createOrderWithLineItems()` - Main order creation
- `updateOrderTracking()` - Update tracking info
- `createRefund()` - Handle refunds

#### Customer Analytics Service
**Location**: `src/services/customerAnalytics.js`

**Responsibilities**:
- Calculate Customer Lifetime Value (CLV)
- Determine customer tiers
- Calculate RFM scores
- Apply customer tags
- Update analytics after each order

**Key Methods**:
- `updateCustomerAnalytics()` - Main analytics update
- `_calculateCustomerTier()` - Tier calculation
- `_calculateRFMScore()` - RFM scoring
- `_applyCustomerTags()` - Tag assignment

**Analytics Calculations**:
```javascript
// CLV Calculation
CLV = Sum of all order totals

// Customer Tier
if (CLV >= $10,000) → Platinum
else if (CLV >= $5,000) → Gold
else if (CLV >= $1,000) → Silver
else → Bronze

// RFM Score (1-5 scale for each)
Recency = Score based on days since last order
Frequency = Score based on order count
Monetary = Score based on total spend
RFM Score = "{R}{F}{M}" (e.g., "555")
```

#### Cart Recovery Service
**Location**: `src/services/cartRecovery.js`

**Responsibilities**:
- Process abandoned carts
- Create Opportunities (high value) or Leads (low value)
- Generate recovery tasks
- Expire old cart opportunities

**Key Methods**:
- `processAbandonedCart()` - Main processing
- `_createOpportunity()` - High-value carts
- `_createLead()` - Low-value carts
- `_createRecoveryTask()` - Follow-up tasks
- `expireOldOpportunities()` - Cleanup

**Decision Logic**:
```javascript
if (cartValue >= OPPORTUNITY_MIN_VALUE) {
  // Create Opportunity
  // Link to Account/Contact
  // Set stage = "Prospecting"
} else {
  // Create Lead
  // Status = "Open - Not Contacted"
}

// Always create recovery Task
// Due date = tomorrow
// Priority = High if > $500
```

#### Platform Events Service
**Location**: `src/services/platformEvents.js`

**Responsibilities**:
- Publish platform events to Salesforce
- Support event-driven architecture
- Enable external systems to subscribe

**Key Events**:
- `BigCommerce_Order_Created__e`
- `BigCommerce_Order_Updated__e`
- `BigCommerce_Order_Shipped__e`
- `BigCommerce_Cart_Abandoned__e`

#### Audit Log Service
**Location**: `src/services/auditLog.js`

**Responsibilities**:
- Log all sync operations
- Track success/failure
- Store performance metrics
- Support compliance requirements

**Log Data**:
- Operation type
- BigCommerce ID
- Salesforce ID
- Status (success/failed)
- Error details
- Timestamp
- Duration

### 4. Data Transformation

**Location**: `src/utils/mapper.js`

**Responsibilities**:
- Transform BigCommerce data to Salesforce format
- Handle data type conversions
- Apply default values
- Build descriptions

**Key Functions**:
- `mapOrderToSalesforce()` - Order transformation
- `mapCustomerData()` - Customer transformation
- `mapAbandonedCartToLead()` - Cart to Lead transformation

## Data Flow

### Order Sync Flow

```
1. BigCommerce Order Created
        ↓
2. Webhook Sent to Integration
        ↓
3. Signature Validated
        ↓
4. Fetch Full Order Details from BC API
        ↓
5. Fetch Order Products (Line Items)
        ↓
6. Map Customer Data
        ↓
7. Find/Create Account in Salesforce
        ↓
8. Find/Create Contact in Salesforce
        ↓
9. Create Order with Line Items
        ↓
10. Update Customer Analytics
    ├─ Calculate CLV
    ├─ Update Tier
    ├─ Calculate RFM
    └─ Apply Tags
        ↓
11. Publish Platform Event
        ↓
12. Log to Audit Trail
        ↓
13. Return Success Response
```

### Abandoned Cart Flow

```
1. Cart Abandoned in BigCommerce
        ↓
2. Webhook Sent to Integration
        ↓
3. Signature Validated
        ↓
4. Fetch Cart Details from BC API
        ↓
5. Fetch Customer Info (if available)
        ↓
6. Calculate Cart Value
        ↓
7. Decision: Opportunity or Lead?
   ├─ High Value (≥ $100)
   │   ├─ Find/Create Account
   │   ├─ Find/Create Contact
   │   └─ Create Opportunity
   │
   └─ Low Value (< $100)
       └─ Create Lead
        ↓
8. Create Recovery Task
        ↓
9. Publish Platform Event
        ↓
10. Log to Audit Trail
        ↓
11. Return Success Response
```

## Error Handling

### Error Handling Strategy

```
┌─────────────────────┐
│  Error Occurs       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Log Error          │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Retry Logic?       │
└──────────┬──────────┘
      Yes  │  No
      ┌────┴─────┐
      ↓          ↓
Retry with   Return Error
Exponential  Response
Backoff
```

### Retry Configuration

```javascript
MAX_RETRY_ATTEMPTS = 3
RETRY_DELAY_MS = 5000

Attempt 1: Immediate
Attempt 2: Wait 5 seconds
Attempt 3: Wait 10 seconds (5s * 2)
Attempt 4: Wait 15 seconds (5s * 3)
```

### Error Responses

**Success (200)**:
```json
{
  "success": true,
  "message": "Order synced successfully",
  "orderId": "123",
  "salesforceOrderId": "801..."
}
```

**Error (500)**:
```json
{
  "success": false,
  "error": "Failed to sync order",
  "orderId": "123",
  "message": "Detailed error message"
}
```

## Authentication & Security

### Salesforce Authentication

**Method**: OAuth 2.0 Username-Password Flow

**Process**:
```
1. Application starts
2. Call Salesforce login endpoint
3. Provide username + password + security token
4. Receive access token
5. Store connection in memory
6. Auto-refresh when needed
```

**Configuration**:
```env
SALESFORCE_USERNAME=user@example.com
SALESFORCE_PASSWORD=password
SALESFORCE_SECURITY_TOKEN=token
SALESFORCE_INSTANCE_URL=https://login.salesforce.com
```

### Webhook Security

**Method**: HMAC SHA-256 Signature Validation

**Process**:
```
1. Webhook received
2. Extract X-BC-Webhook-Signature header
3. Calculate HMAC using webhook secret
4. Compare signatures
5. Accept if match, reject if not
```

**Code**:
```javascript
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(JSON.stringify(payload));
const calculatedSignature = hmac.digest('hex');
```

## Performance Optimization

### Strategies

1. **Connection Pooling**
   - Reuse Salesforce connection
   - Auto-reconnect if session expires

2. **Bulk Operations**
   - Create multiple OrderItems in single call
   - Use bulk API for large data loads

3. **Async Processing**
   - Non-blocking webhook handlers
   - Return response immediately after validation

4. **Caching** (Future)
   - Cache product mappings
   - Cache configuration settings
   - Use Salesforce Platform Cache

5. **Retry Logic**
   - Exponential backoff
   - Configurable max attempts
   - Avoid overwhelming APIs

### API Call Optimization

**Current Implementation**:
- Order sync: 3-6 API calls
- Cart sync: 1-4 API calls

**Future Optimizations**:
- Use Composite API to batch related operations
- Implement change data capture to only sync changes
- Use streaming API for real-time updates

## Scalability Considerations

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

```
┌─────────────┐
│ Load        │
│ Balancer    │
└──────┬──────┘
       │
   ┌───┴───┐
   ↓       ↓
┌─────┐ ┌─────┐
│App 1│ │App 2│
└─────┘ └─────┘
```

**Key Points**:
- No shared state between instances
- Each instance has own Salesforce connection
- Webhook requests can be load balanced
- No session management needed

### Volume Handling

**Current Capacity** (single instance):
- ~100 orders/minute
- ~200 carts/minute
- Limited by Salesforce API limits (not application)

**Salesforce API Limits**:
- Professional: 1,000 API calls/day
- Enterprise: 25,000 API calls/day
- Unlimited: 50,000 API calls/day

**Scaling Strategy**:
1. Monitor API usage
2. Add instances as needed
3. Implement queueing for high volume
4. Use Bulk API for batch processing

## Monitoring & Observability

### Logging

**Log Levels**:
- `error`: Critical failures
- `warn`: Warnings and retries
- `info`: Normal operations
- `debug`: Detailed debugging

**Log Destinations**:
- Console (always)
- File (production): `logs/combined.log`
- Error file (production): `logs/error.log`

### Metrics to Monitor

1. **Sync Success Rate**
   - Orders synced successfully / total orders
   - Carts synced successfully / total carts

2. **API Usage**
   - Salesforce API calls per hour
   - BigCommerce API calls per hour
   - Percentage of daily limit used

3. **Performance**
   - Average sync time per order
   - Average sync time per cart
   - 95th percentile response times

4. **Errors**
   - Error rate by type
   - Failed webhooks
   - Authentication failures

### Health Checks

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "salesforceConnected": true
}
```

## Deployment

### Environment Requirements

- Node.js v16+ runtime
- Network access to BigCommerce and Salesforce
- Public URL for webhook endpoints
- SSL/TLS certificate (production)

### Deployment Options

1. **Heroku**
   - Easy deployment
   - Auto-scaling
   - Add-ons for monitoring

2. **AWS**
   - Elastic Beanstalk
   - ECS/Fargate
   - Lambda (with API Gateway)

3. **Docker**
   - Containerized deployment
   - Kubernetes orchestration
   - Multi-environment support

### Environment Variables

Required in all environments:
- BigCommerce credentials
- Salesforce credentials
- Webhook secret
- Feature flags
- Thresholds

### Health Monitoring

Recommended:
- Uptime monitoring (Pingdom, UptimeRobot)
- APM solution (New Relic, DataDog)
- Log aggregation (LogDNA, Papertrail)
- Error tracking (Sentry, Rollbar)

## Testing Strategy

### Unit Tests (Planned)
- Service methods
- Data transformation
- Configuration loading
- Error handling

### Integration Tests (Planned)
- End-to-end order sync
- End-to-end cart sync
- Webhook validation
- API error handling

### Manual Testing
- Use test webhooks endpoint
- Simulate BigCommerce webhooks
- Verify Salesforce records
- Check audit logs

## Future Enhancements

### Short-term
- Comprehensive test suite
- Bulk API support
- Product catalog sync
- Bidirectional sync

### Medium-term
- Service Cloud integration
- Campaign management
- CPQ integration
- Einstein AI features

### Long-term
- Multi-tenant support
- UI configuration panel
- Advanced analytics dashboard
- Machine learning insights

## Best Practices

### Development
1. Use feature flags for new features
2. Add comprehensive logging
3. Handle errors gracefully
4. Write modular, testable code
5. Document complex logic

### Operations
1. Monitor API usage closely
2. Review audit logs regularly
3. Set up alerts for failures
4. Rotate credentials periodically
5. Test in sandbox first

### Security
1. Never commit credentials
2. Use environment variables
3. Validate all webhook signatures
4. Implement IP restrictions
5. Encrypt sensitive data

## Support & Maintenance

### Regular Tasks
- Monitor error logs
- Review audit trail
- Check API usage
- Update dependencies
- Rotate credentials

### Troubleshooting
1. Check application logs
2. Verify connectivity
3. Review Salesforce debug logs
4. Test webhook signatures
5. Validate field mappings

### Getting Help
- Review documentation
- Check GitHub issues
- Contact support
- Community forums

## Conclusion

This architecture provides:
- ✅ Modular, maintainable codebase
- ✅ Scalable design
- ✅ Comprehensive features
- ✅ Enterprise-grade security
- ✅ Extensible framework
- ✅ Detailed observability

The system is designed to grow with your needs while maintaining reliability and performance.
