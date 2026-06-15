class StorageService:
    def __init__(self, http_client):
        self.http = http_client

    def get_stats(self):
        """
        Get storage statistics.
        """
        try:
            response = self.http.post("/files/stats")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to get storage stats: {str(e)}")

    def list_buckets(self):
        """
        List all buckets.
        """
        try:
            response = self.http.post("/files/get-buckets")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to list buckets: {str(e)}")

    def create_bucket(self, name):
        """
        Create a new bucket.
        """
        try:
            response = self.http.post("/files/create-bucket", json={"name": name})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to create bucket: {str(e)}")

    def delete_bucket(self, bucket_id):
        """
        Delete a bucket.
        """
        try:
            response = self.http.post("/files/delete-bucket", json={"id": bucket_id})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to delete bucket: {str(e)}")

    def upload_file(self, file_path, bucket_name=None, destination=None):
        """
        Upload a file using multipart/form-data.
        """
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                data = {}
                if bucket_name:
                    data['bucket_name'] = bucket_name
                if destination:
                    data['destination'] = destination
                
                # We need to bypass our standard json request for multipart
                # self.http.headers will have x-api-key which is good
                response = self.http.request(
                    'POST', 
                    "/files/upload", 
                    files=files, 
                    data=data
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            raise Exception(f"Failed to upload file: {str(e)}")

    def delete_file(self, file_path):
        """
        Delete a file.
        """
        try:
            response = self.http.post("/files/deleteFile", json={"filePath": file_path})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to delete file: {str(e)}")
