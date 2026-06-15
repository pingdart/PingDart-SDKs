import 'package:mysql1/mysql1.dart';

class SchemaBuilder {
  final MySqlConnection connection;
  final String dbType;
  final String q;

  SchemaBuilder(this.connection, this.dbType)
      : q = (dbType == 'postgresql' || dbType == 'pgsql') ? '"' : '`';

  Future<Map<String, dynamic>> createTable(String tableName, {List<Map<String, dynamic>>? columns}) async {
    String query;

    if (columns != null && columns.isNotEmpty) {
      final colStrings = columns.map((col) => "$q${col['name']}$q ${col['type']}").toList();
      query = "CREATE TABLE IF NOT EXISTS $q$tableName$q (${colStrings.join(', ')})";
    } else {
      final idType = (dbType == 'postgresql' || dbType == 'pgsql') ? 'SERIAL PRIMARY KEY' : 'INT AUTO_INCREMENT PRIMARY KEY';
      final onUpdate = (dbType == 'mysql') ? 'ON UPDATE CURRENT_TIMESTAMP' : '';
      
      query = '''
        CREATE TABLE IF NOT EXISTS $q$tableName$q (
          ${q}id$q $idType,
          ${q}created_at$q TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ${q}updated_at$q TIMESTAMP DEFAULT CURRENT_TIMESTAMP $onUpdate
        )
      ''';
    }

    await connection.query(query);
    return {'success': true, 'message': 'Table $tableName created successfully.'};
  }

  Future<Map<String, dynamic>> dropTable(String tableName) async {
    final query = "DROP TABLE IF EXISTS $q$tableName$q";
    await connection.query(query);
    return {'success': true, 'message': 'Table $tableName dropped successfully.'};
  }

  Future<List<Map<String, dynamic>>> getColumns(String tableName) async {
    String query;
    if (dbType == 'mysql') {
      query = "SHOW COLUMNS FROM `$tableName`";
    } else {
      query = "SELECT column_name as \"Field\", data_type as \"Type\" FROM information_schema.columns WHERE table_name = '$tableName'";
    }

    final results = await connection.query(query);
    return results.map((row) => row.fields).toList();
  }
}
