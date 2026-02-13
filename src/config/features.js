/**
 * Feature Flags Configuration
 * Enable/disable features without code changes
 */

const featureFlags = {
  // Advanced Order Management
  orderLineItems: process.env.FEATURE_ORDER_LINE_ITEMS === 'true',
  bidirectionalSync: process.env.FEATURE_BIDIRECTIONAL_SYNC === 'true',
  productCatalogSync: process.env.FEATURE_PRODUCT_CATALOG_SYNC === 'true',
  priceBookManagement: process.env.FEATURE_PRICE_BOOK_MANAGEMENT === 'true',
  refundsReturns: process.env.FEATURE_REFUNDS_RETURNS === 'true',
  paymentDetails: process.env.FEATURE_PAYMENT_DETAILS === 'true',
  taxShippingBreakdown: process.env.FEATURE_TAX_SHIPPING_BREAKDOWN === 'true',
  orderNotes: process.env.FEATURE_ORDER_NOTES === 'true',

  // Enhanced Customer Data
  accountContactHierarchy: process.env.FEATURE_ACCOUNT_CONTACT_HIERARCHY === 'true',
  contactRoles: process.env.FEATURE_CONTACT_ROLES === 'true',
  duplicateDetection: process.env.FEATURE_DUPLICATE_DETECTION === 'true',
  customerSegmentation: process.env.FEATURE_CUSTOMER_SEGMENTATION === 'true',
  customerLifetimeValue: process.env.FEATURE_CUSTOMER_LIFETIME_VALUE === 'true',
  rfmAnalysis: process.env.FEATURE_RFM_ANALYSIS === 'true',
  customerTags: process.env.FEATURE_CUSTOMER_TAGS === 'true',

  // Cart Recovery & Opportunities
  opportunityCreation: process.env.FEATURE_OPPORTUNITY_CREATION === 'true',
  leadCreationLowValue: process.env.FEATURE_LEAD_CREATION_LOW_VALUE === 'true',
  recoveryTasks: process.env.FEATURE_RECOVERY_TASKS === 'true',
  assignmentRules: process.env.FEATURE_ASSIGNMENT_RULES === 'true',
  cartExpiration: process.env.FEATURE_CART_EXPIRATION === 'true',
  multiTouchAttribution: process.env.FEATURE_MULTI_TOUCH_ATTRIBUTION === 'true',

  // Marketing Integration
  campaignAssociation: process.env.FEATURE_CAMPAIGN_ASSOCIATION === 'true',
  campaignMemberManagement: process.env.FEATURE_CAMPAIGN_MEMBER_MANAGEMENT === 'true',
  marketingCloudConnector: process.env.FEATURE_MARKETING_CLOUD_CONNECTOR === 'true',
  pardotIntegration: process.env.FEATURE_PARDOT_INTEGRATION === 'true',
  leadSourceTracking: process.env.FEATURE_LEAD_SOURCE_TRACKING === 'true',

  // Sales Process Automation
  platformEvents: process.env.FEATURE_PLATFORM_EVENTS === 'true',
  chatterIntegration: process.env.FEATURE_CHATTER_INTEGRATION === 'true',
  approvalProcesses: process.env.FEATURE_APPROVAL_PROCESSES === 'true',
  queueManagement: process.env.FEATURE_QUEUE_MANAGEMENT === 'true',

  // Service Cloud Integration
  caseCreation: process.env.FEATURE_CASE_CREATION === 'true',
  orderToCaseLinking: process.env.FEATURE_ORDER_TO_CASE_LINKING === 'true',
  returnsManagement: process.env.FEATURE_RETURNS_MANAGEMENT === 'true',
  knowledgeBase: process.env.FEATURE_KNOWLEDGE_BASE === 'true',
  liveAgent: process.env.FEATURE_LIVE_AGENT === 'true',
  fieldService: process.env.FEATURE_FIELD_SERVICE === 'true',

  // Inventory & Fulfillment
  inventorySync: process.env.FEATURE_INVENTORY_SYNC === 'true',
  lowStockAlerts: process.env.FEATURE_LOW_STOCK_ALERTS === 'true',
  backorderManagement: process.env.FEATURE_BACKORDER_MANAGEMENT === 'true',
  fulfillmentStatus: process.env.FEATURE_FULFILLMENT_STATUS === 'true',
  multiWarehouse: process.env.FEATURE_MULTI_WAREHOUSE === 'true',
  orderRouting: process.env.FEATURE_ORDER_ROUTING === 'true',

  // Subscription & Recurring Revenue
  subscriptionManagement: process.env.FEATURE_SUBSCRIPTION_MANAGEMENT === 'true',
  contractManagement: process.env.FEATURE_CONTRACT_MANAGEMENT === 'true',
  renewalAutomation: process.env.FEATURE_RENEWAL_AUTOMATION === 'true',
  churnPrevention: process.env.FEATURE_CHURN_PREVENTION === 'true',
  mrrArrTracking: process.env.FEATURE_MRR_ARR_TRACKING === 'true',

  // AI & Machine Learning
  einsteinLeadScoring: process.env.FEATURE_EINSTEIN_LEAD_SCORING === 'true',
  einsteinOpportunityInsights: process.env.FEATURE_EINSTEIN_OPPORTUNITY_INSIGHTS === 'true',
  einsteinNextBestAction: process.env.FEATURE_EINSTEIN_NEXT_BEST_ACTION === 'true',
  sentimentAnalysis: process.env.FEATURE_SENTIMENT_ANALYSIS === 'true',

  // Performance & Scalability
  useBulkAPI: process.env.FEATURE_USE_BULK_API === 'true',
  useCompositeAPI: process.env.FEATURE_USE_COMPOSITE_API === 'true',
  usePlatformCache: process.env.FEATURE_USE_PLATFORM_CACHE === 'true',
  changeDataCapture: process.env.FEATURE_CHANGE_DATA_CAPTURE === 'true',

  // Data Quality & Governance
  fieldHistoryTracking: process.env.FEATURE_FIELD_HISTORY_TRACKING === 'true',
  auditTrail: process.env.FEATURE_AUDIT_TRAIL === 'true',
  dataArchiving: process.env.FEATURE_DATA_ARCHIVING === 'true',
  gdprCompliance: process.env.FEATURE_GDPR_COMPLIANCE === 'true'
};

/**
 * Configuration thresholds for various features
 */
const thresholds = {
  // Cart value threshold for creating Opportunities vs Leads
  opportunityMinValue: parseFloat(process.env.OPPORTUNITY_MIN_VALUE) || 100.0,
  
  // Customer segmentation thresholds
  customerTiers: {
    platinum: parseFloat(process.env.CUSTOMER_TIER_PLATINUM) || 10000,
    gold: parseFloat(process.env.CUSTOMER_TIER_GOLD) || 5000,
    silver: parseFloat(process.env.CUSTOMER_TIER_SILVER) || 1000,
    bronze: 0
  },

  // Cart expiration (days)
  cartExpirationDays: parseInt(process.env.CART_EXPIRATION_DAYS) || 30,

  // Low stock alert threshold
  lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD) || 10,

  // High value order threshold for approval
  highValueOrderThreshold: parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD) || 5000,

  // Churn risk threshold (days since last order)
  churnRiskDays: parseInt(process.env.CHURN_RISK_DAYS) || 90,

  // Data archiving threshold (days)
  archivingThresholdDays: parseInt(process.env.ARCHIVING_THRESHOLD_DAYS) || 730
};

/**
 * Custom field mappings for Salesforce custom fields
 */
const customFieldMappings = {
  order: {
    bigCommerceOrderId: process.env.SF_ORDER_BC_ID_FIELD || 'BigCommerceOrderId__c',
    subtotal: process.env.SF_ORDER_SUBTOTAL_FIELD || 'Subtotal__c',
    taxTotal: process.env.SF_ORDER_TAX_FIELD || 'TaxTotal__c',
    shippingTotal: process.env.SF_ORDER_SHIPPING_FIELD || 'ShippingTotal__c',
    bcStatus: process.env.SF_ORDER_BC_STATUS_FIELD || 'BC_Status__c',
    trackingNumber: process.env.SF_ORDER_TRACKING_FIELD || 'TrackingNumber__c',
    paymentMethod: process.env.SF_ORDER_PAYMENT_METHOD_FIELD || 'PaymentMethod__c',
    transactionId: process.env.SF_ORDER_TRANSACTION_ID_FIELD || 'TransactionId__c'
  },
  account: {
    clv: process.env.SF_ACCOUNT_CLV_FIELD || 'CLV__c',
    totalOrders: process.env.SF_ACCOUNT_TOTAL_ORDERS_FIELD || 'Total_Orders__c',
    customerTier: process.env.SF_ACCOUNT_CUSTOMER_TIER_FIELD || 'Customer_Tier__c',
    rfmScore: process.env.SF_ACCOUNT_RFM_SCORE_FIELD || 'RFM_Score__c',
    lastOrderDate: process.env.SF_ACCOUNT_LAST_ORDER_DATE_FIELD || 'Last_Order_Date__c',
    averageOrderValue: process.env.SF_ACCOUNT_AVG_ORDER_VALUE_FIELD || 'Average_Order_Value__c'
  },
  contact: {
    lastOrderDate: process.env.SF_CONTACT_LAST_ORDER_DATE_FIELD || 'Last_Order_Date__c',
    orderCount: process.env.SF_CONTACT_ORDER_COUNT_FIELD || 'Order_Count__c',
    totalSpent: process.env.SF_CONTACT_TOTAL_SPENT_FIELD || 'Total_Spent__c'
  },
  lead: {
    abandonedCartValue: process.env.SF_LEAD_CART_VALUE_FIELD || 'AbandonedCartValue__c',
    abandonedCartId: process.env.SF_LEAD_CART_ID_FIELD || 'AbandonedCartId__c',
    abandonedCartDate: process.env.SF_LEAD_CART_DATE_FIELD || 'AbandonedCartDate__c',
    cartItems: process.env.SF_LEAD_CART_ITEMS_FIELD || 'Cart_Items__c'
  },
  opportunity: {
    cartId: process.env.SF_OPP_CART_ID_FIELD || 'Cart_ID__c',
    cartValue: process.env.SF_OPP_CART_VALUE_FIELD || 'Cart_Value__c',
    abandonedDate: process.env.SF_OPP_ABANDONED_DATE_FIELD || 'Abandoned_Date__c'
  }
};

/**
 * Check if a feature is enabled
 */
function isFeatureEnabled(featureName) {
  return featureFlags[featureName] === true;
}

/**
 * Get threshold value
 */
function getThreshold(thresholdName) {
  if (thresholdName.includes('.')) {
    const parts = thresholdName.split('.');
    let value = thresholds;
    for (const part of parts) {
      value = value[part];
      if (value === undefined) return null;
    }
    return value;
  }
  return thresholds[thresholdName];
}

/**
 * Get custom field name
 */
function getCustomField(object, field) {
  if (customFieldMappings[object] && customFieldMappings[object][field]) {
    return customFieldMappings[object][field];
  }
  return null;
}

module.exports = {
  featureFlags,
  thresholds,
  customFieldMappings,
  isFeatureEnabled,
  getThreshold,
  getCustomField
};
