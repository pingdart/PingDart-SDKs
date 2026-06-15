import { createClient } from "./utils/request.js";
import DatabaseService from "./services/database.service.js";
import WhatsAppService from "./services/whatsapp.service.js";
import SmsService from "./services/sms.service.js";
import AiService from "./services/ai.service.js";
import CallsService from "./services/calls.service.js";
import StorageService from "./services/storage.service.js";
import EmailService from "./services/email.service.js";

class PingDartSDK {
    constructor({
        apiKey,
        databaseId,
        agentKey,
        baseURL = "https://cloudapi.pingdart.com/api",
        realtimeBaseURL
    }) {
        if (!apiKey) {
            throw new Error("PingDart SDK: API Key is required");
        }

        this.apiKey = apiKey;
        this.databaseId = databaseId;
        this.agentKey = agentKey;
        this.baseURL = baseURL;
        // Auto-derive realtimeBaseURL if not provided (assume structure domain.com/api/realtime/)
        this.realtimeBaseURL = realtimeBaseURL || `${baseURL.replace(/\/api\/?$/, '')}/api/realtime/`;

        this.http = createClient({ apiKey, baseURL: this.baseURL });
        this.realtimeHttp = createClient({ apiKey, baseURL: this.realtimeBaseURL });

        // Services Configuration Object
        const config = { apiKey, baseURL: this.baseURL, databaseId, agentKey: this.agentKey, realtimeBaseURL: this.realtimeBaseURL };

        this.database = new DatabaseService(this.realtimeHttp, config);
        this.whatsapp = new WhatsAppService(this.http, config);
        this.sms = new SmsService(this.http, config);
        this.email = new EmailService(this.http, config);
        this.ai = new AiService(this.http, config);
        this.ai.databaseId = config.databaseId; // Explicitly attach if needed, though constructor uses config
        this.calls = new CallsService(this.http, config);
        this.storage = new StorageService(this.http, config, this.apiKey);
    }
}

export default PingDartSDK;
