class WhatsAppService {
    constructor(http, config) {
        this.http = http;
        this.baseURL = config?.baseURL || 'https://cloudapi.pingdart.com/api';
        this.apiKey = config?.apiKey;
    }

    async initialize(clientId, phoneNumber) {
        const res = await this.http.post("/whatsapp/initialize-whatsapp", {
            clientId,
            phoneNumber
        });
        return res.data;
    }

    async sendMessage({ clientId, to, message, type = 'text', mediaData, mimetype, filename }) {
        if (!clientId || !to || (!message && !mediaData)) {
            throw new Error("clientId, to, and message/mediaData are required");
        }

        const res = await this.http.post("/whatsapp/send-message", {
            clientId,
            phoneNumber: to,
            message,
            type,
            mediaData,
            mimetype,
            filename
        });

        return res.data;
    }

    async checkStatus(clientId) {
        const res = await this.http.post("/whatsapp/check-status", { clientId });
        return res.data;
    }

    async getChats(clientId) {
        const res = await this.http.get(`/whatsapp/get-chats/${clientId}`);
        return res.data;
    }

    async sendWhatsApp(phoneNumber, message, template = "whatsapp") {
        let cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
        cleanPhoneNumber = cleanPhoneNumber.replace(/\s/g, '');

        if (cleanPhoneNumber.startsWith('0')) {
            cleanPhoneNumber = '+91' + cleanPhoneNumber.substring(1);
        }

        if (!cleanPhoneNumber.startsWith('+')) {
            cleanPhoneNumber = '+91' + cleanPhoneNumber;
        }

        try {
            const response = await this.http.post("/whatsapp/send", {
                number: cleanPhoneNumber,
                message: message,
                template: template
            });

            if (response.status === 200 || response.data.success) {
                return {
                    success: true,
                    message: 'WhatsApp message sent successfully via backend',
                    data: response.data
                };
            }
        } catch (error) {
            throw new Error(`Backend WhatsApp route failed: ${error.message}`);
        }
    }
}

export default WhatsAppService;
