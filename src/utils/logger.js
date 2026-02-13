const winston = require('winston');
const { config } = require('../config');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'bigcommerce-salesforce-integration' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0 && meta.service !== 'bigcommerce-salesforce-integration') {
            metaStr = '\n' + JSON.stringify(meta, null, 2);
          }
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add file transport for production
if (config.server.nodeEnv === 'production') {
  logger.add(new winston.transports.File({ 
    filename: path.join(logsDir, 'error.log'), 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: path.join(logsDir, 'combined.log') 
  }));
}

module.exports = logger;
