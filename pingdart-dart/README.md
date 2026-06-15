# PingDart Dart SDK

The official Dart/Flutter SDK for the PingDart platform.

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  pingdart_sdk:
    path: ./path/to/pingdart_sdk
```

## Quick Start

```dart
import 'package:pingdart_sdk/pingdart_sdk.dart';

void main() async {
  final sdk = PingDartSDK(
    apiKey: 'YOUR_API_KEY',
    databaseId: 'YOUR_DATABASE_ID',
  );

  // List Call Applications
  final apps = await sdk.calls.listApps();
  print(apps);

  // Read from Database
  final result = await sdk.database.read('public', 'users', conditions: {'status': 'active'});
  print(result);
}
```

## Features
- **Database**: Multi-DB support for Flutter apps.
- **Calls**: Signaling management for WebRTC.
- **WhatsApp/AI**: Coming soon.

## License
MIT
