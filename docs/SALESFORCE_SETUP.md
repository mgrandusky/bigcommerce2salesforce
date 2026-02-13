# Salesforce Setup Guide

This guide will walk you through configuring Salesforce for the BigCommerce integration, including custom objects, fields, and security settings.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Custom Objects](#custom-objects)
3. [Custom Fields](#custom-fields)
4. [Platform Events](#platform-events)
5. [Connected App](#connected-app)
6. [Permission Sets](#permission-sets)
7. [Reports and Dashboards](#reports-and-dashboards)
8. [Validation Rules](#validation-rules)
9. [Field History Tracking](#field-history-tracking)

## Prerequisites

- Salesforce org with API access (Professional, Enterprise, Unlimited, or Developer Edition)
- System Administrator access
- API calls available in your org

## Custom Objects

### BC_Sync_Log__c (Audit Trail Object)

This custom object tracks all sync operations for auditing and troubleshooting.

**To create:**

1. Go to **Setup** > **Object Manager** > **Create** > **Custom Object**
2. Set the following:
   - **Label**: BC Sync Log
   - **Plural Label**: BC Sync Logs
   - **Object Name**: BC_Sync_Log
   - **Record Name**: Log Number
   - **Data Type**: Auto Number
   - **Display Format**: LOG-{00000}

**Custom Fields:**

| Field Label | Field Name | Data Type | Length/Options |
|------------|------------|-----------|----------------|
| Operation Type | Operation_Type__c | Picklist | ORDER_SYNC, CART_SYNC, PRODUCT_SYNC |
| BigCommerce ID | BigCommerce_ID__c | Text | 100 |
| Salesforce ID | Salesforce_ID__c | Text | 18 |
| Status | Status__c | Picklist | Success, Failed |
| Error Message | Error_Message__c | Long Text Area | 32000 |
| Sync Date | Sync_Date__c | Date/Time | - |
| Duration (ms) | Duration_MS__c | Number | 18, 0 |

### BC_Order_Line_Item__c (Optional - for detailed line items)

**To create:**

1. Go to **Setup** > **Object Manager** > **Create** > **Custom Object**
2. Set the following:
   - **Label**: BC Order Line Item
   - **Plural Label**: BC Order Line Items
   - **Object Name**: BC_Order_Line_Item

**Custom Fields:**

| Field Label | Field Name | Data Type | Relationship |
|------------|------------|-----------|--------------|
| Order | Order__c | Master-Detail(Order) | - |
| Product Name | Product_Name__c | Text(255) | - |
| Quantity | Quantity__c | Number(18,0) | - |
| Unit Price | Unit_Price__c | Currency(18,2) | - |
| Total Price | Total_Price__c | Currency(18,2) | - |
| SKU | SKU__c | Text(100) | - |

## Custom Fields

### Order Object Custom Fields

Navigate to **Setup** > **Object Manager** > **Order** > **Fields & Relationships** > **New**

| Field Label | Field Name | Data Type | Length |
|------------|------------|-----------|--------|
| BigCommerce Order ID | BigCommerceOrderId__c | Text | 50 |
| Subtotal | Subtotal__c | Currency | 18, 2 |
| Tax Total | TaxTotal__c | Currency | 18, 2 |
| Shipping Total | ShippingTotal__c | Currency | 18, 2 |
| BC Status | BC_Status__c | Text | 100 |
| Tracking Number | TrackingNumber__c | Text | 100 |
| Payment Method | PaymentMethod__c | Text | 100 |
| Transaction ID | TransactionId__c | Text | 100 |

**Important:** Set `BigCommerceOrderId__c` as:
- **External ID**: ✓ Checked
- **Unique**: ✓ Checked (Case Insensitive)

### Account Object Custom Fields

Navigate to **Setup** > **Object Manager** > **Account** > **Fields & Relationships** > **New**

| Field Label | Field Name | Data Type | Length/Precision |
|------------|------------|-----------|------------------|
| CLV (Customer Lifetime Value) | CLV__c | Currency | 18, 2 |
| Total Orders | Total_Orders__c | Number | 18, 0 |
| Customer Tier | Customer_Tier__c | Picklist | Bronze, Silver, Gold, Platinum |
| RFM Score | RFM_Score__c | Text | 10 |
| Last Order Date | Last_Order_Date__c | Date | - |
| Average Order Value | Average_Order_Value__c | Currency | 18, 2 |

### Contact Object Custom Fields

Navigate to **Setup** > **Object Manager** > **Contact** > **Fields & Relationships** > **New**

| Field Label | Field Name | Data Type | Length/Precision |
|------------|------------|-----------|------------------|
| Last Order Date | Last_Order_Date__c | Date | - |
| Order Count | Order_Count__c | Number | 18, 0 |
| Total Spent | Total_Spent__c | Currency | 18, 2 |

### Lead Object Custom Fields

Navigate to **Setup** > **Object Manager** > **Lead** > **Fields & Relationships** > **New**

| Field Label | Field Name | Data Type | Length/Precision |
|------------|------------|-----------|------------------|
| Abandoned Cart Value | AbandonedCartValue__c | Currency | 18, 2 |
| Abandoned Cart ID | AbandonedCartId__c | Text | 100 |
| Abandoned Cart Date | AbandonedCartDate__c | Date/Time | - |
| Cart Items | Cart_Items__c | Long Text Area | 5000 |

**Important:** Set `AbandonedCartId__c` as:
- **External ID**: ✓ Checked
- **Unique**: ✓ Checked (Case Insensitive)

### Opportunity Object Custom Fields

Navigate to **Setup** > **Object Manager** > **Opportunity** > **Fields & Relationships** > **New**

| Field Label | Field Name | Data Type | Length/Precision |
|------------|------------|-----------|------------------|
| Cart ID | Cart_ID__c | Text | 100 |
| Cart Value | Cart_Value__c | Currency | 18, 2 |
| Abandoned Date | Abandoned_Date__c | Date/Time | - |

## Platform Events

### BigCommerce_Order_Created__e

**To create:**

1. Go to **Setup** > **Platform Events** > **New Platform Event**
2. Set:
   - **Label**: BigCommerce Order Created
   - **Plural Label**: BigCommerce Orders Created
   - **Object Name**: BigCommerce_Order_Created

**Custom Fields:**

| Field Label | Field Name | Data Type | Length |
|------------|------------|-----------|--------|
| Event Type | EventType__c | Text | 50 |
| Order ID | OrderId__c | Text | 18 |
| BigCommerce Order ID | BigCommerceOrderId__c | Text | 50 |
| Account ID | AccountId__c | Text | 18 |
| Total Amount | TotalAmount__c | Number | 18, 2 |
| Order Date | OrderDate__c | Date/Time | - |

### BigCommerce_Cart_Abandoned__e

**To create:**

1. Go to **Setup** > **Platform Events** > **New Platform Event**
2. Set:
   - **Label**: BigCommerce Cart Abandoned
   - **Plural Label**: BigCommerce Carts Abandoned
   - **Object Name**: BigCommerce_Cart_Abandoned

**Custom Fields:**

| Field Label | Field Name | Data Type | Length |
|------------|------------|-----------|--------|
| Event Type | EventType__c | Text | 50 |
| Cart ID | CartId__c | Text | 100 |
| Customer Email | CustomerEmail__c | Text | 255 |
| Cart Value | CartValue__c | Number | 18, 2 |
| Lead ID | LeadId__c | Text | 18 |
| Opportunity ID | OpportunityId__c | Text | 18 |
| Abandoned Date | AbandonedDate__c | Date/Time | - |

## Connected App

### Create Connected App for Integration

1. Go to **Setup** > **App Manager** > **New Connected App**

2. Fill in:
   - **Connected App Name**: BigCommerce Integration
   - **API Name**: BigCommerce_Integration
   - **Contact Email**: your-email@example.com

3. **Enable OAuth Settings**: ✓ Checked
   - **Callback URL**: `https://login.salesforce.com/services/oauth2/callback`
   - **Selected OAuth Scopes**:
     - Access and manage your data (api)
     - Perform requests on your behalf at any time (refresh_token, offline_access)
     - Full access (full)

4. Click **Save**

5. After saving, click **Manage Consumer Details** to view:
   - **Consumer Key** (use as `SALESFORCE_CLIENT_ID`)
   - **Consumer Secret** (use as `SALESFORCE_CLIENT_SECRET`)

### Configure OAuth Policies

1. Go back to the Connected App
2. Click **Edit Policies**
3. Set:
   - **Permitted Users**: All users may self-authorize
   - **IP Relaxation**: Relax IP restrictions
   - **Refresh Token Policy**: Refresh token is valid until revoked

## Permission Sets

### BigCommerce Integration Admin

**To create:**

1. Go to **Setup** > **Permission Sets** > **New**
2. Set:
   - **Label**: BigCommerce Integration Admin
   - **API Name**: BigCommerce_Integration_Admin

**Assigned Permissions:**

- **Object Permissions**:
  - Account: Read, Create, Edit
  - Contact: Read, Create, Edit
  - Order: Read, Create, Edit
  - Lead: Read, Create, Edit
  - Opportunity: Read, Create, Edit
  - Task: Read, Create, Edit
  - BC_Sync_Log__c: Read, Create, Edit, Delete

- **Field Permissions**: All custom fields created above

- **System Permissions**:
  - API Enabled
  - View Setup and Configuration

### BigCommerce Integration User

Similar to Admin but with limited delete permissions.

### BigCommerce Integration Read Only

Only Read permissions on all objects.

## Reports and Dashboards

### Pre-built Reports

#### 1. Orders by Date Range

**Report Type**: Orders
**Filters**:
- Order Date = THIS_MONTH
**Columns**:
- Order Number
- Account Name
- Total Amount
- Order Date
- BC Status

#### 2. Abandoned Carts (Leads)

**Report Type**: Leads
**Filters**:
- Lead Source = Abandoned Cart
- Status = Open - Not Contacted
**Columns**:
- Name
- Email
- Company
- Abandoned Cart Value
- Abandoned Cart Date
**Sort By**: Abandoned Cart Value (Descending)

#### 3. Abandoned Carts (Opportunities)

**Report Type**: Opportunities
**Filters**:
- Lead Source = Abandoned Cart
- Stage = Prospecting
**Columns**:
- Opportunity Name
- Account Name
- Amount
- Cart ID
- Abandoned Date
- Stage

#### 4. Customer Segmentation

**Report Type**: Accounts
**Filters**:
- CLV > 0
**Columns**:
- Account Name
- Customer Tier
- CLV
- Total Orders
- Average Order Value
- Last Order Date
**Group By**: Customer Tier

#### 5. Revenue by Customer Tier

**Report Type**: Accounts with Orders
**Filters**:
- Order Date = THIS_YEAR
**Summary**:
- Sum of Total Amount
**Group By**: Customer Tier

### Executive Dashboard

**Components:**
1. **Gauge**: Total Revenue (This Month)
2. **Donut Chart**: Revenue by Customer Tier
3. **Line Chart**: Orders Over Time
4. **Table**: Top 10 Customers by CLV
5. **Funnel Chart**: Abandoned Cart Recovery Rate
6. **Metric**: Average Order Value

## Validation Rules

### Order_Minimum_Amount

**Object**: Order
**Formula**:
```
TotalAmount < 0
```
**Error Message**: "Order amount cannot be negative"

### Lead_Email_Required

**Object**: Lead
**Formula**:
```
AND(
  ISPICKVAL(LeadSource, "Abandoned Cart"),
  ISBLANK(Email)
)
```
**Error Message**: "Email is required for abandoned cart leads"

## Field History Tracking

Enable field history tracking for key fields:

### Order Object
1. Go to **Setup** > **Object Manager** > **Order** > **Fields & Relationships** > **Set History Tracking**
2. Enable tracking for:
   - Status
   - Total Amount
   - BC Status
   - Tracking Number

### Account Object
1. Go to **Setup** > **Object Manager** > **Account** > **Fields & Relationships** > **Set History Tracking**
2. Enable tracking for:
   - CLV
   - Customer Tier
   - Total Orders

### Opportunity Object
1. Go to **Setup** > **Object Manager** > **Opportunity** > **Fields & Relationships** > **Set History Tracking**
2. Enable tracking for:
   - Stage
   - Amount

## Testing Your Setup

1. **Create test data** in your Salesforce sandbox
2. **Test the Connected App** by authenticating from the Node.js application
3. **Verify field-level security** for different user profiles
4. **Test platform events** using Workbench or Apex
5. **Run reports** to ensure data is visible

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify username, password, and security token
   - Check IP restrictions on Connected App
   - Ensure API access is enabled

2. **Field Not Found Errors**
   - Verify custom fields are created with exact API names
   - Check field-level security for integration user

3. **Insufficient Privileges**
   - Assign appropriate permission set to integration user
   - Verify object and field permissions

4. **Platform Events Not Publishing**
   - Check platform event definitions
   - Verify event field names match code
   - Review debug logs

## Next Steps

1. Deploy to Salesforce Sandbox first
2. Test thoroughly with sample data
3. Train users on new features
4. Deploy to Production
5. Monitor integration via BC_Sync_Log__c records

## Support

For issues and questions, refer to:
- [Salesforce Help](https://help.salesforce.com)
- [BigCommerce Documentation](https://developer.bigcommerce.com)
- Project GitHub repository
