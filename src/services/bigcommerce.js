const axios = require('axios');
const { config } = require('../config');
const logger = require('../utils/logger');

class BigCommerceService {
  constructor() {
    this.apiUrl = `${config.bigcommerce.apiUrl}/stores/${config.bigcommerce.storeHash}`;
    this.headers = {
      'X-Auth-Token': config.bigcommerce.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Get order details by ID
   */
  async getOrder(orderId) {
    try {
      logger.info('Fetching order from BigCommerce', { orderId });
      
      const response = await axios.get(
        `${this.apiUrl}/v2/orders/${orderId}`,
        { headers: this.headers }
      );

      logger.info('Successfully fetched order', { orderId });
      return response.data;
    } catch (error) {
      logger.error('Error fetching order from BigCommerce', { 
        orderId, 
        error: error.message,
        response: error.response?.data 
      });
      throw error;
    }
  }

  /**
   * Get order products (line items)
   */
  async getOrderProducts(orderId) {
    try {
      logger.info('Fetching order products from BigCommerce', { orderId });
      
      const response = await axios.get(
        `${this.apiUrl}/v2/orders/${orderId}/products`,
        { headers: this.headers }
      );

      logger.info('Successfully fetched order products', { orderId, count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Error fetching order products from BigCommerce', { 
        orderId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get order shipping addresses
   */
  async getOrderShippingAddresses(orderId) {
    try {
      logger.info('Fetching order shipping addresses from BigCommerce', { orderId });
      
      const response = await axios.get(
        `${this.apiUrl}/v2/orders/${orderId}/shipping_addresses`,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching shipping addresses from BigCommerce', { 
        orderId, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Get cart details by ID
   */
  async getCart(cartId) {
    try {
      logger.info('Fetching cart from BigCommerce', { cartId });
      
      const response = await axios.get(
        `${this.apiUrl}/v3/carts/${cartId}`,
        { headers: this.headers }
      );

      logger.info('Successfully fetched cart', { cartId });
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching cart from BigCommerce', { 
        cartId, 
        error: error.message,
        response: error.response?.data 
      });
      throw error;
    }
  }

  /**
   * Get customer by ID
   * Note: Uses v3/customers endpoint with id:in filter which supports
   * comma-separated IDs for bulk queries. For single customer lookup,
   * this is the recommended approach per BigCommerce API v3 documentation.
   */
  async getCustomer(customerId) {
    try {
      logger.info('Fetching customer from BigCommerce', { customerId });
      
      const response = await axios.get(
        `${this.apiUrl}/v3/customers?id:in=${customerId}`,
        { headers: this.headers }
      );

      if (response.data.data && response.data.data.length > 0) {
        logger.info('Successfully fetched customer', { customerId });
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      logger.error('Error fetching customer from BigCommerce', { 
        customerId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Register a webhook
   */
  async registerWebhook(scope, destination) {
    try {
      logger.info('Registering webhook', { scope, destination });
      
      const response = await axios.post(
        `${this.apiUrl}/v3/hooks`,
        {
          scope,
          destination,
          is_active: true
        },
        { headers: this.headers }
      );

      logger.info('Successfully registered webhook', { 
        scope, 
        webhookId: response.data.data.id 
      });
      return response.data.data;
    } catch (error) {
      // Check if webhook already exists
      if (error.response?.status === 422) {
        logger.warn('Webhook already exists', { scope });
        return null;
      }
      
      logger.error('Error registering webhook', { 
        scope, 
        error: error.message,
        response: error.response?.data 
      });
      throw error;
    }
  }

  /**
   * List all webhooks
   */
  async listWebhooks() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v3/hooks`,
        { headers: this.headers }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Error listing webhooks', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BigCommerceService();
