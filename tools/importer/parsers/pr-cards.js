/* eslint-disable */
/* global WebImporter */
/**
 * Parser for pr-cards. Base: cards (Block Collection Cards convention).
 * Source: https://www.progressrail.com/en/ (div.cards.block)
 * Generated for the Progress Rail homepage migration.
 *
 * Native AEM EDS markup: div.cards.block > ul > li.linked, each li with a
 * .media-wrapper (<picture>/<img>), a .body-wrapper (h2 + description <p>), and
 * a <footer> with the "Learn More" link.
 *
 * Cards convention — 2 columns, one row per card (4 cards):
 *   Row 1: block name (added by createBlock)
 *   Col 1: card image (<picture>/<img>, promoted to a usable src).
 *   Col 2: H2 title + description paragraph + "Learn More" link.
 * Cards: Careers (/en/careers), Sustainability (/en/company/sustainability),
 *        Community Outreach (/en/company/community-outreach),
 *        Customer Service (/en/services/customer-service).
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll(':scope > ul > li'));

  const cells = [];

  cards.forEach((card) => {
    // ---- Col 1: image (promote lazy/relative srcset to a usable src) ----
    let image = '';
    const picture = card.querySelector('picture');
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
      image = picture;
    } else {
      const img = card.querySelector('img');
      if (img) {
        const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
        const src = img.getAttribute('src');
        if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
        const cur = img.getAttribute('src');
        if (cur && !cur.startsWith('data:')) image = img;
      }
    }

    // ---- Col 2: title + description + Learn More link ----
    const body = card.querySelector('.body-wrapper') || card;
    const contentCell = [];

    const titleEl = body.querySelector('h1, h2, h3, h4');
    if (titleEl && titleEl.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = titleEl.textContent.trim();
      contentCell.push(h2);
    }

    body.querySelectorAll('p').forEach((p) => {
      if (p.closest('footer')) return;
      if (p.querySelector('a')) return; // skip button/CTA paragraphs here
      if (p.textContent.trim()) {
        const para = document.createElement('p');
        para.textContent = p.textContent.trim();
        contentCell.push(para);
      }
    });

    // "Learn More" link (lives in the card <footer>).
    const linkEl = card.querySelector('footer a[href], a[href]');
    if (linkEl && linkEl.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = linkEl.getAttribute('href');
      if (linkEl.getAttribute('title')) a.title = linkEl.getAttribute('title');
      a.textContent = linkEl.textContent.trim();
      contentCell.push(a);
    }

    // Skip empty cards.
    if (!image && contentCell.length === 0) return;

    cells.push([image, contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'pr-cards', cells });
  element.replaceWith(block);
}
