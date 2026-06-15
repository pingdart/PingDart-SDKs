# PingDart Python SDK

The official Python SDK for the PingDart platform.

## Installation

```bash
pip install pingdart-sdk
```

## Quick Start

```python
from pingdart_sdk import PingDartSDK

sdk = PingDartSDK(
    api_key="YOUR_API_KEY",
    database_id="YOUR_DATABASE_ID"
)

# List Call Applications
apps = sdk.calls.list_apps()

# Real-time Database: Read data
users = sdk.database.read('public', 'users', {'status': 'active'})

# Send a WhatsApp Message
sdk.whatsapp.send_message(
    client_id="my-session",
    to="919999999999",
    message="Hello from PingDart Python SDK!"
)
```

## Features

- **Universal Database**: Multi-database support (MySQL, PostgreSQL, MongoDB).
- **WhatsApp Service**: Manage sessions and send messages.
- **AI Chat**: Streaming responses from PingDart AI.
- **Communication Channels**: SMS, Email, and Bulk Email support.
- **Call Apps**: Manage your signaling applications.
- **Cloud Storage**: Bucket management and file uploads.

## API Reference

Refer to the NodeJS SDK README for full API parameter details, as the Python SDK follows a similar structure with snake_case method names.

## License

MIT
