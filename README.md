# RNA-Pathology.com

**RNA-Pathology.com** is a public, web-based platform for RNA pathology–related datasets, documentation, and interactive features (e.g., dataset pages and challenges).  
Live site: https://www.rna-pathology.com

This repository contains the static website source used by GitHub Pages (with a custom domain).

---

## Quick links (Start here)

- **Site structure map:** `SITE_MAP.md`
- **How to maintain / publish:** `MAINTENANCE.md`
- **What changed over time:** `CHANGELOG.md`

---

## Repository structure (high level)

Common locations (see `SITE_MAP.md` for details):

- `index.html` — Homepage
- `database.html` — Database overview / entry page
- `challenge.html` — Interactive challenge page
- `docs/` — Documentation pages (schema, roadmap, policies, etc.)
- `datasets/` — Dataset pages (dataset cards / details)
- `access/` — Account-related pages (login/register/profile, etc.)
- `assets/` — Shared static assets (recommended: css/js/img)

---

## Editing & publishing (TL;DR)

Typical workflow:
1. Edit files locally (recommended), or directly in GitHub.
2. Commit changes to the branch used by GitHub Pages.
3. Verify changes on the live site:
   - https://www.rna-pathology.com
   - and the specific page you edited

Troubleshooting and detailed procedures are in `MAINTENANCE.md`.

---

## Conventions

### Paths
- Prefer absolute paths for shared assets:
  - `/assets/...`, `/favicon.ico`
- Avoid fragile relative paths when possible.

### Analytics
- GA4 snippet should appear on all public-facing pages.
- Current GA4 Measurement ID used in page templates: `G-B2L5CDD57`

### Dataset pages
- Keep dataset pages under `datasets/`.
- Naming convention example:
  - `human_breast_biomarkers_s2_top.html`
- Keep metadata and styling consistent across pages.

---

## Roadmap (short)

Near-term goals (kept lightweight; details can live in `docs/roadmap.*`):
- Consolidate shared layout (nav/footer) to reduce duplication
- Improve documentation pages (schema, roadmap) into polished HTML pages
- Expand datasets section and standardize dataset page templates
- Build/iterate interactive “challenge” features

---

## License / usage

Unless otherwise stated, content and code in this repository are provided as-is.  
(You can add a formal license later if needed.)
