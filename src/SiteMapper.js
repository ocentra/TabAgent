

// Polyfill for browser API if only chrome is available
const browser = typeof window.browser !== 'undefined' ? window.browser : (typeof window.chrome !== 'undefined' ? window.chrome : undefined);

(function () {
  /**
   * Structure of navigation element
   * @typedef {Object} NavigationElement
   * @property {string} type - 'link' | 'button'
   * @property {string} text - Link or button text (or ARIA label)
   * @property {string} [href] - Link URL (for links)
   * @property {string} [ariaLabel] - ARIA label (for buttons)
   * @property {string} [title] - Title attribute (for links)
   * @property {string} [rel] - Rel attribute (for links)
   */

  /**
   * Structure of page navigation data
   * @typedef {Object} PageNavigation
   * @property {string} url - Page URL
   * @property {NavigationElement[]} elements - Links and buttons on the page
   */

  /**
   * Structure of sitemap result
   * @typedef {Object} SiteMapResult
   * @property {string[]} sitemap - Array of unique URLs (internal and external)
   * @property {Object.<string, PageNavigation>} navigation - Dictionary of URL to navigation elements
   * @property {string} startedAt - ISO timestamp of crawl start
   * @property {string} completedAt - ISO timestamp of crawl end
   * @property {number} totalPages - Total pages crawled
   */

  const MAX_PAGES = 100; // Limit total pages to crawl
  const visitedUrls = new Set(); // Track visited URLs
  const allUrls = new Set(); // Track all unique URLs (internal and external)
  let crawlQueue = []; // Queue for pending URLs
  let navigationData = {}; // URL -> PageNavigation
  let sitemap = []; // List of unique URLs

  function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function extractNavigationElements(doc, baseUrl) {
    doc = doc || document;
    const elements = [];
    const seenLinks = new Set(); // Deduplicate links/buttons per page
    const baseDomain = new URL(baseUrl).hostname;

    // Selectors for headers, footers, and social/contact links
    const linkSelectors = [
      'a[href]', // All links
      'header a[href]', // Header links
      'footer a[href]', // Footer links
      'nav a[href]', // Navigation links
      '[class*="social"] a[href]', // Social media links (e.g., Twitter)
      '[class*="contact"] a[href]', // Contact links
      '[id*="social"] a[href]',
      '[id*="contact"] a[href]',
      'a[href*="twitter.com"]', // Specific social platforms
      'a[href*="linkedin.com"]',
      'a[href*="facebook.com"]',
      'a[href*="instagram.com"]',
      'a[href*="/contact"]', // Contact pages
      'a[href*="/about"]', // About pages
      'a[href*="/blog"]' // Blog links
    ].join(',');

    // Extract links
    const links = Array.from(doc.querySelectorAll(linkSelectors));
    links.forEach(link => {
      const href = link.href;
      const text = cleanText(link.innerText || link.getAttribute('aria-label') || '');
      if (!href || !text || href.startsWith('javascript:') || href === '#') return;

      try {
        const url = new URL(href, baseUrl);
        const linkKey = `${href}|${text}`;
        if (!seenLinks.has(linkKey)) {
          seenLinks.add(linkKey);
          allUrls.add(href); // Collect all URLs (internal and external)
          elements.push({
            type: 'link',
            text: text,
            href: href,
            title: link.getAttribute('title') || undefined,
            rel: link.getAttribute('rel') || undefined
          });
        }
      } catch {
        return;
      }
    });

    // Extract buttons (including in headers/footers)
    const buttonSelectors = [
      'button',
      '[role="button"]',
      'header button',
      'footer button',
      'nav button',
      '[class*="social"] button',
      '[class*="contact"] button'
    ].join(',');
    const buttons = Array.from(doc.querySelectorAll(buttonSelectors));
    buttons.forEach(button => {
      const text = cleanText(button.innerText || button.getAttribute('aria-label') || '');
      if (!text) return;

      const buttonKey = `button|${text}`;
      if (!seenLinks.has(buttonKey)) {
        seenLinks.add(buttonKey);
        elements.push({
          type: 'button',
          text: text,
          ariaLabel: button.getAttribute('aria-label') || undefined
        });
      }
    });

    return elements;
  }

  function crawlSinglePage(doc, url) {
    doc = doc || document;
    console.log('[SiteMapper] Mapping:', url);
    try {
      const navigationElements = extractNavigationElements(doc, url);

      // Filter links for crawling (same domain only)
      const crawlableLinks = navigationElements
        .filter(el => el.type === 'link' && el.href)
        .map(el => el.href)
        .filter(href => {
          try {
            const linkUrl = new URL(href, url);
            return linkUrl.hostname === new URL(url).hostname;
          } catch {
            return false;
          }
        });

      return {
        url: url,
        elements: navigationElements,
        links: crawlableLinks
      };
    } catch (error) {
      console.error('[SiteMapper] Mapping failed for:', url, error);
      return {
        url: url,
        elements: [],
        links: []
      };
    }
  }

  async function crawlRecursive(startUrl) {
    if (visitedUrls.size >= MAX_PAGES || !startUrl.match(/^https?:\/\//)) {
      console.log('[SiteMapper] Stopping crawl: pages=', visitedUrls.size);
      return;
    }

    if (visitedUrls.has(startUrl)) {
      console.log('[SiteMapper] Skipping visited URL:', startUrl);
      return;
    }

    visitedUrls.add(startUrl);
    allUrls.add(startUrl); // Include the page itself in sitemap

    const result = await new Promise(resolve => {
      browser.runtime.sendMessage({ type: SiteMapperMessageTypes.OPEN_TAB, url: startUrl }, response => {
        if ((browser.runtime.lastError || !response || !response.tabId)) {
          console.error('[SiteMapper] Failed to open tab for:', startUrl, browser.runtime.lastError?.message);
          resolve(null);
          return;
        }

        const tabId = response.tabId;

        browser.tabs.onUpdated.addListener(function listener(tabIdUpdated, changeInfo) {
          if (tabIdUpdated === tabId && changeInfo.status === 'complete') {
            browser.tabs.onUpdated.removeListener(listener);

            browser.scripting.executeScript({
              target: { tabId: tabId },
              func: (url) => {
                const content = window.mapper.crawlSingle(url);
                browser.runtime.sendMessage({ type: SiteMapperMessageTypes.MAPPED, content: content, url: url });
              },
              args: [startUrl]
            });

            setTimeout(() => {
              browser.tabs.remove(tabId, () => {
                if (browser.runtime.lastError) {
                  console.warn('[SiteMapper] Failed to close tab:', browser.runtime.lastError.message);
                }
              });
            }, 2000);
          }
        });

        browser.runtime.onMessage.addListener(function handler(message) {
          if (message.type === SiteMapperMessageTypes.MAPPED && message.url === startUrl) {
            browser.runtime.onMessage.removeListener(handler);
            resolve(message.content);
          }
        });
      });
    });

    if (result) {
      navigationData[startUrl] = { url: startUrl, elements: result.elements };
      console.log(`[SiteMapper] Mapped ${visitedUrls.size}/${MAX_PAGES} pages, ${allUrls.size} total URLs`);

      // Add unique, same-domain links to queue
      result.links.forEach(link => {
        if (!visitedUrls.has(link) && visitedUrls.size < MAX_PAGES) {
          crawlQueue.push(link);
        }
      });
    }

    // Process next URL in queue
    while (crawlQueue.length > 0 && visitedUrls.size < MAX_PAGES) {
      const nextUrl = crawlQueue.shift();
      await crawlRecursive(nextUrl);
    }
  }

  async function mapSite(startUrl) {
    if (!startUrl.match(/^https?:\/\//)) {
      console.error('[SiteMapper] Invalid URL:', startUrl);
      return null;
    }

    console.log('[SiteMapper] Starting site mapping from:', startUrl);
    const startedAt = new Date().toISOString();

    // Reset state
    visitedUrls.clear();
    allUrls.clear();
    sitemap = [];
    navigationData = {};
    crawlQueue = [];

    await crawlRecursive(startUrl);

    // Populate sitemap from all collected URLs
    sitemap = Array.from(allUrls).sort();

    const completedAt = new Date().toISOString();
    console.log(`[SiteMapper] Mapping completed: ${visitedUrls.size} pages crawled, ${sitemap.length} total URLs`);

    return {
      sitemap: sitemap,
      navigation: navigationData,
      startedAt: startedAt,
      completedAt: completedAt,
      totalPages: visitedUrls.size
    };
  }

  window.mapper = {
    crawlSingle: crawlSinglePage,
    mapSite: mapSite,
    version: '1.1.0'
  };

  function initializeExtension() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[SiteMapper] Initialized for browser extension.');
      });
    } else {
      console.log('[SiteMapper] Initialized for browser extension.');
    }

    window.addEventListener('popstate', () => {
      console.log('[SiteMapper] SPA navigation detected, re-mapping...');
      setTimeout(() => {
        const content = crawlSinglePage(document, document.location.href);
        window.dispatchEvent(new CustomEvent('mapperContent', { detail: content }));
      }, 500);
    });

    window.addEventListener('hashchange', () => {
      console.log('[SiteMapper] Hash change detected, re-mapping...');
      setTimeout(() => {
        const content = crawlSinglePage(document, document.location.href);
        window.dispatchEvent(new CustomEvent('mapperContent', { detail: content }));
      }, 500);
    });
  }

  if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === SiteMapperMessageTypes.OPEN_TAB) {
        browser.tabs.create({ url: message.url, active: false }, tab => {
          if (browser.runtime.lastError) {
            console.error('[SiteMapper] Tab creation failed:', browser.runtime.lastError.message);
            sendResponse({ error: browser.runtime.lastError.message });
          } else {
            sendResponse({ tabId: tab.id });
          }
        });
        return true;
      }
    });
  }

  initializeExtension();
})();