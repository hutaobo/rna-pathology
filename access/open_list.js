(function () {
  async function waitForAuthReady() {
    // Wait for site.js to dispatch rp:auth; fallback to timeout
    await new Promise((resolve) => {
      if (window.__supabaseClient) return resolve();
      const t = setTimeout(resolve, 4000);
      window.addEventListener("rp:auth", () => {
        clearTimeout(t);
        resolve();
      }, { once: true });
    });
  }

  function stripHtml(html) {
    const d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || d.innerText || "").trim();
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await waitForAuthReady();

    const supabase = window.__supabaseClient;
    const isSignedIn = !!window.__isSignedIn;

    const btn = document.getElementById("newArticleBtn");
    if (btn) {
      if (!isSignedIn) {
        btn.textContent = "Log in to submit";
        btn.addEventListener("click", () => {
          window.location.href = "/login.html?next=/open/new.html";
        });
      } else {
        btn.addEventListener("click", () => {
          window.location.href = "/open/new.html";
        });
      }
    }

    const list = document.getElementById("articlesList");
    if (!list) return;

    if (!supabase) {
      list.innerHTML = "<p>Supabase client not ready. Please check assets/site.js.</p>";
      return;
    }

    const { data, error } = await supabase
      .from("articles")
      .select("id,title,content,created_at, author:profiles(display_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      list.innerHTML = "<p>Failed to load articles.</p>";
      return;
    }

    if (!data || data.length === 0) {
      list.innerHTML = "<p>No articles yet. Be the first to publish!</p>";
      return;
    }

    list.innerHTML = "";
    data.forEach((a) => {
      const author = a.author?.display_name || "User";
      const date = new Date(a.created_at).toLocaleString();
      const snippet = stripHtml(a.content).slice(0, 180) + (stripHtml(a.content).length > 180 ? "…" : "");
      const el = document.createElement("div");
      el.className = "card";
      el.innerHTML = `
        <h3 style="margin:0 0 6px 0;">
          <a href="/open/article.html?id=${a.id}">${a.title}</a>
        </h3>
        <div class="muted" style="margin-bottom:10px;">By <strong>${author}</strong> · ${date}</div>
        <div>${snippet}</div>
      `;
      list.appendChild(el);
    });
  });
})();
