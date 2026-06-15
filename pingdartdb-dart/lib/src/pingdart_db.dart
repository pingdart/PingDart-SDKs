import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:http/http.dart' as http;
import 'package:mysql1/mysql1.dart';

import 'query_builder.dart';
import 'schema_builder.dart';

class PingDartDB {
  final String apiKey;
  final Map<String, dynamic> dbConfig;
  final String dbType;

  Map<String, dynamic>? license;
  MySqlConnection? connection;

  PingDartDB({required this.apiKey, required this.dbConfig})
      : dbType = dbConfig['type'] ?? 'mysql' {
    if (dbType != 'mysql' && dbType != 'postgresql') {
      throw Exception("Unsupported database type: $dbType");
    }
    _validateKey(apiKey);
  }

  void _validateKey(String key) {
    if (!key.startsWith('pd_')) {
      throw Exception(
          'PingDart Authorization Failed: Invalid PingDart License Key format');
    }

    final parts = key.replaceAll('pd_', '').split('.');
    if (parts.length != 2) {
      throw Exception(
          'PingDart Authorization Failed: Invalid PingDart License Key format');
    }

    try {
      final ivBytes = _hexToBytes(parts[0]);
      final encryptedText = _hexToBytes(parts[1]);

      const secretKey = 'PingDartSuperSecretKey2026!@#\$';
      final digest = sha256.convert(utf8.encode(secretKey));
      final encodedHash = base64.encode(digest.bytes);
      final keyBytes = utf8.encode(encodedHash.substring(0, 32));

      final encrypter = encrypt.Encrypter(encrypt.AES(
          encrypt.Key(Uint8List.fromList(keyBytes)),
          mode: encrypt.AESMode.cbc,
          padding: 'PKCS7'));

      final decrypted = encrypter.decrypt(
        encrypt.Encrypted(Uint8List.fromList(encryptedText)),
        iv: encrypt.IV(Uint8List.fromList(ivBytes)),
      );

      license = json.decode(decrypted);
    } catch (e) {
      throw Exception(
          'PingDart Authorization Failed: License key is corrupted or tampered with. $e');
    }
  }

  Future<void> connect() async {
    if (dbType == 'mysql') {
      final settings = ConnectionSettings(
        host: dbConfig['host'],
        port: int.tryParse(dbConfig['port']?.toString() ?? '3306') ?? 3306,
        user: dbConfig['user'],
        password: dbConfig['password'],
        db: dbConfig['database'],
      );
      connection = await MySqlConnection.connect(settings);
    } else {
      throw Exception(
          "PostgreSQL support requires 'postgres' package implementation.");
    }

    if (license != null && license!['tier'] != 'free') {
      await _validateLiveServer();
    }
  }

  Future<void> _validateLiveServer() async {
    final response = await http
        .post(
          Uri.parse('https://cloudapi.pingdart.com/api/realtime/validate-sdk'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'apiKey': apiKey}),
        )
        .timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw Exception('PingDart Live Authorization Failed: Server error');
    }

    final result = json.decode(response.body);
    if (result['success'] != true) {
      throw Exception('PingDart Live Authorization Failed');
    }
  }

  QueryBuilder table(String tableName) {
    if (connection == null)
      throw Exception("Database not connected. Call connect() first.");
    return QueryBuilder(tableName, connection!, dbType);
  }

  SchemaBuilder schema() {
    if (connection == null)
      throw Exception("Database not connected. Call connect() first.");
    return SchemaBuilder(connection!, dbType);
  }

  Future<void> close() async {
    await connection?.close();
  }

  List<int> _hexToBytes(String hexStr) {
    final bytes = <int>[];
    for (int i = 0; i < hexStr.length; i += 2) {
      bytes.add(int.parse(hexStr.substring(i, i + 2), radix: 16));
    }
    return bytes;
  }
}
