/* eslint-disable */
/* global WebImporter */
/**
 * Parser for pr-teaser. Base: hero (teaser variant).
 * Source: https://www.progressrail.com/en/ (div.hero.block.teaser)
 * Generated for the Progress Rail homepage migration.
 *
 * Native AEM EDS markup: div.hero.block.teaser with .body-wrapper (h3 + copy +
 * CTA) and .media-wrapper (<picture>/<img>).
 *
 * Hero teaser variant — 1 column:
 *   Row 1: block name (added by createBlock)
 *   Row 2: media cell — the <picture>/<img> (promoted to a usable src).
 *   Row 3: content cell — H3 "ADVANCED RAIL TECHNOLOGY" + paragraph + CTA
 *          "LEARN MORE" (/en/segments/rail-technology).
 */
export default function parse(element, { document }) {
  const cells = [];

  // ---- Row 2: media ----
  const mediaScope = element.querySelector('.media-wrapper') || element;
  let media = null;
  const picture = mediaScope.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      const cur = img.getAttribute('src');
      if (!cur || cur.startsWith('data:')) {
        const source = picture.querySelector('source[srcset]');
        if (source) img.setAttribute('src', source.getAttribute('srcset').split(',')[0].trim().split(' ')[0]);
      }
    }
    media = picture;
  } else {
    const img = mediaScope.querySelector('img');
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      const cur = img.getAttribute('src');
      if (cur && !cur.startsWith('data:')) media = img;
    }
  }
  if (media) cells.push([media]);

  // ---- Row 3: content (heading + copy + CTA) ----
  const bodyScope = element.querySelector('.body-wrapper') || element;
  const contentCell = [];

  const titleEl = bodyScope.querySelector('h1, h2, h3, h4, .title, [class*="title"]');
  if (titleEl && titleEl.textContent.trim()) {
    const h3 = document.createElement('h3');
    h3.textContent = titleEl.textContent.trim();
    contentCell.push(h3);
  }

  bodyScope.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('a')) return; // skip CTA paragraphs here
    if (p.textContent.trim()) {
      const para = document.createElement('p');
      para.textContent = p.textContent.trim();
      contentCell.push(para);
    }
  });

  const ctaEl = bodyScope.querySelector('.button-wrapper a[href], a.button, a.cta, a[href]');
  if (ctaEl && ctaEl.getAttribute('href')) {
    const a = document.createElement('a');
    a.href = ctaEl.getAttribute('href');
    if (ctaEl.getAttribute('title')) a.title = ctaEl.getAttribute('title');
    a.textContent = ctaEl.textContent.trim();
    contentCell.push(a);
  }

  // Empty-block guard.
  if (!media && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  if (contentCell.length) cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'pr-teaser', cells });
  element.replaceWith(block);
}
