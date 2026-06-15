import requests
import json

class AiService:
    def __init__(self, http_client):
        self.http = http_client

    def call_ai_api(self, message, on_progress=None, model="chinnuai:1.1", **kwargs):
        """
        Call the AI API with optional streaming progress.
        """
        payload = {
            "message": message,
            "stream": True,
            "model": model,
            **kwargs
        }
        
        try:
            # We use the base http client but for streaming we need to be careful with its configuration
            # Assuming self.http is a requests.Session or similar
            base_url = self.http.base_url if hasattr(self.http, 'base_url') else ""
            headers = self.http.headers
            
            response = requests.post(
                f"{base_url}/api/ai/chinuai-chat",
                json=payload,
                headers=headers,
                stream=True
            )
            response.raise_for_status()
            
            full_result = ""
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data: '):
                        data_str = decoded_line[6:].strip()
                        if not data_str:
                            continue
                        try:
                            parsed = json.loads(data_str)
                            chunk = parsed.get('chunk', '')
                            if chunk:
                                full_result += chunk
                                if on_progress:
                                    on_progress(chunk)
                            if parsed.get('done'):
                                break
                        except json.JSONDecodeError:
                            # Fallback if the line is raw text
                            full_result += decoded_line
                            if on_progress:
                                on_progress(decoded_line)
            
            return full_result
        except Exception as e:
            raise Exception(f"AI API Error: {str(e)}")
