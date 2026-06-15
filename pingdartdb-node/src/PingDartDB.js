const crypto = require('crypto');
const https = require('https');
const { Sequelize } = require('sequelize');
const QueryBuilder = require('./QueryBuilder');
const SchemaBuilder = require('./SchemaBuilder');

class PingDartDB {
    /**
     * Initialize the PingDart Database SDK
     * @param {string} apiKey - Your PingDart API / License Key
     * @param {Object} dbConfig - Your direct database credentials
     * @param {string} dbConfig.host - Database host
     * @param {string} dbConfig.user - Database user
     * @param {string} dbConfig.password - Database password
     * @param {string} dbConfig.database - Database name
     * @param {string} dbConfig.type - 'mysql' or 'postgres'
     */
    constructor(apiKey, dbConfig) {
        this.apiKey = apiKey;
        this.validateKey(apiKey);

        this.dbConfig = dbConfig;
        // Normalize 'postgresql' → 'postgres' once, and reuse everywhere
        this.dbType = dbConfig.type === 'postgresql' ? 'postgres' : dbConfig.type;

        if (this.dbType === 'mysql' || this.dbType === 'postgres') {
            this.sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
                host: dbConfig.host,
                dialect: this.dbType,
                logging: false, // Set to console.log to see SQL queries
                pool: {
                    max: 20,
                    min: 0,
                    acquire: 60000,
                    idle: 10000,
                }
            });
        } else {
            throw new Error(`Unsupported database type: "${dbConfig.type}". Use 'mysql' or 'postgres'.`);
        }
    }

    /**
     * Validate the provided PingDart API key
     */
    validateKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('pd_')) {
            throw new Error('PingDart Authorization Failed: Invalid PingDart License Key format. Key must start with "pd_".');
        }

        const parts = apiKey.replace('pd_', '').split('.');
        if (parts.length !== 2) {
            throw new Error('PingDart Authorization Failed: Invalid PingDart License Key format. Key structure is malformed.');
        }

        try {
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];

            // This is the obfuscated secret key used by the SDK to validate the license locally.
            const SECRET_KEY = 'PingDartSuperSecretKey2026!@#$';
            const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32);

            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            let payload;
            try {
                payload = JSON.parse(decrypted);
            } catch {
                throw new Error('PingDart Authorization Failed: License key is corrupted or was tampered with.');
            }

            // Check Expiration Date
            if (payload.expiresAt) {
                const expirationDate = new Date(payload.expiresAt);
                const now = new Date();

                if (now > expirationDate) {
                    throw new Error(`PingDart Authorization Failed: Your PingDart License expired on ${expirationDate.toLocaleDateString()}. Please renew at PingDart.`);
                }
            }

            this.license = payload;
        } catch (error) {
            // Re-throw without double-wrapping if already formatted
            if (error.message.startsWith('PingDart Authorization Failed:')) {
                throw error;
            }
            throw new Error(`PingDart Authorization Failed: ${error.message}`);
        }
    }

    /**
     * Get a QueryBuilder instance for a specific table
     * @param {string} tableName 
     * @returns {QueryBuilder}
     */
    table(tableName) {
        return new QueryBuilder(tableName, this.sequelize, this.dbType);
    }

    /**
     * Get the SchemaBuilder instance
     * @returns {SchemaBuilder}
     */
    schema() {
        return new SchemaBuilder(this.sequelize, this.dbConfig.type);
    }

    /**
     * Connect and authenticate the database connection
     */
    async connect() {
        await this.sequelize.authenticate();
        
        // If the license tier requires live validation (e.g., 'pro' or 'enterprise')
        if (this.license && this.license.tier && this.license.tier !== 'free') {
            await this._validateLiveServer();
        }
        
        return true;
    }

    /**
     * Internal method to validate paid keys with the PingDart Server.
     * Has a 10-second timeout to avoid hanging the caller's app startup.
     */
    _validateLiveServer() {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ apiKey: this.apiKey });
            const options = {
                hostname: 'cloudapi.pingdart.com',
                port: 443,
                path: '/api/realtime/validate-sdk',
                method: 'POST',
                timeout: 10000, // 10-second timeout — never hang indefinitely
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', chunk => { responseBody += chunk; });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseBody);
                        if (!result.success) {
                            reject(new Error(`PingDart Live Authorization Failed: ${result.message}`));
                        } else {
                            resolve(true);
                        }
                    } catch (err) {
                        reject(new Error("PingDart Live Authorization Failed: Invalid server response."));
                    }
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('PingDart Live Authorization Failed: Connection to PingDart server timed out after 10 seconds.'));
            });

            req.on('error', (err) => {
                reject(new Error(`PingDart Live Authorization Failed: ${err.message}`));
            });

            req.write(data);
            req.end();
        });
    }

    /**
     * Close the database connection
     */
    async close() {
        if (this.sequelize) {
            await this.sequelize.close();
        }
    }
}

module.exports = PingDartDB;



