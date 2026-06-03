interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Tavily MCP — wraps the Tavily API (tavily.com)
 *
 * AI/LLM-optimized web search built for RAG: returns a synthesized answer
 * plus sourced, ranked results, and clean article-text extraction from URLs.
 *
 * Tools:
 * - search:  AI-native web search → synthesized answer + sourced results
 * - extract: pull clean article text from one or more URLs
 *
 * Dual-key model: pass your own Tavily key via _apiKey (OPTIONAL) for higher
 * limits, or omit it to use the shared Pipeworx platform key.
 * Auth: Authorization: Bearer <key> header on POST requests.
 */


const BASE_URL = 'https://api.tavily.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description:
      'AI/LLM-optimized web search built for RAG: returns a synthesized natural-language answer plus a ranked list of sourced results (title, url, content snippet, relevance score). Prefer this over scraping a generic search engine when you need grounded, citable web context. Example: search({ query: "latest SpaceX Starship test result" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query / question to research.',
        },
        search_depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Search depth: "basic" (fast, default) or "advanced" (deeper, more thorough).',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default 5, max 20).',
        },
        topic: {
          type: 'string',
          enum: ['general', 'news'],
          description: 'Search topic: "general" (default) or "news" for recent news coverage.',
        },
        include_answer: {
          type: 'boolean',
          description: 'Whether to include a synthesized AI answer string (default true).',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own Tavily API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'extract',
    description:
      'Extract clean article text from one or more URLs. Strips boilerplate/navigation and returns the readable raw content of each page — ideal for feeding source pages into an LLM. Example: extract({ urls: "https://example.com/article" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        urls: {
          type: ['string', 'array'],
          items: { type: 'string' },
          description: 'A single URL string, or an array of URL strings, to extract clean text from.',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own Tavily API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['urls'],
    },
  },
];

async function tavilyPost(
  apiKey: string,
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: any } | { ok: false; error: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: { error: res.status, message: text } };
  }

  return { ok: true, data: await res.json() };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  if (!apiKey) {
    return { error: 'api_key_required', message: 'No Tavily key available.' };
  }

  switch (name) {
    case 'search':
      return search(args, apiKey);
    case 'extract':
      return extract(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function search(args: Record<string, unknown>, apiKey: string) {
  const search_depth = (args.search_depth as string) ?? 'basic';
  const max_results = Math.min(20, (args.max_results as number) ?? 5);
  const topic = (args.topic as string) ?? 'general';
  const include_answer = args.include_answer === undefined ? true : (args.include_answer as boolean);

  const result = await tavilyPost(apiKey, '/search', {
    query: args.query,
    search_depth,
    max_results,
    topic,
    include_answer,
    include_raw_content: false,
  });

  if (!result.ok) return result.error;

  const data = result.data as {
    answer?: string;
    results?: Array<{ title: string; url: string; content: string; score: number }>;
    response_time?: number;
  };

  return {
    answer: include_answer ? data.answer : undefined,
    results: (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
    response_time: data.response_time,
  };
}

async function extract(args: Record<string, unknown>, apiKey: string) {
  const raw = args.urls;
  const urls = Array.isArray(raw) ? raw : [raw];

  const result = await tavilyPost(apiKey, '/extract', { urls });

  if (!result.ok) return result.error;

  const data = result.data as {
    results?: Array<{ url: string; raw_content?: string }>;
    failed_results?: unknown[];
  };

  return {
    results: (data.results ?? []).map((r) => ({
      url: r.url,
      raw_content: (r.raw_content || '').slice(0, 20000),
    })),
    failed_results: data.failed_results,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
