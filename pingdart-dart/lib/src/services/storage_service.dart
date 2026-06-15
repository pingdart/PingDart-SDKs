import 'package:http/http.dart' as http;
import 'dart:convert';

class StorageService {
  final http.Client client;
  final String apiKey;
  final String baseUrl;

  StorageService({required this.client, required this.apiKey, required this.baseUrl});

  Future<dynamic> getStats() async {
    final response = await client.post(
      Uri.parse('${baseUrl}files/stats'),
      headers: {'x-api-key': apiKey},
    );
    return jsonDecode(response.body);
  }

  Future<dynamic> listBuckets() async {
    final response = await client.post(
      Uri.parse('${baseUrl}files/get-buckets'),
      headers: {'x-api-key': apiKey},
    );
    return jsonDecode(response.body);
  }

  // ... other methods ...
}
