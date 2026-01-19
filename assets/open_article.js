(function () {
  async function waitForSupabaseClient() {
    await new Promise((resolve) => {
      if (window.__supabaseClient) return resolve();
      const t = setTimeout(resolve, 4000);
      window.addEventListener(
        "rp:auth",
        () => {
          clearTimeout(t);
          resolve();
        },
        { once: true }
      );
    });
  }

  function qs(key) {
    return new URLSearchParams(location.search).get(key);
  }

  function setCommentUI({ signedIn, textEl, submitBtn, msgEl }) {
    if (!textEl || !submitBtn || !msgEl) return;

    if (signedIn) {
      textEl.disabled = false;
      submitBtn.disabled = false;
      textEl.placeholder = "Write a comment";
      msgEl.textContent = "";
    } else {
      textEl.disabled = true;
      submitBtn.disabled = true;
      textEl.placeholder = "Write a comment (login required)";
      msgEl.textContent = "Please sign in to comment.";
    }
  }

  async function getSignedInUser(supabase) {
    // getUser() performs a network request; the returned user is authentic. :contentReference[oaicite:2]{index=2}
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await waitForSupabaseClient();

    const supabase = window.__supabaseClient;

    const articleId = qs("id");
    const titleEl = document.getElementById("articleTitle");
    const metaEl = document.getElementById("articleMeta");
    const contentEl = document.getElementById("articleContent");
    const commentsEl = document.getElementById("commentsList");

    // Comment box elements
    const textEl = document.getElementById("commentText");
    const submitBtn = document.getElementById("commentSubmit");
    const msgEl = document.getElementById("commentMsg");

    if (!articleId) {
      if (titleEl) titleEl.textContent = "Article not found";
      return;
    }
    if (!supabase) {
      if (titleEl) titleEl.textContent = "Supabase client not ready. Check assets/site.js.";
      return;
    }

    // ---- Load article ----
    const { data: article, error: aErr } = await supabase
      .from("articles")
      .select("id,title,content,created_at, author:profiles(display_name)")
      .eq("id", articleId)
      .single();

    if (aErr || !article) {
      console.error(aErr);
      if (titleEl) titleEl.textContent = "Failed to load article.";
      return;
    }

    if (titleEl) titleEl.textContent = article.title;
    if (metaEl) {
      metaEl.textContent = `By ${article.author?.display_name || "User"} · ${new Date(
        article.created_at
      ).toLocaleString()}`;
    }

    // Sanitize on render too (defense in depth)
    if (contentEl) contentEl.innerHTML = DOMPurify.sanitize(article.content || "");

    // ---- Load comments ----
    async function loadComments() {
      const { data: comments, error: cErr } = await supabase
        .from("comments")
        .select("id,content,created_at, author:profiles(display_name)")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });

      if (cErr) {
        console.error(cErr);
        if (commentsEl) commentsEl.innerHTML = "<p>Failed to load comments.</p>";
        return;
      }
      if (!comments || comments.length === 0) {
        if (commentsEl) commentsEl.innerHTML = "<p class='muted'>No comments yet.</p>";
        return;
      }

      if (!commentsEl) return;
      commentsEl.innerHTML = "";
      comments.forEach((c) => {
        const el = document.createElement("div");
        el.className = "card";
        el.innerHTML = `
          <div class="muted" style="margin-bottom:8px;">
            <strong>${c.author?.display_name || "User"}</strong> · ${new Date(
              c.created_at
            ).toLocaleString()}
          </div>
          <div>${DOMPurify.sanitize(c.content || "")}</div>
        `;
        commentsEl.appendChild(el);
      });
    }
    await loadComments();

    // ---- Auth-aware comment UI ----
    let currentUser = await getSignedInUser(supabase);
    setCommentUI({
      signedIn: !!currentUser,
      textEl,
      submitBtn,
      msgEl
    });

    // Listen for auth changes and update UI live. :contentReference[oaicite:3]{index=3}
    supabase.auth.onAuthStateChange(async (_event, _session) => {
      currentUser = await getSignedInUser(supabase);
      setCommentUI({
        signedIn: !!currentUser,
        textEl,
        submitBtn,
        msgEl
      });
    });

    // ---- Post comment ----
    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        if (!msgEl || !textEl) return;

        msgEl.textContent = "";

        // Re-check user right before posting (avoid stale state)
        if (!currentUser) {
          currentUser = await getSignedInUser(supabase);
        }
        if (!currentUser) {
          setCommentUI({ signedIn: false, textEl, submitBtn, msgEl });
          // 用相对路径，避免 www/non-www 切换造成会话“看不见”:contentReference[oaicite:4]{index=4}
          const next = encodeURIComponent(location.pathname + location.search);
          msgEl.innerHTML = `Not signed in. <a href="/login.html?next=${next}">Sign in</a>`;
          return;
        }

        const content = (textEl.value || "").trim();
        if (!content) return;

        const clean = DOMPurify.sanitize(content);

        const { error } = await supabase.from("comments").insert({
          article_id: articleId,
          author_id: currentUser.id,
          content: clean
        });

        if (error) {
          console.error(error);
          msgEl.textContent = "Failed to post comment.";
          return;
        }

        textEl.value = "";
        msgEl.textContent = "Comment posted.";
        await loadComments();
      });
    }
  });
})();
