import { getMetadata } from './aem.js';
// eslint-disable-next-line import/no-relative-packages
import { GtmMartech, pushToDataLayer } from '../plugins/gtm-martech/src/index.js';

function consentCallback() {
  return new Promise((resolve) => {
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('Updating Consent');
      resolve({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'denied',
      });
    }, 1500);
  });
}

function getPageMetadata() {
  return {
    page_title: getMetadata('page-title'),
  };
}

function decorateHeader(el) {
  const base = { event: 'header', type: 'click' };
  el.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      pushToDataLayer({
        ...base,
        label: e.currentTarget.textContent,
      });
    });
  });
}

function decorateBlock(el) {
  const blockName = el.classList[0];

  pushToDataLayer({
    event: 'block loaded',
    type: blockName,
  });

  new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        pushToDataLayer({
          event: 'block visible',
          type: blockName,
        });
        observer.unobserve(entry.target);
      }
    });
  }).observe(el);

  if (blockName === 'header') {
    decorateHeader(el);
  }
}

function decorateSection(el) {
  const classes = [...el.classList];
  const containers = classes.filter((cls) => cls.endsWith('-container'));

  containers.forEach((container) => {
    pushToDataLayer({
      event: 'section loaded',
      type: container,
    });
  });

  new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        containers.forEach((container) => {
          pushToDataLayer({
            event: 'section visible',
            type: container,
          });
        });
        observer.unobserve(entry.target);
      }
    });
  }).observe(el);
}

function decorateEvents(el) {
  const classes = [...el.classList];

  // Find and remove the entry that equals "section" or "block"
  const typeIndex = classes.findIndex((cls) => cls === 'section' || cls === 'block');
  const type = typeIndex !== -1 ? classes.splice(typeIndex, 1)[0] : null;

  if (type === 'block') {
    decorateBlock(el);
  } else if (type === 'section') {
    decorateSection(el);
  }
}

const disabled = window.location.search.includes('martech=off');

const { eager, lazy, delayed } = new GtmMartech({
  analytics: !disabled,
  tags: ['G-WCGDQMP9ZL'],
  containers: {
    lazy: ['GTM-T6V2QHKZ'],
  },
  consent: !disabled,
  consentCallback,
  pageMetadata: getPageMetadata(),
  decorateCallback: decorateEvents,
});

export { eager, lazy, delayed };
