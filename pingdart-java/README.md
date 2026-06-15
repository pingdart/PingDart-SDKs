# PingDart Java SDK

The official Java SDK for the PingDart platform.

## Installation (Maven)

Add the following to your `pom.xml`:

```xml
<dependency>
    <groupId>com.pingdart</groupId>
    <artifactId>pingdart-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Quick Start

```java
import com.pingdart.sdk.PingDartSDK;

PingDartSDK sdk = new PingDartSDK(
    "YOUR_API_KEY",
    "YOUR_DATABASE_ID",
    null, // use default base URL
    null  // use default realtime URL
);

// List Call Applications
String appsJson = sdk.calls.listApps();
System.out.println(appsJson);

// Real-time Database: Read data
JsonObject conditions = new JsonObject();
conditions.addProperty("status", "active");
String usersJson = sdk.database.read("public", "users", conditions);
```

## Features

- **Universal Database**: Multi-database support and real-time operations.
- **Calls Service**: Manage signaling applications.
- **Cloud Storage**: Manage buckets and upload files.
- **AI Chat**: Integrated streaming AI responses.
- **Communication**: Email and SMS services.

## License

MIT
