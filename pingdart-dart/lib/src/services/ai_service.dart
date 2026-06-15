import 'package:http/http.dart' as http;
import 'dart:convert';

class AiService {
  final http.Client client;
  final String apiKey;
  final String baseUrl;

  AiService({required this.client, required this.apiKey, required this.baseUrl});

  Future<String> callAiApi(String message, {Function(String)? onProgress, String model = 'chinnuai:1.1', Map<String, dynamic>? options}) async {
    final payload = {
      'message': message,
      'stream': true,
      'model': model,
      if (options != null) ...options,
    };

    final request = http.Request('POST', Uri.parse('${baseUrl}ai/chinuai-chat'))
      ..headers.addAll({
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      })
      ..body = jsonEncode(payload);

    final response = await client.send(request);
    
    var fullResult = "";
    await response.stream.transform(utf8.decoder).listen((line) {
      if (line.startsWith('data: ')) {
        final dataStr = line.substring(6).trim();
        if (dataStr.isEmpty) return;
        try {
          final parsed = jsonDecode(dataStr);
          if (parsed['chunk'] != null) {
            fullResult += parsed['chunk'];
            if (onProgress != null) onProgress(parsed['chunk']);
          }
        } catch (e) {
          // Fallback
        }
      }
    }).asFuture();

    return fullResult;
  }
}
