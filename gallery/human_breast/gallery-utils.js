/**
 * gallery-utils.js
 * Explain: load JSON metadata + render with filter + pagination + lightbox
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

  // load JSON metadata
  const resp = await fetch(metadataJson);
  galleryData = await resp.json();

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

    // ✅ 核心改动：用 figure + figcaption 包起来
    galleryGrid.innerHTML = items
      .map(item => `
        <figure class="gallery-item">
          <figcaption>${item.id}</figcaption>
          <img src="${item.src}" alt="${item.id}" data-caption="${item.id}">
        </figure>
      `)
      .join("");

    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    document.querySelectorAll("#galleryGrid img").forEach(img => {
      img.addEventListener("click", () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.getAttribute("data-caption") || "";
        lightbox.classList.add("is-open");
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
