# mcp-tavily

Tavily MCP — wraps the Tavily API (tavily.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search` | AI/LLM-optimized web search built for RAG: returns a synthesized natural-language answer plus a ranked list of sourced results (title, url, content snippet, relevance score). Prefer this over scraping a generic search engine when you need grounded, citable web context. Example: search({ query: "latest SpaceX Starship test result" }) |
| `extract` | Extract clean article text from one or more URLs via Tavily: strips boilerplate/navigation and returns up to 20,000 chars of readable content per page. Accepts a single URL string or an array. Ideal for feeding source pages into an LLM. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tavily": {
      "url": "https://gateway.pipeworx.io/tavily/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tavily data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
