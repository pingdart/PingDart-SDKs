package com.pingdart.sdk;

import com.pingdart.sdk.services.*;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;

public class PingDartSDK {
    private final String apiKey;
    private final String databaseId;
    private final String baseUrl;
    private final String realtimeBaseUrl;
    private final OkHttpClient client;
    private final OkHttpClient realtimeClient;

    public final DatabaseService database;
    public final WhatsAppService whatsapp;
    public final CallsService calls;
    public final StorageService storage;
    public final EmailService email;
    public final SmsService sms;
    public final AiService ai;

    public PingDartSDK(String apiKey, String databaseId, String baseUrl, String realtimeBaseUrl) {
        this.apiKey = apiKey;
        this.databaseId = databaseId;
        this.baseUrl = baseUrl != null ? baseUrl : "https://cloudapi.pingdart.com/api";
        this.realtimeBaseUrl = realtimeBaseUrl != null ? realtimeBaseUrl : 
                               this.baseUrl.replace("/api", "") + "/api/realtime/";

        this.client = createHttpClient(apiKey);
        this.realtimeClient = createHttpClient(apiKey);

        this.database = new DatabaseService(this.realtimeClient, databaseId);
        this.whatsapp = new WhatsAppService(this.client);
        this.calls = new CallsService(this.client, this.baseUrl);
        this.storage = new StorageService(this.client, this.baseUrl);
        this.email = new EmailService(this.client, this.baseUrl);
        this.sms = new SmsService(this.client, this.baseUrl);
        this.ai = new AiService(this.client, this.baseUrl);
    }

    private OkHttpClient createHttpClient(final String apiKey) {
        return new OkHttpClient.Builder()
                .addInterceptor(new Interceptor() {
                    @Override
                    public Response intercept(Chain chain) throws IOException {
                        Request original = chain.request();
                        Request request = original.newBuilder()
                                .addHeader("x-api-key", apiKey)
                                .addHeader("Content-Type", "application/json")
                                .addHeader("X-SDK-Source", "PingDart-Java-SDK")
                                .build();
                        return chain.proceed(request);
                    }
                })
                .build();
    }
}
