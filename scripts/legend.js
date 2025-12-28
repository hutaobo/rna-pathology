(function () {
  function parseLegend(text) {
    // 支持你这种格式：
    // IMAGE: xxx
    // LEGEND: yyy
    // 也支持直接写一段纯文本（没有 LEGEND: 也能显示）
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const legendLine = lines.find(l => l.toUpperCase().startsWith("LEGEND:"));
    if (legendLine) return legendLine.replace(/^LEGEND:\s*/i, "").trim();
    // fallback: 全文当 legend
    return lines.join("\n").trim();
  }

  async function attachLegendToImage(img) {
    const src = img.getAttribute("src");
    if (!src) return;

    const legendUrl = src + ".legend.txt";

    // 找到插入位置：优先 figure > figcaption；否则创建一个 div 放在图片后面
    let container = img.closest("figure");
    let captionEl = container ? container.querySelector("figcaption") : null;

    // HE 图目前不是 figure 包裹的，我们就创建一个 legend 块
    if (!captionEl) {
      captionEl = document.createElement("div");
      captionEl.className = "img-legend";
      img.insertAdjacentElement("afterend", captionEl);
    } else {
      // 如果已有 figcaption，我们在 figcaption 下方再加 legend（不覆盖原标题）
      const legendDiv = document.createElement("div");
      legendDiv.className = "img-legend";
      captionEl.insertAdjacentElement("afterend", legendDiv);
      captionEl = legendDiv;
    }

    captionEl.textContent = "Loading legend…";

    try {
      const res = await fetch(legendUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error("Missing legend file: " + legendUrl);

      const text = await res.text();
      const legend = parseLegend(text);

      if (!legend) {
        captionEl.textContent = "";
        captionEl.style.display = "none";
        return;
      }

      captionEl.textContent = legend;
    } catch (e) {
      // 如果没有 legend 文件，不报错，只隐藏（保持页面干净）
      captionEl.textContent = "";
      captionEl.style.display = "none";
    }
  }

  function init() {
    // 你页面里用的 class="zoomable"
    const images = Array.from(document.querySelectorAll("img.zoomable"));
    images.forEach(img => attachLegendToImage(img));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
