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

  window.addEventListener("DOMContentLoaded", async () => {
    await waitForAuthReady();

    const supabase = window.__supabaseClient;
    const isSignedIn = !!window.__isSignedIn;

    if (!isSignedIn) {
      window.location.href = "/login.html?next=/access/profile.html";
      return;
    }
    if (!supabase) {
      document.getElementById("nameMsg").textContent = "Supabase client not ready. Check assets/site.js.";
      return;
    }

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    document.getElementById("profEmail").textContent = user.email;

    // Load profile
    let { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const nameInput = document.getElementById("nameInput");
    if (profile?.display_name) nameInput.value = profile.display_name;

    // Save
    document.getElementById("saveNameBtn").addEventListener("click", async () => {
      const v = (nameInput.value || "").trim();
      const msg = document.getElementById("nameMsg");
      msg.textContent = "";
      if (!v) {
        msg.textContent = "Display name cannot be empty.";
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: v })
        .eq("id", user.id);

      if (error) {
        console.error(error);
        msg.textContent = "Save failed.";
        return;
      }
      msg.textContent = "Saved.";
    });

    // My articles
    const listEl = document.getElementById("myArticlesList");
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id,title,created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      listEl.innerHTML = "<p>Failed to load your articles.</p>";
      return;
    }

    if (!articles || articles.length === 0) {
      listEl.innerHTML = "<p class='muted'>You haven’t published anything yet.</p>";
      return;
    }

    listEl.innerHTML = "";
    articles.forEach((a) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<a href="/open/article.html?id=${a.id}">${a.title}</a><div class="muted">${new Date(a.created_at).toLocaleString()}</div>`;
      listEl.appendChild(div);
    });
  });
})();
