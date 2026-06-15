// Client-side only import - dynamically loaded when needed
let io = null;

// Helper function to get socket.io-client instance (client-side only)
const getSocketIO = async () => {
  if (typeof window === 'undefined') return null;
  if (!io) {
    const socketIOClient = await import('socket.io-client');
    io = socketIOClient.io;
  }
  return io;
};


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

// Directly define your API URLs
const url = process.env.NEXT_PUBLIC_MODE === 'LIVE' ? process.env.NEXT_PUBLIC_API_BASE_LIVE_URL : process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE_URL = `${url}/api/realtime/`;
const API_URL = `${url}/api/`;


// Environment variables with fallbacks and warnings
const databaseid = process.env.NEXT_PUBLIC_DATABASEID || (() => {
  throw new Error('NEXT_PUBLIC_DATABASEID is missing! Please add it to your .env file.');
})();

const API_key = process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS || process.env.NEXT_PUBLIC_API_KEY_PINGDART || (() => {
  throw new Error('API Key is missing! Please add NEXT_PUBLIC_API_KEY_PINGDART to your .env file.');
})();

class PingDartSDK {
  constructor() {
    this.pollingInterval = null;
    this.socket = null;
    this._socketInitialized = false;
  }

  async _initializeSocket() {
    if (typeof window === 'undefined') return null;
    if (!this._socketInitialized && !this.socket) {
      const socketIO = await getSocketIO();
      if (socketIO) {
        this.socket = socketIO(API_BASE_URL);
        this._socketInitialized = true;
      }
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

  async postRequest(endpoint, data, timeout = 15000) {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // console.log("postRequest starting time", new Date().toISOString());
      // console.log("postRequest URL:", `${API_BASE_URL}${endpoint}`);
      // console.log("postRequest data:", data);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_key,
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response even if status is error to get error details
      let responseData;
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      try {
        if (isJson) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = text ? { message: text } : { message: 'Server error' };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = { message: 'Failed to parse server response' };
      }

      if (!response.ok) {
        const errorMessage = responseData?.message || responseData?.error || responseData?.errorMessage || `Server error (${response.status})`;
        // console.log('Error in postRequest', {
        //   endpoint,
        //   status: response.status,
        //   statusText: response.statusText,
        //   url: `${API_BASE_URL}${endpoint}`,
        //   responseData: responseData
        // });
        // Return error object instead of throwing
        return {
          success: false,
          status: response.status,
          message: errorMessage,
          error: errorMessage,
          data: [],
          responseData: responseData
        };
      }

      // console.log("postRequest ending time", new Date().toISOString());

      // Ensure response has success property for consistency
      if (responseData && typeof responseData === 'object' && !responseData.hasOwnProperty('success')) {
        responseData.success = true;
      }

      return responseData;
    } catch (error) {
      // Clear timeout if still pending
      clearTimeout(timeoutId);

      // Handle network errors and other exceptions
      console.error(`Error in ${endpoint}:`, error);

      // Handle timeout/abort errors
      if (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
        return {
          success: false,
          status: 0,
          message: `Request timeout: The server did not respond within ${timeout}ms. Please check your connection or try again later.`,
          error: 'Connection timeout',
          data: []
        };
      }

      // Return error object instead of throwing
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          status: 0,
          message: `Network error: Unable to connect to server. Please check if the API server is running at ${API_BASE_URL}`,
          error: error.message,
          data: []
        };
      }

      return {
        success: false,
        status: 0,
        message: error.message || 'Unknown error occurred',
        error: error.message || 'Unknown error occurred',
        data: []
      };
    }
  }

  // CRUD methods
  create(tableSchema, tableName, data, conditions, login = true) {
    return this.postRequest('dynamicCreate', { tableSchema, tableName, data, conditions, databaseid });
  }

  read(tableSchema, tableName, conditions, orderBy, search, pagination, margedata, range = []) {

    return this.postRequest('dynamicRead', { tableSchema, tableName, conditions, orderBy, search, pagination, margedata, range, databaseid });
  }

  update(tableSchema, tableName, data, condition, login = true) {
    return this.postRequest('dynamicUpdate', { tableSchema, tableName, data, condition, databaseid });
  }

  delete(tableSchema, tableName, condition) {
    return this.postRequest('dynamicDelete', { tableSchema, tableName, condition, databaseid });
  }

  count(tableSchema, tableName, conditions) {

    return this.postRequest('dynamicCount', { tableSchema, tableName, conditions, databaseid });
  }

  hashPassword(password) {
    return this.postRequest('hashPassword', { password });
  }

  async callAppRequest(method, endpoint, data = null, timeout = 15000) {
    const presentUser = getLocalUser();
    const token = presentUser?.token || presentUser?.access_token;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_key,
        'Cache-Control': 'no-store',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_URL}v1/calls/${endpoint}`, options);
      clearTimeout(timeoutId);

      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = { message: text || `Server error (${response.status})` };
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: responseData.message || responseData.error || 'Server error',
          data: []
        };
      }

      if (responseData && typeof responseData === 'object' && !responseData.hasOwnProperty('success')) {
        responseData.success = true;
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Error in callAppRequest (${endpoint}):`, error);
      return {
        success: false,
        status: 0,
        message: error.message || 'Network error',
        data: []
      };
    }
  }

  listCallApps() {
    return this.callAppRequest('GET', 'apps');
  }

  createCallApp(name, type = 'Web') {
    return this.callAppRequest('POST', 'apps', { name, type });
  }

  deleteCallApp(id) {
    return this.callAppRequest('DELETE', `apps/${id}`);
  }

  startLongPolling(tableSchema, tableName, conditions, orderBy, search, callback, pagination, margedata) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function.');
    }

    const fetchData = async () => {
      try {
        const data = await this.read(tableSchema, tableName, conditions, orderBy, search, pagination, margedata);
        callback(data);
      } catch (error) {
        throw new Error(`Polling error: ${error.message}`);
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

// Email sender utility
export const sendEmail = async (email, subject, text) => {
  const host = process.env.NEXT_PUBLIC_SMTP_HOST || "mail.pingdart.com";
  const portEnv = process.env.NEXT_PUBLIC_SMTP_PORT;
  const secureEnv = process.env.NEXT_PUBLIC_SMTP_SECURE;

  const resolvedPort = portEnv ? Number(portEnv) : 465;
  const resolvedSecure = typeof secureEnv === 'string' ? secureEnv.toLowerCase() === 'true' : true;

  const smtpConfigPrimary = {
    host,
    port: resolvedPort,
    secure: resolvedSecure,
    auth: {
      user: process.env.NEXT_PUBLIC_SMTP_USER || "info@pingdart.com",
      pass: process.env.NEXT_PUBLIC_SMTP_PASS || ""
    }
  };

  // Fallback: try STARTTLS on 587 if implicit SSL 465 fails (or vice versa)
  const smtpConfigFallback = resolvedPort === 465
    ? { ...smtpConfigPrimary, port: 587, secure: false }
    : { ...smtpConfigPrimary, port: 465, secure: true };

  const api_key = process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS || (() => {
    throw new Error('NEXT_PUBLIC_API_KEY_ONEKLICKS is missing! Please add it to your .env file.');
  })();

  try {
    const primaryResponse = await fetch(`${API_URL}email/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_key,
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ smtpConfig: smtpConfigPrimary, email, subject, text, api_key }),
    });

    const primaryJson = await primaryResponse.json();
    if (primaryJson?.success === true) {
      return primaryJson;
    }

    // If connection refused or similar network error from backend, try fallback
    const shouldFallback = typeof primaryJson?.error === 'string' && /ECONNREFUSED|connect|timeout/i.test(primaryJson.error);
    if (!shouldFallback) {
      return primaryJson;
    }

    const fallbackResponse = await fetch(`${API_URL}email/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_key,
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ smtpConfig: smtpConfigFallback, email, subject, text, api_key }),
    });
    return await fallbackResponse.json();
  } catch (error) {
    throw new Error(`Email sending error: ${error.message}`);
  }
};

export const sendSMS = async (phoneNumber, body) => {
  try {
    const response = await fetch(`${API_URL}email/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_key,
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ phoneNumber, body }),
    });

    return await response.json();
  } catch (error) {
    throw new Error(`SMS sending error: ${error.message}`);
  }
};

export const sendWhatsApp = async (phoneNumber, message, template = "whatsapp") => {
  try {
    console.log('Sending WhatsApp message to:', phoneNumber);
    console.log('Message:', message);

    // Clean phone number - remove any non-digit characters except + and ensure proper format
    let cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Remove spaces and ensure it starts with country code
    cleanPhoneNumber = cleanPhoneNumber.replace(/\s/g, '');

    // If it starts with 0, replace with +91 (India country code)
    if (cleanPhoneNumber.startsWith('0')) {
      cleanPhoneNumber = '+91' + cleanPhoneNumber.substring(1);
    }

    // If it doesn't start with +, add +91
    if (!cleanPhoneNumber.startsWith('+')) {
      cleanPhoneNumber = '+91' + cleanPhoneNumber;
    }

    console.log('Original phone:', phoneNumber);
    console.log('Cleaned phone:', cleanPhoneNumber);

    // Try to route through backend first (recommended approach)
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://cloudapi.pingdart.com";
    const backendWhatsAppUrl = `${backendUrl}/api/whatsapp/send`;

    try {
      const response = await fetch(backendWhatsAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS || '',
        },
        body: JSON.stringify({
          number: cleanPhoneNumber,
          message: message,
          template: template
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: 'WhatsApp message sent successfully via backend',
          data: result
        };
      }
    } catch (backendError) {
      console.log('Backend WhatsApp route failed, trying direct API...', backendError);
    }

    // Use WhatsApp API to send message directly (open in new window/tab)
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${cleanPhoneNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`;

    console.log('Opening WhatsApp URL:', whatsappUrl);

    // Open WhatsApp in a new window/tab - this is more reliable than iframe
    const whatsappWindow = window.open(whatsappUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');

    // Check if window opened successfully
    if (whatsappWindow) {
      console.log('WhatsApp window opened successfully');

      // Return success for direct sending
      return {
        success: true,
        message: 'WhatsApp opened in new window!',
        data: {
          status: 'opened',
          url: whatsappUrl,
          note: 'WhatsApp opened in new window/tab. Please send the message manually.'
        }
      };
    } else {
      // Fallback: try to open in same window
      console.log('Failed to open new window, trying same window...');
      window.location.href = whatsappUrl;

      return {
        success: true,
        message: 'WhatsApp opened!',
        data: {
          status: 'redirected',
          url: whatsappUrl,
          note: 'Redirected to WhatsApp. Please send the message manually.'
        }
      };
    }


  } catch (error) {
    console.error('WhatsApp sending error:', error);

    // Check if it's a CORS error and provide helpful message
    if (error.message.includes('Failed to fetch')) {
      throw new Error('CORS/Network error: WhatsApp API cannot be accessed directly from browser. Please contact administrator to set up backend proxy.');
    }

    throw new Error(`WhatsApp sending error: ${error.message}`);
  }
};

export const callAiApi = async (message) => {
  try {
    const response = await fetch(`http://27.7.41.165:11434/api/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "pingdart-ai",
        prompt: message,
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // console.log(chunk); // You can update UI here letter by letter
      result += chunk;
    }

    return result;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};



export const pingDart = new PingDartSDK();
