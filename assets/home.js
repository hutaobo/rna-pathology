/* assets/home.js
   Home-only behavior:
   - Toggle body.rp-scrolled for header glass -> solid transition
   - Minimal footprint, no dependencies
*/
(function () {
  "use strict";

  function isHome() {
    return document.body && document.body.classList.contains("home");
  }

  if (!isHome()) return;

  const body = document.body;

  // Respect reduced motion: no extra effects needed
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ticking = false;

  function update() {
    const scrolled = (window.scrollY || window.pageYOffset || 0) > 12;
    body.classList.toggle("rp-scrolled", scrolled);
    ticking = false;
  }

  // Initial state
  update();

  function onScroll() {
    if (ticking) return;

    if (reduceMotion) {
      // Still update, just no RAF throttling needed
      update();
      return;
    }

    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();
