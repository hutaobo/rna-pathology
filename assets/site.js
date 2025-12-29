/* assets/site.js
   Shared behavior for RNA-Pathology.com:
   - Inject a consistent header/nav + footer across pages (when not already present)
   - Highlight current nav item
   - Mobile nav toggle
   - Auth-aware nav (Supabase): show email when signed in, hide Sign In/Up, provide Sign Out
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
    // { href: "/datasets/", label: "Datasets" }, // removed (no longer used)
    { href: "/challenge.html", label: "Challenge" },
    { href: "/docs/", label: "Docs" },
    { href: "/access/", label: "Account" },
  ];

  // ---- Supabase Auth (shared) ----
  // Keep these in ONE place so every page stays consistent.
  const SUPABASE_URL = "https://xxlkxorwprtynemmbeya.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_ZzCo8J6b6y0xVkExiOtHyg_gOpGEJFv";

  const LOGIN_PATH = "/login.html";
  const SIGNUP_PATH = "/login.html?signup=1";

  const SUPABASE_JS_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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

    // Folder-like routes: /docs/, /access/
    if (itemHref.endsWith("/")) return cur === itemHref || cur.startsWith(itemHref);

    // Root
    if (itemHref === "/") return cur === "/";

    return false;
  }

  function elExists(selector) {
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

  function ensureStyle(id, cssText) {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  // ---------- UI builders ----------
  function buildHeader() {
    const linksHtml = NAV_ITEMS.map((it) => {
      const url = joinUrl(basePath, it.href);
      return `<a class="nav-link" data-href="${it.href}" href="${url}">${it.label}</a>`;
    }).join("");

    // Auth URLs (respect basePath)
    const signInUrl = joinUrl(basePath, LOGIN_PATH);
    const signUpUrl = joinUrl(basePath, SIGNUP_PATH);

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

      <!-- Auth cluster (shared across pages) -->
      <div class="nav-auth" aria-label="Account actions">
        <a id="navSignUp" class="nav-auth-btn" href="${signUpUrl}">Sign Up</a>
        <a id="navSignIn" class="nav-auth-btn" href="${signInUrl}">Sign In</a>

        <button id="navSignOutBtn" class="nav-auth-btn nav-auth-danger" type="button" style="display:none;">
          Sign Out
        </button>

        <div id="navAuthed" class="nav-auth-pill" style="display:none;">
          <span class="nav-auth-email" id="navEmail">Signed in</span>
        </div>
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
        <a href="${joinUrl(basePath, "/legal/")}">Legal</a>
        <a href="${joinUrl(basePath, "/legal/privacy.html")}">Privacy</a>
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

  // ---------- Auth-aware nav ----------
  let _supabaseClientPromise = null;
  let _authSub = null;

  async function getSupabaseClient() {
    if (_supabaseClientPromise) return _supabaseClientPromise;

    _supabaseClientPromise = (async () => {
      const mod = await import(SUPABASE_JS_CDN);
      const createClient = mod.createClient;
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    })();

    return _supabaseClientPromise;
  }

  function findAuthEls() {
    // Works for injected header or a hand-built page that reuses the same ids.
    const navSignUp = document.getElementById("navSignUp");
    const navSignIn = document.getElementById("navSignIn");
    const navSignOutBtn = document.getElementById("navSignOutBtn");
    const navAuthed = document.getElementById("navAuthed");
    const navEmail = document.getElementById("navEmail");

    return { navSignUp, navSignIn, navSignOutBtn, navAuthed, navEmail };
  }

  function setAuthUiSignedOut(els) {
    if (!els.navSignUp || !els.navSignIn || !els.navSignOutBtn || !els.navAuthed) return;

    els.navAuthed.style.display = "none";
    els.navSignOutBtn.style.display = "none";

    els.navSignUp.style.display = "inline-flex";
    els.navSignIn.style.display = "inline-flex";
  }

  function setAuthUiSignedIn(els, emailText) {
    if (!els.navSignUp || !els.navSignIn || !els.navSignOutBtn || !els.navAuthed || !els.navEmail) return;

    els.navAuthed.style.display = "inline-flex";
    els.navEmail.textContent = emailText || "Signed in";
    els.navSignOutBtn.style.display = "inline-flex";

    els.navSignUp.style.display = "none";
    els.navSignIn.style.display = "none";
  }

  async function refreshAuthNav() {
    const els = findAuthEls();
    if (!els.navSignIn && !els.navSignUp && !els.navSignOutBtn && !els.navAuthed) return;

    try {
      const supabase = await getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session && session.user) {
        setAuthUiSignedIn(els, session.user.email || "Signed in");
      } else {
        setAuthUiSignedOut(els);
      }
    } catch (_) {
      // Fail open: keep public actions visible
      setAuthUiSignedOut(els);
    }
  }

  async function wireAuthNav() {
    const els = findAuthEls();
    // If page doesn't have the auth cluster, do nothing.
    if (!els.navSignOutBtn && !els.navAuthed && !els.navSignIn && !els.navSignUp) return;

    // Auth styles (only once)
    ensureStyle("siteAuthNavStyles", `
      .nav-auth{ display:flex; align-items:center; gap:10px; margin-left: 12px; flex-wrap:wrap; justify-content:flex-end; }
      .nav-auth-btn{
        display:inline-flex; align-items:center; justify-content:center;
        padding: 8px 10px; border-radius: 10px;
        text-decoration:none; font-weight:700; letter-spacing:0.2px;
        border: 1px solid rgba(17,24,39,0.12);
        background: rgba(255,255,255,0.9);
        color: #0b3c5d;
        cursor:pointer;
        user-select:none;
      }
      .nav-auth-btn:hover{ filter: brightness(0.98); }
      .nav-auth-danger{
        border-color: rgba(185,28,28,0.22);
        background: rgba(185,28,28,0.08);
        color: #7f1d1d;
      }
      .nav-auth-pill{
        display:none;
        align-items:center;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(17,24,39,0.12);
        background: rgba(255,255,255,0.85);
        max-width: 320px;
      }
      .nav-auth-email{
        font-weight:800;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        max-width: 260px;
      }
    `);

    try {
      const supabase = await getSupabaseClient();

      // Avoid double subscriptions
      if (!_authSub) {
        const { data } = supabase.auth.onAuthStateChange(() => {
          refreshAuthNav();
        });
        _authSub = data?.subscription || null;
      }

      // Sign out button
      if (els.navSignOutBtn && !els.navSignOutBtn.dataset.wired) {
        els.navSignOutBtn.dataset.wired = "1";
        els.navSignOutBtn.addEventListener("click", async () => {
          els.navSignOutBtn.disabled = true;
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
          } catch (_) {
            // Even if signOut fails, we still refresh UI and redirect.
          } finally {
            els.navSignOutBtn.disabled = false;
          }

          window.location.href = joinUrl(basePath, "/?signed_out=1");
        });
      }

      await refreshAuthNav();
    } catch (_) {
      setAuthUiSignedOut(els);
    }
  }

  // ---------- main init ----------
  function init() {
    // IMPORTANT: avoid injecting a second header/footer if the page already has its own nav UI.
    // We treat the presence of the auth ids as "custom header exists" to prevent duplicate IDs.
    const hasCustomAuthNav =
      elExists("#navSignIn") ||
      elExists("#navSignUp") ||
      elExists("#navAuthed") ||
      elExists("#navSignOutBtn");

    // If the page already has a header/footer (hand-written), do NOT inject again.
    const hasHeader = elExists("header.site-header") || hasCustomAuthNav;
    const hasFooter = elExists("footer.site-footer") || elExists("footer");

    if (!hasHeader) {
      const headerMount = ensureMount("siteHeaderMount", "top");
      if (!headerMount.innerHTML.trim()) headerMount.innerHTML = buildHeader();
    }

    if (!hasFooter) {
      const footerMount = ensureMount("siteFooterMount", "bottom");
      if (!footerMount.innerHTML.trim()) footerMount.innerHTML = buildFooter();
    }

    highlightActiveNav();
    wireMobileToggle();

    // Auth nav works whether injected or hand-written, as long as ids match.
    // (If the page doesn't have auth elements, it just no-ops.)
    wireAuthNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
