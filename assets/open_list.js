// assets/open_list.js
(function () {
  "use strict";

  const SUPABASE_URL = "https://xxlkxorwprtynemmbeya.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_ZzCo8J6b6y0xVkExiOtHyg_gOpGEJFv";

  const listEl = document.getElementById("articlesList");
  const msgEl = document.getElementById("listMsg");
  const newBtn = document.getElementById("newArticleBtn");

  function setMsg(text) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  async function loadSupabase() {
    const errors = [];
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
      } catch (e) {
        errors.push(e);
      }
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
        if (typeof createClient !== "function") throw new Error("globalThis.supabase.createClient missing");
        return createClient;
      } catch (e) {
        errors.push(e);
      }
    }

    throw new Error("Cannot load Supabase SDK. " + errors.map(x => x.message).join(" | "));
  }

  async function main() {
    if (!listEl) return;

    newBtn?.addEventListener("click", () => {
      window.location.href = "/open/new.html";
    });

    setMsg("Loading…");

    const createClient = await loadSupabase();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    let currentUserId = null;
    try {
      const { data } = await supabase.auth.getUser();
      currentUserId = data?.user?.id || null;
    } catch (_) {}

    async function render() {
      listEl.innerHTML = "";
      setMsg("");

      // Pull author display_name via joins/nesting + view_count
      // Supabase joins & nesting docs: select("..., profiles(display_name)") :contentReference[oaicite:6]{index=6}
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, content, created_at, user_id, deleted_at, view_count, profiles:profiles(display_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        setMsg("Failed to load articles: " + (error.message || String(error)));
        return;
      }

      if (!data || data.length === 0) {
        setMsg("No submissions yet.");
        return;
      }

      for (const a of data) {
        const canDelete = currentUserId && a.user_id && (a.user_id === currentUserId);

        const card = document.createElement("div");
        card.className = "card";
        card.style.padding = "14px 16px";

        const title = escapeHtml(a.title || "Untitled");
        const created = a.created_at ? new Date(a.created_at).toLocaleString() : "";
        const snippet = (a.content || "").replace(/<[^>]*>/g, "").slice(0, 180);
        const author = escapeHtml(a.profiles?.display_name || "Anonymous");
        const views = Number.isFinite(a.view_count) ? a.view_count : 0;

        card.innerHTML = `
          <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;">
            <div>
              <a href="/open/article.html?id=${encodeURIComponent(a.id)}" style="font-weight:800;text-decoration:none;">
                ${title}
              </a>
              <div class="muted" style="margin-top:4px;">
                ${created} · By ${author} · ${views} views
              </div>
            </div>
            ${canDelete ? `<button class="btn" data-del="${a.id}" style="background:rgba(185,28,28,0.10);border:1px solid rgba(185,28,28,0.25);">Delete</button>` : ""}
          </div>
          <div class="muted" style="margin-top:10px;">${escapeHtml(snippet)}${snippet.length >= 180 ? "…" : ""}</div>
        `;

        if (canDelete) {
          const btn = card.querySelector(`[data-del="${a.id}"]`);
          btn?.addEventListener("click", async () => {
            if (!confirm("Soft-delete this article? (It will disappear from the list)")) return;

            btn.disabled = true;
            try {
              const { error: uerr } = await supabase
                .from("articles")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", a.id);

              if (uerr) throw uerr;

              card.remove();
            } catch (e) {
              btn.disabled = false;
              alert("Delete failed: " + (e?.message || String(e)));
            }
          });
        }

        listEl.appendChild(card);
      }
    }

    await render();

    supabase.auth.onAuthStateChange(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserId = data?.user?.id || null;
      } catch (_) {
        currentUserId = null;
      }
      await render();
    });
  }

  main().catch((e) => {
    setMsg("Startup error: " + (e?.message || String(e)));
  });
})();
