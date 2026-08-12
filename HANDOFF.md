# Progress Rail → AEM Edge Delivery — Handoff

Migrated the Progress Rail homepage (https://www.progressrail.com/en/) into this
AEM Edge Delivery Services project (aem-boilerplate base).

## What's in this repo

- **Blocks** (`blocks/`): `pr-hero`, `pr-jump-nav`, `pr-cards`, `pr-teaser`,
  `pr-columns`, `pr-video` (JS + CSS each). Boilerplate `cards/columns/hero/
  header/footer/fragment/widget` are unmodified base blocks.
- **Migrated content**: `content/en.plain.html` (homepage → `/en`). Contains the
  media hero, jump-nav strip, 4-card featured grid, and the company-intro
  (default content) + teaser + 2-col promo grid + video section, with a `dark`
  section-metadata on the hero.
- **Import infrastructure** (`tools/importer/`): `page-templates.json`
  (template `progressrail-home`), `parsers/pr-*.js`, `transformers/
  progressrail-cleanup.js` + `progressrail-sections.js`,
  `import-progressrail-home.js`, `urls-progressrail-home.txt`.
- **Global design** (`styles/styles.css`): Progress Rail brand tokens —
  Caterpillar yellow `#ffcd11` CTAs, Roboto / Roboto Condensed, near-black
  `#131313` text. CTA style on `a.button.cta`.
- **Nav + footer fragment sources** (`tools/nav-footer-source/nav.html`,
  `footer.html`) — upload to the content source as `/nav` and `/footer`.

## Remaining setup (console steps — not automatable)

1. **Install AEM Code Sync** GitHub app on `samshao/progressrail-eds`.
2. **Wire a content source.** `fstab.yaml` currently points at Document
   Authoring: `https://content.da.live/samshao/progressrail-eds/`. Create that
   DA space (or change `fstab.yaml` to your Drive/SharePoint mountpoint).
3. **Upload content** to the content source:
   - the homepage: `content/en.plain.html` → `/en`
   - `tools/nav-footer-source/nav.html` → `/nav`
   - `tools/nav-footer-source/footer.html` → `/footer`
   For DA: `curl -X POST -F "data=@<file>.html;type=text/html" \
     "https://admin.da.live/source/samshao/progressrail-eds/<path>.html"`
4. **Preview + publish** each path:
   `POST https://admin.hlx.page/{preview|live}/samshao/progressrail-eds/main/<path>`
5. **Verify** the live page: `https://main--progressrail-eds--samshao.aem.live/en`

## Re-running the import (if source content changes)

```
# bundle + run (uses the excat content-import runner)
tools/importer/import-progressrail-home.js  →  content/en.plain.html
urls-progressrail-home.txt lists the source URL.
```

## Notes

- Source site is itself EDS, so its DOM already used EDS block conventions;
  parsers emit standard Block Collection tables.
- Images are EDS-optimized `media_*.jpg` URLs (no Scene7/Dynamic Media), so no
  DM auto-block/dispatcher was needed.
- A Facebook tracking pixel from the source is stripped by
  `progressrail-cleanup.js` (afterTransform + body-level `<noscript>` removal).
