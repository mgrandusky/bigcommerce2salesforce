const salesforceService = require('./salesforce');
const logger = require('../utils/logger');
const { isFeatureEnabled, getCustomField, getThreshold } = require('../config/features');

/**
 * Customer Analytics Service
 * Handles customer segmentation, CLV, RFM analysis, and tagging
 */
class CustomerAnalyticsService {
  /**
   * Update customer analytics after order
   */
  async updateCustomerAnalytics(accountId, orderValue) {
    try {
      const updates = {};

      // Get existing account data
      const account = await this._getAccount(accountId);
      if (!account) return;

      // Calculate CLV
      if (isFeatureEnabled('customerLifetimeValue')) {
        const clvField = getCustomField('account', 'clv');
        if (clvField) {
          const currentCLV = parseFloat(account[clvField] || 0);
          updates[clvField] = currentCLV + orderValue;
        }
      }

      // Update total orders count
      if (isFeatureEnabled('customerSegmentation')) {
        const totalOrdersField = getCustomField('account', 'totalOrders');
        if (totalOrdersField) {
          const currentOrders = parseInt(account[totalOrdersField] || 0);
          updates[totalOrdersField] = currentOrders + 1;
        }

        // Calculate average order value
        const avgOrderValueField = getCustomField('account', 'averageOrderValue');
        if (avgOrderValueField && updates[getCustomField('account', 'clv')]) {
          const totalRevenue = updates[getCustomField('account', 'clv')];
          const totalOrders = updates[getCustomField('account', 'totalOrders')];
          updates[avgOrderValueField] = totalRevenue / totalOrders;
        }
      }

      // Update last order date
      const lastOrderDateField = getCustomField('account', 'lastOrderDate');
      if (lastOrderDateField) {
        updates[lastOrderDateField] = new Date().toISOString().split('T')[0];
      }

      // Calculate customer tier
      if (isFeatureEnabled('customerSegmentation')) {
        const tierField = getCustomField('account', 'customerTier');
        if (tierField && updates[getCustomField('account', 'clv')]) {
          updates[tierField] = this._calculateCustomerTier(updates[getCustomField('account', 'clv')]);
        }
      }

      // Calculate RFM score
      if (isFeatureEnabled('rfmAnalysis')) {
        const rfmScoreField = getCustomField('account', 'rfmScore');
        if (rfmScoreField) {
          updates[rfmScoreField] = await this._calculateRFMScore(accountId, account);
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        updates.Id = accountId;
        await salesforceService.updateRecord('Account', updates);
        logger.info('Updated customer analytics', { accountId, updates });
      }

      // Apply customer tags
      if (isFeatureEnabled('customerTags')) {
        await this._applyCustomerTags(accountId, account, updates);
      }

    } catch (error) {
      logger.error('Error updating customer analytics', { error: error.message, accountId });
    }
  }

  /**
   * Get account data
   */
  async _getAccount(accountId) {
    try {
      const fields = ['Id', 'Name'];
      
      // Add custom fields if they exist
      const clvField = getCustomField('account', 'clv');
      if (clvField) fields.push(clvField);
      
      const totalOrdersField = getCustomField('account', 'totalOrders');
      if (totalOrdersField) fields.push(totalOrdersField);
      
      const lastOrderDateField = getCustomField('account', 'lastOrderDate');
      if (lastOrderDateField) fields.push(lastOrderDateField);

      const soql = `SELECT ${fields.join(', ')} FROM Account WHERE Id = '${accountId}' LIMIT 1`;
      const records = await salesforceService.query(soql);
      return records[0] || null;
    } catch (error) {
      logger.error('Error getting account', { error: error.message, accountId });
      return null;
    }
  }

  /**
   * Calculate customer tier based on CLV
   */
  _calculateCustomerTier(clv) {
    const thresholds = getThreshold('customerTiers');
    
    if (clv >= thresholds.platinum) return 'Platinum';
    if (clv >= thresholds.gold) return 'Gold';
    if (clv >= thresholds.silver) return 'Silver';
    return 'Bronze';
  }

  /**
   * Calculate RFM Score
   * Returns a score like "555" (high recency, frequency, monetary)
   */
  async _calculateRFMScore(accountId, account) {
    try {
      // Get order data for this account
      const orders = await this._getAccountOrders(accountId);
      
      if (orders.length === 0) {
        return '111'; // Lowest score for first-time customers
      }

      // Recency: Days since last order (lower is better)
      const lastOrderDateField = getCustomField('account', 'lastOrderDate');
      const lastOrderDate = account[lastOrderDateField] 
        ? new Date(account[lastOrderDateField]) 
        : new Date(orders[0].EffectiveDate);
      const daysSinceLastOrder = Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24));
      const recencyScore = this._scoreRecency(daysSinceLastOrder);

      // Frequency: Number of orders
      const frequencyScore = this._scoreFrequency(orders.length);

      // Monetary: Total value
      const totalValue = orders.reduce((sum, order) => sum + parseFloat(order.TotalAmount || 0), 0);
      const monetaryScore = this._scoreMonetary(totalValue);

      return `${recencyScore}${frequencyScore}${monetaryScore}`;
    } catch (error) {
      logger.error('Error calculating RFM score', { error: error.message });
      return '333'; // Default middle score
    }
  }

  /**
   * Get orders for an account
   */
  async _getAccountOrders(accountId) {
    try {
      const soql = `SELECT Id, TotalAmount, EffectiveDate FROM Order WHERE AccountId = '${accountId}' ORDER BY EffectiveDate DESC`;
      return await salesforceService.query(soql);
    } catch (error) {
      logger.error('Error getting account orders', { error: error.message });
      return [];
    }
  }

  /**
   * Score recency (1-5, where 5 is most recent)
   */
  _scoreRecency(days) {
    if (days <= 30) return 5;
    if (days <= 60) return 4;
    if (days <= 90) return 3;
    if (days <= 180) return 2;
    return 1;
  }

  /**
   * Score frequency (1-5, where 5 is most frequent)
   */
  _scoreFrequency(orderCount) {
    if (orderCount >= 10) return 5;
    if (orderCount >= 5) return 4;
    if (orderCount >= 3) return 3;
    if (orderCount >= 2) return 2;
    return 1;
  }

  /**
   * Score monetary value (1-5, where 5 is highest)
   */
  _scoreMonetary(totalValue) {
    const thresholds = getThreshold('customerTiers');
    if (totalValue >= thresholds.platinum) return 5;
    if (totalValue >= thresholds.gold) return 4;
    if (totalValue >= thresholds.silver) return 3;
    if (totalValue >= thresholds.bronze) return 2;
    return 1;
  }

  /**
   * Apply customer tags based on behavior
   */
  async _applyCustomerTags(accountId, account, updates) {
    try {
      const tags = [];

      // VIP tag (high CLV)
      const clvField = getCustomField('account', 'clv');
      const clv = parseFloat(updates[clvField] || account[clvField] || 0);
      if (clv >= getThreshold('customerTiers.platinum')) {
        tags.push('VIP');
      }

      // First-Time Buyer
      const totalOrdersField = getCustomField('account', 'totalOrders');
      const totalOrders = parseInt(updates[totalOrdersField] || account[totalOrdersField] || 0);
      if (totalOrders === 1) {
        tags.push('First-Time Buyer');
      }

      // At-Risk (no recent orders)
      const lastOrderDateField = getCustomField('account', 'lastOrderDate');
      const lastOrderDate = new Date(account[lastOrderDateField] || new Date());
      const daysSinceLastOrder = Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24));
      const churnRiskDays = getThreshold('churnRiskDays');
      if (daysSinceLastOrder > churnRiskDays && totalOrders > 1) {
        tags.push('At-Risk');
      }

      // Log tags (in a full implementation, these would be added to a Tags field or related records)
      if (tags.length > 0) {
        logger.info('Customer tags applied', { accountId, tags });
      }

      return tags;
    } catch (error) {
      logger.error('Error applying customer tags', { error: error.message });
      return [];
    }
  }
}

module.exports = new CustomerAnalyticsService();
