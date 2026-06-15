import os
import binascii
import hashlib
import json
import datetime
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

from src.pingdartdb.client import PingDartDB

def generate_valid_key():
    secret_key = b'PingDartSuperSecretKey2026!@#$'
    key = binascii.b2a_base64(hashlib.sha256(secret_key).digest(), newline=False)[:32]
    iv = os.urandom(16)
    
    payload = json.dumps({"tier": "free", "createdAt": datetime.datetime.now().isoformat()}).encode('utf-8')
    
    # PKCS7 Padding
    pad_len = 16 - (len(payload) % 16)
    payload += bytes([pad_len] * pad_len)
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(payload) + encryptor.finalize()
    
    return f"pd_{binascii.hexlify(iv).decode('utf-8')}.{binascii.hexlify(encrypted).decode('utf-8')}"

try:
    api_key = generate_valid_key()
    print("1. Generated Local Python Offline API Key")

    db = PingDartDB(api_key, {
        'host': '94.136.190.60',
        'user': 'pingdart_ravi',
        'password': 'Ravindra12@',
        'database': 'pingdart_test',
        'type': 'mysql'
    })

    db.connect()
    print("2. Connection successful.")

    res = db.table('test_users').read({
        'conditions': {'status': 'active'}
    })

    print(f"3. Basic Read test returned {res['totalCount']} rows.")
    
    print("\n✅ Python SDK Connection Test passed successfully!")
    
except Exception as e:
    print(f"❌ Python Test failed: {e}")
finally:
    if 'db' in locals():
        db.close()
