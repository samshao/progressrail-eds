/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Progress Rail section breaks and section metadata.
 *
 * Builds EDS section boundaries from the template's section definitions
 * (payload.template.sections) for the progressrail-home template. Four sections
 * (selectors verified against migration-work/cleaned.html; source is itself an
 * AEM Edge Delivery site):
 *   1. Media / Video Hero            (body > main > div.section.hero-container:nth-of-type(1))
 *                                    — style "dark" → emits Section Metadata.
 *   2. Jump Navigation Strip         (body > main > div.section.jump-nav-container)
 *                                    — style null → no Section Metadata.
 *   3. Featured Cards Grid           (#featured) — style null → no Section Metadata.
 *   4. Company Intro + Teaser + Promo Grid + Video
 *                                    (body > main > div.section.hero-container.columns-container.video-container.teaser)
 *                                    — style null → no Section Metadata.
 *
 * Behaviour (matches fortinet-sections.js / pr-sections.js in this repo):
 *   - Inserts an <hr> before every section except the first (section breaks).
 *   - Inserts a "Section Metadata" block after any section that declares a
 *     `style` (only the dark hero here).
 *
 * Runs in beforeTransform against the pristine DOM — at that point all four
 * section selectors still exist and match, so boundaries and section-metadata
 * land correctly. Block parsers later replace each section's block with its
 * table, but the inserted <hr> (an hr, not a div) and Section Metadata siblings
 * survive parsing and cleanup. Processing in reverse so our own DOM insertions
 * do not shift earlier section selectors. (Same rationale as
 * fortinet-sections.js.)
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : null;
  if (!sections || sections.length < 2) return;

  const { document } = payload;

  // Process in reverse so DOM insertions do not shift earlier section selectors.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) continue;

    let sectionEl;
    try {
      sectionEl = element.querySelector(section.selector);
    } catch (e) {
      sectionEl = null;
    }
    if (!sectionEl) continue;

    // Section Metadata block for sections that declare a style (dark hero).
    if (section.style) {
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.after(metadataBlock);
    }

    // Section break before every section except the first.
    if (i > 0) {
      sectionEl.before(document.createElement('hr'));
    }
  }
}
