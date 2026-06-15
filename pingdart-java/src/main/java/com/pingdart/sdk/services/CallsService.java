package com.pingdart.sdk.services;

import com.google.gson.Gson;
import okhttp3.*;

import java.io.IOException;

public class CallsService {
    private final OkHttpClient http;
    private final String baseUrl;
    private final Gson gson = new Gson();

    public CallsService(OkHttpClient http, String baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl;
    }

    public String listApps() throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + "/v1/calls/apps")
                .get()
                .build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            return response.body().string();
        }
    }

    public String createApp(String name, String type) throws IOException {
        String json = gson.toJson(new CreateAppRequest(name, type));
        RequestBody body = RequestBody.create(json, MediaType.get("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(baseUrl + "/v1/calls/apps")
                .post(body)
                .build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            return response.body().string();
        }
    }

    public String deleteApp(String id) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + "/v1/calls/apps/" + id)
                .delete()
                .build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            return response.body().string();
        }
    }

    private static class CreateAppRequest {
        String name;
        String type;
        CreateAppRequest(String name, String type) {
            this.name = name;
            this.type = type;
        }
    }
}
