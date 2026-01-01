/* assets/site.js
   Shared behavior for RNA-Pathology.com:
   - Inject a consistent header/nav + footer across pages (when not already present)
   - Highlight current nav item
   - Mobile nav toggle
   - Auth-aware nav (Supabase): show email when signed in, hide Sign In/Up, provide Sign Out

   ✅ Global auth bridge (for Challenge unlock + other pages):
   - window.__supabaseClient   (Supabase client object; existence != signed-in)
   - window.__memberEmail      ("" when signed out)
   - window.__isSignedIn       (true only when a valid session exists)
   - dispatch CustomEvent "rp:auth" on auth changes
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
    { href: "/challenge.html", label: "Challenge" },
    { href: "/access/", label: "Access" },
  ];

  // ---- Supabase Auth (shared) ----
  const SUPABASE_URL = "https://xxlkxorwprtynemmbeya.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_ZzCo8J6b6y0xVkExiOtHyg_gOpGEJFv";

  const LOGIN_PATH = "/login.html";
  const SIGNUP_PATH = "/login.html?signup=1";

  const SUPABASE_JS_CDN =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

  // ---- QR (Step 2: footer HTML only; styling comes in Step 3) ----
  const FOOTER_QR_IMG_PATH = "/images/qr/rna-pathology-home.png";

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

  // ---------- Global auth bridge ----------
  // IMPORTANT: __supabaseClient existing does NOT mean the user is signed in.
  // The only authoritative signed-in flag is window.__isSignedIn (and/or non-empty __memberEmail).
  function setGlobalAuth(signedIn, email, supabaseClient) {
    try {
      window.__supabaseClient = supabaseClient || null;
      window.__memberEmail = signedIn ? (email || "") : "";
      window.__isSignedIn = !!signedIn;

      // Broadcast to any page that listens (e.g. challenge.html unlock logic)
      window.dispatchEvent(
        new CustomEvent("rp:auth", {
          detail: {
            signedIn: !!signedIn,
            email: signedIn ? (email || "") : "",
          },
        })
      );
    } catch (_) {
      // ignore
    }
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
    const qrImgUrl = joinUrl(basePath, FOOTER_QR_IMG_PATH);

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
        <a href="${joinUrl(basePath, "/share/")}">Share</a>
        <a href="${joinUrl(basePath, "/")}">Home</a>
      </div>

      <!-- Step 2: QR in footer (styling comes in Step 3 via site.css) -->
      <div class="footer-qr" aria-label="QR code to share RNA-Pathology.com">
        <div class="footer-qr-title muted">Scan to share</div>
        <img
          class="footer-qr-img"
          src="${qrImgUrl}"
          alt="QR code for https://www.rna-pathology.com/"
          loading="lazy"
          decoding="async"
          width="96"
          height="96"
        />
        <a class="footer-qr-link" href="${qrImgUrl}" download>Download QR</a>
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

      // Always expose the client, but don't confuse that with signed-in.
      // Signed-in is determined ONLY by session existence.
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session && session.user) {
        const email = session.user.email || "Signed in";
        setAuthUiSignedIn(els, email);
        setGlobalAuth(true, email, supabase);
      } else {
        setAuthUiSignedOut(els);
        setGlobalAuth(false, "", supabase);
      }
    } catch (_) {
      // Fail open: keep public actions visible
      const els2 = findAuthEls();
      setAuthUiSignedOut(els2);
      setGlobalAuth(false, "", null);
    }
  }

  async function wireAuthNav() {
    const els = findAuthEls();
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

      // Expose client immediately (still signed-out until session proves otherwise)
      setGlobalAuth(false, "", supabase);

      // Avoid double subscriptions
      if (!_authSub) {
        const { data } = supabase.auth.onAuthStateChange(() => {
          // Re-check session on every auth change; this keeps __isSignedIn authoritative.
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
            // ignore
          } finally {
            els.navSignOutBtn.disabled = false;
          }
          window.location.href = joinUrl(basePath, "/?signed_out=1");
        });
      }

      await refreshAuthNav();
    } catch (_) {
      setAuthUiSignedOut(findAuthEls());
      setGlobalAuth(false, "", null);
    }
  }

  // ---------- main init ----------
  function init() {
    // Avoid injecting a second header/footer if the page already has its own nav UI.
    // Presence of auth ids means "custom header exists" to prevent duplicate IDs.
    const hasCustomAuthNav =
      elExists("#navSignIn") ||
      elExists("#navSignUp") ||
      elExists("#navAuthed") ||
      elExists("#navSignOutBtn");

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
    wireAuthNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
