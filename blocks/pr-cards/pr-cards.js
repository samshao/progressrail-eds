import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // the "Featured" jump-nav link targets this section directly — there's
  // no heading here to auto-generate an id from (matching the source,
  // which sets the id on the section itself rather than adding a
  // visible heading)
  const section = block.closest('.section');
  if (section && !section.id) section.id = 'featured';

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'pr-cards-card-image';
      else div.className = 'pr-cards-card-body';
    });

    // split a trailing link-only paragraph (e.g. "Learn More") into its own
    // footer, pinned to the card's bottom edge regardless of how much body
    // copy precedes it (see .pr-cards-card-body's flex:1 in the CSS)
    const body = li.querySelector('.pr-cards-card-body');
    const lastP = body && body.lastElementChild;
    const lastLink = lastP && lastP.tagName === 'P' && lastP.querySelector('a');
    if (lastLink && lastP.textContent.trim() === lastLink.textContent.trim()) {
      // chevron icon, inlined (not decorateIcons' <img>) so its
      // currentColor fill matches the label — same icon as the header's
      // nav-drop chevron, just rotated to point right instead of down
      const chevron = document.createElement('span');
      chevron.className = 'icon icon-chevron';
      chevron.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">'
        + '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M1.54977 4.69112C1.74503 4.49586 2.06161 4.49586 2.25687 4.69112L7.99999 10.4342L13.7431 4.69112C13.9384 4.49586 14.2549 4.49586 14.4502 4.69112C14.6455 4.88639 14.6455 5.20297 14.4502 5.39823L8.68639 11.162C8.5988 11.2535 8.49378 11.3266 8.37749 11.377C8.25832 11.4286 8.12985 11.4552 7.99999 11.4552C7.87013 11.4552 7.74165 11.4286 7.62248 11.377C7.50619 11.3266 7.40117 11.2535 7.31358 11.162L1.54977 5.39823C1.3545 5.20297 1.3545 4.88639 1.54977 4.69112Z"/></svg>';
      lastLink.append(chevron);

      // a plain <div>, not <footer> — the page's <footer> landmark styling
      // (blocks/footer/footer.css) targets the bare footer tag and would
      // otherwise bleed into every card
      const footer = document.createElement('div');
      footer.className = 'pr-cards-card-footer';
      footer.append(lastP);
      li.append(footer);
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
