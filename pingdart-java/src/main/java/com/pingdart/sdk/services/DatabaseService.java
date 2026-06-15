package com.pingdart.sdk.services;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;

public class DatabaseService {
    private final OkHttpClient http;
    private final String databaseId;
    private final Gson gson = new Gson();

    public DatabaseService(OkHttpClient http, String databaseId) {
        this.http = http;
        this.databaseId = databaseId;
    }

    private String postRequest(String endpoint, JsonObject data) throws IOException {
        data.addProperty("databaseid", databaseId);
        RequestBody body = RequestBody.create(gson.toJson(data), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder().url("/" + endpoint).post(body).build();
        try (Response response = http.newCall(request).execute()) {
            return response.body().string();
        }
    }

    public String read(String schema, String table, JsonObject conditions) throws IOException {
        JsonObject data = new JsonObject();
        data.addProperty("tableSchema", schema);
        data.addProperty("tableName", table);
        data.add("conditions", conditions);
        return postRequest("dynamicRead", data);
    }
    
    // Additional CRUD methods follow similar pattern...
}
