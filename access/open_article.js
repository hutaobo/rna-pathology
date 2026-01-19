(function () {
  async function waitForAuthReady() {
    await new Promise((resolve) => {
      if (window.__supabaseClient) return resolve();
      const t = setTimeout(resolve, 4000);
      window.addEventListener("rp:auth", () => {
        clearTimeout(t);
        resolve();
      }, { once: true });
    });
  }

  function qs(key) {
    return new URLSearchParams(location.search).get(key);
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await waitForAuthReady();

    const supabase = window.__supabaseClient;
    const isSignedIn = !!window.__isSignedIn;

    const articleId = qs("id");
    const titleEl = document.getElementById("articleTitle");
    const metaEl = document.getElementById("articleMeta");
    const contentEl = document.getElementById("articleContent");
    const commentsEl = document.getElementById("commentsList");

    if (!articleId) {
      titleEl.textContent = "Article not found";
      return;
    }
    if (!supabase) {
      titleEl.textContent = "Supabase client not ready. Check assets/site.js.";
      return;
    }

    // Load article
    const { data: article, error: aErr } = await supabase
      .from("articles")
      .select("id,title,content,created_at, author:profiles(display_name)")
      .eq("id", articleId)
      .single();

    if (aErr || !article) {
      console.error(aErr);
      titleEl.textContent = "Failed to load article.";
      return;
    }

    titleEl.textContent = article.title;
    metaEl.textContent = `By ${article.author?.display_name || "User"} · ${new Date(article.created_at).toLocaleString()}`;

    // Sanitize on render too (defense in depth)
    contentEl.innerHTML = DOMPurify.sanitize(article.content || "");

    // Load comments
    async function loadComments() {
      const { data: comments, error: cErr } = await supabase
        .from("comments")
        .select("id,content,created_at, author:profiles(display_name)")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });

      if (cErr) {
        console.error(cErr);
        commentsEl.innerHTML = "<p>Failed to load comments.</p>";
        return;
      }
      if (!comments || comments.length === 0) {
        commentsEl.innerHTML = "<p class='muted'>No comments yet.</p>";
        return;
      }

      commentsEl.innerHTML = "";
      comments.forEach((c) => {
        const el = document.createElement("div");
        el.className = "card";
        el.innerHTML = `
          <div class="muted" style="margin-bottom:8px;">
            <strong>${c.author?.display_name || "User"}</strong> · ${new Date(c.created_at).toLocaleString()}
          </div>
          <div>${DOMPurify.sanitize(c.content || "")}</div>
        `;
        commentsEl.appendChild(el);
      });
    }
    await loadComments();

    // Comment box
    const textEl = document.getElementById("commentText");
    const submitBtn = document.getElementById("commentSubmit");
    const msgEl = document.getElementById("commentMsg");

    if (!isSignedIn) {
      textEl.disabled = true;
      submitBtn.disabled = true;
      msgEl.textContent = "Please sign in to comment.";
      return;
    }

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    submitBtn.addEventListener("click", async () => {
      msgEl.textContent = "";
      const content = (textEl.value || "").trim();
      if (!content) return;

      // Keep comments simple: sanitize (allow basic text/line breaks)
      const clean = DOMPurify.sanitize(content);

      const { error } = await supabase.from("comments").insert({
        article_id: articleId,
        author_id: user.id,
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
  });
})();
