import axios from 'axios';
import { JSDOM } from 'jsdom';

export interface ScrapeOptions {
  firstRouteOnly?: boolean;
  maxPages?: number;
  timeout?: number;
  userAgent?: string;
}

export interface ScrapeResult {
  success: boolean;
  content?: string;
  error?: string;
  pages?: number;
  urls?: string[];
}

export async function scrapeWebsite(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const {
    firstRouteOnly = true,
    maxPages = 10,
    timeout = 30000,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0 Safari/537.36'
  } = options;

  const visitedUrls = new Set<string>();
  const allContent: string[] = [];
  const urlsToVisit = [url];
  let pagesScraped = 0;

  while (urlsToVisit.length > 0 && pagesScraped < maxPages) {
    const currentUrl = urlsToVisit.shift()!;
    if (visitedUrls.has(currentUrl)) continue;

    try {
      console.log(`Scraping: ${currentUrl}`);
      const response = await axios.get(currentUrl, {
        headers: { 'User-Agent': userAgent },
        timeout,
      });

      const html = response.data;
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Remove unwanted elements
      document.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());

      // Extract text content
      const main =
        document.querySelector('main, article, .content, #content, .main') || document.body;
      const text = main?.textContent?.trim() || '';

      if (text.length > 0) {
        allContent.push(text);
        visitedUrls.add(currentUrl);
        pagesScraped++;
      }

      // If not first route only, find internal links
      if (!firstRouteOnly && pagesScraped < maxPages) {
        const base = new URL(currentUrl);
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map(link => link.getAttribute('href'))
          .filter(Boolean)
          .map(href => {
            try {
              const u = new URL(href!, base);
              return u.href;
            } catch {
              return null;
            }
          })
          .filter(
            (href): href is string =>
              !!href &&
              href.startsWith(base.origin) &&
              !href.includes('#') &&
              !visitedUrls.has(href)
          );

        // Add unique links
        links.forEach(link => {
          if (!urlsToVisit.includes(link)) {
            urlsToVisit.push(link);
          }
        });
      }
    } catch (error: any) {
      console.error(`Error scraping ${currentUrl}:`, error.message);
      // Continue to next URL
    }
  }

  if (allContent.length === 0) {
    return {
      success: false,
      error: 'No content found on the website',
    };
  }

  const combinedContent = allContent.join('\n\n');
  return {
    success: true,
    content: combinedContent,
    pages: pagesScraped,
    urls: Array.from(visitedUrls),
  };
}

export async function scrapeAllRoutes(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  return scrapeWebsite(url, { ...options, firstRouteOnly: false });
}

export function cleanScrapedContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim();
}

export function extractTextFromHtml(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
  const main = document.querySelector('main, article, .content, #content, .main') || document.body;

  return main?.textContent?.trim() || '';
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return url;
  }
}
