package com.pingdart.sdk.services;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.File;
import java.io.IOException;

public class StorageService {
    private final OkHttpClient http;
    private final String baseUrl;
    private final Gson gson = new Gson();

    public StorageService(OkHttpClient http, String baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl;
    }

    private String postRequest(String endpoint, JsonObject data) throws IOException {
        RequestBody body = RequestBody.create(gson.toJson(data), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(baseUrl + "/files/" + endpoint)
                .post(body)
                .build();
        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            return response.body().string();
        }
    }

    public String getStats() throws IOException {
        return postRequest("stats", new JsonObject());
    }

    public String listBuckets() throws IOException {
        return postRequest("get-buckets", new JsonObject());
    }

    public String createBucket(String name) throws IOException {
        JsonObject data = new JsonObject();
        data.addProperty("name", name);
        return postRequest("create-bucket", data);
    }

    public String deleteBucket(String bucketId) throws IOException {
        JsonObject data = new JsonObject();
        data.addProperty("id", bucketId);
        return postRequest("delete-bucket", data);
    }

    public String uploadFile(File file, String bucketName, String destination) throws IOException {
        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", file.getName(),
                        RequestBody.create(file, MediaType.parse("application/octet-stream")));

        if (bucketName != null) builder.addFormDataPart("bucket_name", bucketName);
        if (destination != null) builder.addFormDataPart("destination", destination);

        Request request = new Request.Builder()
                .url(baseUrl + "/files/upload")
                .post(builder.build())
                .build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            return response.body().string();
        }
    }

    public String deleteFile(String filePath) throws IOException {
        JsonObject data = new JsonObject();
        data.addProperty("filePath", filePath);
        return postRequest("deleteFile", data);
    }
}
