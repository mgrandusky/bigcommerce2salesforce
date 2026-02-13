const salesforceService = require('./salesforce');
const logger = require('../utils/logger');
const { isFeatureEnabled, getCustomField } = require('../config/features');

/**
 * Enhanced Order Service
 * Handles advanced order management features
 */
class OrderService {
  /**
   * Create Order with Line Items
   */
  async createOrderWithLineItems(bcOrder, bcProducts, accountId, contactId) {
    try {
      // Create the main order
      const orderData = this._mapOrderData(bcOrder, accountId, contactId);
      const orderId = await salesforceService.createOrder(orderData);

      // Create line items if feature is enabled
      if (isFeatureEnabled('orderLineItems') && bcProducts && bcProducts.length > 0) {
        await this._createOrderLineItems(orderId, bcProducts, bcOrder);
      }

      return orderId;
    } catch (error) {
      logger.error('Error creating order with line items', { error: error.message });
      throw error;
    }
  }

  /**
   * Map order data including custom fields
   */
  _mapOrderData(bcOrder, accountId, contactId) {
    const orderData = {
      AccountId: accountId,
      Status: this._mapOrderStatus(bcOrder.status),
      EffectiveDate: new Date(bcOrder.date_created).toISOString().split('T')[0],
      OrderNumber: bcOrder.id.toString(),
      TotalAmount: parseFloat(bcOrder.total_inc_tax),
      BillingStreet: bcOrder.billing_address?.street_1,
      BillingCity: bcOrder.billing_address?.city,
      BillingState: bcOrder.billing_address?.state,
      BillingPostalCode: bcOrder.billing_address?.zip,
      BillingCountry: bcOrder.billing_address?.country,
      ShippingStreet: bcOrder.shipping_addresses?.[0]?.street_1,
      ShippingCity: bcOrder.shipping_addresses?.[0]?.city,
      ShippingState: bcOrder.shipping_addresses?.[0]?.state,
      ShippingPostalCode: bcOrder.shipping_addresses?.[0]?.zip,
      ShippingCountry: bcOrder.shipping_addresses?.[0]?.country,
      Description: `Order from BigCommerce\nPayment Method: ${bcOrder.payment_method}\nStatus: ${bcOrder.status}`
    };

    // Add custom fields if they exist
    const bcIdField = getCustomField('order', 'bigCommerceOrderId');
    if (bcIdField) orderData[bcIdField] = bcOrder.id.toString();

    const subtotalField = getCustomField('order', 'subtotal');
    if (subtotalField) orderData[subtotalField] = parseFloat(bcOrder.subtotal_inc_tax);

    const taxField = getCustomField('order', 'taxTotal');
    if (taxField) orderData[taxField] = parseFloat(bcOrder.total_tax);

    const shippingField = getCustomField('order', 'shippingTotal');
    if (shippingField) orderData[shippingField] = parseFloat(bcOrder.shipping_cost_inc_tax);

    const bcStatusField = getCustomField('order', 'bcStatus');
    if (bcStatusField) orderData[bcStatusField] = bcOrder.status;

    if (isFeatureEnabled('paymentDetails')) {
      const paymentMethodField = getCustomField('order', 'paymentMethod');
      if (paymentMethodField) orderData[paymentMethodField] = bcOrder.payment_method;

      const transactionIdField = getCustomField('order', 'transactionId');
      if (transactionIdField && bcOrder.payment_provider_id) {
        orderData[transactionIdField] = bcOrder.payment_provider_id;
      }
    }

    return orderData;
  }

  /**
   * Create Order Line Items (OrderItem records)
   */
  async _createOrderLineItems(orderId, bcProducts, bcOrder) {
    try {
      const orderItems = [];

      for (const product of bcProducts) {
        const orderItem = {
          OrderId: orderId,
          Quantity: product.quantity,
          UnitPrice: parseFloat(product.base_price),
          Description: product.name,
          // Note: Product2Id and PricebookEntryId would require product sync
          // These would be populated if productCatalogSync feature is enabled
        };

        orderItems.push(orderItem);
      }

      // Create all order items
      if (orderItems.length > 0) {
        const results = await salesforceService.createBulk('OrderItem', orderItems);
        logger.info(`Created ${results.length} order line items`, { orderId });
        return results;
      }
      return [];
    } catch (error) {
      // Log warning but don't throw - order is already created, line items are supplementary
      logger.warn('Failed to create order line items (non-critical)', { 
        error: error.message, 
        orderId,
        productCount: bcProducts.length 
      });
      return []; // Return empty array to indicate line items creation failed
    }
  }

  /**
   * Map order status to Salesforce
   */
  _mapOrderStatus(bcStatus) {
    const statusMap = {
      'Pending': 'Draft',
      'Shipped': 'Activated',
      'Partially Shipped': 'Activated',
      'Refunded': 'Activated',
      'Cancelled': 'Activated',
      'Declined': 'Draft',
      'Awaiting Payment': 'Draft',
      'Awaiting Pickup': 'Activated',
      'Awaiting Shipment': 'Activated',
      'Completed': 'Activated',
      'Awaiting Fulfillment': 'Activated',
      'Manual Verification Required': 'Draft',
      'Disputed': 'Activated',
      'Partially Refunded': 'Activated'
    };
    return statusMap[bcStatus] || 'Draft';
  }

  /**
   * Update order tracking information
   */
  async updateOrderTracking(salesforceOrderId, trackingNumber, carrier, trackingUrl) {
    if (!isFeatureEnabled('fulfillmentStatus')) {
      return;
    }

    try {
      const updateData = {
        Id: salesforceOrderId
      };

      const trackingField = getCustomField('order', 'trackingNumber');
      if (trackingField) {
        updateData[trackingField] = trackingNumber;
      }

      await salesforceService.updateRecord('Order', updateData);
      logger.info('Updated order tracking', { salesforceOrderId, trackingNumber });
    } catch (error) {
      logger.error('Error updating order tracking', { error: error.message });
    }
  }

  /**
   * Create refund/credit memo
   */
  async createRefund(bcRefund, salesforceOrderId) {
    if (!isFeatureEnabled('refundsReturns')) {
      return;
    }

    // In a full implementation, this would create a custom Refund object or CreditMemo
    logger.info('Refund tracking not fully implemented', { bcRefund, salesforceOrderId });
  }
}

module.exports = new OrderService();
