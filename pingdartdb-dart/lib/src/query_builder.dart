import 'package:mysql1/mysql1.dart';
import 'dart:math';

class QueryBuilder {
  final String tableName;
  final MySqlConnection connection;
  final String dbType;
  final String q;

  QueryBuilder(this.tableName, this.connection, this.dbType)
      : q = (dbType == 'postgresql' || dbType == 'pgsql') ? '"' : '`';

  void _buildWhereClause(Map<String, dynamic> conditions, List<String> clauses, List<dynamic> replacements) {
    conditions.forEach((key, value) {
      if (value is Map) {
        if (value.containsKey('min') && value.containsKey('max')) {
          clauses.add("$q$key$q BETWEEN ? AND ?");
          replacements.addAll([value['min'], value['max']]);
        } else if (value.containsKey('start') && value.containsKey('end')) {
          clauses.add("$q$key$q BETWEEN ? AND ?");
          replacements.addAll([value['start'], value['end']]);
        }
      } else if (value is List) {
        if (value.isNotEmpty) {
          final placeholders = List.filled(value.length, '?').join(', ');
          clauses.add("$q$key$q IN ($placeholders)");
          replacements.addAll(value);
        } else {
          clauses.add("1=0");
        }
      } else if (value is String) {
        if (value.startsWith('!')) {
          clauses.add("$q$key$q != ?");
          replacements.add(value.substring(1));
        } else if (value.startsWith('>=')) {
          clauses.add("$q$key$q >= ?");
          replacements.add(value.substring(2));
        } else if (value.startsWith('<=')) {
          clauses.add("$q$key$q <= ?");
          replacements.add(value.substring(2));
        } else if (value.startsWith('>')) {
          clauses.add("$q$key$q > ?");
          replacements.add(value.substring(1));
        } else if (value.startsWith('<')) {
          clauses.add("$q$key$q < ?");
          replacements.add(value.substring(1));
        } else {
          clauses.add("$q$key$q = ?");
          replacements.add(value);
        }
      } else {
        clauses.add("$q$key$q = ?");
        replacements.add(value);
      }
    });
  }

  Future<void> _processMargedataBatch(List<Map<String, dynamic>> rows, Map<String, dynamic> margedataItem, Map<String, dynamic>? search) async {
    final targetTable = margedataItem['target_table']?.toString();
    final targetColumn = margedataItem['target_column']?.toString();
    final targetValue = margedataItem['target_value']?.toString();
    final targetLabel = margedataItem['target_label']?.toString();

    if (targetTable == null || targetColumn == null || targetValue == null || targetLabel == null) return;

    final parentIds = rows.map((row) => row[targetValue]).where((v) => v != null).toSet();

    if (parentIds.isEmpty) {
      for (var row in rows) { row[targetLabel] = []; }
      return;
    }

    final conditions = <String>[];
    final replacements = <dynamic>[];

    final placeholders = List.filled(parentIds.length, '?').join(', ');
    conditions.add("$q$targetColumn$q IN ($placeholders)");
    replacements.addAll(parentIds);

    final query = "SELECT * FROM $q$targetTable$q WHERE ${conditions.join(' AND ')}";

    try {
      final results = await connection.query(query, replacements);
      final allMatches = results.map((e) => Map<String, dynamic>.from(e.fields)).toList();

      final groupedMatches = <dynamic, List<Map<String, dynamic>>>{};
      for (var match in allMatches) {
        final pid = match[targetColumn];
        groupedMatches.putIfAbsent(pid, () => []).add(match);
      }

      for (var row in rows) {
        final pid = row[targetValue];
        row[targetLabel] = groupedMatches[pid] ?? [];
      }
    } catch (e) {
      for (var row in rows) { row[targetLabel] = []; }
    }
  }

  Future<Map<String, dynamic>> read([Map<String, dynamic>? options]) async {
    options ??= {};
    final conditions = options['conditions'] as Map<String, dynamic>? ?? {};
    final search = options['search'] as Map<String, dynamic>? ?? {};
    final orderBy = options['orderBy']?.toString();
    final pagination = options['pagination'] as Map<String, dynamic>?;
    final rangeData = options['range'] as Map<String, dynamic>?;
    final margedata = options['margedata'] as List<dynamic>? ?? [];

    var query = "SELECT * FROM $q$tableName$q WHERE 1=1";
    final replacements = <dynamic>[];

    final condClauses = <String>[];
    _buildWhereClause(conditions, condClauses, replacements);

    if (condClauses.isNotEmpty) {
      query += " AND ${condClauses.join(' AND ')}";
    }

    if (search.isNotEmpty) {
      final searchClauses = <String>[];
      search.forEach((key, value) {
        if (value != null && value.toString().isNotEmpty) {
          final likeOp = (dbType == 'postgresql') ? 'ILIKE' : 'LIKE';
          searchClauses.add("$q$key$q $likeOp ?");
          replacements.add("%$value%");
        }
      });
      if (searchClauses.isNotEmpty) {
        query += " AND (${searchClauses.join(' OR ')})";
      }
    }

    if (rangeData != null && rangeData.containsKey('latitude')) {
      final lat = rangeData['latitude'];
      final lng = rangeData['longitude'];
      final rad = rangeData['radius'];
      final tLat = rangeData['target_latitude'];
      final tLng = rangeData['target_longitude'];

      query += ''' AND (
        6371 * ACOS(
          COS(RADIANS(?)) *
          COS(RADIANS($q$tLat$q)) *
          COS(RADIANS($q$tLng$q) - RADIANS(?)) +
          SIN(RADIANS(?)) *
          SIN(RADIANS($q$tLat$q))
        )
      ) <= ?''';
      replacements.addAll([lat, lng, lat, rad]);
    }

    if (orderBy != null && orderBy.isNotEmpty) {
      query += " ORDER BY $orderBy";
    }

    final countQuery = query.replaceFirst('SELECT *', 'SELECT COUNT(*) as total');
    final countResult = await connection.query(countQuery, replacements);
    final totalCount = countResult.first[0];

    int totalPages = 0;
    if (pagination != null && pagination.containsKey('page') && pagination.containsKey('limit')) {
      final page = max(1, (pagination['page'] as num).toInt());
      final limit = (pagination['limit'] as num).toInt();
      final offset = (page - 1) * limit;
      query += " LIMIT $limit OFFSET $offset";
      totalPages = (totalCount / limit).ceil();
    }

    final results = await connection.query(query, replacements);
    final rows = results.map((e) => Map<String, dynamic>.from(e.fields)).toList();

    if (margedata.isNotEmpty && rows.isNotEmpty) {
      for (var mdItem in margedata) {
        if (mdItem is Map<String, dynamic>) {
          await _processMargedataBatch(rows, mdItem, search);
        }
      }
    }

    return {
      'success': true,
      'data': rows,
      'totalCount': totalCount,
      'totalPages': totalPages,
    };
  }

  Future<Map<String, dynamic>> update(Map<String, dynamic> data, Map<String, dynamic> conditions) async {
    if (conditions.isEmpty) throw Exception("Update requires conditions to prevent bulk overwrite.");

    final setClauses = <String>[];
    final replacements = <dynamic>[];

    data.forEach((k, v) {
      setClauses.add("$q$k$q = ?");
      replacements.add(v);
    });

    final condClauses = <String>[];
    _buildWhereClause(conditions, condClauses, replacements);

    if (condClauses.isEmpty) throw Exception("Update conditions could not be generated.");

    final query = "UPDATE $q$tableName$q SET ${setClauses.join(', ')} WHERE ${condClauses.join(' AND ')}";
    final result = await connection.query(query, replacements);

    return {
      'success': true,
      'message': 'Record(s) updated successfully.',
      'affectedRows': result.affectedRows,
    };
  }

  Future<Map<String, dynamic>> delete(Map<String, dynamic> conditions) async {
    if (conditions.isEmpty) throw Exception("Delete requires conditions to prevent bulk delete.");

    final condClauses = <String>[];
    final replacements = <dynamic>[];
    _buildWhereClause(conditions, condClauses, replacements);

    if (condClauses.isEmpty) throw Exception("Delete conditions could not be generated.");

    final query = "DELETE FROM $q$tableName$q WHERE ${condClauses.join(' AND ')}";
    final result = await connection.query(query, replacements);

    return {
      'success': true,
      'message': 'Record(s) deleted successfully.',
      'affectedRows': result.affectedRows,
    };
  }
}
