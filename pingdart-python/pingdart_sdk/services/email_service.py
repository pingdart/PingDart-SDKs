class EmailService:
    def __init__(self, http_client):
        self.http = http_client

    def send_email(self, email, subject, text, smtp_config=None):
        payload = {
            "email": email,
            "subject": subject,
            "text": text
        }
        if smtp_config:
            payload["smtpConfig"] = smtp_config
            
        try:
            response = self.http.post("/email/send-email", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Email sending error: {str(e)}")

    def bulk_send(self, data, smtp_config=None):
        payload = {
            "data": data
        }
        if smtp_config:
            payload["smtpConfig"] = smtp_config
            
        try:
            response = self.http.post("/email/bulk-send", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Bulk email sending error: {str(e)}")
