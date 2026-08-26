# mcp-tavily

Tavily MCP — wraps the Tavily API (tavily.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search` | AI/LLM-optimized web search built for RAG: returns a synthesized natural-language answer plus a ranked list of sourced results (title, url, content snippet, relevance score). Prefer this over scraping a generic search engine when you need grounded, citable web context. Example: search({ query: "latest SpaceX Starship test result" }) |
| `tavily_news` | Recent NEWS coverage with FULL ARTICLE TEXT — "latest news about <company/person/topic>", "news coverage of X this week", "what are people reporting about X", "recent headlines on X". Returns a synthesized answer plus ranked articles each carrying title, url, publication content, and a relevance score — the full text, not just a headline, so the calling agent can quote and cite. Freshness-windowed via `days` (default 7). This is the premium news path (Tavily, funded key, no per-IP throttle, no shared free-tier quota); prefer it when the question asks what is being REPORTED about a specific entity or topic. |
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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/tavily/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Tavily data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
