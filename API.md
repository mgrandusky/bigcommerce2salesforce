# API Documentation

## Endpoints

### Health Check

**GET** `/health`

Check server status and Salesforce connection.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "salesforceConnected": true
}
```

---

### Root Endpoint

**GET** `/`

Get API information and available endpoints.

**Response:**
```json
{
  "message": "BigCommerce to Salesforce Integration",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "webhooks": {
      "orders": "/webhooks/orders",
      "abandonedCarts": "/webhooks/carts/abandoned",
      "general": "/webhooks/general"
    }
  }
}
```

---

### Order Webhook

**POST** `/webhooks/orders`

Receive order created/updated webhooks from BigCommerce.

**Headers:**
- `Content-Type: application/json`
- `X-BC-Webhook-Signature: <hmac_signature>`

**Request Body:**
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

**Response (Success):**
```json
{
  "success": true,
  "message": "Order synced successfully",
  "orderId": 250,
  "salesforceOrderId": "8015g000000ABCDAAZ"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to sync order",
  "orderId": 250,
  "message": "Error details..."
}
```

**Supported Order Scopes:**
- `store/order/created` - New order created
- `store/order/updated` - Order updated
- `store/order/statusUpdated` - Order status changed

---

### Abandoned Cart Webhook

**POST** `/webhooks/carts/abandoned`

Receive abandoned cart webhooks from BigCommerce.

**Headers:**
- `Content-Type: application/json`
- `X-BC-Webhook-Signature: <hmac_signature>`

**Request Body:**
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

**Response (Success):**
```json
{
  "success": true,
  "message": "Abandoned cart synced successfully",
  "cartId": "09346f8b-d3b0-4c74-b4b9-8c5b6f2e7a42",
  "salesforceLeadId": "00Q5g000000ABCDAAZ"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to sync abandoned cart",
  "cartId": "09346f8b-d3b0-4c74-b4b9-8c5b6f2e7a42",
  "message": "Error details..."
}
```

---

### General Webhook

**POST** `/webhooks/general`

General webhook endpoint for testing and logging.

**Headers:**
- `Content-Type: application/json`
- `X-BC-Webhook-Signature: <hmac_signature>`

**Request Body:**
```json
{
  "scope": "store/*",
  "store_id": "1025646",
  "data": {
    "type": "any",
    "id": 123
  },
  "hash": "dd70c0976e06b67aaf672594f8b2e3d3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received",
  "scope": "store/*"
}
```

---

## Webhook Signature Validation

All webhook endpoints validate the `X-BC-Webhook-Signature` header to ensure authenticity.

The signature is an HMAC SHA256 hash of the request body using the `WEBHOOK_SECRET`:

```javascript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(requestBody))
  .digest('hex');
```

**Invalid signatures return:**
```json
{
  "error": "Invalid webhook signature"
}
```

---

## Error Responses

### 400 Bad Request
Invalid webhook payload structure.

```json
{
  "error": "Invalid webhook payload"
}
```

### 401 Unauthorized
Missing or invalid webhook signature.

```json
{
  "error": "Missing webhook signature"
}
```

or

```json
{
  "error": "Invalid webhook signature"
}
```

### 404 Not Found
Route does not exist.

```json
{
  "error": "Route not found"
}
```

### 500 Internal Server Error
Server error during processing.

```json
{
  "error": "Internal server error"
}
```

In development mode, error responses may include additional details:

```json
{
  "error": "Error message",
  "stack": "Error stack trace..."
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting middleware for production deployments.

---

## Retry Logic

Failed operations are automatically retried with exponential backoff:
- Default: 3 attempts
- Delay: 5000ms * attempt number
- Configurable via `MAX_RETRY_ATTEMPTS` and `RETRY_DELAY_MS` environment variables

---

## Logging

All requests and operations are logged with different levels:
- `error` - Critical errors that need attention
- `warn` - Warning messages
- `info` - General information
- `debug` - Detailed debugging information

Log level can be configured via `LOG_LEVEL` environment variable.
