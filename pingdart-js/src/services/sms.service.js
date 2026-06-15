class SmsService {
    constructor(http, config) {
        this.http = http;
    }

    async sendSMS({ to, templateId, text, route = "pingdart", unicode = "true" }) {
        try {
            const response = await this.http.post("/email/send-sms", {
                to,
                templateId,
                text,
                route,
                unicode
            });
            return response.data;
        } catch (error) {
            throw new Error(`SMS sending error: ${error.message}`);
        }
    }
}

export default SmsService;
