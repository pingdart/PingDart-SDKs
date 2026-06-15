import json
import time
import hashlib
import binascii
import requests
import pymysql
import pymysql.cursors
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

from .query_builder import QueryBuilder

class PingDartDB:
    def __init__(self, api_key: str, db_config: dict):
        self.api_key = api_key
        self.db_config = db_config
        self.db_type = db_config.get('type', 'mysql')
        self.license = None
        self.connection = None
        
        if self.db_type not in ['mysql', 'postgresql']:
            raise Exception(f"Unsupported database type: '{self.db_type}'. Use 'mysql' or 'postgresql'.")
            
        self._validate_key(api_key)

    def _validate_key(self, api_key: str):
        if not api_key or not api_key.startswith('pd_'):
            raise Exception('PingDart Authorization Failed: Invalid PingDart License Key format.')
            
        key_body = api_key.replace('pd_', '')
        parts = key_body.split('.')
        
        if len(parts) != 2:
            raise Exception('PingDart Authorization Failed: Invalid PingDart License Key format.')
            
        try:
            iv = binascii.unhexlify(parts[0])
            encrypted_text = binascii.unhexlify(parts[1])
            
            secret_key = 'PingDartSuperSecretKey2026!@#$'.encode('utf-8')
            key = binascii.b2a_base64(hashlib.sha256(secret_key).digest(), newline=False)[:32]
            
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            decrypted_padded = decryptor.update(encrypted_text) + decryptor.finalize()
            
            # Remove PKCS7 padding
            padding_len = decrypted_padded[-1]
            decrypted = decrypted_padded[:-padding_len]
            
            payload = json.loads(decrypted.decode('utf-8'))
            
            if 'expiresAt' in payload:
                # ISO to unix timestamp logic could go here; simplified for now
                pass
                
            self.license = payload
            
        except Exception as e:
            if 'PingDart Authorization Failed' in str(e):
                raise e
            raise Exception(f"PingDart Authorization Failed: License key is corrupted or tampered with. {e}")

    def connect(self):
        try:
            if self.db_type == 'mysql':
                self.connection = pymysql.connect(
                    host=self.db_config['host'],
                    user=self.db_config['user'],
                    password=self.db_config['password'],
                    database=self.db_config['database'],
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=True
                )
            else:
                raise Exception("PostgreSQL support requires psycopg2.")
                
        except Exception as e:
            raise Exception(f"Database connection failed: {e}")
            
        if self.license and self.license.get('tier') != 'free':
            self._validate_live_server()
            
        return True
        
    def _validate_live_server(self):
        try:
            resp = requests.post(
                'https://cloudapi.pingdart.com/api/realtime/validate-sdk',
                json={'apiKey': self.api_key},
                timeout=10
            )
            result = resp.json()
            if not result.get('success'):
                raise Exception(f"PingDart Live Authorization Failed: {result.get('message', 'Invalid response')}")
        except Exception as e:
            raise Exception(f"PingDart Live Authorization Failed: {e}")

    def table(self, table_name: str):
        return QueryBuilder(table_name, self.connection, self.db_type)
        
    def schema(self):
        from .schema_builder import SchemaBuilder
        return SchemaBuilder(self.connection, self.db_type)
        
    def close(self):
        if self.connection:
            self.connection.close()
