# PingDart JavaScript SDK

The official JavaScript SDK for the PingDart platform. Compatible with Node.js, React, Next.js, Vite, and other JavaScript frameworks.

## Installation

```bash
npm install pingdart-sdk
```

## Quick Start

```javascript
import PingDart from "pingdart-sdk";

const sdk = new PingDart({
  apiKey: "YOUR_API_KEY",
  databaseId: "YOUR_DATABASE_ID" // Required for Real-time Database services
});

// List Call Applications
const apps = await sdk.calls.listApps();

// Real-time Database: Read data
const users = await sdk.database.read('public', 'users', { status: 'active' });

// Send a WhatsApp Message
await sdk.whatsapp.sendMessage({
  clientId: "my-session",
  to: "919999999999",
  message: "Hello from PingDart SDK!"
});
```

## Features

- **Cross-Platform**: Works in both server-side (Node.js) and client-side (Frontend) environments.
- **Universal Database**: Multi-database support (MySQL, PostgreSQL, MongoDB) with real-time updates and long-polling.
- **WhatsApp Service**: Initialize sessions, send text/media, and check status.
- **AI Chat**: Integrate with PingDart's AI models for streaming chat responses.
- **Email & SMS**: Comprehensive delivery services for multiple communication channels.
- **Call Apps**: Manage Web and Mobile call identities and signaling.

## API Reference

### Database Service (`sdk.database`)
Supports MySQL, PostgreSQL, and MongoDB based on your database configuration.
- `create(tableSchema, tableName, data, conditions, login)`
- `read(tableSchema, tableName, conditions, orderBy, search, pagination, margedata, range)`
- `update(tableSchema, tableName, data, condition, login)`
- `delete(tableSchema, tableName, condition)`
- `count(tableSchema, tableName, conditions)`
- `listenForUpdates(tableSchema, tableName, callback)` (Webhooks/Sockets)

### Call Apps Service (`sdk.calls`)
- `listApps()`
- `createApp(name, type)`
- `deleteApp(id)`

### Storage Service (`sdk.storage`)
- `getStats()`
- `listBuckets()`
- `createBucket(name)`
- `deleteBucket(bucketId)`
- `uploadFile(formData)`
- `deleteFile(filePath)`

### WhatsApp Service (`sdk.whatsapp`)
- `initialize(clientId, phoneNumber)`
- `sendMessage({ clientId, to, message, type, mediaData, ... })`
- `checkStatus(clientId)`
- `getChats(clientId)`

### AI Service (`sdk.ai`)
- `callAiApi(message, onProgress, options)` (Supports streaming responses)

### SMS Service (`sdk.sms`)
- `sendSMS({ to, templateId, text, route, unicode })`

### Email Service (`sdk.email`)
- `sendEmail({ email, subject, text, smtpConfig })`
- `bulkSend({ data, smtpConfig })`

## License

MIT
