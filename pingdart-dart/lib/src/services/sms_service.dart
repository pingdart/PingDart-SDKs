import 'package:http/http.dart' as http;
import 'dart:convert';

class SmsService {
  final http.Client client;
  final String apiKey;
  final String baseUrl;

  SmsService({required this.client, required this.apiKey, required this.baseUrl});

  Future<dynamic> sendSms(String to, String text, {String? templateId, String route = 'pingdart', String unicode = 'true'}) async {
    final response = await client.post(
      Uri.parse('${baseUrl}email/send-sms'),
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'to': to,
        'text': text,
        'templateId': templateId,
        'route': route,
        'unicode': unicode,
      }),
    );
    return jsonDecode(response.body);
  }
}
