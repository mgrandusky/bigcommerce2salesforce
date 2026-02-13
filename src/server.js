const express = require('express');
const { config, validateConfig } = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { validateWebhookSignature, validateWebhookPayload } = require('./middleware/webhookValidator');
const { 
  handleOrderWebhook, 
  handleAbandonedCartWebhook,
  handleGeneralWebhook 
} = require('./webhooks/bigcommerce');
const salesforceService = require('./services/salesforce');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    salesforceConnected: salesforceService.isAuthenticated
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BigCommerce to Salesforce Integration',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      webhooks: {
        orders: '/webhooks/orders',
        abandonedCarts: '/webhooks/carts/abandoned',
        general: '/webhooks/general'
      }
    }
  });
});

// Webhook endpoints with validation
app.post(
  '/webhooks/orders',
  validateWebhookSignature,
  validateWebhookPayload,
  asyncHandler(handleOrderWebhook)
);

app.post(
  '/webhooks/carts/abandoned',
  validateWebhookSignature,
  validateWebhookPayload,
  asyncHandler(handleAbandonedCartWebhook)
);

app.post(
  '/webhooks/general',
  validateWebhookSignature,
  validateWebhookPayload,
  asyncHandler(handleGeneralWebhook)
);

// Test endpoint (no signature validation for testing)
if (config.server.nodeEnv === 'development') {
  app.post('/webhooks/test', asyncHandler(async (req, res) => {
    logger.info('Test webhook received', { body: req.body });
    res.status(200).json({ 
      success: true, 
      message: 'Test webhook received',
      body: req.body 
    });
  }));
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration validated successfully');

    // Authenticate with Salesforce
    logger.info('Authenticating with Salesforce...');
    await salesforceService.authenticate();
    logger.info('Salesforce authentication successful');

    // Start listening
    const server = app.listen(config.server.port, () => {
      logger.info(`Server started successfully`, {
        port: config.server.port,
        environment: config.server.nodeEnv,
        pid: process.pid
      });
      logger.info(`Health check available at: http://localhost:${config.server.port}/health`);
      logger.info(`Webhook endpoints:`);
      logger.info(`  - Orders: http://localhost:${config.server.port}/webhooks/orders`);
      logger.info(`  - Abandoned Carts: http://localhost:${config.server.port}/webhooks/carts/abandoned`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
