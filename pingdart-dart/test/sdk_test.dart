import 'package:test/test.dart';
import 'package:pingdart_sdk/pingdart_sdk.dart';

void main() {
  group('PingDartSDK', () {
    final apiKey = 'test-key';
    final dbId = 'test-db';

    test('should initialize successfully', () {
      final sdk = PingDartSDK(apiKey: apiKey, databaseId: dbId);
      expect(sdk, isNotNull);
    });

    test('should have all services mounted', () {
      final sdk = PingDartSDK(apiKey: apiKey, databaseId: dbId);
      expect(sdk.database, isNotNull);
      expect(sdk.calls, isNotNull);
      expect(sdk.ai, isNotNull);
      expect(sdk.email, isNotNull);
      expect(sdk.sms, isNotNull);
      expect(sdk.storage, isNotNull);
    });
  });
}
