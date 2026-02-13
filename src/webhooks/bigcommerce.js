const bigcommerceService = require('../services/bigcommerce');
const salesforceService = require('../services/salesforce');
const { mapOrderToSalesforce, mapCustomerData, mapAbandonedCartToLead } = require('../utils/mapper');
const logger = require('../utils/logger');
const { config } = require('../config');

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

    // Map order to Salesforce format
    const salesforceOrder = mapOrderToSalesforce(order, accountId, contactId);

    // Create order in Salesforce
    const salesforceOrderId = await retryOperation(() => 
      salesforceService.createOrder(salesforceOrder)
    );

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
      customerData = await bigcommerceService.getCustomer(cart.customer_id);
    }

    // Map cart to Salesforce Lead
    const lead = mapAbandonedCartToLead(cart, customerData);

    // Create Lead in Salesforce
    const salesforceLeadId = await retryOperation(() => 
      salesforceService.createLead(lead)
    );

    logger.info('Successfully synced abandoned cart to Salesforce', { 
      cartId, 
      salesforceLeadId
    });

    res.status(200).json({
      success: true,
      message: 'Abandoned cart synced successfully',
      cartId,
      salesforceLeadId
    });
  } catch (error) {
    logger.error('Error processing abandoned cart webhook', { 
      cartId, 
      error: error.message,
      stack: error.stack
    });

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
