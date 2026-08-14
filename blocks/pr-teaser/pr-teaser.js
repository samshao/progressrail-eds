/**
 * Progress Rail teaser.
 *
 * Authored structure (2 rows, matching pr-hero's convention):
 *   Row 1 cell: media — a <picture>.
 *   Row 2 cell: content — heading + copy + CTA.
 *
 * At desktop widths this uses the same full-bleed-media-with-overlaid-text
 * layout as pr-hero (verified via getBoundingClientRect: the source's
 * media-wrapper spans the block's entire width, with the text panel
 * positioned on top of it and a dark gradient — not a solid panel —
 * providing contrast), just with its own narrower text-panel width and a
 * stronger, more opaque gradient. Below 900px it stacks image-then-copy
 * like a plain two-row block instead.
 */
export default function decorate(block) {
  const [mediaRow, bodyRow] = [...block.children];
  if (mediaRow) mediaRow.className = 'pr-teaser-media';
  if (bodyRow) bodyRow.className = 'pr-teaser-body';

  if (!block.querySelector(':scope > .pr-teaser-media picture')) {
    block.classList.add('no-image');
  }
}
