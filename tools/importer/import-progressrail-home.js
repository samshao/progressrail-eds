/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import prHeroParser from './parsers/pr-hero.js';
import prJumpNavParser from './parsers/pr-jump-nav.js';
import prCardsParser from './parsers/pr-cards.js';
import prTeaserParser from './parsers/pr-teaser.js';
import prColumnsParser from './parsers/pr-columns.js';
import prVideoParser from './parsers/pr-video.js';

// TRANSFORMER IMPORTS (Progress Rail only — do not import the Fortinet transformers)
import cleanupTransformer from './transformers/progressrail-cleanup.js';
import sectionsTransformer from './transformers/progressrail-sections.js';

// PARSER REGISTRY — keys match block names in the progressrail-home template
const parsers = {
  'pr-hero': prHeroParser,
  'pr-jump-nav': prJumpNavParser,
  'pr-cards': prCardsParser,
  'pr-teaser': prTeaserParser,
  'pr-columns': prColumnsParser,
  'pr-video': prVideoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (progressrail-home)
const PAGE_TEMPLATE = {
  name: 'progressrail-home',
  description: 'Progress Rail homepage: media/video hero, jump-nav strip, 4-card featured grid, and a company intro (default content) + teaser + 2-col promo grid + video section.',
  urls: [
    'https://www.progressrail.com/en/',
  ],
  blocks: [
    { name: 'pr-hero', instances: ['div.section.hero-container:nth-of-type(1) div.hero.block:not(.teaser)'] },
    { name: 'pr-jump-nav', instances: ['div.jump-nav.block'] },
    { name: 'pr-cards', instances: ['div.cards.block'] },
    { name: 'pr-teaser', instances: ['div.hero.block.teaser'] },
    { name: 'pr-columns', instances: ['div.columns.block.cols-2'] },
    { name: 'pr-video', instances: ['div.video.block'] },
  ],
  sections: [
    { id: 'rc2', name: 'Media / Video Hero', selector: 'body > main > div.section.hero-container:nth-of-type(1)', style: 'dark', blocks: ['pr-hero'], defaultContent: [] },
    { id: 'rc3', name: 'Jump Navigation Strip', selector: 'body > main > div.section.jump-nav-container', style: null, blocks: ['pr-jump-nav'], defaultContent: [] },
    { id: 'rc4', name: 'Featured Cards Grid', selector: '#featured', style: null, blocks: ['pr-cards'], defaultContent: [] },
    { id: 'rc5', name: 'Company Intro + Teaser + Promo Grid + Video', selector: 'body > main > div.section.hero-container.columns-container.video-container.teaser', style: null, blocks: ['pr-teaser', 'pr-columns', 'pr-video'], defaultContent: ['body > main > div.section.hero-container.columns-container.video-container.teaser > div.default-content-wrapper'] },
  ],
};

// TRANSFORMER REGISTRY
// progressrail-cleanup: beforeTransform chrome removal (header/footer/OneTrust).
// progressrail-sections: section breaks + metadata — added only when the template
// declares 2+ sections (matches import-press-release.js / import-blog-*.js gating).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Generate sanitized path. Map a root/empty pathname to /index to avoid the
    // bundled importer's path polyfill crashing on an empty string.
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
