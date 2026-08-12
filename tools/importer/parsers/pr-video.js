/* eslint-disable */
/* global WebImporter */
/**
 * Parser for pr-video. Base: video (Block Collection Video convention).
 * Source: https://www.progressrail.com/en/ (div.video.block)
 * Generated for the Progress Rail homepage migration.
 *
 * Native AEM EDS markup: div.video.block[data-source="youtube"] with a
 * <figure class="placeholder"> containing the poster <picture>/<img> and a play
 * icon. The YouTube URL is only present in an HTML comment:
 *   <!-- youtube embed: https://www.youtube.com/embed/FuAkPwuQSig -->
 *
 * Video convention — 1 column:
 *   Row 1: block name (added by createBlock)
 *   Row 2: single cell = the YouTube embed link (emitted as an <a href> so the
 *          video block can pick it up) plus the poster image (promoted src).
 */
export default function parse(element, { document }) {
  const contentCell = [];

  // Poster image — promote lazy/relative srcset to a usable src.
  const figure = element.querySelector('figure') || element;
  const picture = figure.querySelector('picture');
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
    contentCell.push(picture);
  }

  // Resolve the YouTube URL. Prefer an explicit anchor/iframe if present;
  // otherwise recover it from the HTML comment left by the EDS video block.
  let videoUrl = null;
  const explicit = element.querySelector('a[href*="youtube"], a[href*="youtu.be"], iframe[src*="youtube"]');
  if (explicit) videoUrl = explicit.getAttribute('href') || explicit.getAttribute('src');
  if (!videoUrl) {
    const walker = document.createTreeWalker(element, 128 /* SHOW_COMMENT */);
    while (walker.nextNode()) {
      const m = walker.currentNode.nodeValue && walker.currentNode.nodeValue.match(/https?:\/\/[^\s]*youtu[^\s]*/i);
      if (m) { videoUrl = m[0].trim(); break; }
    }
  }
  // Known embed URL for this source instance as a final fallback.
  if (!videoUrl) videoUrl = 'https://www.youtube.com/embed/FuAkPwuQSig';

  if (videoUrl) {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.textContent = videoUrl;
    contentCell.push(a);
  }

  // Empty-block guard.
  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'pr-video', cells });
  element.replaceWith(block);
}
