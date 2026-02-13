const bigcommerceService = require('../services/bigcommerce');
const salesforceService = require('../services/salesforce');
const orderService = require('../services/orderService');
const customerAnalyticsService = require('../services/customerAnalytics');
const cartRecoveryService = require('../services/cartRecovery');
const platformEventsService = require('../services/platformEvents');
const auditLogService = require('../services/auditLog');
const { mapOrderToSalesforce, mapCustomerData, mapAbandonedCartToLead } = require('../utils/mapper');
const logger = require('../utils/logger');
const { config } = require('../config');
const { isFeatureEnabled } = require('../config/features');

/**
 * Retry logic for failed operations
 */
async function retryOperation(operation, maxAttempts = config.retry.maxAttempts) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(`Operation failed, attempt ${attempt}/${maxAttempts}`, { 
        error: error.message 
      });
      
      if (attempt < maxAttempts) {
        // Wait before retrying (exponential backoff)
        const delay = config.retry.delayMs * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Handle order created/updated webhook
 */
async function handleOrderWebhook(req, res) {
  const { scope, data } = req.body;
  const orderId = data.id;

  logger.info('Processing order webhook', { scope, orderId });

  try {
    // Fetch complete order details from BigCommerce
    const order = await retryOperation(() => bigcommerceService.getOrder(orderId));
    
    // Only process completed orders
    if (!['Completed', 'Shipped', 'Awaiting Shipment'].includes(order.status)) {
      logger.info('Order not in completed state, skipping', { 
        orderId, 
        status: order.status 
      });
      return res.status(200).json({ 
        message: 'Order status not eligible for sync',
        orderId,
        status: order.status
      });
    }

    // Map customer data
    const customerData = mapCustomerData(order);

    // Find or create Account and Contact in Salesforce
    const accountId = await retryOperation(() => 
      salesforceService.findOrCreateAccount(customerData)
    );
    
    const contactId = await retryOperation(() => 
      salesforceService.findOrCreateContact(customerData, accountId)
    );

    // Fetch order products for line items
    let products = [];
    if (isFeatureEnabled('orderLineItems')) {
      products = await retryOperation(() => 
        bigcommerceService.getOrderProducts(orderId)
      );
    }

    // Create order with line items using enhanced service
    const salesforceOrderId = await retryOperation(() => 
      orderService.createOrderWithLineItems(order, products, accountId, contactId)
    );

    // Update customer analytics
    if (isFeatureEnabled('customerLifetimeValue') || isFeatureEnabled('customerSegmentation')) {
      await customerAnalyticsService.updateCustomerAnalytics(accountId, parseFloat(order.total_inc_tax));
    }

    // Publish platform event
    if (isFeatureEnabled('platformEvents')) {
      await platformEventsService.publishOrderCreated({
        orderId: salesforceOrderId,
        bigCommerceOrderId: orderId,
        accountId,
        totalAmount: parseFloat(order.total_inc_tax)
      });
    }

    // Log to audit trail
    await auditLogService.logOrderSync(orderId, salesforceOrderId, true);

    logger.info('Successfully synced order to Salesforce', { 
      orderId, 
      salesforceOrderId,
      accountId,
      contactId
    });

    res.status(200).json({
      success: true,
      message: 'Order synced successfully',
      orderId,
      salesforceOrderId
    });
  } catch (error) {
    logger.error('Error processing order webhook', { 
      orderId, 
      error: error.message,
      stack: error.stack
    });

    // Log failure to audit trail
    await auditLogService.logOrderSync(orderId, null, false, error);

    res.status(500).json({
      success: false,
      error: 'Failed to sync order',
      orderId,
      message: error.message
    });
  }
}

/**
 * Handle abandoned cart webhook
 */
async function handleAbandonedCartWebhook(req, res) {
  const { scope, data } = req.body;
  const cartId = data.id;

  logger.info('Processing abandoned cart webhook', { scope, cartId });

  try {
    // Fetch cart details from BigCommerce
    const cart = await retryOperation(() => bigcommerceService.getCart(cartId));

    // Get customer data if available
    let customerData = null;
    if (cart.customer_id) {
      customerData = await retryOperation(() => 
        bigcommerceService.getCustomer(cart.customer_id)
      );
    }

    // Prepare customer data for cart recovery
    const mappedCustomerData = customerData ? {
      first_name: customerData.first_name || 'Unknown',
      last_name: customerData.last_name || 'Customer',
      email: customerData.email || cart.email || 'unknown@example.com',
      phone: customerData.phone || '',
      company: customerData.company || ''
    } : mapCustomerData({ billing_address: cart.billing_address, customer_email: cart.email });

    // Use cart recovery service to create Opportunity or Lead based on value
    const result = await retryOperation(() => 
      cartRecoveryService.processAbandonedCart(cart, mappedCustomerData)
    );

    // Publish platform event
    if (isFeatureEnabled('platformEvents')) {
      await platformEventsService.publishCartAbandoned({
        cartId: cart.id,
        customerEmail: mappedCustomerData.email,
        cartValue: result.cartValue,
        leadId: result.type === 'Lead' ? result.id : null,
        opportunityId: result.type === 'Opportunity' ? result.id : null
      });
    }

    // Log to audit trail
    await auditLogService.logCartSync(cartId, result.id, true);

    logger.info('Successfully synced abandoned cart to Salesforce', { 
      cartId, 
      type: result.type,
      id: result.id
    });

    res.status(200).json({
      success: true,
      message: 'Abandoned cart synced successfully',
      cartId,
      type: result.type,
      salesforceId: result.id
    });
  } catch (error) {
    logger.error('Error processing abandoned cart webhook', { 
      cartId, 
      error: error.message,
      stack: error.stack
    });

    // Log failure to audit trail
    await auditLogService.logCartSync(cartId, null, false, error);

    res.status(500).json({
      success: false,
      error: 'Failed to sync abandoned cart',
      cartId,
      message: error.message
    });
  }
}

/**
 * Handle general webhook (for testing and logging)
 */
async function handleGeneralWebhook(req, res) {
  const { scope, data } = req.body;
  
  logger.info('Received webhook', { scope, data });

  res.status(200).json({
    success: true,
    message: 'Webhook received',
    scope
  });
}

module.exports = {
  handleOrderWebhook,
  handleAbandonedCartWebhook,
  handleGeneralWebhook
};
