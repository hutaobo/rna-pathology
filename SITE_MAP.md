# RNA-Pathology.com — Site Map (Website Structure)

Last updated: 2025-12-29  
Repo: hutaobo/rna-pathology

## 1. Top-level entry pages (Root)
These are the main user-facing entry points.

- `/index.html`
  - Homepage. Primary navigation hub.
- `/database.html`
  - Database overview / public-facing entry to datasets & schema.
- `/challenge.html`
  - Interactive quiz/challenge page (cell type guessing).
- `/favicon.ico`
  - Site icon used by browsers and search engines.
- `/robots.txt` (optional)
  - Search engine crawling rules (add if needed).
- `/sitemap.xml` (optional)
  - Search engine sitemap (add if needed).

## 2. Directories (What lives where)

### `/docs/`
Human-readable documentation pages.
Typical contents:
- `roadmap.*` — roadmap planning
- `schema_v*.html|md` — schema documentation / overview
- policies and compliance notes (e.g., GDPR, data policy)

Rules:
- Docs should be linkable from the site (homepage or footer).
- Prefer `.html` for user-facing docs; keep `.md` for internal drafts if needed.

### `/datasets/`
Dataset “cards” / dataset detail pages.
Typical contents:
- `human_breast_biomarkers_s1_bot.html`
- `human_breast_biomarkers_s2_top.html`
- other dataset-specific pages

Rules:
- Naming convention: `datasetname_section_position.html`
  - Example: `human_breast_biomarkers_s2_top.html`
- Keep style consistent (same header/meta/analytics/footer).
- If many pages follow the same pattern, consider a template or generator later.

### `/access/`
Account-related pages (auth, login, registration, profile).
Typical contents:
- `index.html` (if used as /access/ landing)
- `login.html`, `register.html`, `profile.html` (if/when added)

Rules:
- Keep all auth/account UI here.
- Any Supabase auth callbacks or redirects should be documented in MAINTENANCE.md.

### `/assets/` (recommended if not already present)
Static assets: images, icons, css, js.
Typical contents:
- `/assets/img/*` — images, logos
- `/assets/css/*` — shared stylesheets
- `/assets/js/*` — shared scripts

Rules:
- Prefer shared assets here rather than duplicating per-page.
- Use relative paths carefully to avoid GitHub Pages path issues.

## 3. Shared site components (Where to edit common things)

### Navigation (top menu)
- Usually defined in: `/index.html`
- If duplicated across pages:
  - Consider extracting to `/assets/js/nav.js` and injecting into pages later.

### Footer
- If duplicated across many pages:
  - Keep wording consistent (copyright, links).

### Analytics (GA4)
- Script included in `<head>` of pages.
- GA4 ID currently used:
  - `G-B2L5CDD57`

### SEO / Meta
Each public page should have:
- `<title>`
- `<meta name="description">`
- `<meta name="viewport">`
- favicon link: `<link rel="icon" href="/favicon.ico">`

## 4. “Source of truth” rules (to avoid getting lost later)

- Public pages should be `.html` and reachable via navigation.
- Draft notes can be `.md`, but convert to `.html` when meant for visitors.
- Put shared images/scripts/styles under `/assets/` (recommended).
- Keep dataset pages under `/datasets/`.
- Keep auth/account pages under `/access/`.

## 5. Quick checklist when adding a new page
- [ ] Decide location: root vs `/docs/` vs `/datasets/` vs `/access/`
- [ ] Add title + meta description + favicon + GA4
- [ ] Link it from navigation or relevant index page
- [ ] Test URL on GitHub Pages / custom domain
- [ ] Add a line to `CHANGELOG.md` (when you create it)
