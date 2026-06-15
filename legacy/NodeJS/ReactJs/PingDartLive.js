import { io } from 'socket.io-client';

// Helper function to safely get user data from localStorage
const getLocalUser = () => {
  try {
    const presentUser = localStorage.getItem("presentuser");
    if (presentUser) {
      return JSON.parse(presentUser);
    }

    const userData = localStorage.getItem("userData");
    if (userData) {
      return JSON.parse(userData);
    }

    return null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};

// Environment configuration
const url = process.env.NEXT_PUBLIC_MODE === 'LIVE' ? process.env.NEXT_PUBLIC_API_BASE_LIVE_URL : process.env.NEXT_PUBLIC_API_BASE_URL;
const SOCKET_URL = `${url}`;
const API_BASE_URL = `${url}/api/realtime/`;
const API_URL = `${url}/api/`;

const databaseid = process.env.NEXT_PUBLIC_DATABASEID || (() => {
  throw new Error('NEXT_PUBLIC_DATABASEID is missing! Please add it to your .env file.');
})();

const API_key = process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS || process.env.NEXT_PUBLIC_API_KEY_PINGDART || (() => {
  throw new Error('API Key is missing! Please add NEXT_PUBLIC_API_KEY_PINGDART to your .env file.');
})();

class PingDartLiveSDK {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.socketId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
    this.user = null;
    this.rooms = new Set();
  }

  async initialize(options = {}) {
    try {
      // Get current user data
      this.user = getLocalUser();
      
      // Try with authentication first
      let defaultOptions = {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        auth: {
          token: options.auth || this.user?.token || '',
          userId: this.user?.id || '',
          databaseid: databaseid,
          apiKey: API_key
        },
        query: {
          userId: this.user?.id || '',
          userType: this.user?.userType || 'guest',
          ...options.query
        }
      };

      //console.log('Initializing Socket.IO connection to:', SOCKET_URL);
      //console.log('Initializing Socket.IO Connection options:', defaultOptions);

      // Create socket connection
      this.socket = io(SOCKET_URL, defaultOptions);

      // Set up event listeners
      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.socketId = this.socket.id;
          this.reconnectAttempts = 0;
          //console.log('Socket.IO connected successfully!');
          //console.log('Socket ID:', this.socketId);
          
          // Join user-specific room if authenticated
          if (this.user?.id) {
            this.joinRoom(`user_${this.user.id}`);
          }
          
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('Initializing Socket.IO Connection connection error:', error);
          console.error('Error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          
          // Try with simpler options if authentication fails
          if (error.message.includes('Invalid namespace') || error.message.includes('Authentication')) {
            //console.log('Initializing Socket.IO Connection trying with simpler connection options...');
            this.socket.disconnect();
            
            // Try with minimal options
            const simpleOptions = {
              transports: ['websocket', 'polling'],
              timeout: 10000,
              forceNew: true
            };
            
            this.socket = io(SOCKET_URL, simpleOptions);
            this.setupEventListeners();
            
            this.socket.on('connect', () => {
              //console.log('Socket connected with simple options!');
              this.isConnected = true;
              this.socketId = this.socket.id;
              resolve(this.socket);
            });
            
            this.socket.on('connect_error', (simpleError) => {
              console.error('Initializing Socket.IO Connection Simple connection also failed:', simpleError);
              reject(simpleError);
            });
          } else {
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          //console.log('Initializing Socket.IO Connection Socket disconnected:', reason);
        });
      });

    } catch (error) {
      console.error('Initializing Socket.IO Connection Failed to initialize Socket.IO Connection:', error);
      throw error;
    }
  }

  /**
   * Set up all socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.socketId = this.socket.id;
      //console.log('Socket ID:', this.socketId);
      this.reconnectAttempts = 0;
      //console.log('✅ Socket.IO connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.socketId = null;
      //console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Initializing Socket.IO Connection Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      //console.log(`Initializing Socket.IO Connection 🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.socketId = this.socket.id;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Initializing Socket.IO Connection Socket reconnection error:', error);
    });
  }

  /**
   * Join a room
   * @param {string} roomName - Name of the room to join
   * @param {Object} data - Additional data to send
   */
  joinRoom(roomName, data = {}) {
    if (!this.socket || !this.isConnected) {
      console.warn('Initializing Socket.IO Connection Cannot join room: Socket not connected');
      return;
    }

    const roomData = {
      room: roomName,
      userId: this.user?.id || '',
      timestamp: new Date().toISOString(),
      ...data
    };

    //console.log(`Initializing Socket.IO Connection Joining room: ${roomName}`, roomData);
    this.socket.emit('join_room', roomData);
    this.rooms.add(roomName);
  }

  realtimeRead(data, callback) {
    const eventName = `dynamicRead`;
    const dataToSend = {
      tableSchema : data.tableSchema,
      tableName : data.tableName,
      data : data.data,
      conditions : data.conditions,
      orderBy : data.orderBy,
      search : data.search,
      pagination : data.pagination,
      margedata : data.margedata,
      range : data.range,
      databaseid : data.databaseid
    };
    this.socket.emit(eventName, dataToSend);
    this.socket.on("dynamicRead-response", (data) => {
      console.log(`Initializing Socket.IO Connection Table read received for ${data.tableName}:`, data);
      callback(data);
    });
  }

  realtimeUpdate(data, callback) {
    const eventName = `dynamicUpdate`;
    const dataToSend = {
      tableSchema : data.tableSchema,
      tableName : data.tableName,
      data : data.data,
      condition : data.condition,
      databaseid : data.databaseid,
      localid : data.localid,
    };
    this.socket.emit(eventName, dataToSend);
    this.socket.on("dynamicUpdate-success", (data) => {
      //console.log(`Initializing Socket.IO Connection Table update received for ${data.tableName}:`, data);
      callback(data);
    });
  }

  realtimeCreate(data, callback) {
    const eventName = `dynamicCreate`;
    const dataToSend = {
      tableSchema : data.tableSchema,
      tableName : data.tableName,
      data : data.data,
      condition : data.condition,
      databaseid : data.databaseid,
      localid : data.localid,
    };
    this.socket.emit(eventName, dataToSend);
    this.socket.on("dynamicCreate-success", (data) => {
      //console.log(`Initializing Socket.IO Connection Table create received for ${data.tableName}:`, data);
      callback(data);
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      rooms: Array.from(this.rooms),
      user: this.user,
      reconnectAttempts: this.reconnectAttempts,
      socketConnected: this.socket?.connected || false
    };
  }

  /**
   * Wait for socket to be ready
   */
  async waitForSocketReady(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.socket?.connected) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Socket ready timeout'));
      }, timeout);

      const checkReady = () => {
        if (this.isConnected && this.socket?.connected) {
          clearTimeout(timeoutId);
          resolve(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      //console.log('Initializing Socket.IO Connection Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.isConnected = false;
      this.rooms.clear();
    }
  }

  /**
   * Reconnect socket
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Test socket connection with a simple ping
   */
  testConnection() {
    if (!this.socket || !this.isConnected) {
      //console.log('Initializing Socket.IO Connection ❌ Socket not connected for testing');
      return;
    }

    //console.log('Initializing Socket.IO Connection === TESTING SOCKET CONNECTION ===');
    //console.log('Initializing Socket.IO Connection Sending ping...');
    
    this.socket.emit('ping', { message: 'Hello from client', timestamp: new Date().toISOString() });
    
    this.socket.on('pong', (data) => {
      //console.log('Initializing Socket.IO Connection === PONG RECEIVED ===');
      //console.log('Initializing Socket.IO Connection Server responded:', data);
      //console.log('Initializing Socket.IO Connection Server responded:', data);
    });

    // Also try a generic test
    this.socket.emit('test', { test: true });
    
    this.socket.on('test-response', (data) => {
      //console.log('Initializing Socket.IO Connection === TEST RESPONSE ===');
      //console.log('Initializing Socket.IO Connection Test response:', data);
      //console.log('Initializing Socket.IO Connection Test response:', data);
    });
  }
}

// Create and export singleton instance
export const pingDartLive = new PingDartLiveSDK();

// Export the class for custom instances
export { PingDartLiveSDK };

// Default export
export default pingDartLive;
