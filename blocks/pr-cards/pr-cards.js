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
    // footer, so it gets a divider + chevron instead of running into the body copy
    const body = li.querySelector('.pr-cards-card-body');
    const lastP = body && body.lastElementChild;
    const lastLink = lastP && lastP.tagName === 'P' && lastP.querySelector('a');
    if (lastLink && lastP.textContent.trim() === lastLink.textContent.trim()) {
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
