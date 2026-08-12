/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Progress Rail site-wide cleanup.
 * Removes non-authorable global chrome and injected overlays so the import
 * contains only the page-level authorable content (hero, jump-nav, featured
 * cards, and the company-intro / teaser / columns / video section).
 *
 * All selectors below were verified against migration-work/cleaned.html for the
 * Progress Rail homepage (which is itself an AEM Edge Delivery site):
 *   - <header class="header-wrapper">           (site header, auto-populated shell)
 *   - <footer class="footer-wrapper">           (site footer, auto-populated shell)
 *   - <div id="onetrust-consent-sdk">           (OneTrust cookie consent root)
 *     - <div class="onetrust-pc-dark-filter ...">(consent modal dark backdrop)
 *     - <div id="onetrust-banner-sdk">           (consent banner)
 *     - <div id="onetrust-pc-sdk">               (preference centre panel)
 *
 * Runs in beforeTransform: this chrome is removed up front so it can never
 * interfere with block parsing, and so the section transformer (also
 * beforeTransform, keyed to `body > main > ...` and `#featured`) operates on a
 * DOM that contains only the four content sections. None of the section
 * selectors depend on header/footer position, so removing them here is safe.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-authorable global chrome (site shell header/footer) and the OneTrust
    // cookie-consent overlay. Listed with both the `body >` scoped selector and
    // the bare selector so removal works whether `element` is the body or main.
    WebImporter.DOMUtils.remove(element, [
      'body > header.header-wrapper', // site header (scoped)
      'header.header-wrapper', // site header
      'body > footer.footer-wrapper', // site footer (scoped)
      'footer.footer-wrapper', // site footer
      '#onetrust-consent-sdk', // OneTrust consent SDK root
      '#onetrust-banner-sdk', // OneTrust cookie banner
      '#onetrust-pc-sdk', // OneTrust preference centre panel
      '.onetrust-pc-dark-filter', // OneTrust consent modal dark backdrop
      'div[role="dialog"]', // generic cookie/consent overlay dialog
      'dialog', // native <dialog> cookie/consent overlay
    ]);

    // Strip any <script>/<style>/<noscript> anywhere in the tree (body-wide, not
    // just inside <main>) — never authorable content. The Facebook tracking
    // pixel (<noscript><img src="facebook.com/tr?id=..."></noscript>) is a
    // body-level sibling of <main>, so scoping this to main would miss it.
    element.querySelectorAll('script, style, noscript').forEach((n) => n.remove());

    // Also remove any analytics/tracking pixel <img> that sits directly in the
    // DOM (not wrapped in <noscript>), matched by tracking host/pattern.
    element.querySelectorAll('img[src*="facebook.com/tr"], img[src*="/tr?id="], img[src*="ct.pinterest"], img[src*="doubleclick"], img[src*="google-analytics"]').forEach((img) => {
      const wrap = img.closest('p, picture');
      (wrap || img).remove();
    });
  }
}
