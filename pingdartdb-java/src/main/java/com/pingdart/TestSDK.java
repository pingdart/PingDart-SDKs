package com.pingdart;

import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import com.fasterxml.jackson.databind.ObjectMapper;

public class TestSDK {

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static String generateValidKey() throws Exception {
        String secretKey = "PingDartSuperSecretKey2026!@#$";
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(secretKey.getBytes(StandardCharsets.UTF_8));
        String encodedHash = Base64.getEncoder().encodeToString(hash);
        byte[] keyBytes = encodedHash.substring(0, 32).getBytes(StandardCharsets.UTF_8);

        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);

        Map<String, String> payload = new HashMap<>();
        payload.put("tier", "free");
        payload.put("createdAt", Instant.now().toString());

        ObjectMapper mapper = new ObjectMapper();
        byte[] jsonData = mapper.writeValueAsBytes(payload);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

        byte[] encrypted = cipher.doFinal(jsonData);

        return "pd_" + bytesToHex(iv) + "." + bytesToHex(encrypted);
    }

    public static void main(String[] args) {
        try {
            System.out.println("1. Generated Local Java Offline API Key");
            String apiKey = generateValidKey();

            Map<String, String> config = new HashMap<>();
            config.put("host", "94.136.190.60");
            config.put("user", "pingdart_ravi");
            config.put("password", "Ravindra12@");
            config.put("database", "pingdart_test");
            config.put("type", "mysql");

            PingDartDB db = new PingDartDB(apiKey, config);
            db.connect();
            System.out.println("2. Connection successful.");

            Map<String, Object> options = new HashMap<>();
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("status", "active");
            options.put("conditions", conditions);

            Map<String, Object> res = db.table("test_users").read(options);
            System.out.println("3. Basic Read test returned " + res.get("totalCount") + " rows.");

            db.close();
            System.out.println("\n✅ Java SDK Connection Test passed successfully!");

        } catch (Exception e) {
            System.err.println("❌ Java Test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
