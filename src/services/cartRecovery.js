const salesforceService = require('./salesforce');
const logger = require('../utils/logger');
const { isFeatureEnabled, getCustomField, getThreshold } = require('../config/features');

/**
 * Cart Recovery Service
 * Handles abandoned cart recovery with Opportunities and Leads
 */
class CartRecoveryService {
  /**
   * Process abandoned cart
   * Creates either Opportunity (high value) or Lead (low value)
   */
  async processAbandonedCart(cart, customerData) {
    try {
      const cartValue = this._calculateCartValue(cart);
      const opportunityThreshold = getThreshold('opportunityMinValue');

      let result;
      if (cartValue >= opportunityThreshold && isFeatureEnabled('opportunityCreation')) {
        // High value - create Opportunity
        result = await this._createOpportunity(cart, customerData, cartValue);
      } else if (isFeatureEnabled('leadCreationLowValue')) {
        // Lower value - create Lead
        result = await this._createLead(cart, customerData, cartValue);
      } else {
        // Feature disabled - use default Lead creation
        result = await this._createLead(cart, customerData, cartValue);
      }

      // Create recovery task if enabled
      if (isFeatureEnabled('recoveryTasks') && result) {
        await this._createRecoveryTask(result);
      }

      return result;
    } catch (error) {
      logger.error('Error processing abandoned cart', { error: error.message });
      throw error;
    }
  }

  /**
   * Create Opportunity for high-value abandoned cart
   */
  async _createOpportunity(cart, customerData, cartValue) {
    try {
      logger.info('Creating Opportunity for high-value cart', { 
        cartId: cart.id, 
        cartValue 
      });

      // Find or create Account/Contact first
      const accountId = await salesforceService.findOrCreateAccount(customerData);
      const contactId = await salesforceService.findOrCreateContact(customerData, accountId);

      const opportunityData = {
        Name: `Abandoned Cart - ${cart.id}`,
        AccountId: accountId,
        StageName: 'Prospecting',
        Amount: cartValue,
        CloseDate: this._calculateCloseDate(),
        LeadSource: 'Abandoned Cart',
        Description: this._buildCartDescription(cart)
      };

      // Add custom fields
      const cartIdField = getCustomField('opportunity', 'cartId');
      if (cartIdField) opportunityData[cartIdField] = cart.id;

      const cartValueField = getCustomField('opportunity', 'cartValue');
      if (cartValueField) opportunityData[cartValueField] = cartValue;

      const abandonedDateField = getCustomField('opportunity', 'abandonedDate');
      if (abandonedDateField) opportunityData[abandonedDateField] = new Date().toISOString();

      const result = await salesforceService.createRecord('Opportunity', opportunityData);
      
      logger.info('Created Opportunity for abandoned cart', { 
        cartId: cart.id, 
        opportunityId: result.id 
      });

      return {
        type: 'Opportunity',
        id: result.id,
        accountId,
        contactId,
        cartValue
      };
    } catch (error) {
      logger.error('Error creating Opportunity', { error: error.message });
      throw error;
    }
  }

  /**
   * Create Lead for lower-value abandoned cart
   */
  async _createLead(cart, customerData, cartValue) {
    try {
      logger.info('Creating Lead for abandoned cart', { 
        cartId: cart.id, 
        cartValue 
      });

      const leadData = {
        FirstName: customerData.first_name || 'Unknown',
        LastName: customerData.last_name || 'Customer',
        Email: customerData.email,
        Company: customerData.company || `${customerData.first_name} ${customerData.last_name}`,
        LeadSource: 'Abandoned Cart',
        Status: 'Open - Not Contacted',
        Description: this._buildCartDescription(cart)
      };

      // Add custom fields
      const cartValueField = getCustomField('lead', 'abandonedCartValue');
      if (cartValueField) leadData[cartValueField] = cartValue;

      const cartIdField = getCustomField('lead', 'abandonedCartId');
      if (cartIdField) leadData[cartIdField] = cart.id;

      const abandonedDateField = getCustomField('lead', 'abandonedCartDate');
      if (abandonedDateField) leadData[abandonedDateField] = new Date().toISOString();

      const result = await salesforceService.createLead(leadData);

      logger.info('Created Lead for abandoned cart', { 
        cartId: cart.id, 
        leadId: result 
      });

      return {
        type: 'Lead',
        id: result,
        cartValue
      };
    } catch (error) {
      logger.error('Error creating Lead', { error: error.message });
      throw error;
    }
  }

  /**
   * Create recovery task
   */
  async _createRecoveryTask(cartResult) {
    try {
      const taskData = {
        Subject: 'Follow up on abandoned cart',
        Status: 'Not Started',
        Priority: cartResult.cartValue > 500 ? 'High' : 'Normal',
        ActivityDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        Description: `Follow up with customer regarding abandoned cart worth $${cartResult.cartValue.toFixed(2)}`
      };

      // Link to Opportunity or Lead
      if (cartResult.type === 'Opportunity') {
        taskData.WhatId = cartResult.id;
      } else if (cartResult.type === 'Lead') {
        taskData.WhoId = cartResult.id;
      }

      const result = await salesforceService.createRecord('Task', taskData);
      logger.info('Created recovery task', { taskId: result.id, cartResult });
      
      return result.id;
    } catch (error) {
      // Log warning but don't throw - task creation is supplementary
      // The cart recovery was successful even if task creation failed
      logger.warn('Failed to create recovery task (non-critical)', { 
        error: error.message,
        cartResult 
      });
      return null; // Return null to indicate task creation failed
    }
  }

  /**
   * Calculate close date (30 days from now by default)
   */
  _calculateCloseDate() {
    const expirationDays = getThreshold('cartExpirationDays') || 30;
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + expirationDays);
    return closeDate.toISOString().split('T')[0];
  }

  /**
   * Calculate cart value
   */
  _calculateCartValue(cart) {
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
   * Build cart description
   */
  _buildCartDescription(cart) {
    const items = [];
    
    if (cart.line_items?.physical_items) {
      cart.line_items.physical_items.forEach(item => {
        items.push(`- ${item.name} (Qty: ${item.quantity}, Price: $${item.list_price})`);
      });
    }

    return `Abandoned Cart\nCart ID: ${cart.id}\nAbandoned: ${new Date().toISOString()}\n\nItems:\n${items.join('\n')}`;
  }

  /**
   * Expire old opportunities
   */
  async expireOldOpportunities() {
    if (!isFeatureEnabled('cartExpiration')) return;

    try {
      const expirationDays = getThreshold('cartExpirationDays');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - expirationDays);

      const abandonedDateField = getCustomField('opportunity', 'abandonedDate');
      if (!abandonedDateField) return;

      // Find expired opportunities
      const soql = `SELECT Id FROM Opportunity 
                    WHERE StageName = 'Prospecting' 
                    AND ${abandonedDateField} < ${cutoffDate.toISOString().split('T')[0]} 
                    AND LeadSource = 'Abandoned Cart'`;

      const opportunities = await salesforceService.query(soql);
      
      if (opportunities.length > 0) {
        const updates = opportunities.map(opp => ({
          Id: opp.Id,
          StageName: 'Closed Lost',
          Description: 'Cart expired - automatically closed'
        }));

        await salesforceService.updateBulk('Opportunity', updates);
        logger.info(`Expired ${opportunities.length} old cart opportunities`);
      }
    } catch (error) {
      logger.error('Error expiring old opportunities', { error: error.message });
    }
  }
}

module.exports = new CartRecoveryService();
