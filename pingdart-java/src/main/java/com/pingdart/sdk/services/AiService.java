package com.pingdart.sdk.services;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;

public class AiService {
    private final OkHttpClient http;
    private final String baseUrl;
    private final Gson gson = new Gson();

    public AiService(OkHttpClient http, String baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl;
    }

    public void callAiApi(String message, OnProgress onProgress, String model) throws IOException {
        JsonObject payload = new JsonObject();
        payload.addProperty("message", message);
        payload.addProperty("stream", true);
        payload.addProperty("model", model != null ? model : "chinnuai:1.1");

        RequestBody body = RequestBody.create(gson.toJson(payload), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder().url(baseUrl + "/ai/chinuai-chat").post(body).build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            
            // Simple line-by-line simulation for a skeleton
            // Real implementation would handle SSE properly
            String line;
            while ((line = response.body().source().readUtf8Line()) != null) {
                if (line.startsWith("data: ")) {
                    String data = line.substring(6).trim();
                    if (data.isEmpty()) continue;
                    try {
                        JsonObject json = gson.fromJson(data, JsonObject.class);
                        if (json.has("chunk")) {
                            String chunk = json.get("chunk").getAsString();
                            if (onProgress != null) onProgress.handle(chunk);
                        }
                        if (json.has("done") && json.get("done").getAsBoolean()) break;
                    } catch (Exception e) {
                        if (onProgress != null) onProgress.handle(data);
                    }
                }
            }
        }
    }

    public interface OnProgress {
        void handle(String chunk);
    }
}
