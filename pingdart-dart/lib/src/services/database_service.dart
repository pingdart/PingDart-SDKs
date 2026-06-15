import 'package:http/http.dart' as http;
import 'dart:convert';

class DatabaseService {
  final http.Client client;
  final String apiKey;
  final String baseUrl;
  final String databaseId;

  DatabaseService({
    required this.client,
    required this.apiKey,
    required this.baseUrl,
    required this.databaseId,
  });

  Future<Map<String, dynamic>> _postRequest(String endpoint, Map<String, dynamic> data) async {
    if (!data.containsKey('databaseid')) {
      data['databaseid'] = databaseId;
    }

    final response = await client.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'X-SDK-Source': 'PingDart-Dart-SDK',
      },
      body: jsonEncode(data),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> create(String schema, String table, Map<String, dynamic> data, {Map<String, dynamic>? conditions}) {
    return _postRequest('dynamicCreate', {
      'tableSchema': schema,
      'tableName': table,
      'data': data,
      'conditions': conditions ?? {},
    });
  }

  Future<Map<String, dynamic>> read(String schema, String table, {Map<String, dynamic>? conditions}) {
    return _postRequest('dynamicRead', {
      'tableSchema': schema,
      'tableName': table,
      'conditions': conditions ?? {},
    });
  }
}
