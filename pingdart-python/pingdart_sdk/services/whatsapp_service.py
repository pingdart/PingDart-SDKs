class WhatsAppService:
    def __init__(self, http_client):
        self.http = http = http_client

    def initialize(self, client_id, phone_number):
        try:
            response = self.http.post("/whatsapp/initialize-whatsapp", json={
                "clientId": client_id,
                "phoneNumber": phone_number
            })
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to initialize WhatsApp: {str(e)}")

    def send_message(self, client_id, to, message=None, media_data=None, message_type='text', mimetype=None, filename=None):
        if not client_id or not to or (not message and not media_data):
            raise ValueError("client_id, to, and message/media_data are required")

        payload = {
            "clientId": client_id,
            "phoneNumber": to,
            "message": message,
            "type": message_type,
            "mediaData": media_data,
            "mimetype": mimetype,
            "filename": filename
        }
        
        try:
            response = self.http.post("/whatsapp/send-message", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to send WhatsApp message: {str(e)}")

    def check_status(self, client_id):
        try:
            response = self.http.post("/whatsapp/check-status", json={"clientId": client_id})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to check WhatsApp status: {str(e)}")
