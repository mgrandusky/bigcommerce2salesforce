const logger = require('../utils/logger');
const { isFeatureEnabled } = require('../config/features');

/**
 * Audit Log Service
 * Tracks all sync operations for compliance and debugging
 */
class AuditLogService {
  constructor() {
    this.logs = [];
    this.enabled = isFeatureEnabled('auditTrail');
  }

  /**
   * Log a sync operation
   * Note: Currently stores logs in memory. For production, implement persistence to
   * BC_Sync_Log__c custom object in Salesforce or external logging system.
   */
  async logOperation(operation, data, result, error = null) {
    if (!this.enabled) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      data: this._sanitizeData(data),
      result: result ? 'success' : 'failure',
      error: error ? error.message : null,
      metadata: {
        bigCommerceId: data.bigCommerceId || data.orderId || data.cartId,
        salesforceId: result?.id || result?.salesforceId,
        duration: data.duration
      }
    };

    // Store in memory (WARNING: logs lost on restart)
    this.logs.push(logEntry);

    // Also log to standard logger
    if (error) {
      logger.error(`Audit: ${operation} failed`, logEntry);
    } else {
      logger.info(`Audit: ${operation} succeeded`, logEntry);
    }

    // TODO: For production, persist to Salesforce BC_Sync_Log__c custom object
    // Example:
    // const salesforceService = require('./salesforce');
    // await salesforceService.createRecord('BC_Sync_Log__c', {
    //   Operation_Type__c: operation,
    //   BigCommerce_ID__c: logEntry.metadata.bigCommerceId,
    //   Salesforce_ID__c: logEntry.metadata.salesforceId,
    //   Status__c: logEntry.result === 'success' ? 'Success' : 'Failed',
    //   Error_Message__c: logEntry.error,
    //   Sync_Date__c: logEntry.timestamp,
    //   Duration_MS__c: logEntry.metadata.duration
    // });

    return logEntry;
  }

  /**
   * Log order sync
   */
  async logOrderSync(orderId, salesforceOrderId, success, error = null) {
    return this.logOperation(
      'ORDER_SYNC',
      { bigCommerceId: orderId },
      { id: salesforceOrderId, success },
      error
    );
  }

  /**
   * Log cart sync
   */
  async logCartSync(cartId, salesforceLeadId, success, error = null) {
    return this.logOperation(
      'CART_SYNC',
      { bigCommerceId: cartId },
      { id: salesforceLeadId, success },
      error
    );
  }

  /**
   * Log product sync
   */
  async logProductSync(productId, salesforceProductId, success, error = null) {
    return this.logOperation(
      'PRODUCT_SYNC',
      { bigCommerceId: productId },
      { id: salesforceProductId, success },
      error
    );
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by operation type
   */
  getLogsByOperation(operation) {
    return this.logs.filter(log => log.operation === operation);
  }

  /**
   * Get failed operations
   */
  getFailedOperations() {
    return this.logs.filter(log => log.result === 'failure');
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Sanitize sensitive data before logging
   */
  _sanitizeData(data) {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'accessToken', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }

  /**
   * Generate audit report
   */
  generateReport(startDate, endDate) {
    const filtered = this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);
    });

    return {
      total: filtered.length,
      successful: filtered.filter(l => l.result === 'success').length,
      failed: filtered.filter(l => l.result === 'failure').length,
      byOperation: this._groupByOperation(filtered),
      logs: filtered
    };
  }

  /**
   * Group logs by operation type
   */
  _groupByOperation(logs) {
    const grouped = {};
    logs.forEach(log => {
      if (!grouped[log.operation]) {
        grouped[log.operation] = { total: 0, successful: 0, failed: 0 };
      }
      grouped[log.operation].total++;
      if (log.result === 'success') {
        grouped[log.operation].successful++;
      } else {
        grouped[log.operation].failed++;
      }
    });
    return grouped;
  }
}

// Export singleton instance
module.exports = new AuditLogService();
