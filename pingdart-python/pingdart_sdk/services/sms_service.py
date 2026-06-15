class SmsService:
    def __init__(self, http_client):
        self.http = http_client

    def send_sms(self, to, text, template_id=None, route="pingdart", unicode="true"):
        try:
            response = self.http.post("/email/send-sms", json={
                "to": to,
                "text": text,
                "templateId": template_id,
                "route": route,
                "unicode": unicode
            })
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"SMS sending error: {str(e)}")
