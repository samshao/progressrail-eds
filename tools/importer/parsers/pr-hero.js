/* eslint-disable */
/* global WebImporter */
/**
 * Parser for pr-hero. Base: hero (Block Collection Hero convention).
 * Source: https://www.progressrail.com/en/
 *         (div.section.hero-container:nth-of-type(1) div.hero.block:not(.teaser))
 * Generated for the Progress Rail homepage migration.
 *
 * Native AEM EDS markup: div.hero.block with .body-wrapper (title + CTA) and
 * .media-wrapper (background <picture> + background <video>).
 *
 * Hero convention — 1 column:
 *   Row 1: block name (added by createBlock)
 *   Row 2: background media cell — the <picture> AND the background mp4.
 *          The <video src="...hero-banner.mp4"> URL is preserved as an <a href>
 *          so it survives the import (markdown drops bare <video>).
 *   Row 3: content cell — H1 title ("We Keep You Rolling") + CTA link
 *          (a.button.cta "LEARN MORE" -> /en/company).
 */
export default function parse(element, { document }) {
  const cells = [];

  // ---- Row 2: background media (picture + video link) ----
  const mediaCell = [];

  const mediaScope = element.querySelector('.media-wrapper') || element;

  // Background picture — promote lazy/relative srcset to a usable <img> src.
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
    mediaCell.push(picture);
  }

  // Background video — preserve the mp4 URL as a link so it survives import.
  const video = mediaScope.querySelector('video[src], video source[src]');
  const videoSrc = video ? (video.getAttribute('src') || (video.querySelector('source[src]') && video.querySelector('source[src]').getAttribute('src'))) : null;
  if (videoSrc) {
    const a = document.createElement('a');
    a.href = videoSrc;
    // The mp4 URL is preserved in href so it survives import; the source <video>
    // has no visible text, so keep the label minimal to avoid diluting content.
    a.textContent = 'mp4';
    mediaCell.push(a);
  }

  if (mediaCell.length) cells.push([mediaCell]);

  // ---- Row 3: content (title + CTA) ----
  const contentCell = [];
  const bodyScope = element.querySelector('.body-wrapper') || element;

  const titleEl = bodyScope.querySelector('h1, .title, [class*="title"]');
  if (titleEl && titleEl.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.textContent = titleEl.textContent.trim();
    contentCell.push(h1);
  }

  const ctaEl = bodyScope.querySelector('a.button, a.cta, .button-wrapper a[href], a[href]');
  if (ctaEl && ctaEl.getAttribute('href')) {
    const a = document.createElement('a');
    a.href = ctaEl.getAttribute('href');
    if (ctaEl.getAttribute('title')) a.title = ctaEl.getAttribute('title');
    a.textContent = ctaEl.textContent.trim();
    contentCell.push(a);
  }

  // Empty-block guard.
  if (mediaCell.length === 0 && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  if (contentCell.length) cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'pr-hero', cells });
  element.replaceWith(block);
}
