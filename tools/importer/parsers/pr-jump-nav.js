/* eslint-disable */
/* global WebImporter */
/**
 * Parser for pr-jump-nav. Base: custom in-page navigation strip.
 * Source: https://www.progressrail.com/en/ (div.jump-nav.block)
 * Generated for the Progress Rail homepage migration.
 *
 * Native AEM EDS markup: div.jump-nav.block > nav > (ul of anchor links) + a
 * "CONTACT US" CTA (p.button-wrapper > a.button.cta).
 *
 * Custom block — 1 column:
 *   Row 1: block name (added by createBlock)
 *   Row 2: single cell holding the <ul> of the 4 in-page anchor links
 *          (FEATURED, NEWS & EVENTS, SUPPLY CHAIN, GIFTS & APPAREL) followed by
 *          the CONTACT US CTA link (/en/services/customer-service). Links are
 *          preserved as real <a> elements.
 */
export default function parse(element, { document }) {
  const contentCell = [];

  // The anchor-link list.
  const list = element.querySelector('ul');
  if (list) {
    // Strip transient AEM attributes (e.g. aria-current) but keep the links.
    list.querySelectorAll('a[aria-current]').forEach((a) => a.removeAttribute('aria-current'));
    contentCell.push(list);
  }

  // The CONTACT US CTA — keep it as a real link.
  const ctaEl = element.querySelector('.button-wrapper a[href], a.button, a.cta');
  if (ctaEl && ctaEl.getAttribute('href')) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = ctaEl.getAttribute('href');
    if (ctaEl.getAttribute('title')) a.title = ctaEl.getAttribute('title');
    a.textContent = ctaEl.textContent.trim();
    p.append(a);
    contentCell.push(p);
  }

  // Empty-block guard.
  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'pr-jump-nav', cells });
  element.replaceWith(block);
}
