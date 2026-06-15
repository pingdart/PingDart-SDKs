class CallsService:
    def __init__(self, http_client):
        self.http = http_client

    def list_apps(self):
        """
        List all call applications for the authenticated user.
        """
        try:
            response = self.http.get("/v1/calls/apps")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to list call apps: {str(e)}")

    def create_app(self, name, app_type='Web'):
        """
        Create a new call application.
        """
        try:
            response = self.http.post("/v1/calls/apps", json={"name": name, "type": app_type})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to create call app: {str(e)}")

    def delete_app(self, app_id):
        """
        Delete a call application.
        """
        try:
            response = self.http.delete(f"/v1/calls/apps/{app_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to delete call app: {str(e)}")
