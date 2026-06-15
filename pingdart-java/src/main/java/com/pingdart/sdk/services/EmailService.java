package com.pingdart.sdk.services;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;

public class EmailService {
    private final OkHttpClient http;
    private final String baseUrl;
    private final Gson gson = new Gson();

    public EmailService(OkHttpClient http, String baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl;
    }

    public String sendEmail(String email, String subject, String text, JsonObject smtpConfig) throws IOException {
        JsonObject payload = new JsonObject();
        payload.addProperty("email", email);
        payload.addProperty("subject", subject);
        payload.addProperty("text", text);
        if (smtpConfig != null) payload.add("smtpConfig", smtpConfig);

        RequestBody body = RequestBody.create(gson.toJson(payload), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder().url(baseUrl + "/email/send-email").post(body).build();
        try (Response response = http.newCall(request).execute()) {
            return response.body().string();
        }
    }

    public String bulkSend(JsonObject data, JsonObject smtpConfig) throws IOException {
        JsonObject payload = new JsonObject();
        payload.add("data", data);
        if (smtpConfig != null) payload.add("smtpConfig", smtpConfig);

        RequestBody body = RequestBody.create(gson.toJson(payload), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder().url(baseUrl + "/email/bulk-send").post(body).build();
        try (Response response = http.newCall(request).execute()) {
            return response.body().string();
        }
    }
}
