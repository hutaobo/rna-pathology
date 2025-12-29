/* assets/site.js
   Shared behavior for RNA-Pathology.com:
   - Inject a consistent header/nav + footer across pages
   - Highlight current nav item
   - Mobile nav toggle
*/

(function () {
  "use strict";

  // Build-time or manual override (optional):
  // <html data-base-path="/"> (default)
  // If you ever host under a subpath, set data-base-path="/subpath"
  const basePath =
    document.documentElement.getAttribute("data-base-path") || "/";

  const NAV_ITEMS = [
    { href: "/", label: "Home" },
    { href: "/database.html", label: "Database" },
    { href: "/datasets/", label: "Datasets" },  // folder landing if you create one later
    { href: "/challenge.html", label: "Challenge" },
    { href: "/docs/", label: "Docs" },
    { href: "/access/", label: "Account" },
  ];

  function joinUrl(base, path) {
    // Ensure base ends with / and path begins with /
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : "/" + path;
    return (b || "") + p;
  }

  function normalizePath(pathname) {
    // Treat /index.html as /
    if (pathname.endsWith("/index.html")) return pathname.slice(0, -10) || "/";
    return pathname || "/";
  }

  function isActive(current, itemHref) {
    const cur = normalizePath(current);

    // Exact match for file pages
    if (itemHref.endsWith(".html")) {
      return cur === itemHref;
    }

    // Folder-like routes: /docs/, /access/, /datasets/
    if (itemHref.endsWith("/")) {
      return cur === itemHref || cur.startsWith(itemHref);
    }

    // Root
    if (itemHref === "/") return cur === "/";
    return false;
  }

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

  function init() {
    // Inject header/footer
    const headerMount = ensureMount("siteHeaderMount", "top");
    headerMount.innerHTML = buildHeader();

    const footerMount = ensureMount("siteFooterMount", "bottom");
    footerMount.innerHTML = buildFooter();

    highlightActiveNav();
    wireMobileToggle();
  }

  // DOMContentLoaded is the right event for DOM manipulation without waiting on images, etc. :contentReference[oaicite:2]{index=2}
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
