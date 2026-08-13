/**
 * Progress Rail teaser.
 *
 * Authored structure (2 rows, matching pr-hero's convention):
 *   Row 1 cell: media — a <picture>.
 *   Row 2 cell: content — heading + copy + CTA.
 *
 * Unlike pr-hero, the source renders this as a two-column split (a solid
 * dark panel for the text, image alongside it) rather than a full-bleed
 * background image with text overlaid — so the two rows are marked as
 * distinct columns instead of stacked layers.
 */
export default function decorate(block) {
  const [mediaRow, bodyRow] = [...block.children];
  if (mediaRow) mediaRow.className = 'pr-teaser-media';
  if (bodyRow) bodyRow.className = 'pr-teaser-body';

  if (!block.querySelector(':scope > .pr-teaser-media picture')) {
    block.classList.add('no-image');
  }
}
