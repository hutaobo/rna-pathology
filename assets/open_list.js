(function () {
  async function waitForSupabaseClient() {
    // Wait for site.js to set window.__supabaseClient; fallback to timeout
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

  function stripHtml(html) {
    const d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || d.innerText || "").trim();
  }

  async function detectSignedIn(supabase) {
    // Preferred: getUser() is authentic (network-validated)
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) return true;
    } catch (e) {
      // ignore and fallback
    }
    // Fallback: getSession() reads from storage (fast client-side)
    try {
      const { data } = await supabase.auth.getSession();
      return !!data?.session?.user;
    } catch (e) {
      return false;
    }
  }

  function setNewArticleButton(btn, signedIn) {
    if (!btn) return;

    if (signedIn) {
      btn.textContent = "+ New Article";
      btn.onclick = () => {
        window.location.href = "/open/new.html";
      };
    } else {
      btn.textContent = "Log in to submit";
      // 如果你的登录页不是 /login.html，就改这里（比如 /access/login.html）
      btn.onclick = () => {
        window.location.href = "/login.html?next=/open/new.html";
      };
    }
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await waitForSupabaseClient();

    const supabase = window.__supabaseClient;
    const btn = document.getElementById("newArticleBtn");

    const list = document.getElementById("articlesList");
    if (!list) return;

    if (!supabase) {
      list.innerHTML =
        "<p>Supabase client not ready. Please check assets/site.js.</p>";
      return;
    }

    // 1) 初次渲染按钮（别抢跑读 window.__isSignedIn）
    const signedIn = await detectSignedIn(supabase);
    setNewArticleButton(btn, signedIn);

    // 2) 监听登录/登出事件，实时更新按钮
    supabase.auth.onAuthStateChange((_event, session) => {
      setNewArticleButton(btn, !!session?.user);
    });

    // ===== 原来的文章列表逻辑（基本不动） =====
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

      const plain = stripHtml(a.content);
      const snippet =
        plain.slice(0, 180) + (plain.length > 180 ? "…" : "");

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
