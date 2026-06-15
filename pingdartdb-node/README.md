# PingDartDB Node.js SDK

Official Node.js SDK for connecting your application directly to a local MySQL or PostgreSQL database using your PingDart license key.

## Installation

```bash
npm install pingdartdb-node
```

## Quick Start

```js
const PingDartDB = require('pingdartdb-node');

const db = new PingDartDB('pd_YOUR_SDK_KEY_HERE', {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'your_database',
  type: 'mysql'   // or 'postgres'
});

await db.connect();

// Read
const users = await db.table('users').read({
  conditions: { status: 'active' },
  pagination: { page: 1, limit: 10 }
});

// Insert
await db.table('users').insert({ name: 'Alice', email: 'alice@example.com' });

// Update
await db.table('users').update({ id: 1 }, { status: 'inactive' });

// Delete
await db.table('users').delete({ id: 1 });

// Count
const total = await db.table('users').count({ status: 'active' });
```

## Getting Your SDK Key

1. Log in to your [PingDart Dashboard](https://pingdart.com)
2. Go to **Settings → Security**
3. Scroll to **PingDartDB Local SDK Keys**
4. Click **Create SDK Key** and copy your `pd_...` key

## Documentation

Full documentation: [pingdart.com/pingdartdb-node](https://pingdart.com/pingdartdb-node)

## License

SEE LICENSE FILE
