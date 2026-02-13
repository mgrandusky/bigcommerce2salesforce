#!/usr/bin/env node

/**
 * Webhook Registration Script
 * This script registers webhooks with BigCommerce
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const config = {
  storeHash: process.env.BIGCOMMERCE_STORE_HASH,
  accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
  apiUrl: process.env.BIGCOMMERCE_API_URL || 'https://api.bigcommerce.com'
};

const headers = {
  'X-Auth-Token': config.accessToken,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function listWebhooks() {
  try {
    console.log('\n📋 Fetching existing webhooks...\n');
    
    const response = await axios.get(
      `${config.apiUrl}/stores/${config.storeHash}/v3/hooks`,
      { headers }
    );

    const webhooks = response.data.data;
    
    if (webhooks.length === 0) {
      console.log('No webhooks found.');
      return [];
    }

    console.log(`Found ${webhooks.length} webhook(s):\n`);
    webhooks.forEach((webhook, index) => {
      console.log(`${index + 1}. ID: ${webhook.id}`);
      console.log(`   Scope: ${webhook.scope}`);
      console.log(`   Destination: ${webhook.destination}`);
      console.log(`   Active: ${webhook.is_active}`);
      console.log('');
    });

    return webhooks;
  } catch (error) {
    console.error('❌ Error listing webhooks:', error.response?.data || error.message);
    return [];
  }
}

async function registerWebhook(scope, destination) {
  try {
    console.log(`\n📝 Registering webhook for ${scope}...`);
    
    const response = await axios.post(
      `${config.apiUrl}/stores/${config.storeHash}/v3/hooks`,
      {
        scope,
        destination,
        is_active: true
      },
      { headers }
    );

    console.log(`✅ Webhook registered successfully!`);
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   Scope: ${response.data.data.scope}`);
    console.log(`   Destination: ${response.data.data.destination}`);
    
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 422) {
      console.log('⚠️  Webhook already exists for this scope and destination.');
    } else {
      console.error('❌ Error registering webhook:', error.response?.data || error.message);
    }
    return null;
  }
}

async function deleteWebhook(webhookId) {
  try {
    console.log(`\n🗑️  Deleting webhook ${webhookId}...`);
    
    await axios.delete(
      `${config.apiUrl}/stores/${config.storeHash}/v3/hooks/${webhookId}`,
      { headers }
    );

    console.log(`✅ Webhook deleted successfully!`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  BigCommerce Webhook Registration Tool   ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Validate configuration
  if (!config.storeHash || !config.accessToken) {
    console.error('❌ Missing required environment variables:');
    if (!config.storeHash) console.error('   - BIGCOMMERCE_STORE_HASH');
    if (!config.accessToken) console.error('   - BIGCOMMERCE_ACCESS_TOKEN');
    console.error('\nPlease set these in your .env file.');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Store Hash: ${config.storeHash}`);
  console.log(`  API URL: ${config.apiUrl}\n`);

  while (true) {
    console.log('\nWhat would you like to do?');
    console.log('1. List existing webhooks');
    console.log('2. Register order webhook');
    console.log('3. Register abandoned cart webhook');
    console.log('4. Delete a webhook');
    console.log('5. Exit\n');

    const choice = await question('Enter your choice (1-5): ');

    switch (choice.trim()) {
      case '1':
        await listWebhooks();
        break;

      case '2': {
        const destination = await question('Enter webhook destination URL (e.g., https://your-domain.com/webhooks/orders): ');
        if (destination.trim()) {
          await registerWebhook('store/order/statusUpdated', destination.trim());
        }
        break;
      }

      case '3': {
        const destination = await question('Enter webhook destination URL (e.g., https://your-domain.com/webhooks/carts/abandoned): ');
        if (destination.trim()) {
          await registerWebhook('store/cart/abandoned', destination.trim());
        }
        break;
      }

      case '4': {
        const webhooks = await listWebhooks();
        if (webhooks.length > 0) {
          const webhookId = await question('Enter webhook ID to delete: ');
          if (webhookId.trim()) {
            await deleteWebhook(webhookId.trim());
          }
        }
        break;
      }

      case '5':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);

      default:
        console.log('❌ Invalid choice. Please try again.');
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
