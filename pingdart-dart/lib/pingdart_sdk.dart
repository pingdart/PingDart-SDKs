import 'package:http/http.dart' as http;
import 'src/services/database_service.dart';
import 'src/services/calls_service.dart';
import 'src/services/ai_service.dart';
import 'src/services/email_service.dart';
import 'src/services/sms_service.dart';
import 'src/services/storage_service.dart';

class PingDartSDK {
  late final DatabaseService database;
  late final CallsService calls;
  late final AiService ai;
  late final EmailService email;
  late final SmsService sms;
  late final StorageService storage;

  PingDartSDK({
    required String apiKey,
    String? databaseId,
    String baseUrl = 'https://cloudapi.pingdart.com/api',
    String? realtimeBaseUrl,
  }) {
    final client = http.Client();
    
    final rUrl = realtimeBaseUrl ?? baseUrl.replaceAll('/api', '') + '/api/realtime/';
    final cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : '$baseUrl/';

    database = DatabaseService(
      client: client,
      apiKey: apiKey,
      baseUrl: rUrl,
      databaseId: databaseId ?? '',
    );

    calls = CallsService(
      client: client,
      apiKey: apiKey,
      baseUrl: cleanBaseUrl,
    );

    ai = AiService(
      client: client,
      apiKey: apiKey,
      baseUrl: cleanBaseUrl,
    );

    email = EmailService(
      client: client,
      apiKey: apiKey,
      baseUrl: cleanBaseUrl,
    );

    sms = SmsService(
      client: client,
      apiKey: apiKey,
      baseUrl: cleanBaseUrl,
    );

    storage = StorageService(
      client: client,
      apiKey: apiKey,
      baseUrl: cleanBaseUrl,
    );
  }
}
