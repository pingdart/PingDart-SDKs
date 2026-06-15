import 'package:http/http.dart' as http;
import 'dart:convert';

class CallsService {
  final http.Client client;
  final String apiKey;
  final String baseUrl;

  CallsService({
    required this.client,
    required this.apiKey,
    required this.baseUrl,
  });

  Future<dynamic> listApps() async {
    final response = await client.get(
      Uri.parse('$baseUrl/v1/calls/apps'),
      headers: {
        'x-api-key': apiKey,
        'X-SDK-Source': 'PingDart-Dart-SDK',
      },
    );
    return jsonDecode(response.body);
  }

  Future<dynamic> createApp(String name, String type) async {
    final response = await client.post(
      Uri.parse('$baseUrl/v1/calls/apps'),
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'name': name, 'type': type}),
    );
    return jsonDecode(response.body);
  }
}
