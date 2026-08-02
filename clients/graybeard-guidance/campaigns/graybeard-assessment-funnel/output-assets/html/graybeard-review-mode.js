(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  if (params.get('review') !== '1') return;

  document.documentElement.classList.add('graybeard-review-mode');

  var style = document.createElement('style');
  style.textContent = [
    '.graybeard-review-banner{position:relative;z-index:999999;background:#17324d;color:#fff;padding:10px 16px;text-align:center;font:700 16px/1.4 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2)}',
    '.graybeard-review-banner a{color:#f6c453;text-decoration:underline;margin-left:10px}',
    '.graybeard-review-disabled{cursor:not-allowed!important;opacity:.8!important}'
  ].join('');
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.className = 'graybeard-review-banner';
  banner.innerHTML = 'REVIEW MODE — No payment or contact information will be submitted. <a href="graybeard-assessment-review.html">Return to all pages</a>';
  document.body.insertBefore(banner, document.body.firstChild);

  document.querySelectorAll('a[href]').forEach(function (link) {
    var raw = link.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || raw.indexOf('mailto:') === 0 || raw.indexOf('tel:') === 0) return;
    try {
      var url = new URL(raw, window.location.href);
      if (url.origin === window.location.origin && /\.html$/i.test(url.pathname)) {
        url.searchParams.set('review', '1');
        link.href = url.pathname + url.search + url.hash;
      }
    } catch (_) {}
  });

  var originalFetch = window.fetch;
  window.fetch = function (input, options) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/\/api\/(create-checkout-session|subscribe-lead)/i.test(url)) {
      return Promise.reject(new Error('Disabled in reviewer mode.'));
    }
    return originalFetch.call(window, input, options);
  };

  if (/graybeard-assessment-checkout\.html$/i.test(window.location.pathname)) {
    var panel = document.getElementById('payment-panel');
    var step2Badge = document.getElementById('step2-badge');
    var continueButton = document.getElementById('continue-btn');
    var checkoutButton = document.getElementById('checkout-button');
    if (panel) panel.classList.remove('step-locked');
    if (step2Badge) step2Badge.className = 'step-badge active';
    if (continueButton) {
      continueButton.textContent = 'Contact Submission Disabled — Review Only';
      continueButton.classList.add('graybeard-review-disabled');
    }
    if (checkoutButton) {
      checkoutButton.textContent = 'Payment Disabled — Review Only';
      checkoutButton.classList.add('graybeard-review-disabled');
    }
    document.addEventListener('click', function (event) {
      if (event.target.closest('#step1-form, #payment-panel')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    document.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

})();
