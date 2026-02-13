# Troubleshooting Guide

This guide helps diagnose and resolve common issues with the BigCommerce to Salesforce integration.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Authentication Issues](#authentication-issues)
3. [Webhook Issues](#webhook-issues)
4. [Data Sync Issues](#data-sync-issues)
5. [Performance Issues](#performance-issues)
6. [Configuration Issues](#configuration-issues)
7. [Salesforce Issues](#salesforce-issues)
8. [BigCommerce Issues](#bigcommerce-issues)
9. [Debugging Tips](#debugging-tips)
10. [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check

**Check if the server is running:**
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "salesforceConnected": true
}
```

**If `salesforceConnected` is `false`:**
- Check Salesforce credentials
- Verify security token
- Check network connectivity

### Log Review

**Check recent logs:**
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

**Look for:**
- Authentication errors
- API errors
- Webhook validation failures
- Data mapping errors

## Authentication Issues

### Issue: "Salesforce authentication failed"

**Symptoms:**
- Server starts but shows authentication error
- `salesforceConnected: false` in health check
- Error: "Login failed"

**Causes & Solutions:**

1. **Incorrect Password**
   ```
   Error: "INVALID_LOGIN: Invalid username, password, security token"
   ```
   **Solution:**
   - Verify `SALESFORCE_USERNAME` is correct
   - Verify `SALESFORCE_PASSWORD` is correct
   - Ensure no extra spaces in credentials

2. **Missing or Incorrect Security Token**
   ```
   Error: "INVALID_LOGIN: Invalid username, password, security token"
   ```
   **Solution:**
   - Get new security token: Salesforce → Settings → Reset My Security Token
   - Update `SALESFORCE_SECURITY_TOKEN` in `.env`
   - Note: Token is appended to password automatically by the integration

3. **IP Restriction**
   ```
   Error: "Login restricted"
   ```
   **Solution:**
   - In Salesforce Connected App, set "IP Relaxation" to "Relax IP restrictions"
   - OR add server IP to trusted IP ranges
   - For development, use "Relax IP restrictions"

4. **Incorrect Instance URL**
   ```
   Error: "Connection refused" or "ENOTFOUND"
   ```
   **Solution:**
   - Verify `SALESFORCE_INSTANCE_URL`
   - Use `https://login.salesforce.com` for production
   - Use `https://test.salesforce.com` for sandbox
   - Don't use your custom domain URL

5. **API Access Not Enabled**
   ```
   Error: "API access not enabled"
   ```
   **Solution:**
   - Verify user has "API Enabled" permission
   - Check Profile or Permission Set
   - Contact Salesforce admin

### Issue: "Session expired"

**Symptoms:**
- Integration works initially, then stops
- Error: "Session expired or invalid"

**Solution:**
- The integration auto-refreshes sessions
- If persists, check Salesforce session timeout settings
- Verify Connected App refresh token policy
- Restart the integration server

## Webhook Issues

### Issue: "Webhooks not being received"

**Symptoms:**
- Orders created in BigCommerce but not in Salesforce
- No logs showing webhook received
- Webhook endpoint returns no response

**Diagnosis:**
```bash
# Check if server is running
curl http://your-domain.com/health

# Test webhook endpoint
curl -X POST http://your-domain.com/webhooks/orders \
  -H "Content-Type: application/json" \
  -d '{"scope":"store/order/created","data":{"id":123}}'
```

**Causes & Solutions:**

1. **Server Not Accessible**
   - Check firewall rules
   - Verify port is open (default: 3000)
   - Ensure public URL is correct
   - For local dev, use ngrok: `ngrok http 3000`

2. **Webhooks Not Registered**
   - Check BigCommerce webhook configuration
   - Re-register webhooks using script:
     ```bash
     npm run webhooks
     ```
   - Verify webhook destination URL is correct

3. **Wrong Endpoint**
   - Orders: `/webhooks/orders`
   - Carts: `/webhooks/carts/abandoned`
   - Check BigCommerce webhook destination

### Issue: "Webhook signature validation failed"

**Symptoms:**
- Error: "Invalid webhook signature"
- Webhooks rejected with 401 status
- Logs show "Webhook validation failed"

**Causes & Solutions:**

1. **Incorrect Webhook Secret**
   - Verify `WEBHOOK_SECRET` matches BigCommerce
   - Secret is case-sensitive
   - No extra spaces or quotes
   - Generate new secret if needed:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

2. **Body Already Parsed**
   - Ensure Express.json() middleware is before webhook routes
   - Don't parse body twice

### Issue: "Webhook received but nothing happens"

**Symptoms:**
- Webhook logged as received
- But no Salesforce records created
- No errors in logs

**Diagnosis:**
```bash
# Check logs for webhook processing
grep "Processing order webhook" logs/combined.log
grep "Successfully synced" logs/combined.log
```

**Causes & Solutions:**

1. **Order Status Not Eligible**
   - Only processes orders with status:
     - Completed
     - Shipped
     - Awaiting Shipment
   - Check order status in BigCommerce
   - Update allowed statuses if needed

2. **Feature Flags Disabled**
   - Check `.env` file for disabled features
   - Enable necessary features

3. **API Errors**
   - Check error logs
   - Verify Salesforce API limits not exceeded
   - Check BigCommerce API credentials

## Data Sync Issues

### Issue: "Order created but no line items"

**Symptoms:**
- Order record exists in Salesforce
- But no OrderItem records
- Or no custom line item records

**Causes & Solutions:**

1. **Feature Disabled**
   ```env
   FEATURE_ORDER_LINE_ITEMS=true  # Must be enabled
   ```

2. **Order Has No Products**
   - Check BigCommerce order
   - Verify products exist

3. **Product2/PricebookEntry Missing**
   - If using standard OrderItem, Product2 and PricebookEntry must exist
   - Or use custom BC_Order_Line_Item__c object

### Issue: "Customer analytics not updating"

**Symptoms:**
- CLV not calculated
- Customer tier not assigned
- RFM score missing

**Causes & Solutions:**

1. **Features Disabled**
   ```env
   FEATURE_CUSTOMER_LIFETIME_VALUE=true
   FEATURE_CUSTOMER_SEGMENTATION=true
   FEATURE_RFM_ANALYSIS=true
   ```

2. **Custom Fields Missing**
   - Verify fields exist in Salesforce:
     - `CLV__c` on Account
     - `Customer_Tier__c` on Account
     - `RFM_Score__c` on Account
   - Check exact field API names
   - Update mappings in `.env` if different

3. **Field-Level Security**
   - Integration user must have edit access to fields
   - Check Permission Set
   - Verify field-level security

### Issue: "Duplicate records created"

**Symptoms:**
- Multiple Accounts with same email
- Multiple Leads for same cart
- Multiple Orders for same BigCommerce order

**Causes & Solutions:**

1. **External ID Fields Not Set**
   - For Order: Set `BigCommerceOrderId__c` as External ID
   - For Lead: Set `AbandonedCartId__c` as External ID
   - Mark as "Unique" in Salesforce

2. **Email Matching Not Working**
   - Check Duplicate Rules in Salesforce
   - Verify email format is valid
   - Review matching logic

3. **Webhook Sent Multiple Times**
   - Check BigCommerce webhook logs
   - May need to handle idempotency
   - Use audit logs to identify duplicates

### Issue: "Data mapping errors"

**Symptoms:**
- Error: "Field not found"
- Error: "Invalid field value"
- Missing data in Salesforce

**Causes & Solutions:**

1. **Field API Names Incorrect**
   - Verify field names in Salesforce
   - Custom fields must end with `__c`
   - Check `.env` field mappings
   - Update `SF_ORDER_*`, `SF_ACCOUNT_*` variables

2. **Data Type Mismatch**
   - Check field types match
   - Currency fields need numeric values
   - Date fields need proper format (YYYY-MM-DD)
   - Picklist values must match exactly

3. **Required Fields Missing**
   - Check Salesforce required fields
   - Provide default values if BigCommerce data missing
   - Review validation rules

## Performance Issues

### Issue: "Slow webhook processing"

**Symptoms:**
- Webhooks take > 10 seconds to process
- Timeouts from BigCommerce
- Backlog of unprocessed webhooks

**Causes & Solutions:**

1. **Too Many Features Enabled**
   - Disable unnecessary features
   - Review RFM Analysis (can be slow with many orders)
   - Disable tags if not needed

2. **Inefficient Queries**
   - Check number of API calls
   - Review logs for query performance
   - Consider caching product mappings

3. **Network Latency**
   - Check network connectivity
   - Consider server location relative to SF
   - Use async processing if possible

### Issue: "API limits reached"

**Symptoms:**
- Error: "REQUEST_LIMIT_EXCEEDED"
- 403 errors from Salesforce
- Sync stops working

**Causes & Solutions:**

1. **Too Many Orders**
   - Check Salesforce API limits:
     - Professional: 1,000/day
     - Enterprise: 25,000/day
   - Monitor usage: Setup → System Overview → API Usage
   - Upgrade Salesforce edition if needed

2. **Inefficient Code**
   - Each order: 3-6 API calls
   - Each cart: 1-4 API calls
   - Disable unnecessary features to reduce calls

3. **Bulk Processing Needed**
   ```env
   FEATURE_USE_BULK_API=true  # Enable for high volume
   ```

## Configuration Issues

### Issue: "Feature not working"

**Symptoms:**
- Feature should be active but isn't
- No errors in logs
- Expected behavior not happening

**Diagnosis:**
```bash
# Check feature flag
grep "FEATURE_NAME" .env

# Check logs for feature check
grep "Feature.*enabled" logs/combined.log
```

**Causes & Solutions:**

1. **Feature Flag Not Set**
   - Add to `.env`: `FEATURE_NAME=true`
   - Restart server after changing `.env`
   - Verify no typos in feature name

2. **Missing Prerequisites**
   - Some features require others
   - Example: RFM Analysis needs Customer Segmentation
   - Check feature dependencies

3. **Configuration Invalid**
   - Check threshold values are numbers
   - Verify field API names are correct
   - Review all related config

### Issue: "Environment variables not loaded"

**Symptoms:**
- Server crashes on startup
- Error: "Missing required environment variables"
- Default values being used

**Causes & Solutions:**

1. **No .env File**
   - Copy `.env.example` to `.env`
   - Fill in all required values
   - Don't commit `.env` to git

2. **Wrong Directory**
   - `.env` must be in project root
   - Same directory as `package.json`

3. **Syntax Errors**
   - No spaces around `=`
   - No quotes needed (usually)
   - One variable per line

## Salesforce Issues

### Issue: "Cannot find custom fields"

**Symptoms:**
- Error: "No such column 'CLV__c'"
- Error: "Field not found"
- NULL values in Salesforce

**Causes & Solutions:**

1. **Fields Not Created**
   - Follow Salesforce Setup Guide
   - Create all custom fields
   - Verify exact API names

2. **Wrong Object**
   - Check if field is on correct object
   - Account vs Contact vs Order

3. **API Name Changed**
   - Update `.env` with correct API name
   - Example: `SF_ACCOUNT_CLV_FIELD=Your_Field_Name__c`

### Issue: "Platform events not publishing"

**Symptoms:**
- No events in Salesforce Event Bus
- Process Builder not triggering
- No errors in integration logs

**Causes & Solutions:**

1. **Feature Disabled**
   ```env
   FEATURE_PLATFORM_EVENTS=true
   ```

2. **Platform Events Not Created**
   - Create platform events in Salesforce
   - Follow Platform Events section in setup guide
   - Verify field API names match code

3. **Permissions Missing**
   - User needs permission to publish events
   - Add to Permission Set

### Issue: "Validation rule failures"

**Symptoms:**
- Error: "Required field missing"
- Error: "Field value outside allowed range"
- Records not created

**Causes & Solutions:**

1. **Required Fields**
   - Provide default values
   - Check Order, Account, Contact requirements
   - Update mapping to include required fields

2. **Validation Rules**
   - Review validation rules in Salesforce
   - May need to deactivate for integration user
   - Or modify data to meet validation

3. **Picklist Values**
   - Verify picklist values exist
   - Match case exactly
   - Add missing values to picklist

## BigCommerce Issues

### Issue: "Cannot fetch order/cart details"

**Symptoms:**
- Error: "Order not found"
- Error: "403 Forbidden"
- Error: "401 Unauthorized"

**Causes & Solutions:**

1. **Incorrect Credentials**
   - Verify `BIGCOMMERCE_ACCESS_TOKEN`
   - Verify `BIGCOMMERCE_STORE_HASH`
   - Check client ID and secret (if used)

2. **Insufficient Permissions**
   - Check API account scopes in BigCommerce
   - Need: Orders (read), Carts (read), Customers (read)
   - Create new API account if needed

3. **Rate Limiting**
   - BigCommerce has rate limits
   - Implement backoff if needed
   - Check response headers

## Debugging Tips

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

Restart server and check logs for detailed information.

### Test Webhook Manually

```bash
# Test order webhook
curl -X POST http://localhost:3000/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "store/order/created",
    "data": {"id": 123}
  }'
```

### Check Audit Logs

Review `BC_Sync_Log__c` records in Salesforce for:
- Operation type
- Success/failure status
- Error messages
- Timestamps

### Use Salesforce Debug Logs

1. Setup → Debug Logs
2. Add integration user
3. Set log levels to FINEST
4. Reproduce issue
5. Review logs

### Check BigCommerce Webhook Logs

1. Login to BigCommerce admin
2. Go to Advanced Settings → Webhooks
3. Click on webhook
4. View delivery history
5. Check response codes

### Monitor API Usage

**Salesforce:**
- Setup → System Overview → API Usage

**BigCommerce:**
- Check response headers for rate limit info

### Use Postman/Insomnia

Test API calls directly:
1. Salesforce authentication
2. Object creation
3. SOQL queries
4. Platform event publishing

## Getting Help

### Before Asking for Help

Collect this information:
1. Error messages (exact text)
2. Relevant log entries
3. Configuration (sanitized)
4. Steps to reproduce
5. Expected vs actual behavior

### Support Channels

1. **Documentation**
   - Review all documentation files
   - Check examples directory
   - Review code comments

2. **GitHub Issues**
   - Search existing issues
   - Create new issue with details
   - Include reproduction steps

3. **Logs**
   - Always include relevant log entries
   - Sanitize sensitive data
   - Include timestamps

### Useful Commands

```bash
# Check server status
curl http://localhost:3000/health

# View logs
tail -f logs/combined.log
tail -f logs/error.log

# Test configuration
node -c src/config/index.js

# Check environment
node -e "console.log(process.env.SALESFORCE_USERNAME)"

# Test Salesforce connection
node src/server.js  # Watch for auth success message
```

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `INVALID_LOGIN` | Wrong credentials or security token | Verify username, password, token |
| `REQUEST_LIMIT_EXCEEDED` | API limit reached | Check usage, upgrade plan, optimize |
| `INVALID_FIELD` | Custom field missing | Create field in Salesforce |
| `REQUIRED_FIELD_MISSING` | Required field not provided | Add field to mapping |
| `DUPLICATE_VALUE` | Unique field violation | Check external ID fields |
| `UNABLE_TO_LOCK_ROW` | Concurrent updates | Retry request |
| `CONNECTION_ERROR` | Network issue | Check connectivity |
| `Session expired` | Auth token expired | Restart server (auto-refreshes) |

## Prevention Tips

1. **Test in Sandbox First**
   - Always test changes in sandbox
   - Verify field mappings
   - Test with real data

2. **Monitor Regularly**
   - Check logs daily
   - Monitor API usage
   - Review sync success rate

3. **Keep Documentation Updated**
   - Document custom fields
   - Document workflow changes
   - Update mappings

4. **Set Up Alerts**
   - Email alerts for critical errors
   - API limit warnings
   - Sync failure notifications

5. **Regular Maintenance**
   - Update dependencies
   - Rotate credentials
   - Clean up test data
   - Review and optimize features

## Still Having Issues?

If you've tried the solutions above and still have issues:

1. Increase logging level to `debug`
2. Collect detailed logs
3. Document exact reproduction steps
4. Check GitHub issues
5. Create new issue with all details

Include:
- Version information
- Environment details
- Complete error messages
- Relevant log entries
- Configuration (sanitized)
- Steps to reproduce
