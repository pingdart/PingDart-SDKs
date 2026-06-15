import { io } from "socket.io-client";

class DatabaseService {
    constructor(http, config) {
        this.http = http;
        this.databaseId = config.databaseId;
        this.realtimeBaseURL = config.realtimeBaseURL;

        this.pollingInterval = null;
        this.socket = null;
        this._socketInitialized = false;

        if (!this.databaseId) {
            console.warn("PingDart SDK: databaseId is missing! Real-time CRUD operations may fail.");
        }
    }

    async _initializeSocket() {
        if (!this._socketInitialized && !this.socket) {
            this.socket = io(this.realtimeBaseURL, {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            this._socketInitialized = true;
        }
        return this.socket;
    }

    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this._socketInitialized = false;
        }
    }

    async _postRequest(endpoint, data, timeout = 15000) {
        try {
            const config = { timeout };
            const response = await this.http.post(`${endpoint}`, data, config);

            let responseData = response.data;
            if (responseData && typeof responseData === 'object' && !responseData.hasOwnProperty('success')) {
                responseData.success = true;
            }
            return responseData;
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                return {
                    success: false,
                    status: 0,
                    message: `Request timeout: The server did not respond within ${timeout}ms.`,
                    error: 'Connection timeout',
                    data: []
                };
            }

            if (error.response) {
                const responseData = error.response.data;
                const errorMessage = responseData?.message || responseData?.error || responseData?.errorMessage || `Server error (${error.response.status})`;
                return {
                    success: false,
                    status: error.response.status,
                    message: errorMessage,
                    error: errorMessage,
                    data: [],
                    responseData: responseData
                };
            }

            return {
                success: false,
                status: 0,
                message: error.message || 'Unknown network error occurred',
                error: error.message,
                data: []
            };
        }
    }

    // CRUD methods
    create(tableSchema, tableName, data, conditions, login = true) {
        return this._postRequest('dynamicCreate', { tableSchema, tableName, data, conditions, databaseid: this.databaseId });
    }

    read(tableSchema, tableName, conditions, orderBy, search, pagination, margedata, range = []) {
        return this._postRequest('dynamicRead', { tableSchema, tableName, conditions, orderBy, search, pagination, margedata, range, databaseid: this.databaseId });
    }

    update(tableSchema, tableName, data, condition, login = true) {
        return this._postRequest('dynamicUpdate', { tableSchema, tableName, data, condition, databaseid: this.databaseId });
    }

    delete(tableSchema, tableName, condition) {
        return this._postRequest('dynamicDelete', { tableSchema, tableName, condition, databaseid: this.databaseId });
    }

    count(tableSchema, tableName, conditions) {
        return this._postRequest('dynamicCount', { tableSchema, tableName, conditions, databaseid: this.databaseId });
    }

    hashPassword(password) {
        return this._postRequest('hashPassword', { password });
    }

    // Polling and Realtime Methods
    startLongPolling(tableSchema, tableName, conditions, orderBy, search, callback, pagination, margedata) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function.');
        }

        const fetchData = async () => {
            try {
                const data = await this.read(tableSchema, tableName, conditions, orderBy, search, pagination, margedata);
                callback(data);
            } catch (error) {
                console.error(`Polling error: ${error.message}`);
            }
        };

        this.pollingInterval = setInterval(fetchData, 1000);
    }

    stopLongPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async listenForUpdates(tableSchema, tableName, callback) {
        await this._initializeSocket();
        if (!this.socket) {
            console.warn('Socket not available. Cannot listen for updates.');
            return;
        }
        const eventName = `${tableSchema}_${tableName}_update`;

        this.socket.on(eventName, (data) => {
            if (typeof callback === 'function') {
                callback(data);
            }
        });
    }

    async stopListeningForUpdates(tableSchema, tableName) {
        await this._initializeSocket();
        if (!this.socket) {
            console.warn('Socket not available. Cannot stop listening for updates.');
            return;
        }
        const eventName = `${tableSchema}_${tableName}_update`;
        this.socket.off(eventName);
    }
}

export default DatabaseService;
