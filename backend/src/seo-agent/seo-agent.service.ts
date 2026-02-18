import { Injectable, Logger } from '@nestjs/common';
import { generateText, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { Message } from '../chat/entities/message.entity';

const SYSTEM_PROMPT = `You are an expert SEO optimization assistant. Your role is to help users improve their website's search engine optimization.

When a user provides a URL:
1. Use the fetchPage tool to download and analyze the page
2. Evaluate the current SEO elements and provide a structured analysis
3. Provide specific, actionable recommendations

For title tag optimization:
- Keep it under 100 characters
- Include target keywords near the beginning
- Make it compelling and unique for the page
- Avoid keyword stuffing

For meta description optimization:
- Keep it between 150-160 characters
- Include a call to action
- Summarize the page content accurately

Also analyze when relevant: heading structure (H1-H3), image alt attributes, canonical URL, Open Graph tags, and overall content structure.

Format your responses with clear sections using markdown. Always provide the current value and your suggested improvement side by side.

When using markdown tables, put each row on its own line. For example:
| Current Value | Suggested Improvement |
| --- | --- |
| Example Domain | Example Domain - Explore Our Website |

Do not put the entire table on one line; use line breaks between the header, separator, and each data row.

If the user asks general SEO questions without a URL, provide helpful and practical guidance.`;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

@Injectable()
export class SeoAgentService {
  private readonly logger = new Logger(SeoAgentService.name);

  async analyze(
    userMessage: string,
    history: Message[],
    modelId?: string,
  ): Promise<string> {
    try {
      const model = groq(modelId ?? 'llama-3.3-70b-versatile');
      const messages = history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const { text } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: [...messages, { role: 'user' as const, content: userMessage }],
        tools: {
          fetchPage: tool({
            description:
              'Fetch a webpage and extract its SEO-relevant HTML elements for analysis',
            parameters: z.object({
              url: z.string().url().describe('The full URL of the page to analyze'),
            }),
            execute: async ({ url }) => this.fetchAndExtract(url),
          }),
        },
        maxSteps: 3,
      });

      return text;
    } catch (error) {
      this.logger.error('SEO analysis failed', error);
      return 'I encountered an error while analyzing. Please make sure the URL is valid and try again.';
    }
  }

  private async fetchAndExtract(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; SEO-Optimizer/1.0; +https://seo-optimizer.app)',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return JSON.stringify({ error: `HTTP ${response.status}: ${response.statusText}` });
      }

      const html = await response.text();
      return this.extractSeoElements(html, url);
    } catch (error) {
      return JSON.stringify({
        error: `Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private extractSeoElements(html: string, url: string): string {
    const extract = (pattern: RegExp): string | null => {
      const match = html.match(pattern);
      return match?.[1]?.trim() || null;
    };

    const extractAll = (pattern: RegExp, limit = 10): string[] => {
      return [...html.matchAll(pattern)]
        .map((m) => m[1]?.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
        .slice(0, limit);
    };

    const title =
      extract(/<title[^>]*>([\s\S]*?)<\/title>/i) || 'NOT FOUND';

    const metaDescription =
      extract(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      extract(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i) ||
      'NOT FOUND';

    const metaKeywords =
      extract(/<meta[^>]*name=["']keywords["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      'NOT FOUND';

    const canonical =
      extract(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["'][^>]*>/i) ||
      'NOT FOUND';

    const ogTitle =
      extract(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      'NOT FOUND';

    const ogDescription =
      extract(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      'NOT FOUND';

    const ogImage =
      extract(/<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      'NOT FOUND';

    const h1Tags = extractAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
    const h2Tags = extractAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, 5);
    const h3Tags = extractAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, 5);

    const imgWithoutAlt = [...html.matchAll(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi)].length;
    const totalImages = [...html.matchAll(/<img[^>]*>/gi)].length;

    const viewport =
      extract(/<meta[^>]*name=["']viewport["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      'NOT FOUND';

    const charset = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)/i)?.[1] || 'NOT FOUND';

    return JSON.stringify(
      {
        url,
        title: { value: title, length: title.length },
        metaDescription: { value: metaDescription, length: metaDescription.length },
        metaKeywords,
        canonical,
        openGraph: { title: ogTitle, description: ogDescription, image: ogImage },
        headings: { h1: h1Tags, h2: h2Tags, h3: h3Tags },
        images: { total: totalImages, missingAlt: imgWithoutAlt },
        technical: { viewport, charset },
      },
      null,
      2,
    );
  }
}
