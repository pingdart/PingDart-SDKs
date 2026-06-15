import 'package:http/http.dart' as http;
import 'dart:convert';

class EmailService {
  final http.Client client;
  final String apiKey;
  final String baseUrl;

  EmailService({required this.client, required this.apiKey, required this.baseUrl});

  Future<dynamic> sendEmail(String email, String subject, String text, {Map<String, dynamic>? smtpConfig}) async {
    final response = await client.post(
      Uri.parse('${baseUrl}email/send-email'),
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'email': email,
        'subject': subject,
        'text': text,
        if (smtpConfig != null) 'smtpConfig': smtpConfig,
      }),
    );
    return jsonDecode(response.body);
  }
}
