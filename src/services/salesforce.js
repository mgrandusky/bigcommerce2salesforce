const jsforce = require('jsforce');
const { config } = require('../config');
const logger = require('../utils/logger');

class SalesforceService {
  constructor() {
    this.conn = null;
    this.isAuthenticated = false;
  }

  /**
   * Authenticate with Salesforce using OAuth 2.0 username-password flow
   */
  async authenticate() {
    try {
      logger.info('Authenticating with Salesforce...');
      
      this.conn = new jsforce.Connection({
        loginUrl: config.salesforce.instanceUrl,
        version: config.salesforce.apiVersion
      });

      const password = config.salesforce.securityToken 
        ? config.salesforce.password + config.salesforce.securityToken
        : config.salesforce.password;

      await this.conn.login(config.salesforce.username, password);
      
      this.isAuthenticated = true;
      logger.info('Successfully authenticated with Salesforce', {
        instanceUrl: this.conn.instanceUrl,
        accessToken: this.conn.accessToken ? '***' : 'none'
      });
      
      return true;
    } catch (error) {
      this.isAuthenticated = false;
      logger.error('Salesforce authentication failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Ensure we have an active connection
   */
  async ensureAuthenticated() {
    if (!this.isAuthenticated || !this.conn) {
      await this.authenticate();
    }
  }

  /**
   * Find or create Account by email
   */
  async findOrCreateAccount(customerData) {
    await this.ensureAuthenticated();

    try {
      const email = customerData.email;
      
      // Try to find existing Account by email
      const accounts = await this.conn.sobject('Account')
        .find({ 
          'PersonEmail': email 
        })
        .limit(1)
        .execute();

      if (accounts.length > 0) {
        logger.info('Found existing Account', { accountId: accounts[0].Id, email });
        return accounts[0].Id;
      }

      // Create new Account (Person Account or Business Account)
      const accountData = {
        Name: customerData.company || `${customerData.first_name} ${customerData.last_name}`,
        BillingStreet: customerData.address_1,
        BillingCity: customerData.city,
        BillingState: customerData.state,
        BillingPostalCode: customerData.zip,
        BillingCountry: customerData.country,
        Phone: customerData.phone
      };

      const result = await this.conn.sobject('Account').create(accountData);
      
      if (result.success) {
        logger.info('Created new Account', { accountId: result.id, email });
        return result.id;
      } else {
        throw new Error(`Failed to create Account: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error('Error finding/creating Account', { error: error.message, customerData });
      throw error;
    }
  }

  /**
   * Find or create Contact by email
   */
  async findOrCreateContact(customerData, accountId = null) {
    await this.ensureAuthenticated();

    try {
      const email = customerData.email;
      
      // Try to find existing Contact by email
      const contacts = await this.conn.sobject('Contact')
        .find({ Email: email })
        .limit(1)
        .execute();

      if (contacts.length > 0) {
        logger.info('Found existing Contact', { contactId: contacts[0].Id, email });
        return contacts[0].Id;
      }

      // Create new Contact
      const contactData = {
        FirstName: customerData.first_name,
        LastName: customerData.last_name || 'Unknown',
        Email: email,
        Phone: customerData.phone,
        MailingStreet: customerData.address_1,
        MailingCity: customerData.city,
        MailingState: customerData.state,
        MailingPostalCode: customerData.zip,
        MailingCountry: customerData.country
      };

      if (accountId) {
        contactData.AccountId = accountId;
      }

      const result = await this.conn.sobject('Contact').create(contactData);
      
      if (result.success) {
        logger.info('Created new Contact', { contactId: result.id, email });
        return result.id;
      } else {
        throw new Error(`Failed to create Contact: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error('Error finding/creating Contact', { error: error.message, customerData });
      throw error;
    }
  }

  /**
   * Create Order in Salesforce
   */
  async createOrder(orderData) {
    await this.ensureAuthenticated();

    try {
      logger.info('Creating Order in Salesforce', { orderNumber: orderData.OrderNumber });

      const result = await this.conn.sobject('Order').create(orderData);
      
      if (result.success) {
        logger.info('Successfully created Order', { 
          orderNumber: orderData.OrderNumber, 
          salesforceOrderId: result.id 
        });
        return result.id;
      } else {
        throw new Error(`Failed to create Order: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error('Error creating Order', { error: error.message, orderNumber: orderData.OrderNumber });
      throw error;
    }
  }

  /**
   * Create Lead for abandoned cart
   */
  async createLead(leadData) {
    await this.ensureAuthenticated();

    try {
      logger.info('Creating Lead in Salesforce for abandoned cart', { email: leadData.Email });

      // Check if Lead already exists
      const existingLeads = await this.conn.sobject('Lead')
        .find({ 
          Email: leadData.Email,
          Status: 'Open - Not Contacted'
        })
        .limit(1)
        .execute();

      if (existingLeads.length > 0) {
        // Update existing Lead
        const updateData = { ...leadData, Id: existingLeads[0].Id };
        const result = await this.conn.sobject('Lead').update(updateData);
        
        if (result.success) {
          logger.info('Updated existing Lead', { leadId: existingLeads[0].Id });
          return existingLeads[0].Id;
        }
      }

      // Create new Lead
      const result = await this.conn.sobject('Lead').create(leadData);
      
      if (result.success) {
        logger.info('Successfully created Lead', { 
          email: leadData.Email, 
          salesforceLeadId: result.id 
        });
        return result.id;
      } else {
        throw new Error(`Failed to create Lead: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error('Error creating Lead', { error: error.message, leadData });
      throw error;
    }
  }

  /**
   * Query Salesforce objects
   */
  async query(soql) {
    await this.ensureAuthenticated();

    try {
      const result = await this.conn.query(soql);
      return result.records;
    } catch (error) {
      logger.error('Error executing SOQL query', { error: error.message, soql });
      throw error;
    }
  }

  /**
   * Create a record in Salesforce
   */
  async createRecord(objectType, data) {
    await this.ensureAuthenticated();

    try {
      logger.info(`Creating ${objectType} record`, { data });
      const result = await this.conn.sobject(objectType).create(data);
      
      if (result.success) {
        logger.info(`Successfully created ${objectType}`, { id: result.id });
        return result;
      } else {
        throw new Error(`Failed to create ${objectType}: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error(`Error creating ${objectType}`, { error: error.message, data });
      throw error;
    }
  }

  /**
   * Update a record in Salesforce
   */
  async updateRecord(objectType, data) {
    await this.ensureAuthenticated();

    try {
      logger.info(`Updating ${objectType} record`, { id: data.Id });
      const result = await this.conn.sobject(objectType).update(data);
      
      if (result.success) {
        logger.info(`Successfully updated ${objectType}`, { id: result.id });
        return result;
      } else {
        throw new Error(`Failed to update ${objectType}: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error(`Error updating ${objectType}`, { error: error.message, data });
      throw error;
    }
  }

  /**
   * Create multiple records in bulk
   */
  async createBulk(objectType, records) {
    await this.ensureAuthenticated();

    try {
      logger.info(`Creating ${records.length} ${objectType} records in bulk`);
      const results = await this.conn.sobject(objectType).create(records);
      
      const successful = Array.isArray(results) 
        ? results.filter(r => r.success).length 
        : (results.success ? 1 : 0);
      
      logger.info(`Bulk create completed`, { 
        objectType, 
        total: records.length, 
        successful 
      });
      
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      logger.error(`Error creating ${objectType} records in bulk`, { error: error.message });
      throw error;
    }
  }

  /**
   * Update multiple records in bulk
   */
  async updateBulk(objectType, records) {
    await this.ensureAuthenticated();

    try {
      logger.info(`Updating ${records.length} ${objectType} records in bulk`);
      const results = await this.conn.sobject(objectType).update(records);
      
      const successful = Array.isArray(results) 
        ? results.filter(r => r.success).length 
        : (results.success ? 1 : 0);
      
      logger.info(`Bulk update completed`, { 
        objectType, 
        total: records.length, 
        successful 
      });
      
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      logger.error(`Error updating ${objectType} records in bulk`, { error: error.message });
      throw error;
    }
  }

  /**
   * Upsert a record (insert or update based on external ID)
   */
  async upsertRecord(objectType, externalIdField, data) {
    await this.ensureAuthenticated();

    try {
      logger.info(`Upserting ${objectType} record`, { externalIdField });
      const result = await this.conn.sobject(objectType).upsert(data, externalIdField);
      
      if (result.success) {
        logger.info(`Successfully upserted ${objectType}`, { id: result.id });
        return result;
      } else {
        throw new Error(`Failed to upsert ${objectType}: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      logger.error(`Error upserting ${objectType}`, { error: error.message, data });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SalesforceService();
