package com.pingdart;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.DriverManager;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;

public class PingDartDB {
    private final String apiKey;
    private final Map<String, String> dbConfig;
    private final String dbType;
    private Map<String, Object> license;
    private Connection connection;

    public PingDartDB(String apiKey, Map<String, String> dbConfig) throws Exception {
        this.apiKey = apiKey;
        this.dbConfig = dbConfig;
        this.dbType = dbConfig.getOrDefault("type", "mysql");

        if (!dbType.equals("mysql") && !dbType.equals("postgresql")) {
            throw new Exception("Unsupported database type: " + dbType);
        }

        validateKey(apiKey);
    }

    private void validateKey(String apiKey) throws Exception {
        if (apiKey == null || !apiKey.startsWith("pd_")) {
            throw new Exception("PingDart Authorization Failed: Invalid PingDart License Key format");
        }

        String[] parts = apiKey.replace("pd_", "").split("\\.");
        if (parts.length != 2) {
            throw new Exception("PingDart Authorization Failed: Invalid PingDart License Key format");
        }

        byte[] iv = hexStringToByteArray(parts[0]);
        byte[] encryptedText = hexStringToByteArray(parts[1]);

        String secretKey = "PingDartSuperSecretKey2026!@#$";
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(secretKey.getBytes(StandardCharsets.UTF_8));
        String encodedHash = Base64.getEncoder().encodeToString(hash);
        byte[] keyBytes = encodedHash.substring(0, 32).getBytes(StandardCharsets.UTF_8);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);

        byte[] decryptedBytes = cipher.doFinal(encryptedText);
        String decryptedString = new String(decryptedBytes, StandardCharsets.UTF_8);

        ObjectMapper mapper = new ObjectMapper();
        this.license = mapper.readValue(decryptedString, new TypeReference<Map<String, Object>>() {});
    }

    public void connect() throws Exception {
        String host = dbConfig.get("host");
        String db = dbConfig.get("database");
        String user = dbConfig.get("user");
        String pass = dbConfig.get("password");

        String jdbcUrl;
        if (dbType.equals("mysql")) {
            Class.forName("com.mysql.cj.jdbc.Driver");
            jdbcUrl = String.format("jdbc:mysql://%s/%s?useUnicode=true&characterEncoding=utf8", host, db);
        } else {
            Class.forName("org.postgresql.Driver");
            jdbcUrl = String.format("jdbc:postgresql://%s/%s", host, db);
        }

        this.connection = DriverManager.getConnection(jdbcUrl, user, pass);

        if (license != null && license.containsKey("tier") && !license.get("tier").equals("free")) {
            validateLiveServer();
        }
    }

    private void validateLiveServer() throws Exception {
        String payload = String.format("{\"apiKey\":\"%s\"}", this.apiKey);

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://cloudapi.pingdart.com/api/realtime/validate-sdk"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> result = mapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
        
        if (!result.containsKey("success") || !(Boolean) result.get("success")) {
            throw new Exception("PingDart Live Authorization Failed");
        }
    }

    public QueryBuilder table(String tableName) {
        return new QueryBuilder(tableName, this.connection, this.dbType);
    }

    public SchemaBuilder schema() {
        return new SchemaBuilder(this.connection, this.dbType);
    }

    public void close() throws Exception {
        if (this.connection != null && !this.connection.isClosed()) {
            this.connection.close();
        }
    }

    private byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }
}
