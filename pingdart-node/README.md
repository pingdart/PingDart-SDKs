# PingDart JavaScript SDK

The official JavaScript SDK for the PingDart platform. Compatible with Node.js, React, Next.js, Vite, and other JavaScript frameworks.

## Installation

```bash
npm install pingdart-node
```

## Quick Start

```javascript
import PingDart from "pingdart-node";

const sdk = new PingDart({
  apiKey: "YOUR_API_KEY",
  databaseId: "YOUR_DATABASE_ID", // Required for Real-time Database services
  agentKey: "YOUR_AGENT_KEY" // Optional: Specific key for AI Agents
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

// Send an Email with custom SMTP (Optional)
await sdk.email.sendEmail({
  email: "recipient@example.com",
  subject: "Welcome to PingDart",
  text: "Thank you for joining our platform!",
  smtpConfigOptions: {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "your-smtp-user",
    pass: "your-smtp-password"
  }
});

// Send an SMS
await sdk.sms.sendSMS({
  to: "+919999999999",
  text: "Your OTP is 123456"
});
```

## Features

- **Cross-Platform**: Works seamlessly in both server-side (Node.js) and client-side (Frontend) environments.
- **Universal Database**: Multi-database support (MySQL, PostgreSQL, MongoDB) with real-time updates and long-polling capabilities.
- **WhatsApp Service**: Manage sessions, send text/media, and monitor status in real-time.
- **AI Chat (ChinuAI)**: Integrate with PingDart's AI models with built-in streaming support.
- **Email & SMS Delivery**: High-reliability communication channels with automatic fallback mechanisms.
- **Call Apps**: Manage Web and Mobile call identities and signaling for real-time communication.

## API Reference

### Database Service (`sdk.database`)
Manage structured data across different database engines.
- `create(tableSchema, tableName, data, conditions, login)`
- `read(tableSchema, tableName, conditions, orderBy, search, pagination, margedata, range)`
- `update(tableSchema, tableName, data, condition, login)`
- `delete(tableSchema, tableName, condition)`
- `count(tableSchema, tableName, conditions)`
- `listenForUpdates(tableSchema, tableName, callback)`

### Email Service (`sdk.email`)
Reliable email delivery with built-in fallback logic and SMTP support.
- `sendEmail({ email, subject, text, smtpConfigOptions })`
- `bulkSend({ emailList, subject, text, smtpConfigOptions })`

### SMS Service (`sdk.sms`)
Global SMS delivery via PingDart's high-speed routes.
- `sendSMS({ to, templateId, text, route, unicode })`

### AI Service (`sdk.ai`)
Power your apps with ChinuAI.
- `callAiApi(message, onProgress, options)` (Supports streaming responses)

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

## License

MIT
