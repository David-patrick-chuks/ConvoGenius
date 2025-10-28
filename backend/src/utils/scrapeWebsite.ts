import puppeteer from 'puppeteer';
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
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Set timeout
    page.setDefaultTimeout(timeout);

    const visitedUrls = new Set<string>();
    const allContent: string[] = [];
    const urlsToVisit = [url];
    let pagesScraped = 0;

    while (urlsToVisit.length > 0 && pagesScraped < maxPages) {
      const currentUrl = urlsToVisit.shift()!;
      
      if (visitedUrls.has(currentUrl)) {
        continue;
      }

      try {
        console.log(`Scraping: ${currentUrl}`);
        await page.goto(currentUrl, { waitUntil: 'networkidle2' });
        
        // Extract text content
        const content = await page.evaluate(() => {
          // Remove script and style elements
          const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
          scripts.forEach(el => el.remove());
          
          // Get main content
          const mainContent = document.querySelector('main, article, .content, #content, .main') || document.body;
          return mainContent.innerText || mainContent.textContent || '';
        });

        if (content.trim().length > 0) {
          allContent.push(content.trim());
          visitedUrls.add(currentUrl);
          pagesScraped++;
        }

        // If not first route only, find more links
        if (!firstRouteOnly && pagesScraped < maxPages) {
          const links = await page.evaluate((baseUrl) => {
            const linkElements = document.querySelectorAll('a[href]');
            const links: string[] = [];
            
            linkElements.forEach(link => {
              const href = link.getAttribute('href');
              if (href) {
                try {
                  const url = new URL(href, baseUrl);
                  if (url.origin === new URL(baseUrl).origin && !url.href.includes('#')) {
                    links.push(url.href);
                  }
                } catch (e) {
                  // Invalid URL, skip
                }
              }
            });
            
            return [...new Set(links)]; // Remove duplicates
          }, currentUrl);

          // Add new links to visit
          links.forEach(link => {
            if (!visitedUrls.has(link) && !urlsToVisit.includes(link)) {
              urlsToVisit.push(link);
            }
          });
        }

      } catch (error) {
        console.error(`Error scraping ${currentUrl}:`, error);
        // Continue with next URL
      }
    }

    await browser.close();

    if (allContent.length === 0) {
      return {
        success: false,
        error: 'No content found on the website'
      };
    }

    const combinedContent = allContent.join('\n\n');
    
    return {
      success: true,
      content: combinedContent,
      pages: pagesScraped,
      urls: Array.from(visitedUrls)
    };

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while scraping'
    };
  }
}

export async function scrapeAllRoutes(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  return scrapeWebsite(url, { ...options, firstRouteOnly: false });
}

export function cleanScrapedContent(content: string): string {
  return content
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters except newlines
    .trim();
}

export function extractTextFromHtml(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
  scripts.forEach(el => el.remove());
  
  // Get main content
  const mainContent = document.querySelector('main, article, .content, #content, .main') || document.body;
  return mainContent?.textContent || '';
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
