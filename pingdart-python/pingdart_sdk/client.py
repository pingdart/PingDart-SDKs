import requests
from .services.database_service import DatabaseService
from .services.whatsapp_service import WhatsAppService
from .services.sms_service import SmsService
from .services.email_service import EmailService
from .services.ai_service import AiService
from .services.calls_service import CallsService
from .services.storage_service import StorageService

class PingDartHTTPClient:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "X-SDK-Source": "PingDart-Python-SDK"
        }

    def request(self, method, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        if 'headers' in kwargs:
            kwargs['headers'].update(self.headers)
        else:
            kwargs['headers'] = self.headers
            
        return requests.request(method, url, **kwargs)

    def get(self, endpoint, **kwargs):
        return self.request('GET', endpoint, **kwargs)

    def post(self, endpoint, data=None, json=None, **kwargs):
        return self.request('POST', endpoint, data=data, json=json, **kwargs)

    def put(self, endpoint, data=None, json=None, **kwargs):
        return self.request('PUT', endpoint, data=data, json=json, **kwargs)

    def delete(self, endpoint, **kwargs):
        return self.request('DELETE', endpoint, **kwargs)

class PingDartSDK:
    def __init__(self, api_key, database_id=None, base_url="https://cloudapi.pingdart.com/api", realtime_base_url=None):
        if not api_key:
            raise ValueError("PingDart SDK: API Key is required")

        self.base_url = base_url.rstrip('/')
        # Auto-derive realtime_base_url if not provided
        if not realtime_base_url:
            self.realtime_base_url = f"{self.base_url.replace('/api', '')}/api/realtime/"
        else:
            self.realtime_base_url = realtime_base_url

        self.http = PingDartHTTPClient(api_key, self.base_url)
        self.realtime_http = PingDartHTTPClient(api_key, self.realtime_base_url)

        config = {
            'apiKey': api_key,
            'baseURL': self.base_url,
            'databaseId': database_id,
            'realtimeBaseURL': self.realtime_base_url
        }

        self.database = DatabaseService(self.realtime_http, config)
        self.whatsapp = WhatsAppService(self.http)
        self.sms = SmsService(self.http)
        self.email = EmailService(self.http)
        self.ai = AiService(self.http)
        self.calls = CallsService(self.http)
        self.storage = StorageService(self.http)
