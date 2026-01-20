// assets/open_new.js
(function () {
  "use strict";

  const SUPABASE_URL = "https://xxlkxorwprtynemmbeya.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_ZzCo8J6b6y0xVkExiOtHyg_gOpGEJFv";

  const form = document.getElementById("articleForm");
  const titleInput = document.getElementById("articleTitleInput");
  const msgEl = document.getElementById("formMsg");

  function setMsg(t) { if (msgEl) msgEl.textContent = t || ""; }

  async function loadSupabaseCreateClient() {
    const esmCandidates = [
      "https://esm.sh/@supabase/supabase-js@2",
      "https://cdn.skypack.dev/@supabase/supabase-js@2",
      "https://jspm.dev/@supabase/supabase-js@2"
    ];
    for (const url of esmCandidates) {
      try {
        const mod = await import(url);
        const createClient = mod?.createClient || mod?.default?.createClient;
        if (typeof createClient !== "function") throw new Error("createClient not found");
        return createClient;
      } catch (_) {}
    }
    const umdCandidates = [
      "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js",
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"
    ];
    for (const src of umdCandidates) {
      try {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.async = true;
          s.onload = resolve;
          s.onerror = () => reject(new Error("Failed to load " + src));
          document.head.appendChild(s);
        });
        const createClient = globalThis.supabase?.createClient;
        if (typeof createClient !== "function") throw new Error("global createClient missing");
        return createClient;
      } catch (_) {}
    }
    throw new Error("Cannot load Supabase SDK");
  }

  async function main() {
    if (!form) return;

    // Quill init
    const quill = new Quill("#editor", {
      theme: "snow",
      modules: { toolbar: "#editorToolbar" }
    });

    const createClient = await loadSupabaseCreateClient();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    // Require login to publish
    const { data: userData } = await supabase.auth.getUser(); // validated user on server :contentReference[oaicite:7]{index=7}
    const user = userData?.user;
    if (!user) {
      setMsg("Login required. Redirecting to login…");
      const next = "/open/new.html";
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setMsg("");

      const title = (titleInput?.value || "").trim();
      const rawHtml = quill.root.innerHTML || "";

      if (!title) { setMsg("Please enter a title."); return; }

      // Sanitize HTML
      const cleanHtml = window.DOMPurify
        ? window.DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } })
        : rawHtml;

      setMsg("Publishing…");

      try {
        // Must include user_id to satisfy your RLS insert policy (user_id = auth.uid()).
        const { data, error } = await supabase
          .from("articles")
          .insert({
            title,
            content: cleanHtml,
            user_id: user.id
          })
          .select("id")
          .single();

        if (error) throw error;

        setMsg("Published!");
        window.location.href = `/open/article.html?id=${encodeURIComponent(data.id)}`;
      } catch (err) {
        setMsg("Publish failed: " + (err?.message || String(err)));
      }
    });
  }

  main().catch((e) => setMsg("Startup error: " + (e?.message || String(e))));
})();
