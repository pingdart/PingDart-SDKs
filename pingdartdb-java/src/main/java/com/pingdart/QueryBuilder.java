package com.pingdart;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.*;

public class QueryBuilder {
    private final String tableName;
    private final Connection connection;
    private final String dbType;
    private final String q;

    public QueryBuilder(String tableName, Connection connection, String dbType) {
        this.tableName = tableName;
        this.connection = connection;
        this.dbType = dbType;
        this.q = (dbType.equals("postgresql") || dbType.equals("pgsql")) ? "\"" : "`";
    }

    private void buildWhereClause(Map<String, Object> conditions, List<String> clauses, List<Object> replacements) {
        if (conditions == null) return;

        for (Map.Entry<String, Object> entry : conditions.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value instanceof Map) {
                Map<?, ?> mapValue = (Map<?, ?>) value;
                if (mapValue.containsKey("min") && mapValue.containsKey("max")) {
                    clauses.add(q + key + q + " BETWEEN ? AND ?");
                    replacements.add(mapValue.get("min"));
                    replacements.add(mapValue.get("max"));
                } else if (mapValue.containsKey("start") && mapValue.containsKey("end")) {
                    clauses.add(q + key + q + " BETWEEN ? AND ?");
                    replacements.add(mapValue.get("start"));
                    replacements.add(mapValue.get("end"));
                }
            } else if (value instanceof List) {
                List<?> listValue = (List<?>) value;
                if (!listValue.isEmpty()) {
                    List<String> placeholders = new ArrayList<>();
                    for (Object v : listValue) {
                        placeholders.add("?");
                        replacements.add(v);
                    }
                    clauses.add(q + key + q + " IN (" + String.join(", ", placeholders) + ")");
                } else {
                    clauses.add("1=0");
                }
            } else if (value instanceof String) {
                String strValue = (String) value;
                if (strValue.startsWith("!")) {
                    clauses.add(q + key + q + " != ?");
                    replacements.add(strValue.substring(1));
                } else if (strValue.startsWith(">=")) {
                    clauses.add(q + key + q + " >= ?");
                    replacements.add(strValue.substring(2));
                } else if (strValue.startsWith("<=")) {
                    clauses.add(q + key + q + " <= ?");
                    replacements.add(strValue.substring(2));
                } else if (strValue.startsWith(">")) {
                    clauses.add(q + key + q + " > ?");
                    replacements.add(strValue.substring(1));
                } else if (strValue.startsWith("<")) {
                    clauses.add(q + key + q + " < ?");
                    replacements.add(strValue.substring(1));
                } else {
                    clauses.add(q + key + q + " = ?");
                    replacements.add(value);
                }
            } else {
                clauses.add(q + key + q + " = ?");
                replacements.add(value);
            }
        }
    }

    private List<Map<String, Object>> fetchRows(String query, List<Object> args) throws Exception {
        try (PreparedStatement stmt = connection.prepareStatement(query)) {
            for (int i = 0; i < args.size(); i++) {
                stmt.setObject(i + 1, args.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                List<Map<String, Object>> results = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(metaData.getColumnLabel(i), rs.getObject(i));
                    }
                    results.add(row);
                }
                return results;
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void processMargedata(List<Map<String, Object>> rows, Map<String, Object> margedataItem, Map<String, Object> search) {
        String targetTable = (String) margedataItem.get("target_table");
        String targetColumn = (String) margedataItem.get("target_column");
        String targetValue = (String) margedataItem.get("target_value");
        String targetLabel = (String) margedataItem.get("target_label");

        if (targetTable == null || targetColumn == null || targetValue == null || targetLabel == null) return;

        Set<Object> parentIds = new HashSet<>();
        for (Map<String, Object> row : rows) {
            if (row.get(targetValue) != null) {
                parentIds.add(row.get(targetValue));
            }
        }

        if (parentIds.isEmpty()) {
            for (Map<String, Object> row : rows) row.put(targetLabel, new ArrayList<>());
            return;
        }

        List<String> conditions = new ArrayList<>();
        List<Object> replacements = new ArrayList<>();

        List<String> placeholders = new ArrayList<>();
        for (Object pid : parentIds) {
            placeholders.add("?");
            replacements.add(pid);
        }
        conditions.add(q + targetColumn + q + " IN (" + String.join(", ", placeholders) + ")");

        String query = "SELECT * FROM " + q + targetTable + q + " WHERE " + String.join(" AND ", conditions);

        try {
            List<Map<String, Object>> allMatches = fetchRows(query, replacements);
            Map<Object, List<Map<String, Object>>> groupedMatches = new HashMap<>();

            for (Map<String, Object> match : allMatches) {
                Object pid = match.get(targetColumn);
                groupedMatches.computeIfAbsent(pid, k -> new ArrayList<>()).add(match);
            }

            for (Map<String, Object> row : rows) {
                Object pid = row.get(targetValue);
                row.put(targetLabel, groupedMatches.getOrDefault(pid, new ArrayList<>()));
            }
        } catch (Exception e) {
            for (Map<String, Object> row : rows) row.put(targetLabel, new ArrayList<>());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> read(Map<String, Object> options) throws Exception {
        if (options == null) options = new HashMap<>();

        Map<String, Object> conditions = (Map<String, Object>) options.get("conditions");
        Map<String, Object> search = (Map<String, Object>) options.get("search");
        String orderBy = (String) options.get("orderBy");
        Map<String, Object> pagination = (Map<String, Object>) options.get("pagination");
        List<Map<String, Object>> margedata = (List<Map<String, Object>>) options.get("margedata");

        StringBuilder query = new StringBuilder("SELECT * FROM ").append(q).append(tableName).append(q).append(" WHERE 1=1");
        List<Object> replacements = new ArrayList<>();

        List<String> condClauses = new ArrayList<>();
        buildWhereClause(conditions, condClauses, replacements);
        if (!condClauses.isEmpty()) {
            query.append(" AND ").append(String.join(" AND ", condClauses));
        }

        if (search != null && !search.isEmpty()) {
            List<String> searchClauses = new ArrayList<>();
            for (Map.Entry<String, Object> entry : search.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().toString().isEmpty()) {
                    String likeOp = dbType.equals("postgresql") ? "ILIKE" : "LIKE";
                    searchClauses.add(q + entry.getKey() + q + " " + likeOp + " ?");
                    replacements.add("%" + entry.getValue() + "%");
                }
            }
            if (!searchClauses.isEmpty()) {
                query.append(" AND (").append(String.join(" OR ", searchClauses)).append(")");
            }
        }

        if (orderBy != null) {
            query.append(" ORDER BY ").append(orderBy);
        }

        // Basic Count logic
        String countQuery = query.toString().replaceFirst("SELECT \\*", "SELECT COUNT(*) as total");
        int totalCount = 0;
        try (PreparedStatement stmt = connection.prepareStatement(countQuery)) {
            for (int i = 0; i < replacements.size(); i++) stmt.setObject(i + 1, replacements.get(i));
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) totalCount = rs.getInt(1);
            }
        }

        if (pagination != null && pagination.containsKey("page") && pagination.containsKey("limit")) {
            int page = Math.max(1, ((Number) pagination.get("page")).intValue());
            int limit = ((Number) pagination.get("limit")).intValue();
            int offset = (page - 1) * limit;
            query.append(" LIMIT ").append(limit).append(" OFFSET ").append(offset);
        }

        List<Map<String, Object>> results = fetchRows(query.toString(), replacements);

        if (margedata != null && !margedata.isEmpty() && !results.isEmpty()) {
            for (Map<String, Object> mdItem : margedata) {
                processMargedata(results, mdItem, search);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", results);
        response.put("totalCount", totalCount);
        return response;
    }
}
