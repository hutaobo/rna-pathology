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
      window.location.href = "/login.html?next=/open/new.html";
      return;
    }
    if (!supabase) {
      document.getElementById("formMsg").textContent = "Supabase client not ready. Check assets/site.js.";
      return;
    }

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

    // Use trusted user data (client-side is ok; RLS enforces)
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    const form = document.getElementById("articleForm");
    const titleInput = document.getElementById("articleTitleInput");
    const msg = document.getElementById("formMsg");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";

      const title = (titleInput.value || "").trim();
      const rawHtml = (quill.root.innerHTML || "").trim();

      if (!title) {
        msg.textContent = "Title is required.";
        return;
      }
      if (!rawHtml || rawHtml === "<p><br></p>") {
        msg.textContent = "Content is required.";
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
        msg.textContent = "Publish failed. Please try again.";
        return;
      }

      msg.textContent = "Published! Redirecting…";
      window.location.href = `/open/article.html?id=${data.id}`;
    });
  });
})();
