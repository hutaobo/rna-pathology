/* assets/site.js
   Shared behavior for RNA-Pathology.com:
   - Inject a consistent header/nav + footer across pages
   - Avoid duplicate header/footer if page already contains them
   - Highlight current nav item
   - Mobile nav toggle
*/

(function () {
  "use strict";

  // Optional override for subpath hosting:
  // <html data-base-path="/subpath">
  const basePath =
    document.documentElement.getAttribute("data-base-path") || "/";

  const NAV_ITEMS = [
    { href: "/", label: "Home" },
    { href: "/database.html", label: "Database" },
    { href: "/datasets/", label: "Datasets" },   // folder route (optional landing)
    { href: "/challenge.html", label: "Challenge" },
    { href: "/docs/", label: "Docs" },
    { href: "/access/", label: "Account" },
  ];

  // ---------- small helpers ----------
  function joinUrl(base, path) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : "/" + path;
    return (b || "") + p;
  }

  function normalizePath(pathname) {
    if (!pathname) return "/";
    // Treat /index.html as /
    if (pathname.endsWith("/index.html")) return pathname.slice(0, -10) || "/";
    return pathname;
  }

  function isActive(currentPath, itemHref) {
    const cur = normalizePath(currentPath);

    // Exact match for file pages
    if (itemHref.endsWith(".html")) return cur === itemHref;

    // Folder-like routes: /docs/, /access/, /datasets/
    if (itemHref.endsWith("/")) return cur === itemHref || cur.startsWith(itemHref);

    // Root
    if (itemHref === "/") return cur === "/";

    return false;
  }

  function elExists(selector) {
    // Checking existence before manipulating avoids runtime errors. :contentReference[oaicite:1]{index=1}
    return !!document.querySelector(selector);
  }

  function ensureMount(id, position /* "top" | "bottom" */) {
    let el = document.getElementById(id);
    if (el) return el;

    el = document.createElement("div");
    el.id = id;

    if (position === "top") {
      document.body.insertBefore(el, document.body.firstChild);
    } else {
      document.body.appendChild(el);
    }
    return el;
  }

  // ---------- UI builders ----------
  function buildHeader() {
    const linksHtml = NAV_ITEMS.map((it) => {
      const url = joinUrl(basePath, it.href);
      return `<a class="nav-link" data-href="${it.href}" href="${url}">${it.label}</a>`;
    }).join("");

    return `
<header class="site-header" role="banner">
  <div class="container">
    <nav class="site-nav" aria-label="Main navigation">
      <a class="brand" href="${joinUrl(basePath, "/")}">
        <span class="logo" aria-hidden="true"></span>
        <span>RNA-Pathology.com</span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="navLinks">
        ☰ Menu
      </button>

      <div id="navLinks" class="nav-links">
        ${linksHtml}
      </div>
    </nav>
  </div>
</header>
`;
  }

  function buildFooter() {
    const year = new Date().getFullYear();

    // NOTE: these two links assume you *may* later create docs/roadmap.html and docs/schema.html.
    // If those pages don't exist yet, either create them, or remove these two footer links.
    return `
<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer-row">
      <div class="muted">© <span id="siteYear">${year}</span> RNA-Pathology.com</div>
      <div class="footer-links">
        <a href="${joinUrl(basePath, "/docs/")}">Docs</a>
        <a href="${joinUrl(basePath, "/docs/roadmap.html")}">Roadmap</a>
        <a href="${joinUrl(basePath, "/docs/schema.html")}">Schema</a>
        <a href="${joinUrl(basePath, "/")}">Home</a>
      </div>
    </div>
  </div>
</footer>
`;
  }

  // ---------- behaviors ----------
  function highlightActiveNav() {
    const current = normalizePath(window.location.pathname);
    const navLinks = document.querySelectorAll(".nav-links a[data-href]");

    navLinks.forEach((a) => {
      const rawHref = a.getAttribute("data-href") || "";
      if (isActive(current, rawHref)) a.classList.add("active");
    });
  }

  function wireMobileToggle() {
    const btn = document.querySelector(".nav-toggle");
    const links = document.getElementById("navLinks");
    if (!btn || !links) return;

    btn.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // ---------- main init ----------
  function init() {
    // If the page already has a header/footer (hand-written), do NOT inject again.
    const hasHeader = elExists("header.site-header");
    const hasFooter = elExists("footer.site-footer");

    if (!hasHeader) {
      const headerMount = ensureMount("siteHeaderMount", "top");
      // Only inject if mount is empty (another safety belt)
      if (!headerMount.innerHTML.trim()) headerMount.innerHTML = buildHeader();
    }

    if (!hasFooter) {
      const footerMount = ensureMount("siteFooterMount", "bottom");
      if (!footerMount.innerHTML.trim()) footerMount.innerHTML = buildFooter();
    }

    // These should work whether injected or hand-written (as long as classes/ids match).
    highlightActiveNav();
    wireMobileToggle();
  }

  // DOMContentLoaded fires after HTML parsed; defer scripts execute before it. :contentReference[oaicite:2]{index=2}
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
