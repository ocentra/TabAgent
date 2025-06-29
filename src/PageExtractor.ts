/**
 * Structure of extracted content
 * @typedef {Object} ExtractedContent
 * @property {string} title - Page title or fallback
 * @property {string} content - Cleaned HTML content
 * @property {string} text - Full text content
 * @property {Object[]} segments - Array of content segments
 * @property {Object[]} images - Array of image data
 * @property {Object[]} videos - Array of video data
 * @property {Object[]} tables - Array of table data
 * @property {Object[]} links - Array of link data
 * @property {string} url - Page URL
 * @property {string} extractedAt - ISO timestamp
 * @property {string} [author] - Author name
 * @property {string} [publishDate] - Publication date
 * @property {string} [metaDescription] - Meta description
 * @property {string} [language] - Page language
 * @property {string[]} [keywords] - Keywords or tags
 * @property {string[]} [categories] - Categories
 * @property {number} [wordCount] - Word count
 * @property {number} [readingTime] - Reading time in minutes
 */

/**
 * Structure of a content segment
 * @typedef {Object} ContentSegment
 * @property {string} type - 'heading' | 'paragraph' | 'list' | 'image' | 'video' | 'table' | 'quote' | 'code' | 'button' | 'listitem'
 * @property {number} [level] - Heading level (1-6)
 * @property {string} [text] - Text content
 * @property {Object} [data] - Image, video, table, or button data
 * @property {Object} [context] - Parent link or button context
 * @property {string} [context.type] - 'link' | 'button'
 * @property {string} [context.href] - Link href (if link)
 * @property {string} [context.text] - Button text or aria-label (if button)
 */

/**
 * Structure of image data
 * @typedef {Object} ImageData
 * @property {string} src - Image URL
 * @property {string} alt - Alt text
 * @property {number} [width] - Image width
 * @property {number} [height] - Image height
 * @property {string} [caption] - Caption
 */

/**
 * Structure of video data
 * @typedef {Object} VideoData
 * @property {string} src - Video URL
 * @property {string} type - MIME type
 * @property {string} [poster] - Poster image URL
 * @property {number} [duration] - Duration in seconds
 */

/**
 * Structure of table data
 * @typedef {Object} TableData
 * @property {string[]} headers - Table headers
 * @property {string[][]} rows - Table rows
 * @property {string} [caption] - Table caption
 */

/**
 * Structure of link data
 * @typedef {Object} LinkData
 * @property {string} href - Link URL
 * @property {string} text - Link text
 * @property {string} [title] - Title attribute
 * @property {string} [rel] - Rel attribute
 */

/**
 * Structure of button data
 * @typedef {Object} ButtonData
 * @property {string} text - Button text or aria-label
 * @property {string} [ariaLabel] - ARIA label
 */

function getTextDensity(element: HTMLElement, doc?: Document): number {
  doc = doc || document;
  var text = (element.innerText || '').trim();
  var rect = element.getBoundingClientRect();
  var area = rect.width * rect.height;
  return area > 0 ? text.length / area : 0;
}

function isBoilerplate(element: HTMLElement): boolean {
  var boilerplateTags = ['header', 'footer', 'nav', 'aside', 'script', 'style', 'iframe', 'noscript', 'form', 'svg', 'banner'];
  var boilerplateClasses = [
    'ad', 'advert', 'banner', 'sidebar', 'menu', 'nav', 'footer', 'widget',
    'social', 'share', 'comment', 'related', 'newsletter', 'popup', 'cookie',
    'modal', 'promo', 'sponsored', 'trending', 'login', 'signup'
  ];
  var tagName = element.tagName.toLowerCase();
  var className = (element.className || '').toString().toLowerCase();
  var id = (element.id || '').toLowerCase();
  var role = (element.getAttribute('role') || '').toLowerCase();

  return (
    boilerplateTags.includes(tagName) ||
    boilerplateClasses.some(function(cls) { return className.includes(cls) || id.includes(cls); }) ||
    Boolean(element.querySelector('[class*="ad"], [id*="ad"], [class*="social"], [id*="social"], [class*="share"], [class*="sponsor"]')) ||
    role === 'navigation' ||
    role === 'complementary' ||
    role === 'banner' ||
    element.hasAttribute('aria-hidden') ||
    getComputedStyle(element).display === 'none' ||
    getComputedStyle(element).visibility === 'hidden' ||
    getComputedStyle(element).opacity === '0'
  );
}

function scoreElement(element: HTMLElement, doc?: Document): number {
  doc = doc || document;
  var score = 0;
  var tagName = element.tagName.toLowerCase();

  var tagScores: Record<string, number> = {
    article: 30,
    main: 25,
    section: 20,
    div: 8,
    p: 15,
    figure: 12
  };
  score += tagScores[tagName] || 0;

  score += getTextDensity(element, doc) * 200;

  var paragraphs = element.querySelectorAll('p, li, blockquote').length;
  score += paragraphs * 15;
  score += Math.min((element.innerText || '').length, 15000) / 30;

  if (isBoilerplate(element)) {
    score -= 200;
  }

  var className = (element.className || '').toString().toLowerCase();
  var id = (element.id || '').toLowerCase();
  var contentKeywords = ['content', 'article', 'main', 'story', 'body', 'post', 'entry', 'page'];
  if (contentKeywords.some(function(keyword) { return className.includes(keyword) || id.includes(keyword); })) {
    score += 50;
  }

  if (((element.innerText || '').trim().length || 0) < 50) {
    score -= 40;
  }

  if (element.querySelector('[itemprop="articleBody"], [itemtype*="Article"], [itemtype*="NewsArticle"]')) {
    score += 80;
  }

  var links = element.querySelectorAll('a').length;
  var textLength = (element.innerText || '').length || 1;
  if (links / textLength > 0.15) {
    score -= 30;
  }

  var richContent = element.querySelectorAll('img, video, table, blockquote, pre').length;
  score += richContent * 20;

  return score;
}

function cleanContent(element: HTMLElement | Element): HTMLElement {
  element = element as HTMLElement;
  var cloned = element.cloneNode(true) as HTMLElement;
  var selectorsToRemove = [
    'header', 'footer', 'nav', 'aside',
    '[class*="ad"]', '[id*="ad"]',
    '[class*="social"]', '[class*="share"]',
    '[class*="comment"]', '[class*="related"]',
    '[class*="sponsor"]', '[class*="promo"]',
    'script', 'style', 'iframe', 'noscript',
    '[aria-hidden="true"]', '[style*="display: none"]',
    'svg', 'canvas', '[role="presentation"]',
    '[role="banner"]', '[role="complementary"]'
  ].join(',');

  cloned.querySelectorAll(selectorsToRemove).forEach(function(el) { (el as HTMLElement).remove(); });

  cloned.querySelectorAll('*').forEach(function(el) { 
    (el as HTMLElement).removeAttribute('style');
    Array.from((el as HTMLElement).attributes).forEach(function(attr) {
      if ((attr as Attr).name.startsWith('on')) {
        (el as HTMLElement).removeAttribute((attr as Attr).name);
      }
    });
  });

  cloned.querySelectorAll('div, section, p, span, figure').forEach(function(el) {
    if (!(el as HTMLElement).innerText.trim() && !(el as HTMLElement).querySelector('img, video, a, table')) {
      (el as HTMLElement).remove();
    }
  });

  cloned.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, button').forEach(function(el) {
    (el as HTMLElement).textContent = ((el as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim();
  });

  cloned.querySelectorAll('img, video, a').forEach(function(el) {
    var keepAttrs = ['src', 'alt', 'href', 'title', 'poster', 'type', 'aria-label'];
    Array.from((el as HTMLElement).attributes).forEach(function(attr) {
      if (!keepAttrs.includes((attr as Attr).name)) (el as HTMLElement).removeAttribute((attr as Attr).name);
    });
  });

  return cloned;
}

function getParentContext(element: HTMLElement): any {
  var parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (parent.tagName === 'A' && (parent as HTMLAnchorElement).href) {
      return {
        type: 'link',
        href: (parent as HTMLAnchorElement).href,
        text: (parent.innerText || '').trim()
      };
    }
    if (parent.tagName === 'BUTTON') {
      return {
        type: 'button',
        text: (parent.innerText || parent.getAttribute('aria-label') || '').trim(),
        ariaLabel: parent.getAttribute('aria-label') || undefined
      };
    }
    parent = parent.parentElement;
  }
  return null;
}

function extractSegments(element: HTMLElement | Element): any[] {
  element = element as HTMLElement;
  var segments: any[] = [];
  var elements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, li, figure, video, table, blockquote, pre, button, div');

  elements.forEach(function(el) {
    if (!(el instanceof HTMLElement)) return;
    var text = ((el as HTMLElement).innerText || '').trim();
    if (!text && !el.querySelector('img, video, table') && !['BUTTON', 'FIGURE', 'VIDEO', 'TABLE'].includes(el.tagName)) return;

    var context = getParentContext(el);

    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
      segments.push({
        type: 'heading',
        level: parseInt(el.tagName[1]),
        text: text,
        context: context
      });
    } else if (el.tagName === 'P') {
      segments.push({
        type: 'paragraph',
        text: text,
        context: context
      });
    } else if (['UL', 'OL'].includes(el.tagName)) {
      var items = Array.from(el.querySelectorAll('li')).map(function(li) { return ((li as HTMLElement).innerText || '').trim(); }).filter(Boolean);
      segments.push({
        type: 'list',
        text: items.join(' | '),
        context: context
      });
    } else if (el.tagName === 'LI') {
      segments.push({
        type: 'listitem',
        text: text,
        context: context
      });
    } else if (el.tagName === 'FIGURE') {
      var img = el.querySelector('img') as HTMLImageElement;
      if (img) {
        if (segments.length > 0 && segments[segments.length - 1].type === 'image' && segments[segments.length - 1].data?.src === img.src) {
          // Do nothing, image already added
        } else {
          segments.push({
            type: 'image',
            text: el.querySelector('figcaption')?.innerText.trim(),
            data: {
              src: img.src,
              alt: (img.alt || '').trim(),
              width: img.width || undefined,
              height: img.height || undefined,
              caption: el.querySelector('figcaption')?.innerText.trim()
            },
            context: context
          });
        }
      }
    } else if (el.tagName === 'VIDEO') {
      segments.push({
        type: 'video',
        data: {
          src: (el as HTMLVideoElement).src || el.querySelector('source')?.getAttribute('src') || '',
          type: (el.querySelector('source')?.getAttribute('type') || ((el as HTMLVideoElement) as any).type) || '',
          poster: (el as HTMLVideoElement).poster || undefined,
          duration: (el as HTMLVideoElement).duration || undefined
        },
        context: context
      });
    } else if (el.tagName === 'TABLE') {
      var headers = Array.from(el.querySelectorAll('th')).map(function(th) { return ((th as HTMLElement).innerText || '').trim(); });
      var rows = Array.from(el.querySelectorAll('tr')).map(function(row) {
        return Array.from(row.querySelectorAll('td')).map(function(td) { return ((td as HTMLElement).innerText || '').trim(); });
      }).filter(function(row) { return row.length > 0; });
      segments.push({
        type: 'table',
        text: el.querySelector('caption')?.innerText.trim(),
        data: {
          headers: headers,
          rows: rows,
          caption: el.querySelector('caption')?.innerText.trim()
        },
        context: context
      });
    } else if (el.tagName === 'BLOCKQUOTE') {
      segments.push({
        type: 'quote',
        text: text,
        context: context
      });
    } else if (el.tagName === 'PRE') {
      segments.push({
        type: 'code',
        text: text,
        context: context
      });
    } else if (el.tagName === 'BUTTON') {
      segments.push({
        type: 'button',
        text: text,
        data: {
          text: text,
          ariaLabel: el.getAttribute('aria-label') || undefined
        },
        context: context
      });
    } else if (el.tagName === 'DIV') {
      if (el.children.length === 0 && text.length > 0 && text.length < 50) {
        if (text.match(/^[\d.,%]+$/) || text.toLowerCase().includes('saving') || text.toLowerCase().includes('compute') || text.toLowerCase().includes('parameter')) {
          segments.push({
            type: 'text_block',
            text: text,
            context: context
          });
        }
      } else if (el.querySelector('img') && !el.querySelector('figure')) {
        var divImg = el.querySelector('img') as HTMLImageElement;
        var alreadyAdded = segments.some((seg: any) => seg.type === 'image' && seg.data?.src === divImg.src);
        if (!alreadyAdded) {
          segments.push({
            type: 'image',
            text: null,
            data: {
              src: divImg.src,
              alt: (divImg.alt || '').trim(),
              width: divImg.width || undefined,
              height: divImg.height || undefined,
              caption: null
            },
            context: context
          });
        }
      }
    }
  });

  return segments;
}

function extractMetadata(doc: Document): any {
  doc = doc || document;
  var author = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    (doc.querySelector('[itemprop="author"]') as HTMLElement)?.innerText.trim() ||
    (doc.querySelector('[rel="author"]') as HTMLElement)?.innerText.trim() ||
    (doc.querySelector('.author-name, .byline') as HTMLElement)?.innerText.trim();
  var publishDate = doc.querySelector('meta[name="publish-date"]')?.getAttribute('content') ||
    doc.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
    doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
    (doc.querySelector('.date, .published') as HTMLElement)?.innerText.trim();
  var metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  var language = doc.documentElement.lang || navigator.language || undefined;
  var keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(function(k: string) { return k.trim(); }) ||
    Array.from(doc.querySelectorAll('[itemprop="keywords"], .tag, .category')).map(function(el) { return (el as HTMLElement).innerText.trim(); }).filter(Boolean);
  var categories = Array.from(doc.querySelectorAll('[itemprop="genre"], .category, .section')).map(function(el) { return (el as HTMLElement).innerText.trim(); }).filter(Boolean);

  return {
    author: author,
    publishDate: publishDate,
    metaDescription: metaDescription,
    language: language,
    keywords: keywords.length > 0 ? keywords : undefined,
    categories: categories.length > 0 ? categories : undefined
  };
}

function filterLinks(links: HTMLElement[]): any[] {
  var validLinks: any[] = [];
  var seenHrefs = new Set<string>();

  links.forEach(function(link) {
    var href = (link as HTMLAnchorElement).href;
    var text = ((link as HTMLElement).innerText || '').trim();
    if (!href || !text || href.startsWith('javascript:') || href === '#' || href.startsWith('mailto:')) return;

    var restrictedDomains = [
      'twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com',
      'pinterest.com', 'youtube.com', 'tiktok.com', 'snapchat.com'
    ];
    try {
      var url = new URL(href);
      if (restrictedDomains.some(function(domain) { return url.hostname.includes(domain); })) return;
      if (url.hostname.includes('ad') || url.pathname.includes('ad') || url.search.includes('ad')) return;
    } catch {
      return;
    }

    if (!seenHrefs.has(href)) {
      seenHrefs.add(href);
      validLinks.push({
        href: href,
        text: text,
        title: (link as HTMLAnchorElement).getAttribute('title') || undefined,
        rel: (link as HTMLAnchorElement).getAttribute('rel') || undefined
      });
    }
  });

  return validLinks;
}

function extractVideos(element: HTMLElement): any[] {
  var videos: any[] = [];
  var videoElements = element.querySelectorAll('video, [data-video]');

  videoElements.forEach(function(vid) {
    vid = vid as HTMLVideoElement;
    var src = vid.getAttribute('src') || vid.querySelector('source')?.getAttribute('src') || '';
    if (!src) return;

    videos.push({
      src: src,
      type: vid.getAttribute('type') || vid.querySelector('source')?.getAttribute('type') || '',
      poster: vid.getAttribute('poster') || undefined,
      duration: vid instanceof HTMLVideoElement ? vid.duration : undefined
    });
  });

  return videos;
}

function extractTables(element: HTMLElement): any[] {
  var tables: any[] = [];
  var tableElements = element.querySelectorAll('table');

  tableElements.forEach(function(table) {
    table = table as HTMLTableElement;
    var headers = Array.from(table.querySelectorAll('th')).map(function(th) { return ((th as HTMLElement).innerText || '').trim(); });
    var rows = Array.from(table.querySelectorAll('tr')).map(function(row) {
      return Array.from(row.querySelectorAll('td')).map(function(td) { return ((td as HTMLElement).innerText || '').trim(); });
    }).filter(function(row) { return row.length > 0; });
    var caption = table.querySelector('caption')?.innerText.trim();

    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        headers: headers,
        rows: rows,
        caption: caption
      });
    }
  });

  return tables;
}

function extractContent(doc?: Document): any {
  doc = doc || document;
  console.log('[PageExtractor] extractContent called.');
  try {
    if (!doc.body.innerText.trim()) {
      console.warn('[PageExtractor] No content found in body.');
      return {
        title: doc.title.trim() || 'Untitled',
        content: '',
        text: doc.body.innerText.trim() || '',
        segments: [],
        images: [],
        videos: [],
        tables: [],
        links: [],
        url: doc.location.href,
        extractedAt: new Date().toISOString(),
        wordCount: 0,
        readingTime: 0
      };
    }

    var candidates = doc.querySelectorAll('article, main, section, div, [role="main"], [itemprop="articleBody"]');
    var bestCandidate: HTMLElement | null = null;
    var highestScore = -Infinity;

    Array.from(candidates).forEach(function(candidate) {
      if (!(candidate instanceof HTMLElement)) return;
      var score = scoreElement(candidate, doc);
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = candidate;
      }
    });

    if (!bestCandidate || highestScore < 50) {
      console.warn('No suitable container found, trying fallbacks.');
      var fallbacks = [doc.body, doc.querySelector('[class*="content"]'), doc.querySelector('[id*="content"]')];
      for (var i = 0; i < fallbacks.length; i++) {
        var fallback = fallbacks[i];
        if (fallback && scoreElement(fallback as HTMLElement, doc) > highestScore) {
          bestCandidate = fallback as HTMLElement;
          highestScore = scoreElement(fallback as HTMLElement, doc);
        }
      }
    }

    if (!bestCandidate) {
      console.warn('No valid content container found, using body fallback.');
      var bodyText = doc.body.innerText.trim() || '';
      return {
        title: doc.title.trim() || 'Untitled',
        content: '',
        text: bodyText,
        segments: [{ type: 'paragraph', text: bodyText }],
        images: [],
        videos: [],
        tables: [],
        links: [],
        url: doc.location.href,
        extractedAt: new Date().toISOString(),
        wordCount: bodyText.split(/\s+/).length,
        readingTime: Math.ceil(bodyText.split(/\s+/).length / 200)
      };
    }

    console.log(`[PageExtractor] Found best candidate: ${bestCandidate.tagName}#${bestCandidate.id}.${bestCandidate.className} with score: ${highestScore}`);

    var cleanedContent = cleanContent(bestCandidate as HTMLElement);
    var metadata = extractMetadata(doc);
    var segments = extractSegments(cleanedContent as HTMLElement);
    var text = cleanedContent.innerText.trim() || '';
    var wordCount = text.split(/\s+/).length;
    var readingTime = Math.ceil(wordCount / 200);

    console.log(`[PageExtractor] Extracted text length after cleaning: ${text.length}`);

    if (text.length < 50) {
      console.warn('[PageExtractor] Extracted text too short, using body fallback.');
      const fallbackBodyText = doc.body.innerText.trim() || '';
      return {
        title: doc.title.trim() || 'Untitled',
        content: '',
        text: fallbackBodyText,
        segments: [{ type: 'paragraph', text: fallbackBodyText }],
        images: [],
        videos: [],
        tables: [],
        links: [],
        url: doc.location.href,
        extractedAt: new Date().toISOString(),
        wordCount: fallbackBodyText.split(/\s+/).length,
        readingTime: Math.ceil(fallbackBodyText.split(/\s+/).length / 200),
        author: metadata.author,
        publishDate: metadata.publishDate,
        metaDescription: metadata.metaDescription,
        language: metadata.language,
        keywords: metadata.keywords,
        categories: metadata.categories
      };
    }

    return {
      title: doc.title.trim() || doc.querySelector('h1')?.innerText.trim() || 'Untitled',
      content: cleanedContent.innerHTML,
      text: text,
      segments: segments,
      images: Array.from(cleanedContent.querySelectorAll('img')).map(function(img) {
        img = img as HTMLImageElement;
        return {
          src: img.src,
          alt: (img.alt || '').trim(),
          width: img.width || undefined,
          height: img.height || undefined,
          caption: img.closest('figure')?.querySelector('figcaption')?.innerText.trim()
        };
      }),
      videos: extractVideos(cleanedContent as HTMLElement),
      tables: extractTables(cleanedContent as HTMLElement),
      links: filterLinks(Array.from(cleanedContent.querySelectorAll('a[href]')) as HTMLElement[]),
      url: doc.location.href,
      extractedAt: new Date().toISOString(),
      wordCount: wordCount,
      readingTime: readingTime,
      author: metadata.author,
      publishDate: metadata.publishDate,
      metaDescription: metadata.metaDescription,
      language: metadata.language,
      keywords: metadata.keywords,
      categories: metadata.categories
    };
  } catch (error) {
    console.error('Content extraction failed:', error);
    const fallbackBodyText = doc.body.innerText.trim() || '';
    return {
      title: doc.title.trim() || 'Untitled',
      content: '',
      text: fallbackBodyText,
      segments: [{ type: 'paragraph', text: fallbackBodyText }],
      images: [],
      videos: [],
      tables: [],
      links: [],
      url: doc.location.href,
      extractedAt: new Date().toISOString(),
      wordCount: fallbackBodyText.split(/\s+/).length,
      readingTime: Math.ceil(fallbackBodyText.split(/\s+/).length / 200)
    };
  }
}

const scraper = {
  extract: extractContent,
  version: '2.2.0'
};

// Expose the scraper object globally for access from executeScript context
if (typeof window !== 'undefined') {
  window.TabAgentPageExtractor = scraper;
}

export default scraper;