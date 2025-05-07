function getTextDensity(element, doc) {
  var text = (element.innerText || "").trim();
  var rect = element.getBoundingClientRect();
  var area = rect.width * rect.height;
  return area > 0 ? text.length / area : 0;
}
function isBoilerplate(element) {
  var boilerplateTags = ["header", "footer", "nav", "aside", "script", "style", "iframe", "noscript", "form", "svg", "banner"];
  var boilerplateClasses = [
    "ad",
    "advert",
    "banner",
    "sidebar",
    "menu",
    "nav",
    "footer",
    "widget",
    "social",
    "share",
    "comment",
    "related",
    "newsletter",
    "popup",
    "cookie",
    "modal",
    "promo",
    "sponsored",
    "trending",
    "login",
    "signup"
  ];
  var tagName = element.tagName.toLowerCase();
  var className = (element.className || "").toString().toLowerCase();
  var id = (element.id || "").toLowerCase();
  var role = (element.getAttribute("role") || "").toLowerCase();
  return boilerplateTags.includes(tagName) || boilerplateClasses.some(function(cls) {
    return className.includes(cls) || id.includes(cls);
  }) || element.querySelector('[class*="ad"], [id*="ad"], [class*="social"], [class*="share"], [class*="sponsor"]') || role === "navigation" || role === "complementary" || role === "banner" || element.hasAttribute("aria-hidden") || getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden" || getComputedStyle(element).opacity === "0";
}
function scoreElement(element, doc) {
  var score = 0;
  var tagName = element.tagName.toLowerCase();
  var tagScores = {
    article: 30,
    main: 25,
    section: 20,
    div: 8,
    p: 15,
    figure: 12
  };
  score += tagScores[tagName] || 0;
  score += getTextDensity(element) * 200;
  var paragraphs = element.querySelectorAll("p, li, blockquote").length;
  score += paragraphs * 15;
  score += Math.min((element.innerText || "").length, 15e3) / 30;
  if (isBoilerplate(element)) {
    score -= 200;
  }
  var className = (element.className || "").toString().toLowerCase();
  var id = (element.id || "").toLowerCase();
  var contentKeywords = ["content", "article", "main", "story", "body", "post", "entry", "page"];
  if (contentKeywords.some(function(keyword) {
    return className.includes(keyword) || id.includes(keyword);
  })) {
    score += 50;
  }
  if (((element.innerText || "").trim().length || 0) < 50) {
    score -= 40;
  }
  if (element.querySelector('[itemprop="articleBody"], [itemtype*="Article"], [itemtype*="NewsArticle"]')) {
    score += 80;
  }
  var links = element.querySelectorAll("a").length;
  var textLength = (element.innerText || "").length || 1;
  if (links / textLength > 0.15) {
    score -= 30;
  }
  var richContent = element.querySelectorAll("img, video, table, blockquote, pre").length;
  score += richContent * 20;
  return score;
}
function cleanContent(element) {
  var cloned = element.cloneNode(true);
  var selectorsToRemove = [
    "header",
    "footer",
    "nav",
    "aside",
    '[class*="ad"]',
    '[id*="ad"]',
    '[class*="social"]',
    '[class*="share"]',
    '[class*="comment"]',
    '[class*="related"]',
    '[class*="sponsor"]',
    '[class*="promo"]',
    "script",
    "style",
    "iframe",
    "noscript",
    '[aria-hidden="true"]',
    '[style*="display: none"]',
    "svg",
    "canvas",
    '[role="presentation"]',
    '[role="banner"]',
    '[role="complementary"]'
  ].join(",");
  cloned.querySelectorAll(selectorsToRemove).forEach(function(el) {
    el.remove();
  });
  cloned.querySelectorAll("*").forEach(function(el) {
    el.removeAttribute("style");
    Array.from(el.attributes).forEach(function(attr) {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  cloned.querySelectorAll("div, section, p, span, figure").forEach(function(el) {
    if (!el.innerText.trim() && !el.querySelector("img, video, a, table")) {
      el.remove();
    }
  });
  cloned.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, button").forEach(function(el) {
    el.textContent = (el.innerText || "").replace(/\s+/g, " ").trim();
  });
  cloned.querySelectorAll("img, video, a").forEach(function(el) {
    var keepAttrs = ["src", "alt", "href", "title", "poster", "type", "aria-label"];
    Array.from(el.attributes).forEach(function(attr) {
      if (!keepAttrs.includes(attr.name)) el.removeAttribute(attr.name);
    });
  });
  return cloned;
}
function getParentContext(element) {
  var parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (parent.tagName === "A" && parent.href) {
      return {
        type: "link",
        href: parent.href,
        text: (parent.innerText || "").trim()
      };
    }
    if (parent.tagName === "BUTTON") {
      return {
        type: "button",
        text: (parent.innerText || parent.getAttribute("aria-label") || "").trim(),
        ariaLabel: parent.getAttribute("aria-label") || void 0
      };
    }
    parent = parent.parentElement;
  }
  return null;
}
function extractSegments(element) {
  var segments = [];
  var elements = element.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, li, figure, video, table, blockquote, pre, button, div");
  elements.forEach(function(el) {
    var _a, _b, _c, _d, _e, _f, _g;
    var text = (el.innerText || "").trim();
    if (!text && !el.querySelector("img, video, table") && !["BUTTON", "FIGURE", "VIDEO", "TABLE"].includes(el.tagName)) return;
    var context = getParentContext(el);
    if (["H1", "H2", "H3", "H4", "H5", "H6"].includes(el.tagName)) {
      segments.push({
        type: "heading",
        level: parseInt(el.tagName[1]),
        text,
        context
      });
    } else if (el.tagName === "P") {
      segments.push({
        type: "paragraph",
        text,
        context
      });
    } else if (["UL", "OL"].includes(el.tagName)) {
      var items = Array.from(el.querySelectorAll("li")).map(function(li) {
        return (li.innerText || "").trim();
      }).filter(Boolean);
      segments.push({
        type: "list",
        text: items.join(" | "),
        context
      });
    } else if (el.tagName === "LI") {
      segments.push({
        type: "listitem",
        text,
        context
      });
    } else if (el.tagName === "FIGURE") {
      var img = el.querySelector("img");
      if (img) {
        if (segments.length > 0 && segments[segments.length - 1].type === "image" && ((_a = segments[segments.length - 1].data) == null ? void 0 : _a.src) === img.src) ;
        else {
          segments.push({
            type: "image",
            text: (_b = el.querySelector("figcaption")) == null ? void 0 : _b.innerText.trim(),
            data: {
              src: img.src,
              alt: (img.alt || "").trim(),
              width: img.width || void 0,
              height: img.height || void 0,
              caption: (_c = el.querySelector("figcaption")) == null ? void 0 : _c.innerText.trim()
            },
            context
          });
        }
      }
    } else if (el.tagName === "VIDEO") {
      segments.push({
        type: "video",
        data: {
          src: el.src || ((_d = el.querySelector("source")) == null ? void 0 : _d.src) || "",
          type: el.type || ((_e = el.querySelector("source")) == null ? void 0 : _e.type) || "",
          poster: el.poster || void 0,
          duration: el.duration || void 0
        },
        context
      });
    } else if (el.tagName === "TABLE") {
      var headers = Array.from(el.querySelectorAll("th")).map(function(th) {
        return (th.innerText || "").trim();
      });
      var rows = Array.from(el.querySelectorAll("tr")).map(function(row) {
        return Array.from(row.querySelectorAll("td")).map(function(td) {
          return (td.innerText || "").trim();
        });
      }).filter(function(row) {
        return row.length > 0;
      });
      segments.push({
        type: "table",
        text: (_f = el.querySelector("caption")) == null ? void 0 : _f.innerText.trim(),
        data: {
          headers,
          rows,
          caption: (_g = el.querySelector("caption")) == null ? void 0 : _g.innerText.trim()
        },
        context
      });
    } else if (el.tagName === "BLOCKQUOTE") {
      segments.push({
        type: "quote",
        text,
        context
      });
    } else if (el.tagName === "PRE") {
      segments.push({
        type: "code",
        text,
        context
      });
    } else if (el.tagName === "BUTTON") {
      segments.push({
        type: "button",
        text,
        data: {
          text,
          ariaLabel: el.getAttribute("aria-label") || void 0
        },
        context
      });
    } else if (el.tagName === "DIV") {
      if (el.children.length === 0 && text.length > 0 && text.length < 50) {
        if (text.match(/^[\d.,%]+$/) || text.toLowerCase().includes("saving") || text.toLowerCase().includes("compute") || text.toLowerCase().includes("parameter")) {
          segments.push({
            type: "text_block",
            text,
            context
          });
        }
      } else if (el.querySelector("img") && !el.querySelector("figure")) {
        var divImg = el.querySelector("img");
        var alreadyAdded = segments.some((seg) => {
          var _a2;
          return seg.type === "image" && ((_a2 = seg.data) == null ? void 0 : _a2.src) === divImg.src;
        });
        if (!alreadyAdded) {
          segments.push({
            type: "image",
            text: null,
            data: {
              src: divImg.src,
              alt: (divImg.alt || "").trim(),
              width: divImg.width || void 0,
              height: divImg.height || void 0,
              caption: null
            },
            context
          });
        }
      }
    }
  });
  return segments;
}
function extractMetadata(doc) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  doc = doc || document;
  var author = ((_a = doc.querySelector('meta[name="author"]')) == null ? void 0 : _a.getAttribute("content")) || ((_b = doc.querySelector('[itemprop="author"]')) == null ? void 0 : _b.innerText.trim()) || ((_c = doc.querySelector('[rel="author"]')) == null ? void 0 : _c.innerText.trim()) || ((_d = doc.querySelector(".author-name, .byline")) == null ? void 0 : _d.innerText.trim());
  var publishDate = ((_e = doc.querySelector('meta[name="publish-date"]')) == null ? void 0 : _e.getAttribute("content")) || ((_f = doc.querySelector('[itemprop="datePublished"]')) == null ? void 0 : _f.getAttribute("content")) || ((_g = doc.querySelector("time[datetime]")) == null ? void 0 : _g.getAttribute("datetime")) || ((_h = doc.querySelector(".date, .published")) == null ? void 0 : _h.innerText.trim());
  var metaDescription = ((_i = doc.querySelector('meta[name="description"]')) == null ? void 0 : _i.getAttribute("content")) || ((_j = doc.querySelector('meta[property="og:description"]')) == null ? void 0 : _j.getAttribute("content"));
  var language = doc.documentElement.lang || navigator.language || void 0;
  var keywords = ((_l = (_k = doc.querySelector('meta[name="keywords"]')) == null ? void 0 : _k.getAttribute("content")) == null ? void 0 : _l.split(",").map(function(k) {
    return k.trim();
  })) || Array.from(doc.querySelectorAll('[itemprop="keywords"], .tag, .category')).map(function(el) {
    return el.innerText.trim();
  }).filter(Boolean);
  var categories = Array.from(doc.querySelectorAll('[itemprop="genre"], .category, .section')).map(function(el) {
    return el.innerText.trim();
  }).filter(Boolean);
  return {
    author,
    publishDate,
    metaDescription,
    language,
    keywords: keywords.length > 0 ? keywords : void 0,
    categories: categories.length > 0 ? categories : void 0
  };
}
function filterLinks(links) {
  var validLinks = [];
  var seenHrefs = /* @__PURE__ */ new Set();
  links.forEach(function(link) {
    var href = link.href;
    var text = (link.innerText || "").trim();
    if (!href || !text || href.startsWith("javascript:") || href === "#" || href.startsWith("mailto:")) return;
    var restrictedDomains = [
      "twitter.com",
      "facebook.com",
      "linkedin.com",
      "instagram.com",
      "pinterest.com",
      "youtube.com",
      "tiktok.com",
      "snapchat.com"
    ];
    try {
      var url = new URL(href);
      if (restrictedDomains.some(function(domain) {
        return url.hostname.includes(domain);
      })) return;
      if (url.hostname.includes("ad") || url.pathname.includes("ad") || url.search.includes("ad")) return;
    } catch {
      return;
    }
    if (!seenHrefs.has(href)) {
      seenHrefs.add(href);
      validLinks.push({
        href,
        text,
        title: link.getAttribute("title") || void 0,
        rel: link.getAttribute("rel") || void 0
      });
    }
  });
  return validLinks;
}
function extractVideos(element) {
  var videos = [];
  var videoElements = element.querySelectorAll("video, [data-video]");
  videoElements.forEach(function(vid) {
    var _a, _b;
    var src = vid.getAttribute("src") || ((_a = vid.querySelector("source")) == null ? void 0 : _a.getAttribute("src")) || "";
    if (!src) return;
    videos.push({
      src,
      type: vid.getAttribute("type") || ((_b = vid.querySelector("source")) == null ? void 0 : _b.getAttribute("type")) || "",
      poster: vid.getAttribute("poster") || void 0,
      duration: vid instanceof HTMLVideoElement ? vid.duration : void 0
    });
  });
  return videos;
}
function extractTables(element) {
  var tables = [];
  var tableElements = element.querySelectorAll("table");
  tableElements.forEach(function(table) {
    var _a;
    var headers = Array.from(table.querySelectorAll("th")).map(function(th) {
      return (th.innerText || "").trim();
    });
    var rows = Array.from(table.querySelectorAll("tr")).map(function(row) {
      return Array.from(row.querySelectorAll("td")).map(function(td) {
        return (td.innerText || "").trim();
      });
    }).filter(function(row) {
      return row.length > 0;
    });
    var caption = (_a = table.querySelector("caption")) == null ? void 0 : _a.innerText.trim();
    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        headers,
        rows,
        caption
      });
    }
  });
  return tables;
}
function extractContent(doc) {
  var _a;
  doc = doc || document;
  console.log("[PageExtractor] extractContent called.");
  try {
    if (!doc.body.innerText.trim()) {
      console.warn("[PageExtractor] No content found in body.");
      return {
        title: doc.title.trim() || "Untitled",
        content: "",
        text: doc.body.innerText.trim() || "",
        segments: [],
        images: [],
        videos: [],
        tables: [],
        links: [],
        url: doc.location.href,
        extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
        wordCount: 0,
        readingTime: 0
      };
    }
    var candidates = doc.querySelectorAll('article, main, section, div, [role="main"], [itemprop="articleBody"]');
    var bestCandidate = null;
    var highestScore = -Infinity;
    Array.from(candidates).forEach(function(candidate) {
      var score = scoreElement(candidate, doc);
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = candidate;
      }
    });
    if (!bestCandidate || highestScore < 50) {
      console.warn("No suitable container found, trying fallbacks.");
      var fallbacks = [doc.body, doc.querySelector('[class*="content"]'), doc.querySelector('[id*="content"]')];
      for (var i = 0; i < fallbacks.length; i++) {
        var fallback = fallbacks[i];
        if (fallback && scoreElement(fallback, doc) > highestScore) {
          bestCandidate = fallback;
          highestScore = scoreElement(fallback, doc);
        }
      }
    }
    if (!bestCandidate) {
      console.warn("No valid content container found, using body fallback.");
      var bodyText = doc.body.innerText.trim() || "";
      return {
        title: doc.title.trim() || "Untitled",
        content: "",
        text: bodyText,
        segments: [{ type: "paragraph", text: bodyText }],
        images: [],
        videos: [],
        tables: [],
        links: [],
        url: doc.location.href,
        extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
        wordCount: bodyText.split(/\s+/).length,
        readingTime: Math.ceil(bodyText.split(/\s+/).length / 200)
      };
    }
    console.log(`[PageExtractor] Found best candidate: ${bestCandidate.tagName}#${bestCandidate.id}.${bestCandidate.className} with score: ${highestScore}`);
    var cleanedContent = cleanContent(bestCandidate);
    var metadata = extractMetadata(doc);
    var segments = extractSegments(cleanedContent);
    var text = cleanedContent.innerText.trim() || "";
    var wordCount = text.split(/\s+/).length;
    var readingTime = Math.ceil(wordCount / 200);
    console.log(`[PageExtractor] Extracted text length after cleaning: ${text.length}`);
    if (text.length < 50) {
      console.warn("[PageExtractor] Extracted text too short, using body fallback.");
      var bodyText = doc.body.innerText.trim() || "";
      return {
        title: doc.title.trim() || "Untitled",
        content: "",
        text: bodyText,
        segments: [{ type: "paragraph", text: bodyText }],
        images: [],
        videos: [],
        tables: [],
        links: [],
        url: doc.location.href,
        extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
        wordCount: bodyText.split(/\s+/).length,
        readingTime: Math.ceil(bodyText.split(/\s+/).length / 200),
        author: metadata.author,
        publishDate: metadata.publishDate,
        metaDescription: metadata.metaDescription,
        language: metadata.language,
        keywords: metadata.keywords,
        categories: metadata.categories
      };
    }
    return {
      title: doc.title.trim() || ((_a = doc.querySelector("h1")) == null ? void 0 : _a.innerText.trim()) || "Untitled",
      content: cleanedContent.innerHTML,
      text,
      segments,
      images: Array.from(cleanedContent.querySelectorAll("img")).map(function(img) {
        var _a2, _b;
        return {
          src: img.src,
          alt: (img.alt || "").trim(),
          width: img.width || void 0,
          height: img.height || void 0,
          caption: (_b = (_a2 = img.closest("figure")) == null ? void 0 : _a2.querySelector("figcaption")) == null ? void 0 : _b.innerText.trim()
        };
      }),
      videos: extractVideos(cleanedContent),
      tables: extractTables(cleanedContent),
      links: filterLinks(Array.from(cleanedContent.querySelectorAll("a[href]"))),
      url: doc.location.href,
      extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
      wordCount,
      readingTime,
      author: metadata.author,
      publishDate: metadata.publishDate,
      metaDescription: metadata.metaDescription,
      language: metadata.language,
      keywords: metadata.keywords,
      categories: metadata.categories
    };
  } catch (error) {
    console.error("Content extraction failed:", error);
    var bodyText = doc.body.innerText.trim() || "";
    return {
      title: doc.title.trim() || "Untitled",
      content: "",
      text: bodyText,
      segments: [{ type: "paragraph", text: bodyText }],
      images: [],
      videos: [],
      tables: [],
      links: [],
      url: doc.location.href,
      extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
      wordCount: bodyText.split(/\s+/).length,
      readingTime: Math.ceil(bodyText.split(/\s+/).length / 200)
    };
  }
}
const scraper = {
  extract: extractContent,
  version: "2.2.0"
};
if (typeof window !== "undefined") {
  window.TabAgentPageExtractor = scraper;
}
//# sourceMappingURL=pageExtractor.js.map
