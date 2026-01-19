/* assets/site.js
   Shared behavior for RNA-Pathology.com:
   - Inject a consistent header/nav + footer across pages (when not already present)
   - Highlight current nav item
   - Mobile nav toggle (close on link click + outside click + Esc)
   - Auth-aware nav (Supabase): hide Sign In/Up when signed in, provide Sign Out
   - Newsletter subscribe wiring (home + footer updates card)
   - Global auth bridge:
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

  // Primary nav: clinician-first + minimal.
  // Brand already links to Home, so we omit a separate "Home" item.
  const NAV_ITEMS = [
    { href: "/database.html", label: "Database" },
    { href: "/challenge.html", label: "Challenge" },
    { href: "/#start-here", label: "Start here" },

    // NEW: Open Submissions
    { href: "/open/", label: "Open Submissions" },

    { href: "/access/", label: "Access / Legal" },
  ];

  // ---- Supabase Auth (shared) ----
  const SUPABASE_URL = "https://xxlkxorwprtynemmbeya.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGt4b3J3cHJ0eW5lbW1iZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjE3NDEsImV4cCI6MjA4MjQzNzc0MX0.4Whq6bGF6cmYUgS6octe3daSyHVx9peh6rObz8kP2UM";

  const LOGIN_PATH = "/login.html";
  const SIGNUP_PATH = "/login.html?signup=1";

  const SUPABASE_JS_CDN =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

  // ---- Newsletter subscribe (Edge Function) ----
  // IMPORTANT:
  // - anon key can be used in browser IF RLS is enabled properly.
  // - service_role/secret keys must NEVER be exposed in browser.
  const RP_SUBSCRIBE_ENDPOINT = `${SUPABASE_URL}/functions/v1/subscribe`;

  // Expose to pages (e.g., index.html newsletter widget)
  window.RP_SUBSCRIBE_ENDPOINT = RP_SUBSCRIBE_ENDPOINT;
  window.RP_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

  // ---- QR ----
  const FOOTER_QR_IMG_PATH = "/images/qr/rna-pathology-home.png";

  // ---------- small helpers ----------
  function joinUrl(base, path) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : "/" + path;
    return (b || "") + p;
  }

  function stripHashAndQuery(s) {
    const str = String(s || "");
    return str.split("#")[0].split("?")[0];
  }

  function normalizePath(pathname) {
    if (!pathname) return "/";
    // Treat /index.html as /
    if (pathname.endsWith("/index.html")) return pathname.slice(0, -10) || "/";
    return pathname;
  }

  function stripBasePath(pathname) {
    const p = pathname || "/";
    if (!basePath || basePath === "/") return p;

    const b = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

    if (p === b) return "/";
    if (p.startsWith(b + "/")) return p.slice(b.length) || "/";

    // If somehow not under basePath, return as-is
    return p;
  }

  function isActive(currentPath, itemHref) {
    const cur = normalizePath(currentPath);
    const hrefPath = normalizePath(stripHashAndQuery(itemHref));

    // Root (covers "/" and "/#start-here")
    if (hrefPath === "/") return cur === "/";

    // Exact match for file pages
    if (hrefPath.endsWith(".html")) return cur === hrefPath;

    // Folder-like routes: /docs/, /access/, /open/
    if (hrefPath.endsWith("/"))
      return cur === hrefPath || cur.startsWith(hrefPath);

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
      <a class="brand" href="${joinUrl(basePath, "/")}" aria-label="RNA-Pathology home">
        <span class="logo" aria-hidden="true"></span>
        <span>RNA-Pathology</span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="Open menu">
        <span aria-hidden="true">☰</span> Menu
      </button>

      <div id="navLinks" class="nav-links">
        ${linksHtml}
      </div>

      <!-- Auth cluster (shared across pages) -->
      <div class="nav-auth" aria-label="Account actions">
        <a id="navSignUp" class="nav-auth-btn" href="${signUpUrl}">Sign up</a>
        <a id="navSignIn" class="nav-auth-btn" href="${signInUrl}">Sign in</a>

        <button id="navSignOutBtn" class="nav-auth-btn nav-auth-danger" type="button" style="display:none;">
          Sign out
        </button>

        <div id="navAuthed" class="nav-auth-pill" style="display:none;">
          <span class="nav-auth-email" id="navEmail">Account</span>
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

    // Footer: keep clinician-first + utility links.
    return `
<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer-row">
      <div class="muted">© <span id="siteYear">${year}</span> RNA-Pathology.com</div>

      <div class="footer-links">
        <a href="${joinUrl(basePath, "/database.html")}">Database</a>
        <a href="${joinUrl(basePath, "/challenge.html")}">Challenge</a>

        <!-- NEW: Open Submissions -->
        <a href="${joinUrl(basePath, "/open/")}">Open Submissions</a>

        <a href="${joinUrl(basePath, "/docs/roadmap.html")}">Roadmap</a>
        <a href="${joinUrl(basePath, "/access/")}">Access / Legal</a>
        <a href="${joinUrl(basePath, "/legal/privacy.html")}">Privacy</a>
        <a href="${joinUrl(basePath, "/")}">Home</a>
      </div>

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
    const current = normalizePath(stripBasePath(window.location.pathname));
    const navLinks = document.querySelectorAll(".nav-links a[data-href]");

    navLinks.forEach((a) => {
      const rawHref = a.getAttribute("data-href") || "";
      if (isActive(current, rawHref)) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function wireMobileToggle() {
    const btn = document.querySelector(".nav-toggle");
    const links = document.getElementById("navLinks");
    const nav = document.querySelector(".site-nav");
    if (!btn || !links || !nav) return;

    function close(opts) {
      const hadOpen = links.classList.contains("open");
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");

      // On keyboard close (Esc), return focus to button for a clean loop.
      if (hadOpen && opts && opts.returnFocus) {
        try { btn.focus(); } catch (_) {}
      }
    }

    btn.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        const first = links.querySelector("a");
        if (first) {
          try { first.focus(); } catch (_) {}
        }
      }
    });

    // Close menu after clicking a link (mobile UX)
    links.addEventListener("click", (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (a) close();
    });

    // Close when clicking outside the nav (mobile polish)
    document.addEventListener("click", (e) => {
      if (!links.classList.contains("open")) return;
      const target = e.target;
      const inside = target && target.closest ? target.closest(".site-nav") : null;
      if (!inside) close();
    });

    // Close on Esc
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close({ returnFocus: true });
    });

    // Defensive: if viewport changes, close the overlay menu
    window.addEventListener("resize", () => close());
  }

  // ---------- Newsletter (home + footer) ----------
  function wireNewsletterSubscribe() {
    const form = document.getElementById("nl-form");
    const emailEl = document.getElementById("nl-email");
    const btn = document.getElementById("nl-btn");
    const msg = document.getElementById("nl-msg");
    if (!form || !emailEl || !btn || !msg) return;

    // Avoid double wiring
    if (form.dataset.wired === "1") return;
    form.dataset.wired = "1";

    function show(text, type /* "success" | "error" | "" */) {
      msg.textContent = text;
      msg.style.display = "block";
      msg.classList.remove("success", "error");
      if (type === "success") msg.classList.add("success");
      if (type === "error") msg.classList.add("error");
    }

    // Capture listener: stable even if other scripts exist
    form.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const endpoint = window.RP_SUBSCRIBE_ENDPOINT || "";
        const anonKey = window.RP_SUPABASE_ANON_KEY || "";

        const email = String(emailEl.value || "").trim();
        if (!email) {
          show("Please enter a valid email.", "error");
          return;
        }

        // If not configured, fail gracefully (no page refresh)
        if (!endpoint || !anonKey) {
          show("Subscriptions are temporarily unavailable.", "error");
          return;
        }

        // Respect native validity if available
        if (emailEl.checkValidity && !emailEl.checkValidity()) {
          show("Please enter a valid email address.", "error");
          return;
        }

        btn.disabled = true;
        const prevText = btn.textContent;
        btn.textContent = "Submitting...";

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + anonKey,
              "apikey": anonKey,
            },
            body: JSON.stringify({ email, source: "homepage" }),
          });

          if (!res.ok) {
            const t = await res.text();
            throw new Error(t || ("HTTP " + res.status));
          }

          show("You're on the list. Check your inbox soon.", "success");
          form.reset();
        } catch (err) {
          show("Subscribe failed. Please try again later.", "error");
          // Keep console for debugging, but don't leak details into UI.
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.textContent = prevText || "Notify me";
        }
      },
      true
    );
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
    if (!els.navSignUp || !els.navSignIn || !els.navSignOutBtn || !els.navAuthed)
      return;

    els.navAuthed.style.display = "none";
    els.navSignOutBtn.style.display = "none";

    els.navSignUp.style.display = "inline-flex";
    els.navSignIn.style.display = "inline-flex";
  }

  function setAuthUiSignedIn(els, emailText) {
    if (
      !els.navSignUp ||
      !els.navSignIn ||
      !els.navSignOutBtn ||
      !els.navAuthed ||
      !els.navEmail
    )
      return;

    // Privacy + aesthetics: don't print the email as visible nav text.
    // Keep it available via title for the signed-in user.
    els.navAuthed.style.display = "inline-flex";
    els.navEmail.textContent = "Account";
    if (emailText) {
      els.navAuthed.setAttribute("title", emailText);
      els.navAuthed.setAttribute("aria-label", "Signed in as " + emailText);
    } else {
      els.navAuthed.removeAttribute("title");
      els.navAuthed.setAttribute("aria-label", "Signed in");
    }

    els.navSignOutBtn.style.display = "inline-flex";
    els.navSignUp.style.display = "none";
    els.navSignIn.style.display = "none";
  }

  async function refreshAuthNav() {
    const els = findAuthEls();
    if (!els.navSignIn && !els.navSignUp && !els.navSignOutBtn && !els.navAuthed)
      return;

    try {
      const supabase = await getSupabaseClient();

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      if (session && session.user) {
        const email = session.user.email || "";
        setAuthUiSignedIn(els, email);
        setGlobalAuth(true, email, supabase);
      } else {
        setAuthUiSignedOut(els);
        setGlobalAuth(false, "", supabase);
      }
    } catch (_) {
      const els2 = findAuthEls();
      setAuthUiSignedOut(els2);
      setGlobalAuth(false, "", null);
    }
  }

  async function wireAuthNav() {
    const els = findAuthEls();
    if (!els.navSignOutBtn && !els.navAuthed && !els.navSignIn && !els.navSignUp)
      return;

    try {
      const supabase = await getSupabaseClient();

      // Expose client immediately (still signed-out until session proves otherwise)
      setGlobalAuth(false, "", supabase);

      // Avoid double subscriptions
      if (!_authSub) {
        const { data } = supabase.auth.onAuthStateChange(() => {
          refreshAuthNav();
        });
        _authSub = data && data.subscription ? data.subscription : null;
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
    wireNewsletterSubscribe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
