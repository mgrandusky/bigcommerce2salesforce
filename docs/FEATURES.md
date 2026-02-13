# Enterprise Features Guide

This guide provides detailed information about the enterprise-grade features available in the BigCommerce to Salesforce integration.

## Overview

The integration now supports 18 major feature categories, each with multiple sub-features that can be enabled or disabled via feature flags.

## Configuration

All features are controlled by environment variables in the `.env` file. Set feature flags to `true` to enable them:

```env
FEATURE_CUSTOMER_SEGMENTATION=true
FEATURE_PLATFORM_EVENTS=true
# ... etc
```

## Feature Categories

### 1. Advanced Order Management

#### Order Line Items
**Feature Flag**: `FEATURE_ORDER_LINE_ITEMS`
**Status**: Implemented

Creates detailed OrderItem records for each product in an order, including:
- Product quantity
- Unit price
- Total price
- Product name and SKU

**Usage**: When enabled, the integration automatically creates line items for each order.

#### Payment Details
**Feature Flag**: `FEATURE_PAYMENT_DETAILS`
**Status**: Implemented
**Default**: Enabled

Stores comprehensive payment information:
- Payment method
- Transaction ID
- Payment gateway details

**Custom Fields Required**:
- `PaymentMethod__c` on Order
- `TransactionId__c` on Order

#### Tax & Shipping Breakdown
**Feature Flag**: `FEATURE_TAX_SHIPPING_BREAKDOWN`
**Status**: Implemented
**Default**: Enabled

Provides detailed breakdown of order costs:
- Subtotal
- Tax total
- Shipping total

**Custom Fields Required**:
- `Subtotal__c` on Order
- `TaxTotal__c` on Order
- `ShippingTotal__c` on Order

#### Fulfillment Status
**Feature Flag**: `FEATURE_FULFILLMENT_STATUS`
**Status**: Implemented
**Default**: Enabled

Tracks order fulfillment and shipping:
- Tracking numbers
- Carrier information
- Delivery status

**Custom Fields Required**:
- `TrackingNumber__c` on Order

### 2. Enhanced Customer Data Management

#### Customer Lifetime Value (CLV)
**Feature Flag**: `FEATURE_CUSTOMER_LIFETIME_VALUE`
**Status**: Implemented
**Default**: Enabled

Automatically calculates and tracks total customer value:
- Updates after each order
- Stored on Account object
- Used for segmentation

**Custom Fields Required**:
- `CLV__c` on Account

#### Customer Segmentation
**Feature Flag**: `FEATURE_CUSTOMER_SEGMENTATION`
**Status**: Implemented
**Default**: Enabled

Automatically assigns customers to tiers based on spending:
- **Bronze**: $0 - $999
- **Silver**: $1,000 - $4,999
- **Gold**: $5,000 - $9,999
- **Platinum**: $10,000+

**Configuration**:
```env
CUSTOMER_TIER_PLATINUM=10000
CUSTOMER_TIER_GOLD=5000
CUSTOMER_TIER_SILVER=1000
```

**Custom Fields Required**:
- `Customer_Tier__c` (Picklist) on Account
- `Total_Orders__c` on Account
- `Average_Order_Value__c` on Account

#### RFM Analysis
**Feature Flag**: `FEATURE_RFM_ANALYSIS`
**Status**: Implemented
**Default**: Enabled

Calculates RFM (Recency, Frequency, Monetary) scores:
- **Recency**: Days since last order (1-5, where 5 is most recent)
- **Frequency**: Number of orders (1-5, where 5 is most frequent)
- **Monetary**: Total spend (1-5, where 5 is highest)
- **Score Format**: "555" (best), "111" (worst)

**Custom Fields Required**:
- `RFM_Score__c` on Account
- `Last_Order_Date__c` on Account

#### Customer Tags
**Feature Flag**: `FEATURE_CUSTOMER_TAGS`
**Status**: Implemented
**Default**: Enabled

Automatically tags customers based on behavior:
- **VIP**: Platinum tier customers
- **First-Time Buyer**: Customers with only 1 order
- **At-Risk**: No orders in last 90 days (configurable)

**Configuration**:
```env
CHURN_RISK_DAYS=90
```

### 3. Cart Recovery & Opportunities

#### Opportunity Creation for High-Value Carts
**Feature Flag**: `FEATURE_OPPORTUNITY_CREATION`
**Status**: Implemented
**Default**: Enabled

Creates Opportunity records for abandoned carts above a threshold:
- Default threshold: $100
- Stage: "Prospecting"
- Close Date: 30 days from abandonment

**Configuration**:
```env
OPPORTUNITY_MIN_VALUE=100.0
CART_EXPIRATION_DAYS=30
```

**Custom Fields Required**:
- `Cart_ID__c` on Opportunity
- `Cart_Value__c` on Opportunity
- `Abandoned_Date__c` on Opportunity

#### Lead Creation for Lower-Value Carts
**Feature Flag**: `FEATURE_LEAD_CREATION_LOW_VALUE`
**Status**: Implemented
**Default**: Enabled

Creates Lead records for abandoned carts below the opportunity threshold:
- Lead Source: "Abandoned Cart"
- Status: "Open - Not Contacted"

**Custom Fields Required**:
- `AbandonedCartValue__c` on Lead
- `AbandonedCartId__c` on Lead
- `AbandonedCartDate__c` on Lead
- `Cart_Items__c` (Long Text Area) on Lead

#### Recovery Tasks
**Feature Flag**: `FEATURE_RECOVERY_TASKS`
**Status**: Implemented
**Default**: Enabled

Automatically creates follow-up tasks:
- Subject: "Follow up on abandoned cart"
- Due Date: Next business day
- Priority: High for carts > $500, Normal otherwise
- Links to Lead or Opportunity

#### Cart Expiration
**Feature Flag**: `FEATURE_CART_EXPIRATION`
**Status**: Implemented
**Default**: Enabled

Automatically closes old cart opportunities:
- Default: After 30 days
- Stage changes to "Closed Lost"
- Reason: "Cart expired"

**Configuration**:
```env
CART_EXPIRATION_DAYS=30
```

### 4. Sales Process Automation

#### Platform Events
**Feature Flag**: `FEATURE_PLATFORM_EVENTS`
**Status**: Implemented
**Default**: Enabled

Publishes custom platform events for event-driven architecture:
- `BigCommerce_Order_Created__e`
- `BigCommerce_Order_Updated__e`
- `BigCommerce_Order_Shipped__e`
- `BigCommerce_Cart_Abandoned__e`

Enables other Salesforce processes to:
- Subscribe to events
- Trigger automations
- Send notifications
- Update external systems

**Platform Events Required**:
See Salesforce Setup Guide for platform event definitions.

### 5. Data Quality & Governance

#### Audit Trail
**Feature Flag**: `FEATURE_AUDIT_TRAIL`
**Status**: Implemented
**Default**: Enabled

Logs all sync operations for:
- Compliance requirements
- Troubleshooting
- Performance monitoring
- Data quality analysis

**Features**:
- Operation type tracking
- Success/failure status
- Error messages
- Timestamps
- Performance metrics

**Custom Object Required**:
- `BC_Sync_Log__c` (see Salesforce Setup Guide)

#### Field History Tracking
**Feature Flag**: `FEATURE_FIELD_HISTORY_TRACKING`
**Status**: Configuration Only
**Default**: Enabled

Enable Salesforce field history tracking on:
- Order: Status, Total Amount, BC Status, Tracking Number
- Account: CLV, Customer Tier, Total Orders
- Opportunity: Stage, Amount

## Feature Roadmap

### Implemented ✅
- Order Line Items
- Payment Details
- Tax & Shipping Breakdown
- Customer Lifetime Value (CLV)
- Customer Segmentation
- RFM Analysis
- Customer Tags
- Opportunity Creation (High-Value Carts)
- Lead Creation (Low-Value Carts)
- Recovery Tasks
- Cart Expiration
- Platform Events
- Audit Trail
- Fulfillment Status

### Planned 🔄
- Bidirectional Order Status Sync
- Product Catalog Sync
- Price Book Management
- Refunds & Returns
- Contact Roles
- Campaign Association
- Chatter Integration
- Case Creation
- Inventory Sync
- Subscription Management
- Einstein AI Features

### Future Consideration 📋
- Marketing Cloud Connector
- Pardot Integration
- CPQ Integration
- Field Service Integration
- Multi-warehouse Support
- GDPR Compliance Tools

## Performance Considerations

### API Call Limits

The integration is designed to work within Salesforce API limits:

**Per Order Sync**:
- 1 call: Find/create Account
- 1 call: Find/create Contact
- 1 call: Create Order
- 1 call (optional): Create Order Line Items (bulk)
- 1 call (optional): Update Account analytics
- 1 call (optional): Query for RFM calculation

**Total**: 3-6 API calls per order

**Per Cart Sync**:
- 0-2 calls: Find/create Account/Contact (if creating Opportunity)
- 1 call: Create Lead or Opportunity
- 1 call (optional): Create Task
- 1 call (optional): Publish Platform Event

**Total**: 1-4 API calls per cart

### Optimization Tips

1. **Use Bulk API** for initial data loads:
   ```env
   FEATURE_USE_BULK_API=true
   ```

2. **Enable Platform Cache** to reduce queries:
   ```env
   FEATURE_USE_PLATFORM_CACHE=true
   ```

3. **Disable unused features** to reduce API calls

4. **Batch webhook processing** during high-volume periods

## Security Best Practices

1. **Use Named Credentials** in Salesforce for external callouts
2. **Implement IP restrictions** on Connected App
3. **Rotate API credentials** regularly
4. **Enable Field-Level Security** on sensitive fields
5. **Use Permission Sets** instead of modifying profiles
6. **Enable platform encryption** for sensitive data
7. **Review audit logs** regularly

## Monitoring & Troubleshooting

### Health Checks

Monitor integration health via:

1. **Audit Logs**: Check `BC_Sync_Log__c` records
2. **Failed Operations**: Review error messages
3. **API Usage**: Monitor Salesforce API call consumption
4. **Performance**: Track sync duration

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
```

### Common Issues

#### Issue: High API Usage
**Solution**: Disable optional features or batch operations

#### Issue: Duplicate Records
**Solution**: Verify external ID fields are set correctly

#### Issue: Authentication Failures
**Solution**: Check security token and Connected App settings

#### Issue: Missing Custom Fields
**Solution**: Verify Salesforce setup and field API names

## Integration Patterns

### Event-Driven Pattern

When Platform Events are enabled:

```
BigCommerce Order → Integration → Salesforce Order → Platform Event
                                                    ↓
                                            ┌───────┴────────┐
                                            ↓                ↓
                                    Process Builder    Apex Trigger
```

### Analytics Pattern

Customer analytics update flow:

```
New Order → Create Order → Update Account
                         ↓
                    Calculate CLV
                         ↓
                    Update Tier
                         ↓
                    Calculate RFM
                         ↓
                    Apply Tags
```

### Cart Recovery Pattern

Abandoned cart processing:

```
Abandoned Cart → Calculate Value
                      ↓
              ┌───────┴────────┐
              ↓                ↓
        Value ≥ $100      Value < $100
              ↓                ↓
       Create Opportunity  Create Lead
              ↓                ↓
         Create Task      Create Task
              ↓                ↓
      Platform Event    Platform Event
```

## Examples

### Enable All Core Features

```env
# Core Features
FEATURE_PAYMENT_DETAILS=true
FEATURE_TAX_SHIPPING_BREAKDOWN=true
FEATURE_CUSTOMER_LIFETIME_VALUE=true
FEATURE_CUSTOMER_SEGMENTATION=true
FEATURE_RFM_ANALYSIS=true
FEATURE_CUSTOMER_TAGS=true
FEATURE_OPPORTUNITY_CREATION=true
FEATURE_LEAD_CREATION_LOW_VALUE=true
FEATURE_RECOVERY_TASKS=true
FEATURE_CART_EXPIRATION=true
FEATURE_PLATFORM_EVENTS=true
FEATURE_AUDIT_TRAIL=true
FEATURE_FULFILLMENT_STATUS=true
```

### High-Volume Store Configuration

Optimize for performance:

```env
# Disable optional features
FEATURE_ORDER_LINE_ITEMS=false
FEATURE_RFM_ANALYSIS=false
FEATURE_CUSTOMER_TAGS=false
FEATURE_PLATFORM_EVENTS=false

# Increase thresholds
OPPORTUNITY_MIN_VALUE=500.0
CART_EXPIRATION_DAYS=7

# Keep essential features
FEATURE_CUSTOMER_LIFETIME_VALUE=true
FEATURE_CUSTOMER_SEGMENTATION=true
FEATURE_AUDIT_TRAIL=true
```

### Minimal Configuration

Basic order sync only:

```env
# Disable all optional features
FEATURE_ORDER_LINE_ITEMS=false
FEATURE_CUSTOMER_LIFETIME_VALUE=false
FEATURE_CUSTOMER_SEGMENTATION=false
FEATURE_RFM_ANALYSIS=false
FEATURE_CUSTOMER_TAGS=false
FEATURE_OPPORTUNITY_CREATION=false
FEATURE_RECOVERY_TASKS=false
FEATURE_PLATFORM_EVENTS=false

# Keep audit trail
FEATURE_AUDIT_TRAIL=true
```

## Support

For questions about specific features:
1. Review this documentation
2. Check Salesforce Setup Guide
3. Review code comments in service files
4. Open a GitHub issue

## Contributing

To add new features:
1. Add feature flag to `src/config/features.js`
2. Implement feature in appropriate service file
3. Update webhook handlers if needed
4. Add configuration to `.env.example`
5. Document in this file
6. Add Salesforce setup instructions if needed
7. Update tests
