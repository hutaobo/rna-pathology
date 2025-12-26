/**
 * Modified gallery-utils.js for human breast gallery
 *
 * This version loads JSON metadata and renders a paginated gallery where
 * each image is wrapped in a <figure> with a <figcaption> displaying
 * the image identifier (e.g. "S1 Top"). Users can filter by section and
 * click images to view them in a lightbox.
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

  // Load gallery metadata (JSON array of {id, section, src})
  const resp = await fetch(metadataJson);
  galleryData = await resp.json();

  /**
   * Populate the drop-down filter with unique section values from the
   * metadata. Includes an "All" option to show all sections.
   */
  function populateFilterOptions() {
    const sections = ["All", ...new Set(galleryData.map(x => x.section))];
    sections.forEach(sec => {
      const opt = document.createElement("option");
      opt.value = sec;
      opt.textContent = sec === "All" ? "All Sections" : sec;
      sectionFilter.appendChild(opt);
    });
  }

  /**
   * Render the current page of gallery items based on the selected
   * section filter and pagination settings. Each item is wrapped in
   * a <figure> with a <figcaption> showing its id.
   */
  function renderPage() {
    // Filter the data by section if a specific section is selected
    const filtered = currentFilter === "All"
      ? galleryData
      : galleryData.filter(x => x.section === currentFilter);

    // Calculate the total number of pages and clamp the current page
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    // Build HTML for each gallery item: <figure><figcaption>…</figcaption><img …></figure>
    galleryGrid.innerHTML = items
      .map(item =>
        `<figure class="gallery-item">
           <figcaption>${item.id}</figcaption>
           <img src="${item.src}" alt="${item.id}">
         </figure>`
      )
      .join("");

    // Update pagination controls
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // Bind click events to each image to open it in the lightbox
    document.querySelectorAll("#galleryGrid img").forEach(img => {
      img.addEventListener("click", () => {
        lightboxImg.src = img.src;
        lightbox.classList.add("is-open");
      });
    });
  }

  // Filter change event: reset page and re-render
  sectionFilter.addEventListener("change", e => {
    currentFilter = e.target.value;
    currentPage = 1;
    renderPage();
  });

  // Pagination controls
  prevBtn.addEventListener("click", () => { currentPage--; renderPage(); });
  nextBtn.addEventListener("click", () => { currentPage++; renderPage(); });

  // Lightbox controls
  closeBtn.addEventListener("click", () => lightbox.classList.remove("is-open"));
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.classList.remove("is-open");
  });

  // Initialize the gallery
  populateFilterOptions();
  renderPage();
})();