/**
 * Progress Rail hero.
 *
 * Authored structure (Hero convention, 1 column):
 *   Row 1 cell: background media — a poster <picture> plus, optionally, a link
 *               to a background video (....mp4). The importer preserves the video
 *               as a plain <a href="....mp4"> so the URL survives round-tripping.
 *   Row 2 cell: content — heading + CTA, overlaid on the media.
 *
 * decorate() upgrades a background-video link into an autoplaying, muted,
 * looping, inline <video> (using the poster image from the <picture>), matching
 * the source site's hero. If the video can't play, the poster remains visible.
 */
export default function decorate(block) {
  const mediaCell = block.querySelector(':scope > div:first-child > div') || block.querySelector(':scope > div:first-child');

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // Find a background-video link (....mp4 / .webm / .ogv), if the author supplied one.
  const videoLink = [...block.querySelectorAll(':scope > div:first-child a')]
    .find((a) => /\.(mp4|webm|ogv)(\?|$)/i.test(a.getAttribute('href') || ''));

  if (videoLink && mediaCell) {
    const src = videoLink.getAttribute('href');
    const poster = block.querySelector(':scope > div:first-child picture img');

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
