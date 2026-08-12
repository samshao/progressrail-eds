/*
 * Jump Nav Block
 * A horizontal strip of in-page anchor links with a right-aligned CTA.
 *
 * Authored structure (pre-decoration): the block contains a list of links
 * (the jump/anchor links) followed optionally by a final link that acts as
 * the call-to-action (e.g. "Contact Us"). The CTA is detected as a link
 * already styled as a button (`a.button`) or, failing that, the last link.
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];
  if (!links.length) return;

  // Determine the CTA: prefer an explicit button link, else the last link.
  let cta = links.find((a) => a.classList.contains('button'));
  if (!cta) cta = links[links.length - 1];

  const navLinks = links.filter((a) => a !== cta);

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
}
