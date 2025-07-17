# OnThisDayToday MCP Server

A Model Context Protocol (MCP) server that provides historical events that happened on the current day from Wikipedia's "On This Day" feed.

### Features

🗓️ Fetches historical events for the current date <br>
🌍 Supports multiple languages (English, German, Italian, French, etc.) <br>
🎲 Option to get a single random event <br>
📚 Clean, formatted output with HTML tags removed <br>
⚡ Fast API responses using Wikipedia's official API <br>

---
## Installation

You can run this server directly with npx (no need to install globally):

```
npx mcp-wikipedia-onthisdaytoday-server
```

Or, to install locally:

```
npm install mcp-wikipedia-onthisdaytoday-server
```

---

## Configuration

To use this server with MCP, add the following to your config file:

```json
{
  "mcpServers": {
    "onthisdaytoday": {
      "command": "npx",
      "args": [
        "mcp-wikipedia-onthisdaytoday-server"
      ]
    }
  }
}
```

This approach uses npx to automatically download and run your published package, making it much easier for others to use your tool!
