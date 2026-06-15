# PingDart Go SDK

The official Go SDK for the PingDart platform.

## Installation

```bash
go get pingdart-go
```

## Quick Start

```go
package main

import (
	"fmt"
	"pingdart-go"
)

func main() {
	sdk := pingdart.NewPingDartSDK("YOUR_API_KEY", "YOUR_DATABASE_ID", "")

	// List Call Applications
	apps, _ := sdk.Calls.ListApps()
	fmt.Println(apps)

	// Read from Database
	result, _ := sdk.Database.Read("public", "users", map[string]interface{}{"status": "active"})
	fmt.Println(result)
}
```

## Features
- **Database**: Multi-DB support.
- **Calls**: Signaling management.
- **WhatsApp/AI**: Coming soon.

## License
MIT
