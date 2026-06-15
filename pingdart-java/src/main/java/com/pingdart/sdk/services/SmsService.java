package com.pingdart.sdk.services;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;

public class SmsService {
    private final OkHttpClient http;
    private final String baseUrl;
    private final Gson gson = new Gson();

    public SmsService(OkHttpClient http, String baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl;
    }

    public String sendSms(String to, String text, String templateId, String route, String unicode) throws IOException {
        JsonObject payload = new JsonObject();
        payload.addProperty("to", to);
        payload.addProperty("text", text);
        if (templateId != null) payload.addProperty("templateId", templateId);
        payload.addProperty("route", route != null ? route : "pingdart");
        payload.addProperty("unicode", unicode != null ? unicode : "true");

        RequestBody body = RequestBody.create(gson.toJson(payload), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder().url(baseUrl + "/email/send-sms").post(body).build();
        try (Response response = http.newCall(request).execute()) {
            return response.body().string();
        }
    }
}
