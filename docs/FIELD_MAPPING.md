# Field Mapping Reference

This document provides complete field mapping between BigCommerce and Salesforce objects.

## Order Mapping

### BigCommerce Order → Salesforce Order

| BigCommerce Field | Data Type | Salesforce Field | Data Type | Transformation |
|------------------|-----------|------------------|-----------|----------------|
| `id` | Number | `OrderNumber` | Text | Convert to string |
| `id` | Number | `BigCommerceOrderId__c` | Text (External ID) | Convert to string |
| `total_inc_tax` | Decimal | `TotalAmount` | Currency | Parse as float |
| `subtotal_inc_tax` | Decimal | `Subtotal__c` | Currency | Parse as float |
| `total_tax` | Decimal | `TaxTotal__c` | Currency | Parse as float |
| `shipping_cost_inc_tax` | Decimal | `ShippingTotal__c` | Currency | Parse as float |
| `date_created` | DateTime | `EffectiveDate` | Date | Convert to YYYY-MM-DD |
| `status` | Text | `Status` | Picklist | See Status Mapping |
| `status` | Text | `BC_Status__c` | Text | Direct copy |
| `payment_method` | Text | `PaymentMethod__c` | Text | Direct copy |
| `payment_provider_id` | Text | `TransactionId__c` | Text | Direct copy |
| `billing_address.street_1` | Text | `BillingStreet` | Text | Direct copy |
| `billing_address.city` | Text | `BillingCity` | Text | Direct copy |
| `billing_address.state` | Text | `BillingState` | Text | Direct copy |
| `billing_address.zip` | Text | `BillingPostalCode` | Text | Direct copy |
| `billing_address.country` | Text | `BillingCountry` | Text | Direct copy |
| `shipping_addresses[0].street_1` | Text | `ShippingStreet` | Text | Direct copy |
| `shipping_addresses[0].city` | Text | `ShippingCity` | Text | Direct copy |
| `shipping_addresses[0].state` | Text | `ShippingState` | Text | Direct copy |
| `shipping_addresses[0].zip` | Text | `ShippingPostalCode` | Text | Direct copy |
| `shipping_addresses[0].country` | Text | `ShippingCountry` | Text | Direct copy |
| N/A (Generated) | Text | `Description` | Long Text | "Order from BigCommerce\nPayment Method: {method}\nStatus: {status}" |

### Order Status Mapping

| BigCommerce Status | Salesforce Status |
|-------------------|-------------------|
| Pending | Draft |
| Awaiting Payment | Draft |
| Declined | Draft |
| Manual Verification Required | Draft |
| Awaiting Shipment | Activated |
| Awaiting Pickup | Activated |
| Awaiting Fulfillment | Activated |
| Shipped | Activated |
| Partially Shipped | Activated |
| Completed | Activated |
| Refunded | Activated |
| Partially Refunded | Activated |
| Cancelled | Activated |
| Disputed | Activated |

## Order Line Items Mapping

### BigCommerce Order Product → Salesforce OrderItem

| BigCommerce Field | Data Type | Salesforce Field | Data Type | Transformation |
|------------------|-----------|------------------|-----------|----------------|
| (Generated) | Lookup | `OrderId` | Lookup(Order) | Link to parent Order |
| `name` | Text | `Description` | Text | Direct copy |
| `quantity` | Number | `Quantity` | Number | Direct copy |
| `base_price` | Decimal | `UnitPrice` | Currency | Parse as float |
| `name` | Text | `Product_Name__c` | Text | Direct copy (if using custom object) |
| `sku` | Text | `SKU__c` | Text | Direct copy (if using custom object) |
| `quantity * base_price` | Decimal | `Total_Price__c` | Currency | Calculate (if using custom object) |

**Note**: If Product Catalog Sync is enabled, additional fields would be populated:
- `Product2Id` - Link to synced Product2 record
- `PricebookEntryId` - Link to Price Book Entry

## Customer Mapping

### BigCommerce Order Billing Address → Salesforce Account

| BigCommerce Field | Data Type | Salesforce Field | Data Type | Transformation |
|------------------|-----------|------------------|-----------|----------------|
| `billing_address.company` or "{first_name} {last_name}" | Text | `Name` | Text | Use company if available, else full name |
| `billing_address.email` | Email | `PersonEmail` | Email | For Person Accounts |
| `billing_address.phone` | Text | `Phone` | Phone | Direct copy |
| `billing_address.street_1` | Text | `BillingStreet` | Text | Direct copy |
| `billing_address.city` | Text | `BillingCity` | Text | Direct copy |
| `billing_address.state` | Text | `BillingState` | Text | Direct copy |
| `billing_address.zip` | Text | `BillingPostalCode` | Text | Direct copy |
| `billing_address.country` | Text | `BillingCountry` | Text | Direct copy |
| (Calculated) | Currency | `CLV__c` | Currency | Sum of all order totals |
| (Calculated) | Number | `Total_Orders__c` | Number | Count of orders |
| (Calculated) | Picklist | `Customer_Tier__c` | Picklist | Based on CLV (Bronze/Silver/Gold/Platinum) |
| (Calculated) | Text | `RFM_Score__c` | Text | "555" format score |
| (Calculated) | Date | `Last_Order_Date__c` | Date | Most recent order date |
| (Calculated) | Currency | `Average_Order_Value__c` | Currency | CLV / Total Orders |

### BigCommerce Order Billing Address → Salesforce Contact

| BigCommerce Field | Data Type | Salesforce Field | Data Type | Transformation |
|------------------|-----------|------------------|-----------|----------------|
| `billing_address.first_name` | Text | `FirstName` | Text | Direct copy (default: "Unknown") |
| `billing_address.last_name` | Text | `LastName` | Text | Direct copy (default: "Customer") |
| `billing_address.email` or `customer_email` | Email | `Email` | Email | Direct copy (required) |
| `billing_address.phone` | Text | `Phone` | Phone | Direct copy |
| `billing_address.street_1` | Text | `MailingStreet` | Text | Direct copy |
| `billing_address.city` | Text | `MailingCity` | Text | Direct copy |
| `billing_address.state` | Text | `MailingState` | Text | Direct copy |
| `billing_address.zip` | Text | `MailingPostalCode` | Text | Direct copy |
| `billing_address.country` | Text | `MailingCountry` | Text | Direct copy |
| (Generated) | Lookup | `AccountId` | Lookup(Account) | Link to parent Account |
| (Calculated) | Date | `Last_Order_Date__c` | Date | Most recent order date |
| (Calculated) | Number | `Order_Count__c` | Number | Count of orders |
| (Calculated) | Currency | `Total_Spent__c` | Currency | Sum of all order totals |

## Abandoned Cart Mapping (Lead)

### BigCommerce Cart → Salesforce Lead

| BigCommerce Field | Data Type | Salesforce Field | Data Type | Transformation |
|------------------|-----------|------------------|-----------|----------------|
| `email` or customer email | Email | `Email` | Email | Direct copy |
| `billing_address.first_name` or customer first name | Text | `FirstName` | Text | Direct copy (default: "Unknown") |
| `billing_address.last_name` or customer last name | Text | `LastName` | Text | Direct copy (default: "Customer") |
| `company` or "{FirstName} {LastName}" | Text | `Company` | Text | Required field |
| (Constant) | Text | `LeadSource` | Picklist | "Abandoned Cart" |
| (Constant) | Text | `Status` | Picklist | "Open - Not Contacted" |
| (Generated) | Long Text | `Description` | Long Text | See Description Format |
| `id` | Text | `AbandonedCartId__c` | Text (External ID) | Direct copy |
| (Calculated) | Currency | `AbandonedCartValue__c` | Currency | Sum of line items |
| (Generated) | DateTime | `AbandonedCartDate__c` | DateTime | Current timestamp |
| (Generated) | Long Text | `Cart_Items__c` | Long Text | Formatted list of items |

#### Lead Description Format
```
Abandoned Cart - {timestamp}

Cart ID: {cart_id}
Cart Value: ${cart_value}

Items:
- {item_name} (Qty: {quantity}, Price: ${price})
- {item_name} (Qty: {quantity}, Price: ${price})
...
```

## Abandoned Cart Mapping (Opportunity)

### BigCommerce Cart → Salesforce Opportunity

| BigCommerce Field | Data Type | Salesforce Field | Data Type | Transformation |
|------------------|-----------|------------------|-----------|----------------|
| (Generated) | Text | `Name` | Text | "Abandoned Cart - {cart_id}" |
| (From Account) | Lookup | `AccountId` | Lookup(Account) | Link to Account |
| (Constant) | Picklist | `StageName` | Picklist | "Prospecting" |
| (Calculated) | Currency | `Amount` | Currency | Sum of line items |
| (Calculated) | Date | `CloseDate` | Date | Today + Cart Expiration Days |
| (Constant) | Picklist | `LeadSource` | Picklist | "Abandoned Cart" |
| (Generated) | Long Text | `Description` | Long Text | Same as Lead description format |
| `id` | Text | `Cart_ID__c` | Text | Direct copy |
| (Calculated) | Currency | `Cart_Value__c` | Currency | Sum of line items |
| (Generated) | DateTime | `Abandoned_Date__c` | DateTime | Current timestamp |

## Recovery Task Mapping

### Generated Task for Abandoned Cart

| Source | Data Type | Salesforce Field | Data Type | Value |
|--------|-----------|------------------|-----------|-------|
| (Constant) | Text | `Subject` | Text | "Follow up on abandoned cart" |
| (Constant) | Picklist | `Status` | Picklist | "Not Started" |
| (Conditional) | Picklist | `Priority` | Picklist | "High" if cart > $500, else "Normal" |
| (Calculated) | Date | `ActivityDate` | Date | Tomorrow |
| (Generated) | Text | `Description` | Text | "Follow up with customer regarding abandoned cart worth ${value}" |
| (Conditional) | Lookup | `WhatId` | Lookup(Opportunity) | If Opportunity created |
| (Conditional) | Lookup | `WhoId` | Lookup(Lead) | If Lead created |

## Audit Log Mapping

### Sync Operation → BC_Sync_Log__c

| Source | Data Type | Salesforce Field | Data Type | Value |
|--------|-----------|------------------|-----------|-------|
| Operation Type | Text | `Operation_Type__c` | Picklist | ORDER_SYNC, CART_SYNC, PRODUCT_SYNC |
| BigCommerce ID | Text | `BigCommerce_ID__c` | Text | Order ID, Cart ID, or Product ID |
| Salesforce ID | Text | `Salesforce_ID__c` | Text | Created record ID |
| Status | Text | `Status__c` | Picklist | Success, Failed |
| Error Message | Text | `Error_Message__c` | Long Text | Error details if failed |
| Timestamp | DateTime | `Sync_Date__c` | DateTime | Sync timestamp |
| Duration | Number | `Duration_MS__c` | Number | Processing time in milliseconds |

## Platform Events Mapping

### BigCommerce_Order_Created__e

| Source | Data Type | Event Field | Data Type | Value |
|--------|-----------|-------------|-----------|-------|
| (Constant) | Text | `EventType__c` | Text | "Order_Created" |
| Salesforce Order ID | Text | `OrderId__c` | Text | Created Order ID |
| BigCommerce Order ID | Text | `BigCommerceOrderId__c` | Text | Original order ID |
| Account ID | Text | `AccountId__c` | Text | Account ID |
| Order Total | Decimal | `TotalAmount__c` | Number | Order amount |
| Timestamp | DateTime | `OrderDate__c` | DateTime | Event timestamp |

### BigCommerce_Cart_Abandoned__e

| Source | Data Type | Event Field | Data Type | Value |
|--------|-----------|-------------|-----------|-------|
| (Constant) | Text | `EventType__c` | Text | "Cart_Abandoned" |
| BigCommerce Cart ID | Text | `CartId__c` | Text | Cart ID |
| Customer Email | Email | `CustomerEmail__c` | Text | Customer email |
| Cart Value | Decimal | `CartValue__c` | Number | Cart total |
| Lead ID | Text | `LeadId__c` | Text | Created Lead ID (if applicable) |
| Opportunity ID | Text | `OpportunityId__c` | Text | Created Opportunity ID (if applicable) |
| Timestamp | DateTime | `AbandonedDate__c` | DateTime | Event timestamp |

## Data Type Conversions

### BigCommerce → Salesforce

| BigCommerce Type | Salesforce Type | Conversion Notes |
|-----------------|-----------------|------------------|
| Number | Text | Convert to string |
| Number | Number | Direct copy |
| Decimal/Float | Currency | Parse as float, maintain 2 decimal places |
| String | Text | Direct copy, truncate if needed |
| DateTime (ISO 8601) | Date | Extract date portion (YYYY-MM-DD) |
| DateTime (ISO 8601) | DateTime | Convert to Salesforce DateTime format |
| Email | Email | Validate format, use default if invalid |
| Boolean | Checkbox | Direct mapping |
| Null | Null | Use default values where appropriate |

## Default Values

When BigCommerce data is missing or invalid:

| Field | Default Value | Notes |
|-------|---------------|-------|
| FirstName | "Unknown" | When customer name not available |
| LastName | "Customer" | When customer last name not available |
| Email | "unknown@example.com" | Only if absolutely required and not available |
| Company | "{FirstName} {LastName}" | For Lead/Account when company not provided |
| Status (Order) | "Draft" | When BC status cannot be mapped |
| LeadSource | "Abandoned Cart" | For cart recovery records |
| Status (Lead) | "Open - Not Contacted" | For new leads |
| StageName (Opportunity) | "Prospecting" | For new opportunities |

## Validation Rules

### Required Fields

**Order**:
- `AccountId` - Must have an Account
- `EffectiveDate` - Must have a date
- `Status` - Must have a status
- `TotalAmount` - Must be >= 0

**Lead**:
- `LastName` - Required by Salesforce
- `Company` - Required by Salesforce
- `Email` - Required for abandoned cart leads

**Opportunity**:
- `Name` - Required by Salesforce
- `StageName` - Required by Salesforce
- `CloseDate` - Required by Salesforce
- `Amount` - Should be > 0 for abandoned carts

## External ID Fields

These fields are marked as External IDs for upsert operations:

| Object | Field | Purpose |
|--------|-------|---------|
| Order | `BigCommerceOrderId__c` | Prevent duplicate orders |
| Lead | `AbandonedCartId__c` | Update existing cart leads |
| Lead | `Email` | Find existing leads by email |
| Account | `PersonEmail` | Find existing accounts (Person Accounts) |
| Contact | `Email` | Find existing contacts |

## Custom Formula Fields (Optional)

These can be created in Salesforce for calculated values:

### Account
```apex
// Days Since Last Order
IF(ISBLANK(Last_Order_Date__c), 
   NULL, 
   TODAY() - Last_Order_Date__c)

// Is VIP
Customer_Tier__c = "Platinum"

// At Risk
AND(
  NOT(ISBLANK(Last_Order_Date__c)),
  TODAY() - Last_Order_Date__c > 90,
  Total_Orders__c > 1
)
```

### Opportunity
```apex
// Days Since Abandoned
IF(ISBLANK(Abandoned_Date__c), 
   NULL, 
   NOW() - Abandoned_Date__c)

// Is Expired
AND(
  ISPICKVAL(StageName, "Prospecting"),
  ISPICKVAL(LeadSource, "Abandoned Cart"),
  Days_Since_Abandoned__c > 30
)
```

## Notes

1. **Field API Names**: Always use the API names (with `__c` suffix) in code
2. **Field Length**: Ensure Salesforce fields are long enough for BigCommerce data
3. **Picklist Values**: Create all necessary picklist values in Salesforce before syncing
4. **Relationships**: Ensure parent records exist before creating child records
5. **Field-Level Security**: Configure FLS for integration user
6. **Validation Rules**: May need to deactivate some rules for integration user

## Testing Field Mappings

1. Create test order in BigCommerce
2. Verify webhook is received
3. Check Salesforce records created
4. Verify all fields are populated correctly
5. Check for null/default values
6. Validate relationships are correct
7. Review audit logs for any issues

## Troubleshooting

**Issue**: Field not found error
- **Cause**: Custom field not created or API name mismatch
- **Solution**: Verify field exists and update `.env` mapping

**Issue**: Data truncation error
- **Cause**: Salesforce field too short
- **Solution**: Increase field length in Salesforce

**Issue**: Invalid picklist value
- **Cause**: Value not in Salesforce picklist
- **Solution**: Add value or map to existing value

**Issue**: Required field missing
- **Cause**: BigCommerce data missing required field
- **Solution**: Add default value in mapping logic
