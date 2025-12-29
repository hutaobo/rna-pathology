# RNA-Pathology.com — Maintenance Guide

Last updated: 2025-12-29  
Repo: hutaobo/rna-pathology  
Primary domain: https://www.rna-pathology.com

This doc is a practical “how to operate the website” playbook:
what to edit, where to edit, and how to verify changes.

---

## 1. Core workflow (edit → publish → verify)

### A) Edit locally (recommended)
1. Pull latest:
   - `git pull`
2. Edit files (HTML/CSS/JS/MD).
3. Quick sanity check:
   - Search for broken links: `href="..."`, `src="..."`.
   - Check paths: `/` vs `./` vs `../` (see section 4).

### B) Commit & push
1. `git status`
2. `git add -A`
3. `git commit -m "Describe the change"`
4. `git push`

### C) Verify after deployment
- Visit:
  - https://www.rna-pathology.com (homepage)
  - the specific page URL you changed
- Hard refresh:
  - macOS: Cmd+Shift+R
  - Windows/Linux: Ctrl+Shift+R
- If changes don’t show up:
  - Wait for GitHub Pages build to finish (Actions / Pages build status)
  - Clear cache / try another browser / incognito

---

## 2. Where to edit common things

### A) Navigation (top menu)
- Usually in: `/index.html`
- If other pages have their own nav (duplicated code):
  - keep labels and links consistent
  - long-term improvement: extract to `/assets/js/nav.js` and inject

### B) Footer
- Often duplicated across pages.
- Keep consistent links: Docs / Policies / Contact / GitHub.

### C) Google Analytics (GA4)
- GA4 script lives in `<head>` on pages.
- Current GA4 Measurement ID (as used in code): `G-B2L5CDD57`
Checklist:
- Ensure the script is present on all public-facing pages.
- Ensure no duplicate GA snippets on the same page.

### D) Favicon
- Expected path:
  - `/favicon.ico`
- HTML head should include:
  - `<link rel="icon" href="/favicon.ico">`
Notes:
- Favicon updates can be cached aggressively (browser + Google).
- Use hard refresh, and for Google results allow time for recrawl.

### E) Supabase (Accounts / Auth)
- Auth-related pages should live under `/access/`.
- Keep a note of:
  - Supabase project URL
  - Auth redirect URLs configured in Supabase
  - Which pages rely on Supabase keys / anon public key usage

(If keys are embedded in client-side JS, treat them as public “anon” keys only; never commit service role keys.)

---

## 3. Common tasks

### Task: Add a new page
1. Choose location:
   - Root: major entry pages (home, database, challenge)
   - `/docs/`: documentation pages
   - `/datasets/`: dataset cards/detail pages
   - `/access/`: login/register/profile
2. Copy a known-good HTML skeleton (title/meta/favicon/GA4).
3. Add navigation link (and/or from the relevant index page).
4. Verify URL works under:
   - `https://www.rna-pathology.com/<path>`
5. Record change in `CHANGELOG.md`.

### Task: Fix a 404 page
Checklist:
- Confirm file exists in repo at the expected path.
- Case sensitivity matters:
  - `Access/` ≠ `access/`
- Confirm URL path matches file path:
  - `/access/` typically maps to `/access/index.html`
- Confirm links are correct relative vs absolute (section 4).
- If GitHub Pages / custom domain involved:
  - Confirm CNAME and Pages settings haven’t drifted.

### Task: Update dataset pages in bulk
Risks:
- Copy/paste drift across pages.

Safer approach:
- Keep a “canonical template” file under `/docs/templates/` (optional).
- When updating styling or head metadata:
  - update template first
  - then apply to dataset pages systematically

---

## 4. Path rules (this prevents 80% of mysterious breakage)

### A) Absolute path (starts with `/`)
Example:
- `<link rel="icon" href="/favicon.ico">`

Meaning:
- “From the site root.”

Pros:
- Stable across nested pages (`/datasets/...`, `/docs/...`).

Cons:
- If you ever host under a subpath (rare for your setup), needs care.

### B) Relative path (starts with `./` or `../`)
Example:
- `./style.css`
- `../assets/img/logo.png`

Pros:
- Works in local folder context.

Cons:
- Easy to break when moving files to another folder.

Recommendation:
- Use absolute paths for shared site assets:
  - `/assets/...`, `/favicon.ico`
- Use relative paths only for truly local assets.

---

## 5. Release hygiene (small habits, big payoff)

- Keep `SITE_MAP.md` updated when you:
  - add a new directory, or add/remove major pages
- Add one line per change in `CHANGELOG.md`
- Prefer small commits with clear messages:
  - “Fix /access/ 404 by adding index.html”
  - “Unify dataset card CSS and meta tags”

---

## 6. Troubleshooting quick hits

### A) “My changes don’t show up”
- Hard refresh
- Check GitHub Pages build status
- Confirm you pushed to the branch used by Pages
- Try another browser / incognito

### B) “Works on GitHub Pages but not custom domain”
- Custom domain DNS (CNAME/A records) mismatch
- HTTPS / certificate provisioning delay
- Cached DNS on your machine

### C) “Some pages work, others 404”
- Wrong paths in links
- Missing `index.html` in folder routes
- Case sensitivity differences
