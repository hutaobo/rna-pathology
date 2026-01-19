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

  async function requireLoginOrRedirect(supabase) {
    // Prefer getUser() (validated) for login gating
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (error) console.warn("getUser error:", error);

    if (user) return user;

    const next = encodeURIComponent(location.pathname + location.search);
    // use replace to avoid back-button loops
    location.replace(`/login.html?next=${next}`);
    return null;
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await waitForSupabaseClient();

    const supabase = window.__supabaseClient;
    const msg = document.getElementById("formMsg");

    if (!supabase) {
      if (msg) msg.textContent = "Supabase client not ready. Check assets/site.js.";
      return;
    }

    // Gate BEFORE initializing editor / binding handlers
    const user = await requireLoginOrRedirect(supabase);
    if (!user) return;

    // Quill init (toolbar)
    const quill = new Quill("#editor", {
      theme: "snow",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link"],
          ["clean"]
        ]
      }
    });

    const form = document.getElementById("articleForm");
    const titleInput = document.getElementById("articleTitleInput");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = "";

      const title = (titleInput.value || "").trim();
      const rawHtml = (quill.root.innerHTML || "").trim();

      if (!title) {
        if (msg) msg.textContent = "Title is required.";
        return;
      }
      if (!rawHtml || rawHtml === "<p><br></p>") {
        if (msg) msg.textContent = "Content is required.";
        return;
      }

      // Sanitize HTML before saving
      const cleanHtml = DOMPurify.sanitize(rawHtml);

      const { data, error } = await supabase
        .from("articles")
        .insert({
          author_id: user.id,
          title,
          content: cleanHtml
        })
        .select("id")
        .single();

      if (error) {
        console.error(error);
        if (msg) msg.textContent = "Publish failed. Please try again.";
        return;
      }

      if (msg) msg.textContent = "Published! Redirecting…";
      location.href = `/open/article.html?id=${data.id}`;
    });
  });
})();
