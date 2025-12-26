/**
 * gallery-utils.js
 * 自动渲染 Human Breast Gallery
 * 标题可点击跳转到 Dataset Card
 * 点击图片默认跳 Dataset Card；按住 Ctrl/Cmd 点击则打开大图（Lightbox）
 */

(async function () {
  const galleryGrid = document.getElementById("galleryGrid");
  const sectionFilter = document.getElementById("filterSection");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("closeBtn");

  let galleryData = [];
  const pageSize = 6;
  let currentPage = 1;
  let currentFilter = "All";

  // fetch metadata.json
  const resp = await fetch(metadataJson);
  galleryData = await resp.json();

  function slugify(str) {
    return str.toLowerCase()
      .trim()
      .replace(/[\s]+/g, "_")
      .replace(/[^\w\-]+/g, "");
  }

  function populateFilterOptions() {
    const sections = ["All", ...new Set(galleryData.map(x => x.section))];
    sections.forEach(sec => {
      const opt = document.createElement("option");
      opt.value = sec;
      opt.textContent = sec === "All" ? "All Sections" : sec;
      sectionFilter.appendChild(opt);
    });
  }

  function renderPage() {
    const filtered = currentFilter === "All"
      ? galleryData
      : galleryData.filter(x => x.section === currentFilter);

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    galleryGrid.innerHTML = items
      .map(item => {
        // 自动构造 dataset card 跳转链接
        const target = `/datasets/human_breast_biomarkers_${slugify(item.section)}.html`;
        return `
          <figure class="gallery-item">
            <figcaption>
              <a class="gallery-link" href="${target}">
                ${item.id}
              </a>
            </figcaption>
            <img 
              src="${item.src}"
              alt="${item.id}"
              data-caption="${item.id}"
              data-href="${target}"
            >
          </figure>
        `;
      })
      .join("");

    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // 图片点击行为
    document.querySelectorAll("#galleryGrid img").forEach(img => {
      img.addEventListener("click", (e) => {
        const target = img.getAttribute("data-href");
        if (e.ctrlKey || e.metaKey) {
          // ctrl/cmd + click → lightbox 查看大图
          lightboxImg.src = img.src;
          lightboxImg.alt = img.getAttribute("data-caption") || "";
          lightbox.classList.add("is-open");
        } else {
          // 普通点击 → 跳 dataset card
          window.location.href = target;
        }
      });
    });
  }

  sectionFilter.addEventListener("change", e => {
    currentFilter = e.target.value;
    currentPage = 1;
    renderPage();
  });

  prevBtn.addEventListener("click", () => { currentPage--; renderPage(); });
  nextBtn.addEventListener("click", () => { currentPage++; renderPage(); });

  closeBtn.addEventListener("click", () => lightbox.classList.remove("is-open"));
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.classList.remove("is-open");
  });

  populateFilterOptions();
  renderPage();
})();
