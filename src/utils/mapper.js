const logger = require('./logger');

/**
 * Map BigCommerce order data to Salesforce Order format
 */
function mapOrderToSalesforce(bcOrder, accountId, contactId) {
  try {
    logger.info('Mapping BigCommerce order to Salesforce format', { orderId: bcOrder.id });

    // Map order status
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

    const salesforceOrder = {
      // External ID from BigCommerce
      AccountId: accountId,
      Status: statusMap[bcOrder.status] || 'Draft',
      EffectiveDate: new Date(bcOrder.date_created).toISOString().split('T')[0],
      
      // Order details
      OrderNumber: bcOrder.id.toString(),
      TotalAmount: parseFloat(bcOrder.total_inc_tax),
      
      // Billing information
      BillingStreet: bcOrder.billing_address?.street_1,
      BillingCity: bcOrder.billing_address?.city,
      BillingState: bcOrder.billing_address?.state,
      BillingPostalCode: bcOrder.billing_address?.zip,
      BillingCountry: bcOrder.billing_address?.country,
      
      // Shipping information (if available)
      ShippingStreet: bcOrder.shipping_addresses?.[0]?.street_1,
      ShippingCity: bcOrder.shipping_addresses?.[0]?.city,
      ShippingState: bcOrder.shipping_addresses?.[0]?.state,
      ShippingPostalCode: bcOrder.shipping_addresses?.[0]?.zip,
      ShippingCountry: bcOrder.shipping_addresses?.[0]?.country,
      
      // Additional fields
      Description: `Order from BigCommerce\nPayment Method: ${bcOrder.payment_method}\nStatus: ${bcOrder.status}`
    };

    // Add custom fields if needed
    // salesforceOrder.BigCommerceOrderId__c = bcOrder.id;
    // salesforceOrder.Subtotal__c = parseFloat(bcOrder.subtotal_inc_tax);
    // salesforceOrder.TaxTotal__c = parseFloat(bcOrder.total_tax);
    // salesforceOrder.ShippingTotal__c = parseFloat(bcOrder.shipping_cost_inc_tax);

    logger.info('Successfully mapped order to Salesforce format', { orderId: bcOrder.id });
    return salesforceOrder;
  } catch (error) {
    logger.error('Error mapping order to Salesforce', { error: error.message, bcOrder });
    throw error;
  }
}

/**
 * Map BigCommerce customer data to Salesforce Contact/Account format
 */
function mapCustomerData(bcOrder) {
  try {
    const billingAddress = bcOrder.billing_address || {};
    
    return {
      first_name: billingAddress.first_name || 'Unknown',
      last_name: billingAddress.last_name || 'Customer',
      email: billingAddress.email || bcOrder.customer_email || 'unknown@example.com',
      phone: billingAddress.phone || '',
      company: billingAddress.company || '',
      address_1: billingAddress.street_1 || '',
      city: billingAddress.city || '',
      state: billingAddress.state || '',
      zip: billingAddress.zip || '',
      country: billingAddress.country || ''
    };
  } catch (error) {
    logger.error('Error mapping customer data', { error: error.message });
    throw error;
  }
}

/**
 * Map abandoned cart to Salesforce Lead
 */
function mapAbandonedCartToLead(cart, cartData) {
  try {
    logger.info('Mapping abandoned cart to Salesforce Lead', { cartId: cart.id });

    // Extract customer information
    const customerEmail = cart.email || cartData?.customer?.email || 'unknown@example.com';
    const customerName = extractCustomerName(cart, cartData);

    // Calculate cart value
    const cartValue = calculateCartValue(cart);

    // Build cart items description
    const itemsDescription = buildCartItemsDescription(cart.line_items);

    const lead = {
      FirstName: customerName.firstName,
      LastName: customerName.lastName,
      Email: customerEmail,
      Company: customerName.firstName + ' ' + customerName.lastName,
      LeadSource: 'Abandoned Cart',
      Status: 'Open - Not Contacted',
      Description: `Abandoned Cart - ${new Date().toISOString()}\n\nCart ID: ${cart.id}\nCart Value: $${cartValue.toFixed(2)}\n\nItems:\n${itemsDescription}`,
      
      // Custom fields if available
      // AbandonedCartValue__c: cartValue,
      // AbandonedCartId__c: cart.id,
      // AbandonedCartDate__c: new Date().toISOString()
    };

    logger.info('Successfully mapped abandoned cart to Lead', { cartId: cart.id, email: customerEmail });
    return lead;
  } catch (error) {
    logger.error('Error mapping abandoned cart to Lead', { error: error.message, cart });
    throw error;
  }
}

/**
 * Extract customer name from cart data
 */
function extractCustomerName(cart, cartData) {
  let firstName = 'Unknown';
  let lastName = 'Customer';

  // Try to get name from cart data
  if (cartData?.customer) {
    firstName = cartData.customer.first_name || firstName;
    lastName = cartData.customer.last_name || lastName;
  }

  // Try to get name from billing address
  if (cart.billing_address) {
    firstName = cart.billing_address.first_name || firstName;
    lastName = cart.billing_address.last_name || lastName;
  }

  return { firstName, lastName };
}

/**
 * Calculate total cart value
 */
function calculateCartValue(cart) {
  let total = 0;

  if (cart.base_amount) {
    total = parseFloat(cart.base_amount);
  } else if (cart.line_items && Array.isArray(cart.line_items.physical_items)) {
    cart.line_items.physical_items.forEach(item => {
      total += parseFloat(item.list_price) * item.quantity;
    });
  }

  return total;
}

/**
 * Build a description of cart items
 */
function buildCartItemsDescription(lineItems) {
  if (!lineItems) return 'No items';

  const items = [];

  if (lineItems.physical_items && Array.isArray(lineItems.physical_items)) {
    lineItems.physical_items.forEach(item => {
      items.push(`- ${item.name} (Qty: ${item.quantity}, Price: $${item.list_price})`);
    });
  }

  if (lineItems.digital_items && Array.isArray(lineItems.digital_items)) {
    lineItems.digital_items.forEach(item => {
      items.push(`- ${item.name} (Digital) (Qty: ${item.quantity}, Price: $${item.list_price})`);
    });
  }

  return items.length > 0 ? items.join('\n') : 'No items';
}

module.exports = {
  mapOrderToSalesforce,
  mapCustomerData,
  mapAbandonedCartToLead
};
