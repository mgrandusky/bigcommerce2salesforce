# BigCommerce to Salesforce Integration

A comprehensive Node.js application that syncs BigCommerce orders and abandoned carts to Salesforce in real-time using webhooks.

## Features

- ✅ **Real-time Order Sync** - Automatically sync completed orders from BigCommerce to Salesforce
- ✅ **Abandoned Cart Recovery** - Track abandoned carts as Salesforce Leads
- ✅ **Secure Webhooks** - Validate webhook signatures for security
- ✅ **Automatic Retry Logic** - Handle API failures with exponential backoff
- ✅ **Comprehensive Logging** - Debug and monitor all operations
- ✅ **OAuth 2.0 Authentication** - Secure Salesforce connection
- ✅ **Data Mapping** - Transform BigCommerce data to Salesforce format
- ✅ **Duplicate Prevention** - Upsert operations to avoid duplicates

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│   BigCommerce   │ webhook │  Node.js/Express     │  API    │  Salesforce │
│   Store         ├────────>│  Integration Server  ├────────>│  CRM        │
└─────────────────┘         └──────────────────────┘         └─────────────┘
                                     │
                                     ├─ Webhook Validation
                                     ├─ Data Transformation
                                     ├─ Error Handling
                                     └─ Retry Logic
```

## Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- BigCommerce store with API access
- Salesforce account with API access
- Public URL for webhook endpoints (use ngrok for local development)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mgrandusky/bigcommerce2salesforce.git
   cd bigcommerce2salesforce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# BigCommerce Configuration
BIGCOMMERCE_CLIENT_ID=your_bigcommerce_client_id
BIGCOMMERCE_CLIENT_SECRET=your_bigcommerce_client_secret
BIGCOMMERCE_ACCESS_TOKEN=your_bigcommerce_access_token
BIGCOMMERCE_STORE_HASH=your_store_hash
BIGCOMMERCE_API_URL=https://api.bigcommerce.com

# Webhook Security
WEBHOOK_SECRET=your_webhook_secret

# Salesforce Configuration
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_salesforce_security_token
SALESFORCE_INSTANCE_URL=https://login.salesforce.com
SALESFORCE_API_VERSION=v57.0

# Logging
LOG_LEVEL=info

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000
```

## BigCommerce Setup

### 1. Create API Account

1. Log in to your BigCommerce store admin panel
2. Go to **Advanced Settings** > **API Accounts** > **Create API Account**
3. Select **Create V2/V3 API Token**
4. Set the following OAuth scopes:
   - **Orders**: `read-only` or `modify`
   - **Carts**: `read-only` or `modify`
   - **Customers**: `read-only`
5. Save the credentials:
   - Client ID → `BIGCOMMERCE_CLIENT_ID`
   - Client Secret → `BIGCOMMERCE_CLIENT_SECRET`
   - Access Token → `BIGCOMMERCE_ACCESS_TOKEN`
6. Your store hash is in the URL: `store-{hash}.mybigcommerce.com`

### 2. Generate Webhook Secret

Generate a random secret for webhook validation:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this as `WEBHOOK_SECRET` in your `.env` file.

### 3. Register Webhooks

After starting the server, webhooks need to be registered with BigCommerce. You can do this via the BigCommerce API or admin panel.

**Using BigCommerce API:**

```bash
# Register order webhook
curl -X POST https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H "X-Auth-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "store/order/statusUpdated",
    "destination": "https://your-domain.com/webhooks/orders",
    "is_active": true
  }'

# Register abandoned cart webhook
curl -X POST https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H "X-Auth-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "store/cart/abandoned",
    "destination": "https://your-domain.com/webhooks/carts/abandoned",
    "is_active": true
  }'
```

**Webhook Scopes:**
- `store/order/created` - New order created
- `store/order/updated` - Order updated
- `store/order/statusUpdated` - Order status changed
- `store/cart/abandoned` - Cart abandoned

## Salesforce Setup

### 1. Create Connected App

1. Log in to Salesforce
2. Go to **Setup** > **Apps** > **App Manager**
3. Click **New Connected App**
4. Fill in the details:
   - **Connected App Name**: BigCommerce Integration
   - **API Name**: BigCommerce_Integration
   - **Contact Email**: your email
5. Enable OAuth Settings:
   - **Callback URL**: `https://login.salesforce.com/services/oauth2/callback`
   - **Selected OAuth Scopes**:
     - Full access (full)
     - Manage user data via APIs (api)
     - Perform requests at any time (refresh_token, offline_access)
6. Save and note:
   - Consumer Key → `SALESFORCE_CLIENT_ID`
   - Consumer Secret → `SALESFORCE_CLIENT_SECRET`

### 2. Get Security Token

1. Go to **Settings** > **Personal** > **Reset My Security Token**
2. Check your email for the security token
3. Add to `SALESFORCE_SECURITY_TOKEN` in `.env`

### 3. Configure Salesforce Objects

The integration uses standard Salesforce objects:

**For Orders:**
- **Account** - Customer account
- **Contact** - Customer contact
- **Order** - Order details

**For Abandoned Carts:**
- **Lead** - Abandoned cart as a sales lead

**Optional: Custom Fields**

You can add custom fields to store additional BigCommerce data:

```
Order Object:
- BigCommerceOrderId__c (Text)
- Subtotal__c (Currency)
- TaxTotal__c (Currency)
- ShippingTotal__c (Currency)

Lead Object:
- AbandonedCartValue__c (Currency)
- AbandonedCartId__c (Text)
- AbandonedCartDate__c (DateTime)
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This uses nodemon to auto-restart on file changes.

### Production Mode

```bash
npm start
```

### Using Docker (Optional)

```bash
docker build -t bigcommerce-salesforce .
docker run -p 3000:3000 --env-file .env bigcommerce-salesforce
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and Salesforce connection state.

### Webhook Endpoints

#### Order Webhook
```
POST /webhooks/orders
```

Receives order created/updated webhooks from BigCommerce.

**Expected payload:**
```json
{
  "scope": "store/order/created",
  "store_id": "1025646",
  "data": {
    "type": "order",
    "id": 250
  },
  "hash": "dd70c0976e06b67aaf672594f8b2e3d3"
}
```

#### Abandoned Cart Webhook
```
POST /webhooks/carts/abandoned
```

Receives abandoned cart webhooks from BigCommerce.

**Expected payload:**
```json
{
  "scope": "store/cart/abandoned",
  "store_id": "1025646",
  "data": {
    "type": "cart",
    "id": "09346f8b-d3b0-4c74-b4b9-8c5b6f2e7a42"
  },
  "hash": "dd70c0976e06b67aaf672594f8b2e3d3"
}
```

## Data Mapping

### Order to Salesforce

| BigCommerce | Salesforce Order |
|-------------|------------------|
| Order ID | OrderNumber |
| Total | TotalAmount |
| Order Date | EffectiveDate |
| Billing Address | BillingStreet, BillingCity, BillingState, BillingPostalCode |
| Shipping Address | ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode |
| Customer | Account + Contact |

### Abandoned Cart to Salesforce

| BigCommerce | Salesforce Lead |
|-------------|-----------------|
| Customer Email | Email |
| Customer Name | FirstName, LastName |
| Cart Items | Description |
| Cart Value | (Custom field) |
| Cart ID | (Custom field) |

## Error Handling

The integration includes comprehensive error handling:

1. **Webhook Validation Errors** - Returns 401 if signature is invalid
2. **API Errors** - Automatically retries with exponential backoff
3. **Data Mapping Errors** - Logs error and returns 500
4. **Salesforce Authentication Errors** - Re-authenticates automatically

## Logging

Logs are written to:
- Console (always)
- `logs/combined.log` (production only)
- `logs/error.log` (production only, errors only)

Log levels: `error`, `warn`, `info`, `debug`

Set `LOG_LEVEL` environment variable to control verbosity.

## Testing

### Local Testing with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start the server: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Use the ngrok URL for webhook registration

### Manual Webhook Testing

```bash
# Test webhook endpoint (development only)
curl -X POST http://localhost:3000/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Deployment

### Heroku

1. Create Heroku app: `heroku create`
2. Set environment variables: `heroku config:set KEY=value`
3. Deploy: `git push heroku main`
4. Scale: `heroku ps:scale web=1`

### AWS/GCP/Azure

Deploy as a standard Node.js application. Ensure:
- Environment variables are configured
- Port is configurable
- Logs are accessible
- SSL/HTTPS is enabled

### Environment-Specific Configuration

For production:
- Set `NODE_ENV=production`
- Use secure `WEBHOOK_SECRET`
- Enable HTTPS
- Configure proper logging
- Set up monitoring/alerts

## Troubleshooting

### Webhooks Not Received

1. Check webhook registration in BigCommerce
2. Verify public URL is accessible
3. Check firewall/security group rules
4. Verify webhook secret matches
5. Check server logs for errors

### Salesforce Authentication Failed

1. Verify username and password
2. Check security token (reset if needed)
3. Verify IP restrictions in Salesforce
4. Check Connected App permissions
5. Ensure OAuth scopes are correct

### Orders Not Syncing

1. Check order status (only completed orders sync)
2. Verify BigCommerce API credentials
3. Check Salesforce account/contact creation
4. Review logs for specific errors
5. Test with manual webhook payload

### Duplicate Records

The integration uses upsert operations to prevent duplicates:
- Accounts/Contacts are matched by email
- Leads are matched by email and status
- Orders are created new each time

## Project Structure

```
.
├── src/
│   ├── config/
│   │   └── index.js              # Configuration management
│   ├── middleware/
│   │   ├── errorHandler.js       # Error handling middleware
│   │   └── webhookValidator.js   # Webhook validation
│   ├── services/
│   │   ├── bigcommerce.js        # BigCommerce API client
│   │   └── salesforce.js         # Salesforce API client
│   ├── utils/
│   │   ├── logger.js             # Winston logger setup
│   │   └── mapper.js             # Data transformation utilities
│   ├── webhooks/
│   │   └── bigcommerce.js        # Webhook handlers
│   └── server.js                 # Express app and server
├── examples/
│   ├── order-webhook-payload.json
│   └── abandoned-cart-webhook-payload.json
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Security Considerations

1. **Webhook Validation** - All webhooks are validated using HMAC signatures
2. **Environment Variables** - Sensitive data stored in `.env`, never committed
3. **HTTPS** - Use HTTPS in production for all communications
4. **API Tokens** - Store securely, rotate regularly
5. **Error Messages** - Don't leak sensitive information in error responses
6. **Rate Limiting** - Consider adding rate limiting for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Check the Troubleshooting section
- Review server logs
- Open a GitHub issue

## Changelog

### Version 1.0.0
- Initial release
- Order sync functionality
- Abandoned cart sync functionality
- Webhook validation
- Retry logic
- Comprehensive logging
- Salesforce OAuth 2.0 authentication
