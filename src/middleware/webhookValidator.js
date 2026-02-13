const crypto = require('crypto');
const { config } = require('../config');
const logger = require('../utils/logger');

/**
 * Validate BigCommerce webhook signature
 * BigCommerce sends webhooks with an X-BC-Webhook-Signature header
 */
function validateWebhookSignature(req, res, next) {
  try {
    // Get signature from header
    const signature = req.headers['x-bc-webhook-signature'];
    
    if (!signature) {
      logger.warn('Webhook received without signature');
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Get raw body (we need to preserve the raw body for signature validation)
    const payload = JSON.stringify(req.body);
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', config.webhook.secret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    if (signature !== expectedSignature) {
      logger.warn('Invalid webhook signature', { 
        received: signature.substring(0, 10) + '...', 
        expected: expectedSignature.substring(0, 10) + '...' 
      });
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    logger.debug('Webhook signature validated successfully');
    next();
  } catch (error) {
    logger.error('Error validating webhook signature', { error: error.message });
    return res.status(500).json({ error: 'Signature validation error' });
  }
}

/**
 * Validate webhook payload structure
 */
function validateWebhookPayload(req, res, next) {
  try {
    const { scope, data } = req.body;

    if (!scope || !data) {
      logger.warn('Invalid webhook payload structure', { body: req.body });
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    logger.debug('Webhook payload structure validated', { scope });
    next();
  } catch (error) {
    logger.error('Error validating webhook payload', { error: error.message });
    return res.status(500).json({ error: 'Payload validation error' });
  }
}

module.exports = {
  validateWebhookSignature,
  validateWebhookPayload
};
