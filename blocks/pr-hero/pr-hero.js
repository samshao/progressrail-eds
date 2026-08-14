/**
 * Progress Rail hero.
 *
 * Authored structure (Hero convention, 1 column):
 *   Row 1 cell: background media — a poster <picture> plus, optionally, a link
 *               to a background video (....mp4). The importer preserves the video
 *               as a plain <a href="....mp4"> so the URL survives round-tripping.
 *   Row 2 cell: content — heading + CTA, overlaid on the media.
 *
 * The two rows are marked as distinct layers (media full-bleed behind,
 * body centered on top) rather than left as plain divs, so the content
 * can be vertically centered in the media's height instead of just
 * top-padded — matching the source's layout.
 *
 * decorate() upgrades a background-video link into an autoplaying, muted,
 * looping, inline <video> (using the poster image from the <picture>), matching
 * the source site's hero. If the video can't play, the poster remains visible.
 */
export default function decorate(block) {
  const [mediaRow, bodyRow] = [...block.children];
  if (mediaRow) mediaRow.className = 'pr-hero-media';
  if (bodyRow) bodyRow.className = 'pr-hero-body';

  if (!block.querySelector(':scope > .pr-hero-media picture')) {
    block.classList.add('no-image');
  }

  // Find a background-video link (....mp4 / .webm / .ogv), if the author supplied one.
  const videoLink = mediaRow && [...mediaRow.querySelectorAll('a')]
    .find((a) => /\.(mp4|webm|ogv)(\?|$)/i.test(a.getAttribute('href') || ''));

  if (videoLink && mediaRow) {
    const src = videoLink.getAttribute('href');
    const poster = mediaRow.querySelector('picture img');

    const video = document.createElement('video');
    video.className = 'pr-hero-video';
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    video.preload = 'metadata';
    if (poster && poster.src) video.poster = poster.src;

    const source = document.createElement('source');
    source.src = src;
    source.type = src.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
    video.append(source);

    // Replace the link's wrapping <p> (or the link itself) with the video, so
    // the stray "mp4" text link never shows. The poster <picture> stays as the
    // fallback layer beneath the video.
    const wrapper = videoLink.closest('p') || videoLink;
    wrapper.replaceWith(video);

    block.classList.add('has-video');

    // If the video errors out, drop it so the poster image shows through.
    video.addEventListener('error', () => {
      video.remove();
      block.classList.remove('has-video');
    });
  }
}
