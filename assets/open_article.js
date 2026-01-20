// assets/open_article.js
(function () {
  "use strict";

  const SUPABASE_URL = "https://xxlkxorwprtynemmbeya.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_ZzCo8J6b6y0xVkExiOtHyg_gOpGEJFv";

  const titleEl = document.getElementById("articleTitle");
  const metaEl = document.getElementById("articleMeta");
  const contentEl = document.getElementById("articleContent");
  const actionsEl = document.getElementById("articleActions");

  const commentsList = document.getElementById("commentsList");
  const commentText = document.getElementById("commentText");
  const commentSubmit = document.getElementById("commentSubmit");
  const commentMsg = document.getElementById("commentMsg");

  function setText(el, t) { if (el) el.textContent = t || ""; }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

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

  function getArticleId() {
    const u = new URL(location.href);
    return u.searchParams.get("id");
  }

  async function main() {
    const id = getArticleId();
    if (!id) {
      setText(titleEl, "Missing article id.");
      return;
    }

    const createClient = await loadSupabaseCreateClient();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    let currentUserId = null;
    try {
      const { data } = await supabase.auth.getUser(); // validated user :contentReference[oaicite:8]{index=8}
      currentUserId = data?.user?.id || null;
    } catch (_) {}

    // Load article (RLS should already hide deleted rows; extra guard is fine)
    const { data: article, error } = await supabase
      .from("articles")
      .select("id, title, content, created_at, user_id, deleted_at")
      .eq("id", id)
      .single();

    if (error || !article) {
      setText(titleEl, "Article not found (or removed).");
      setText(metaEl, error?.message || "");
      return;
    }

    setText(titleEl, article.title || "Untitled");
    setText(metaEl, article.created_at ? new Date(article.created_at).toLocaleString() : "");

    // Render HTML safely
    const clean = window.DOMPurify
      ? window.DOMPurify.sanitize(article.content || "", { USE_PROFILES: { html: true } })
      : (article.content || "");
    if (contentEl) contentEl.innerHTML = clean;

    // Author-only Delete button
    const canDelete = currentUserId && article.user_id && (article.user_id === currentUserId);
    if (actionsEl) {
      actionsEl.innerHTML = "";
      if (canDelete) {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.style.background = "rgba(185,28,28,0.10)";
        btn.style.border = "1px solid rgba(185,28,28,0.25)";
        btn.textContent = "Delete";
        btn.addEventListener("click", async () => {
          if (!confirm("Soft-delete this article?")) return;
          btn.disabled = true;
          try {
            const { error: uerr } = await supabase
              .from("articles")
              .update({ deleted_at: new Date().toISOString() })
              .eq("id", article.id);

            if (uerr) throw uerr;

            window.location.href = "/open/";
          } catch (e) {
            btn.disabled = false;
            alert("Delete failed: " + (e?.message || String(e)));
          }
        });
        actionsEl.appendChild(btn);
      }
    }

    // ---- Comments (basic) ----
    // If you already implemented comments elsewhere, keep yours and only retain Delete logic above.
    async function loadComments() {
      if (!commentsList) return;
      commentsList.innerHTML = "";

      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq("article_id", article.id)
        .order("created_at", { ascending: true });

      if (error) {
        commentsList.innerHTML = `<div class="muted">Failed to load comments: ${escapeHtml(error.message)}</div>`;
        return;
      }

      if (!data || data.length === 0) {
        commentsList.innerHTML = `<div class="muted">No comments yet.</div>`;
        return;
      }

      for (const c of data) {
        const div = document.createElement("div");
        div.className = "card";
        div.style.padding = "10px 12px";
        div.innerHTML = `
          <div class="muted" style="font-size:12px;">${c.created_at ? new Date(c.created_at).toLocaleString() : ""}</div>
          <div style="margin-top:6px;">${escapeHtml(c.content || "")}</div>
        `;
        commentsList.appendChild(div);
      }
    }

    await loadComments();

    commentSubmit?.addEventListener("click", async () => {
      setText(commentMsg, "");

      // Require login to comment
      const { data: ud } = await supabase.auth.getUser();
      const user = ud?.user;
      if (!user) {
        setText(commentMsg, "Login required to comment.");
        return;
      }

      const text = (commentText?.value || "").trim();
      if (!text) { setText(commentMsg, "Please write something."); return; }

      commentSubmit.disabled = true;
      try {
        const { error: ierr } = await supabase
          .from("comments")
          .insert({
            article_id: article.id,
            content: text,
            user_id: user.id
          });

        if (ierr) throw ierr;

        if (commentText) commentText.value = "";
        await loadComments();
        setText(commentMsg, "Posted.");
      } catch (e) {
        setText(commentMsg, "Post failed: " + (e?.message || String(e)));
      } finally {
        commentSubmit.disabled = false;
      }
    });
  }

  main().catch((e) => {
    setText(titleEl, "Startup error");
    setText(metaEl, e?.message || String(e));
  });
})();
