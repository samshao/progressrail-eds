/* eslint-disable */
/* global WebImporter */
/**
 * Parser for pr-columns. Base: columns (Block Collection Columns convention).
 * Source: https://www.progressrail.com/en/ (div.columns.block.cols-2)
 * Generated for the Progress Rail homepage migration.
 *
 * Native AEM EDS markup: div.columns.block.cols-2 > div[data-row] (one per row),
 * each containing a .media-wrapper (<picture>/<img>) and a .body-wrapper
 * (h3 + copy + CTA). The authored order of the two wrappers alternates per row.
 *
 * Columns convention — 2 columns, 4 rows (one per promo item):
 *   Row 1: block name (added by createBlock)
 *   Then one row per promo item, PRESERVING the authored image/text side order:
 *     row1 = [image, text]  NEWS & EVENTS  (/en/company/news)
 *     row2 = [text, image]  SUPPLY CHAIN   (/en/services/supply-chain)
 *     row3 = [image, text]  VALUES IN ACTION (/en/company/codeof-conduct)
 *     row4 = [text, image]  GIFTS & APPAREL, Shop Now
 *                           (https://progressrailstore.com/default.aspx#)
 *   Each text cell = H3 + paragraph + CTA link. Each media cell = picture/img.
 */
export default function parse(element, { document }) {
  // Promote a lazy/relative <picture> or <img> to a usable src.
  const promotePicture = (scope) => {
    const picture = scope.querySelector('picture');
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
      return picture;
    }
    const img = scope.querySelector('img');
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      const cur = img.getAttribute('src');
      if (cur && !cur.startsWith('data:')) return img;
    }
    return null;
  };

  // Build a text cell (heading + copy + CTA) from a .body-wrapper.
  const buildTextCell = (scope) => {
    const cell = [];
    const titleEl = scope.querySelector('h1, h2, h3, h4');
    if (titleEl && titleEl.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      cell.push(h3);
    }
    scope.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('a')) return; // CTA paragraphs handled separately
      if (p.textContent.trim()) {
        const para = document.createElement('p');
        para.textContent = p.textContent.trim();
        cell.push(para);
      }
    });
    const ctaEl = scope.querySelector('.button-wrapper a[href], a.button, a.cta, a[href]');
    if (ctaEl && ctaEl.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = ctaEl.getAttribute('href');
      if (ctaEl.getAttribute('title')) a.title = ctaEl.getAttribute('title');
      a.textContent = ctaEl.textContent.trim();
      cell.push(a);
    }
    return cell;
  };

  // Turn any wrapper (media or body) into its cell content, preserving order.
  const wrapperToCell = (wrapper) => {
    if (wrapper.classList.contains('media-wrapper') || wrapper.querySelector('picture, img')) {
      const media = promotePicture(wrapper);
      // If a wrapper holds both text and media, prefer media only when it's a media-wrapper.
      if (wrapper.classList.contains('media-wrapper')) return media || '';
    }
    if (wrapper.classList.contains('body-wrapper')) {
      const cell = buildTextCell(wrapper);
      return cell.length ? cell : '';
    }
    // Fallback: decide by content.
    const media = promotePicture(wrapper);
    if (media && !wrapper.querySelector('h1, h2, h3, h4, p')) return media;
    const cell = buildTextCell(wrapper);
    return cell.length ? cell : (media || '');
  };

  const cells = [];
  const rows = Array.from(element.querySelectorAll(':scope > div'));

  rows.forEach((row) => {
    // Two column wrappers in authored order (media-wrapper / body-wrapper).
    const wrappers = Array.from(row.querySelectorAll(':scope > .media-wrapper, :scope > .body-wrapper'));
    if (wrappers.length === 0) return;
    const rowCells = wrappers.map((w) => wrapperToCell(w));
    // Pad to 2 columns to keep the table well-formed.
    while (rowCells.length < 2) rowCells.push('');
    cells.push(rowCells);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'pr-columns', cells });
  element.replaceWith(block);
}
