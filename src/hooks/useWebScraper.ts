/**
 * ═══════════════════════════════════════════════════════════
 * useWebScraper — Intelligent web data acquisition for RAG
 * Scrapes radiation shielding literature from public sources
 * ═══════════════════════════════════════════════════════════
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ScrapedDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  authors?: string;
  year?: number;
  standard?: string;
  fetchedAt: string;
  wordCount: number;
  isRelevant: boolean;
  relevanceScore: number;
}

export interface ScraperConfig {
  maxPages: number;
  maxDepth: number;
  minWordCount: number;
  relevanceKeywords: string[];
  delayMs: number;
  respectRobotsTxt: boolean;
}

const DEFAULT_CONFIG: ScraperConfig = {
  maxPages: 5,
  maxDepth: 2,
  minWordCount: 200,
  relevanceKeywords: [
    'radiation shielding', 'NCRP', 'IAEA', 'structural shielding',
    'barrier calculation', 'HVL', 'TVL', 'occupancy factor',
    'dose limit', 'megavoltage', 'x-ray room', 'CT shielding',
    'PET shielding', 'linear accelerator', 'radioactive',
    'dose assessment', 'shielding design', 'medical physics',
  ],
  delayMs: 1000,
  respectRobotsTxt: true,
};

export const WEB_SCRAPER_ENABLED = import.meta.env.VITE_ENABLE_WEB_SCRAPER === 'true';

// ─── Known reliable sources for radiation shielding docs ───
export const TRUSTED_SOURCES = [
  {
    name: 'NCRP Publications',
    baseUrl: 'https://ncrponline.org',
    searchUrl: 'https://ncrponline.org/publications/reports/',
    standard: 'NCRP',
    type: 'standards' as const,
  },
  {
    name: 'IAEA Safety Standards',
    baseUrl: 'https://www.iaea.org',
    searchUrl: 'https://www.iaea.org/resources/safety-standards',
    standard: 'IAEA',
    type: 'standards' as const,
  },
  {
    name: 'ICRU Reports',
    baseUrl: 'https://www.icru.org',
    searchUrl: 'https://www.icru.org/reports/',
    standard: 'ICRU',
    type: 'standards' as const,
  },
  {
    name: 'AAPM Reports',
    baseUrl: 'https://www.aapm.org',
    searchUrl: 'https://www.aapm.org/pubs/reports/',
    standard: 'AAPM',
    type: 'tg_reports' as const,
  },
  {
    name: 'IPEM Reports',
    baseUrl: 'https://www.ipem.ac.uk',
    searchUrl: 'https://www.ipem.ac.uk/publications/',
    standard: 'IPEM',
    type: 'reports' as const,
  },
  {
    name: 'PubMed - Medical Physics Shielding',
    baseUrl: 'https://pubmed.ncbi.nlm.nih.gov',
    searchUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=radiation+shielding+medical+physics',
    standard: 'PUBMED',
    type: 'research' as const,
  },
  {
    name: 'arXiv - Medical Physics',
    baseUrl: 'https://arxiv.org',
    searchUrl: 'https://arxiv.org/search/?query=medical+physics+radiation+shielding',
    standard: 'ARXIV',
    type: 'research' as const,
  },
  {
    name: 'Scholar - Shielding Design',
    baseUrl: 'https://scholar.google.com',
    searchUrl: 'https://scholar.google.com/scholar?q=radiation+shielding+design+medical',
    standard: 'SCHOLAR',
    type: 'research' as const,
  },
];

/**
 * Extract text content from HTML string (client-side only)
 */
function extractTextFromHTML(html: string, url: string): { title: string; content: string; wordCount: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove non-content elements
  const selectorsToRemove = 'script, style, nav, header, footer, aside, .advertisement, .sidebar, .comments, iframe';
  doc.querySelectorAll(selectorsToRemove).forEach(el => el.remove());

  // Try to find main content
  const mainContent =
    doc.querySelector('main, article, .content, .main-content, #content, [role="main"]') ||
    doc.querySelector('body');

  const title = doc.querySelector('title')?.textContent ||
    doc.querySelector('h1')?.textContent ||
    'Untitled';

  const content = mainContent?.textContent || doc.body?.textContent || '';
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return {
    title: title.trim(),
    content: cleanContent,
    wordCount: cleanContent.split(/\s+/).length,
  };
}

/**
 * Score document relevance based on keyword presence
 */
function scoreRelevance(content: string, keywords: string[]): number {
  const lower = content.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lower.match(regex);
    if (matches) score += matches.length * (kw.length / 10);
  }
  return Math.min(score / 10, 1);
}

/**
 * Estimate year from content
 */
function extractYear(content: string): number | undefined {
  const matches = content.match(/\b(19\d{2}|20\d{2})\b/g);
  if (!matches) return undefined;
  const years = matches.map(Number).filter(y => y >= 1980 && y <= 2030);
  if (years.length === 0) return undefined;
  // Return most common year
  const counts = years.reduce<Record<number, number>>((acc, y) => { acc[y] = (acc[y] || 0) + 1; return acc; }, {});
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

export function useWebScraper() {
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentUrl: '' });
  const [results, setResults] = useState<ScrapedDocument[]>([]);
  const [config, setConfig] = useState<ScraperConfig>(DEFAULT_CONFIG);

  // ─── Scrape a single URL ───
  const scrapeUrl = useCallback(async (url: string): Promise<ScrapedDocument | null> => {
    if (!WEB_SCRAPER_ENABLED) {
      toast.info('Scraper web deshabilitado. Configure VITE_ENABLE_WEB_SCRAPER=true para habilitar red externa.');
      return null;
    }

    try {
      setProgress(p => ({ ...p, currentUrl: url }));

      // Use a CORS proxy or the direct fetch
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) return null;

      const html = await response.text();
      const { title, content, wordCount } = extractTextFromHTML(html, url);

      if (wordCount < config.minWordCount) return null;

      const relevanceScore = scoreRelevance(content, config.relevanceKeywords);
      const isRelevant = relevanceScore > 0.3;
      const year = extractYear(content);

      const doc: ScrapedDocument = {
        id: `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url,
        title,
        content,
        year,
        fetchedAt: new Date().toISOString(),
        wordCount,
        isRelevant,
        relevanceScore,
      };

      return doc;
    } catch {
      return null;
    }
  }, [config]);

  // ─── Scrape multiple URLs with delay ───
  const scrapeUrls = useCallback(async (urls: string[]): Promise<ScrapedDocument[]> => {
    if (!WEB_SCRAPER_ENABLED) {
      toast.info('Scraper web deshabilitado; use ingesta manual de textos o archivos.');
      return [];
    }

    setIsScraping(true);
    setProgress({ current: 0, total: urls.length, currentUrl: '' });
    const docs: ScrapedDocument[] = [];

    try {
      for (let i = 0; i < urls.length && i < config.maxPages; i++) {
        const doc = await scrapeUrl(urls[i]);
        if (doc) docs.push(doc);
        setProgress(p => ({ ...p, current: i + 1 }));

        // Rate limiting
        if (i < urls.length - 1 && config.delayMs > 0) {
          await new Promise(r => setTimeout(r, config.delayMs));
        }
      }
    } finally {
      setIsScraping(false);
      setResults(docs);
    }

    const relevant = docs.filter(d => d.isRelevant);
    toast.success(`Scraping completado: ${docs.length} docs, ${relevant.length} relevantes`);
    return docs;
  }, [scrapeUrl, config]);

  // ─── Scrape from a trusted source ───
  const scrapeSource = useCallback(async (sourceIndex: number): Promise<ScrapedDocument[]> => {
    if (!WEB_SCRAPER_ENABLED) {
      toast.info('Scraper web deshabilitado; use ingesta manual de textos o archivos.');
      return [];
    }

    const source = TRUSTED_SOURCES[sourceIndex];
    if (!source) return [];

    toast.info(`Scrapeando: ${source.name}`);

    // In a real implementation, this would crawl the source's search results
    // For now, we return a simulated result for the landing page
    const doc = await scrapeUrl(source.searchUrl);
    if (doc) {
      doc.standard = source.standard;
      setResults([doc]);
      return [doc];
    }
    return [];
  }, [scrapeUrl]);

  // ─── Auto-discover URLs from a page ───
  const discoverLinks = useCallback(async (startUrl: string, maxLinks: number = 10): Promise<string[]> => {
    if (!WEB_SCRAPER_ENABLED) return [];

    try {
      const response = await fetch(startUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return [];

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const baseUrl = new URL(startUrl);
      const links = new Set<string>();

      doc.querySelectorAll('a[href]').forEach(a => {
        try {
          const href = a.getAttribute('href') || '';
          // Only follow same-origin links
          const url = new URL(href, baseUrl).href;
          if (url.startsWith(baseUrl.origin) && !url.match(/\.(pdf|zip|doc|docx|xls|xlsx|jpg|png|gif|css|js)$/i)) {
            links.add(url);
          }
        } catch { /* invalid URL */ }
      });

      return Array.from(links).slice(0, maxLinks);
    } catch {
      return [];
    }
  }, []);

  // ─── Full crawl: discover + scrape ───
  const crawl = useCallback(async (startUrl: string): Promise<ScrapedDocument[]> => {
    if (!WEB_SCRAPER_ENABLED) {
      toast.info('Crawler web deshabilitado; use ingesta manual de textos o archivos.');
      return [];
    }

    setIsScraping(true);
    toast.info(`Iniciando crawl desde: ${startUrl}`);

    try {
      const links = await discoverLinks(startUrl, config.maxPages);
      const allUrls = [startUrl, ...links.filter(l => l !== startUrl)];
      const docs = await scrapeUrls(allUrls);
      return docs;
    } finally {
      setIsScraping(false);
    }
  }, [discoverLinks, scrapeUrls, config]);

  // ─── Add manual document from web ───
  const addManualDocument = useCallback((doc: Omit<ScrapedDocument, 'id' | 'fetchedAt'>): string => {
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullDoc: ScrapedDocument = { ...doc, id, fetchedAt: new Date().toISOString() };
    setResults(prev => [...prev, fullDoc]);
    return id;
  }, []);

  return {
    isScraping,
    isEnabled: WEB_SCRAPER_ENABLED,
    progress,
    results,
    config,
    setConfig,
    scrapeUrl,
    scrapeUrls,
    scrapeSource,
    discoverLinks,
    crawl,
    addManualDocument,
  };
}
