class SmsService {
    constructor(http, config) {
        this.http = http;
        this.apiKey = config?.apiKey;
    }

    async sendSMS({ to, templateId, text, route = "pingdart", unicode = "true" }) {
        try {
            // Basic cleaning for SMS target number
            const cleanTo = to.replace(/[^\d+]/g, '').replace(/\s/g, '');

            const response = await this.http.post("email/send-sms", { // Keep email/ prefix for backend compatibility
                to: cleanTo,
                templateId,
                text,
                route,
                unicode,
                api_key: this.apiKey
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            throw new Error(`SMS sending error: ${errorMessage}`);
        }
    }
}

export default SmsService;
