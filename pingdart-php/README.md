# PingDart PHP SDK

The official PHP SDK for the PingDart platform. Compatible with Laravel, CodeIgniter, and pure PHP.

## Installation

```bash
composer require pingdart/sdk
```

## Quick Start

```php
use PingDart\SDK\PingDartSDK;

$sdk = new PingDartSDK([
    'apiKey' => 'YOUR_API_KEY',
    'databaseId' => 'YOUR_DATABASE_ID'
]);

// List Call Applications
$apps = $sdk->calls->listApps();

// Real-time Database: Read data
$users = $sdk->database->read('public', 'users', ['status' => 'active']);

// Send a WhatsApp Message
$sdk->whatsapp->sendMessage([
    'clientId' => 'my-session',
    'to' => '919999999999',
    'message' => 'Hello from PingDart PHP SDK!'
]);
```

## Laravel Integration

The SDK supports Laravel auto-discovery. After installing, you can optionally publish the config file:

```bash
php artisan vendor:publish --tag="pingdart-config"
```

### Usage with Facade

```php
use PingDart;

// Database
$data = PingDart::database()->read('users', ['id' => 1]);

// WhatsApp
PingDart::whatsapp()->sendMessage([
    'to' => '919999999999',
    'message' => 'Hello from Laravel!'
]);
```

### Usage with Dependency Injection

```php
use PingDart\SDK\PingDartSDK;

public function index(PingDartSDK $sdk)
{
    $apps = $sdk->calls->listApps();
}
```

## CodeIgniter 4 Integration

Add the following to `app/Config/Services.php`:

```php
public static function pingdart($getShared = true)
{
    if ($getShared) {
        return static::getSharedInstance('pingdart');
    }

    return \PingDart\SDK\CodeIgniter\PingDart::instance();
}
```

Now you can use it anywhere:
```php
$sdk = service('pingdart');
$sdk->sms->send(['to' => '...', 'message' => '...']);
```

## Features

- **Universal Database**: Multi-DB support (MySQL, PostgreSQL, MongoDB).
- **WhatsApp**: Session management and messaging.
- **AI Chat**: Streaming responses via Guzzle.
- **Cloud Storage**: Bucket and file management.
- **Communication**: Email and SMS services.
- **Calls**: Signaling application management.

## License

MIT
