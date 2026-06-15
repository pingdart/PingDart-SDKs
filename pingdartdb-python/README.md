# PingDartDB Python SDK

The official direct database driver for PingDart in Python. 

## Installation

```bash
pip install pingdartdb
```

## Usage

```python
from pingdartdb import PingDartDB

db = PingDartDB("pd_your_license_key_here", {
    "host": "localhost",
    "user": "root",
    "password": "password",
    "database": "pingdart_test",
    "type": "mysql"
})

db.connect()

# Read data
result = db.table('users').read({'conditions': {'status': 'active'}})
print(result)

db.close()
```
