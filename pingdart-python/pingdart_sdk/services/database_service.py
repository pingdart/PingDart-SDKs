import requests

class DatabaseService:
    def __init__(self, http_client, config):
        self.http = http_client
        self.database_id = config.get('databaseId')
        self.realtime_base_url = config.get('realtimeBaseURL')

    def _post_request(self, endpoint, data):
        try:
            # Add database_id if not present in data
            if 'databaseid' not in data:
                data['databaseid'] = self.database_id
            
            response = self.http.post(f"/{endpoint}", json=data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "error": str(e)
            }

    def create(self, table_schema, table_name, data, conditions=None):
        return self._post_request('dynamicCreate', {
            'tableSchema': table_schema,
            'tableName': table_name,
            'data': data,
            'conditions': conditions or {}
        })

    def read(self, table_schema, table_name, conditions=None, order_by=None, search=None, pagination=None, margedata=None, range_filter=None):
        return self._post_request('dynamicRead', {
            'tableSchema': table_schema,
            'tableName': table_name,
            'conditions': conditions or {},
            'orderBy': order_by or {},
            'search': search or {},
            'pagination': pagination or {},
            'margedata': margedata or {},
            'range': range_filter or []
        })

    def update(self, table_schema, table_name, data, condition):
        return self._post_request('dynamicUpdate', {
            'tableSchema': table_schema,
            'tableName': table_name,
            'data': data,
            'condition': condition
        })

    def delete(self, table_schema, table_name, condition):
        return self._post_request('dynamicDelete', {
            'tableSchema': table_schema,
            'tableName': table_name,
            'condition': condition
        })

    def count(self, table_schema, table_name, conditions=None):
        return self._post_request('dynamicCount', {
            'tableSchema': table_schema,
            'tableName': table_name,
            'conditions': conditions or {}
        })
