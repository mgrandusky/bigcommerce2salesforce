require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  bigcommerce: {
    clientId: process.env.BIGCOMMERCE_CLIENT_ID,
    clientSecret: process.env.BIGCOMMERCE_CLIENT_SECRET,
    accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
    storeHash: process.env.BIGCOMMERCE_STORE_HASH,
    apiUrl: process.env.BIGCOMMERCE_API_URL || 'https://api.bigcommerce.com'
  },
  salesforce: {
    clientId: process.env.SALESFORCE_CLIENT_ID,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
    username: process.env.SALESFORCE_USERNAME,
    password: process.env.SALESFORCE_PASSWORD,
    securityToken: process.env.SALESFORCE_SECURITY_TOKEN,
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || 'https://login.salesforce.com',
    apiVersion: process.env.SALESFORCE_API_VERSION || 'v57.0'
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    delayMs: parseInt(process.env.RETRY_DELAY_MS) || 5000
  }
};

// Validate required configuration
const validateConfig = () => {
  const required = {
    'BIGCOMMERCE_CLIENT_ID': config.bigcommerce.clientId,
    'BIGCOMMERCE_CLIENT_SECRET': config.bigcommerce.clientSecret,
    'BIGCOMMERCE_ACCESS_TOKEN': config.bigcommerce.accessToken,
    'BIGCOMMERCE_STORE_HASH': config.bigcommerce.storeHash,
    'SALESFORCE_CLIENT_ID': config.salesforce.clientId,
    'SALESFORCE_CLIENT_SECRET': config.salesforce.clientSecret,
    'SALESFORCE_USERNAME': config.salesforce.username,
    'SALESFORCE_PASSWORD': config.salesforce.password,
    'WEBHOOK_SECRET': config.webhook.secret
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { config, validateConfig };
