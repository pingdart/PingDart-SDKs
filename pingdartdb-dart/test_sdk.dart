import 'dart:convert';
import 'dart:typed_data';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'lib/src/pingdart_db.dart';

String generateValidKey() {
  const secretKey = 'PingDartSuperSecretKey2026!@#\$';
  final digest = sha256.convert(utf8.encode(secretKey));
  final encodedHash = base64.encode(digest.bytes);
  final keyBytes = utf8.encode(encodedHash.substring(0, 32));

  final random = Random.secure();
  final ivBytes = List<int>.generate(16, (i) => random.nextInt(256));

  final payload = {'tier': 'free', 'createdAt': DateTime.now().toIso8601String()};
  final jsonData = utf8.encode(json.encode(payload));

  final encrypter = encrypt.Encrypter(
    encrypt.AES(encrypt.Key(Uint8List.fromList(keyBytes)), mode: encrypt.AESMode.cbc, padding: 'PKCS7')
  );

  final encrypted = encrypter.encryptBytes(jsonData, iv: encrypt.IV(Uint8List.fromList(ivBytes)));

  String toHex(List<int> bytes) => bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join('');

  return 'pd_${toHex(ivBytes)}.${toHex(encrypted.bytes)}';
}

void main() async {
  print("1. Generated Local Dart Offline API Key");
  final apiKey = generateValidKey();

  final config = {
    'host': '94.136.190.60',
    'user': 'pingdart_ravi',
    'password': 'Ravindra12@',
    'database': 'pingdart_test',
    'type': 'mysql'
  };

  try {
    final db = PingDartDB(apiKey: apiKey, dbConfig: config);
    await db.connect();
    print("2. Connection successful.");

    final res = await db.table('test_users').read({
      'conditions': {'status': 'active'}
    });

    print("3. Basic Read test returned ${res['totalCount']} rows.");

    await db.close();
    print("\n✅ Dart SDK Connection Test passed successfully!");
  } catch (e) {
    print("❌ Dart Test failed: $e");
  }
}
