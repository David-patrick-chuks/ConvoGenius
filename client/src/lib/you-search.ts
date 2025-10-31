import { z } from 'zod';  

// Updated schema for Search response based on actual structure
const SearchResultSchema = z.object({
  results: z.object({
    web: z.array(z.object({
      url: z.string(),
      title: z.string(),
      description: z.string(),
      snippets: z.array(z.string()),
      thumbnail_url: z.string().optional(),
      page_age: z.string().optional(),
      authors: z.array(z.string()).optional(),
      favicon_url: z.string().optional(),
      // For livecrawl: may include html or markdown if fetched
      html: z.string().optional(),
      markdown: z.string().optional(),
    })),
    news: z.array(z.object({
      title: z.string(),
      description: z.string(),
      page_age: z.string(),
      thumbnail_url: z.string().optional(),
      url: z.string(),
      // For livecrawl: may include html or markdown
      html: z.string().optional(),
      markdown: z.string().optional(),
    })),
  }),
  metadata: z.object({
    request_uuid: z.string(),
    query: z.string(),
    latency: z.number(),
  }),
});

// Schema for Express Agent response (non-streaming)
const ExpressAgentSchema = z.object({
  output: z.array(z.object({
    type: z.string(),
    text: z.string().optional(),
    content: z.string().optional(),
    agent: z.string().optional(),
  })),
});

// Schema for Contents response
const ContentsSchema = z.array(z.object({
  url: z.string(),
  title: z.string(),
  html: z.string().nullable(),
  markdown: z.string().nullable(),
}));

// Existing Search function (updated base URL and schema)
export async function youSearch(query: string, options: { livecrawl?: 'web' | 'news'; count?: number } = {}) {
  const url = new URL('https://api.ydc-index.io/v1/search');
  url.searchParams.append('query', query);
  url.searchParams.append('count', options.count?.toString() ?? '5');
  if (options.livecrawl) url.searchParams.append('livecrawl', options.livecrawl);

  const response = await fetch(url.toString(), {
    headers: { 'X-API-Key': process.env.YOU_API_KEY! }, 
  });
  if (!response.ok) throw new Error('You.com API error');

  const data = await response.json();
  return SearchResultSchema.parse(data);
}

// New: Express Agent function (non-streaming for simplicity)
export async function youExpressAgent(query: string, stream: boolean = false) {
  const url = new URL('https://api.you.com/v1/agents/runs');
  const body = {
    agent: 'express',
    input: query,
    stream,
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${process.env.YOU_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('You.com Express Agent error');

  const data = await response.json();
  return ExpressAgentSchema.parse(data);
}

// New: Contents function
export async function youContents(urls: string[], format: 'html' | 'markdown' = 'markdown') {
  const url = new URL('https://api.ydc-index.io/v1/contents');
  const body = {
    urls,
    format,
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 
      'X-API-Key': process.env.YOU_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('You.com Contents error');

  const data = await response.json();
  return ContentsSchema.parse(data);
}