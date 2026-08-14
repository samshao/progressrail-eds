/*
 * Jump Nav Block
 * A horizontal strip of in-page anchor links with a right-aligned CTA.
 *
 * Authored structure (pre-decoration): the block contains a list of links
 * (the jump/anchor links) followed optionally by a final link that acts as
 * the call-to-action (e.g. "Contact Us"). The CTA is detected as a link
 * already styled as a button (`a.button`) or, failing that, the last link.
 *
 * Once built, the strip sticks to the top of the viewport on scroll and
 * underlines whichever jump link's target section is currently in view,
 * matching the source site's behavior.
 */

/**
 * Fixes the block to the top of the viewport once its natural position
 * scrolls past it, using an IntersectionObserver sentinel left behind at
 * its original spot (`position: sticky` can't do this here — see the CSS
 * comment). A spacer holds the block's height in the flow while it's
 * fixed, so removing it doesn't jump the rest of the page up.
 * @param {Element} block The pr-jump-nav block element
 */
function setupSticky(block) {
  const spacer = document.createElement('div');
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  block.before(sentinel, spacer);

  const observer = new IntersectionObserver(([entry]) => {
    const stuck = entry.boundingClientRect.top < 0;
    block.classList.toggle('is-stuck', stuck);
    spacer.style.height = stuck ? `${block.getBoundingClientRect().height}px` : '0';
  }, { threshold: 0 });
  observer.observe(sentinel);
}

// Must match the `scroll-margin-top` given to headings/sections in
// styles.css. A click-triggered anchor jump lands the target's top at
// exactly this offset — if this threshold were any smaller (e.g. derived
// from the sticky bar's own, shorter, height) the just-landed target
// would never satisfy "has this section been passed?" immediately after
// the click, and the previous link would stay active until the user
// scrolled further. Keeping both in one place avoids that drift.
const ANCHOR_SCROLL_OFFSET = 100;

/**
 * Highlights the nav link whose target section is currently in view.
 * Tracked by scroll position rather than a narrow IntersectionObserver band,
 * since a fast scroll (flick, Page Down) can jump straight past a narrow
 * band between two animation frames and never register the crossing.
 * @param {Element[]} navLinks The jump-nav anchor elements
 */
function setupScrollSpy(navLinks) {
  const targets = navLinks
    .map((a) => {
      const { hash } = new URL(a.href, window.location.href);
      const target = hash && document.getElementById(hash.slice(1));
      return target ? { link: a, target } : null;
    })
    .filter(Boolean);
  if (!targets.length) return;

  const setActive = (link) => {
    navLinks.forEach((a) => a.classList.toggle('active', a === link));
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    // the last target whose top has already crossed the line; falls back
    // to the first jump link (e.g. "Featured") if none have yet. A couple
    // px of tolerance absorb the sub-pixel layout this page renders at —
    // a target that just landed via scroll-margin-top can sit at e.g.
    // 100.2px, a hair over an exact 100 threshold, and never register.
    const passed = (t) => t.target.getBoundingClientRect().top <= ANCHOR_SCROLL_OFFSET + 2;
    const current = targets.filter(passed).pop();
    setActive(current ? current.link : navLinks[0]);
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });

  // Re-measure on any layout shift, not just scroll/resize — the initial
  // call can otherwise capture stale target positions from before images
  // or fonts finish loading and never get a scroll event to correct it.
  new ResizeObserver(() => window.requestAnimationFrame(update)).observe(document.body);

  update();
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];
  if (!links.length) return;

  // Determine the CTA: prefer an explicit button link, else the last link.
  let cta = links.find((a) => a.classList.contains('button'));
  if (!cta) cta = links[links.length - 1];

  const navLinks = links.filter((a) => a !== cta);

  // The authored hrefs carry the source's own path convention (e.g.
  // "/en/#featured", trailing slash), which may not match how this page
  // is actually served (e.g. "/en", no trailing slash) — clicking would
  // navigate to a different, likely-404ing path instead of just jumping
  // to the anchor on the current page. Normalize same-page anchors to
  // the page's real path.
  navLinks.forEach((a) => {
    try {
      const url = new URL(a.getAttribute('href'), window.location.href);
      const samePage = url.pathname.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '');
      if (url.hash && samePage) a.href = window.location.pathname + url.hash;
    } catch { /* malformed href — leave it alone */ }
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Jump navigation');

  const ul = document.createElement('ul');
  navLinks.forEach((a) => {
    const li = document.createElement('li');
    li.append(a);
    ul.append(li);
  });
  nav.append(ul);

  if (cta) {
    const wrapper = document.createElement('p');
    wrapper.className = 'button-wrapper';
    cta.classList.add('button');
    wrapper.append(cta);
    nav.append(wrapper);
  }

  block.textContent = '';
  block.append(nav);

  setupSticky(block);
  setupScrollSpy(navLinks);
}
