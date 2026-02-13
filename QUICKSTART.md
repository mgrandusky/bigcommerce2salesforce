# Quick Start Guide

Get the BigCommerce to Salesforce integration up and running in 5 minutes.

## Prerequisites

- Node.js 16+ installed
- BigCommerce store with API access
- Salesforce account with API access
- A public URL for webhooks (use ngrok for local testing)

## Step 1: Install

```bash
git clone https://github.com/mgrandusky/bigcommerce2salesforce.git
cd bigcommerce2salesforce
npm install
```

## Step 2: Configure

```bash
cp .env.example .env
```

Edit `.env` and set your credentials:

```env
# BigCommerce (get from Advanced Settings > API Accounts)
BIGCOMMERCE_CLIENT_ID=your_client_id
BIGCOMMERCE_CLIENT_SECRET=your_client_secret
BIGCOMMERCE_ACCESS_TOKEN=your_access_token
BIGCOMMERCE_STORE_HASH=your_store_hash

# Generate webhook secret
WEBHOOK_SECRET=use_crypto_random_bytes_here

# Salesforce (get from Setup > Apps > App Manager)
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_salesforce_token
```

**Generate Webhook Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Start the Server

```bash
npm start
```

The server will start on port 3000 by default.

## Step 4: Expose Webhook URL (Local Testing)

If testing locally, use ngrok:

```bash
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

## Step 5: Register Webhooks

Use the built-in registration tool:

```bash
npm run webhooks
```

Or register manually via BigCommerce API:

```bash
# Order webhook
curl -X POST https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H "X-Auth-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "store/order/statusUpdated",
    "destination": "https://your-domain.com/webhooks/orders",
    "is_active": true
  }'

# Abandoned cart webhook
curl -X POST https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H "X-Auth-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "store/cart/abandoned",
    "destination": "https://your-domain.com/webhooks/carts/abandoned",
    "is_active": true
  }'
```

## Step 6: Test

### Check Server Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "salesforceConnected": true
}
```

### Trigger a Test Order

1. Create a test order in BigCommerce
2. Check server logs for sync activity
3. Verify order appears in Salesforce

### Check Logs

```bash
tail -f logs/combined.log
```

## Common Issues

### Salesforce Authentication Failed

**Solution:** Verify credentials and security token. Reset security token in Salesforce if needed.

### Webhooks Not Received

**Solution:** 
- Check that webhook URL is publicly accessible
- Verify webhook is registered in BigCommerce
- Check webhook secret matches

### Port Already in Use

**Solution:** Change port in `.env`:
```env
PORT=3001
```

## Next Steps

- Review [README.md](./README.md) for comprehensive documentation
- Check [API.md](./API.md) for API documentation
- Customize data mapping in `src/utils/mapper.js`
- Configure custom Salesforce fields if needed
- Deploy to production (Heroku, AWS, etc.)

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong webhook secret
- [ ] Enable HTTPS
- [ ] Configure proper logging
- [ ] Set up monitoring/alerts
- [ ] Configure firewall rules
- [ ] Test with production credentials
- [ ] Set up automated backups

## Need Help?

- Review the [Troubleshooting Guide](./README.md#troubleshooting) in README
- Check server logs for detailed error messages
- Open a GitHub issue with logs and error details

## Quick Commands Reference

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Register webhooks
npm run webhooks

# View logs (production)
tail -f logs/combined.log
tail -f logs/error.log

# Test health endpoint
curl http://localhost:3000/health

# Docker deployment
docker-compose up -d
docker-compose logs -f
```

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│   BigCommerce   │ webhook │  Node.js/Express     │  API    │  Salesforce │
│   Store         ├────────>│  Integration Server  ├────────>│  CRM        │
└─────────────────┘         └──────────────────────┘         └─────────────┘
```

**Data Flow:**
1. Order completed in BigCommerce
2. BigCommerce sends webhook to integration server
3. Server validates webhook signature
4. Server fetches full order details from BigCommerce API
5. Server transforms data to Salesforce format
6. Server creates/updates Account, Contact, and Order in Salesforce
7. Success response sent back to BigCommerce

**For Abandoned Carts:**
1. Cart abandoned in BigCommerce
2. BigCommerce sends webhook
3. Server fetches cart details
4. Server creates Lead in Salesforce with cart details
5. Sales team can follow up on abandoned cart leads
