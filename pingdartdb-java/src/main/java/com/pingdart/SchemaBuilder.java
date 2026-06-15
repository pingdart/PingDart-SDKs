package com.pingdart;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SchemaBuilder {
    private final Connection connection;
    private final String dbType;
    private final String q;

    public SchemaBuilder(Connection connection, String dbType) {
        this.connection = connection;
        this.dbType = dbType;
        this.q = (dbType.equals("postgresql") || dbType.equals("pgsql")) ? "\"" : "`";
    }

    public Map<String, Object> createTable(String tableName, List<Map<String, String>> columns) throws Exception {
        String query;

        if (columns != null && !columns.isEmpty()) {
            List<String> colStrings = new ArrayList<>();
            for (Map<String, String> col : columns) {
                colStrings.add(q + col.get("name") + q + " " + col.get("type"));
            }
            query = "CREATE TABLE IF NOT EXISTS " + q + tableName + q + " (" + String.join(", ", colStrings) + ")";
        } else {
            String idType = (dbType.equals("postgresql") || dbType.equals("pgsql")) ? "SERIAL PRIMARY KEY" : "INT AUTO_INCREMENT PRIMARY KEY";
            String onUpdate = dbType.equals("mysql") ? "ON UPDATE CURRENT_TIMESTAMP" : "";
            
            query = String.format("CREATE TABLE IF NOT EXISTS %s%s%s (\n" +
                    "    %sid%s %s,\n" +
                    "    %screated_at%s TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n" +
                    "    %supdated_at%s TIMESTAMP DEFAULT CURRENT_TIMESTAMP %s\n" +
                    ")", q, tableName, q, q, q, idType, q, q, q, q, onUpdate);
        }

        try (PreparedStatement stmt = connection.prepareStatement(query)) {
            stmt.executeUpdate();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Table " + tableName + " created successfully.");
        return result;
    }

    public Map<String, Object> dropTable(String tableName) throws Exception {
        String query = "DROP TABLE IF EXISTS " + q + tableName + q;
        try (PreparedStatement stmt = connection.prepareStatement(query)) {
            stmt.executeUpdate();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Table " + tableName + " dropped successfully.");
        return result;
    }

    public List<Map<String, Object>> getColumns(String tableName) throws Exception {
        String query;
        if (dbType.equals("mysql")) {
            query = "SHOW COLUMNS FROM `" + tableName + "`";
        } else {
            query = "SELECT column_name as \"Field\", data_type as \"Type\" FROM information_schema.columns WHERE table_name = '" + tableName + "'";
        }

        List<Map<String, Object>> results = new ArrayList<>();
        try (PreparedStatement stmt = connection.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();
            
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    row.put(metaData.getColumnLabel(i), rs.getObject(i));
                }
                results.add(row);
            }
        }
        return results;
    }
}
