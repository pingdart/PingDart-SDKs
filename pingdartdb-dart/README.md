# PingDartDB Dart SDK

The official direct database driver for PingDart in Dart and Flutter. 

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  pingdartdb_dart: ^1.0.0
```

## Usage

```dart
import 'package:pingdartdb_dart/pingdartdb_dart.dart';

void main() async {
  final db = PingDartDB(
    apiKey: "pd_your_license_key_here", 
    dbConfig: {
      "host": "localhost",
      "user": "root",
      "password": "password",
      "database": "pingdart_test",
      "type": "mysql"
    }
  );

  await db.connect();
  
  final res = await db.table('users').read({
    'conditions': {'status': 'active'}
  });
  print(res);
  
  await db.close();
}
```
