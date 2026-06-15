class WhatsAppService {
    constructor(http, config) {
        this.http = http;
        this.baseURL = config?.baseURL || 'https://cloudapi.pingdart.com/api';
        this.apiKey = config?.apiKey;
    }

    async initialize(clientId, phoneNumber) {
        const res = await this.http.post("whatsapp/initialize-whatsapp", {
            clientId,
            phoneNumber
        });
        return res.data;
    }

    async sendMessage({ clientId, to, message, type = 'text', mediaData, mimetype, filename }) {
        if (!clientId || !to || (!message && !mediaData)) {
            throw new Error("clientId, to, and message/mediaData are required");
        }

        const res = await this.http.post("whatsapp/send-message", {
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
        const res = await this.http.post("whatsapp/check-status", { clientId });
        return res.data;
    }

    async getChats(clientId) {
        const res = await this.http.get(`whatsapp/get-chats/${clientId}`);
        return res.data;
    }

    async sendWhatsApp(phoneNumber, message, template = "whatsapp") {
        let cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
        cleanPhoneNumber = cleanPhoneNumber.replace(/\s/g, '');

        // If it's a local number (starts with 0), we should ideally know the country. 
        // For now, we'll just ensure it has a '+' if it looks like an international number but lacks it.
        if (!cleanPhoneNumber.startsWith('+') && cleanPhoneNumber.length >= 10) {
            // We'll stop auto-prefixing with +91 to support global users.
            // If the user wants a specific country, they should provide the full international format.
            // However, for backward compatibility, we'll just prepend '+' if it seems like a full number without it.
            // But actually, it's safer to just require the user to provide the '+' for international numbers.
        }

        try {
            const response = await this.http.post("whatsapp/send", {
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
