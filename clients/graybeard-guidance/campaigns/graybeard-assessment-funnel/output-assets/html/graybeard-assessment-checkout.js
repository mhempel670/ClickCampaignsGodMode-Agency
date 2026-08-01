(function () {
  var continueBtn = document.getElementById('continue-btn');
  if (!continueBtn || continueBtn.dataset.externalCheckoutBound === 'true') return;
  continueBtn.dataset.externalCheckoutBound = 'true';

  var step1Complete = false;
  var panel = document.getElementById('payment-panel');
  var checkoutButton = document.getElementById('checkout-button');
  var checkoutError = document.getElementById('checkout-error');
  var step1Badge = document.getElementById('step1-badge');
  var step2Badge = document.getElementById('step2-badge');
  var err = document.getElementById('step1-error');
  var ok = document.getElementById('step1-success');
  var upsellCheckbox = document.getElementById('upsell-checkbox');
  var upsellBump = document.getElementById('upsell-bump');
  var upsellLine = document.getElementById('upsell-line');
  var orderTotal = document.getElementById('order-total');
  var payAmount = document.getElementById('pay-amount');
  var forumCheckbox = document.getElementById('forum-checkbox');
  var forumBump = document.getElementById('forum-bump');
  var forumAvailabilityNote = document.getElementById('forum-availability-note');
  var billingFrequencyNote = document.getElementById('billing-frequency-note');

  function formatMoney(value) {
    return '$' + value.toFixed(2).replace(/\.00$/, '');
  }

  function updateOrderTotal() {
    var withBundle = upsellCheckbox && upsellCheckbox.checked;
    if (!withBundle && forumCheckbox) forumCheckbox.checked = false;
    var withForum = withBundle && forumCheckbox && forumCheckbox.checked;
    var total = withBundle ? 697 : 199;
    if (upsellLine) upsellLine.classList.toggle('hidden', !withBundle);
    if (upsellBump) upsellBump.classList.toggle('selected', withBundle);
    if (forumBump) {
      forumBump.classList.toggle('locked', !withBundle);
      forumBump.classList.toggle('selected', withForum);
      forumBump.setAttribute('aria-hidden', 'false');
    }
    if (forumCheckbox) forumCheckbox.disabled = !withBundle;
    if (forumAvailabilityNote) {
      forumAvailabilityNote.textContent = withBundle
        ? 'Optional — check the box if you would like to include the Forum trial.'
        : 'Available when you add the Blueprint above.';
    }
    if (orderTotal) orderTotal.textContent = formatMoney(total) + '.00';
    if (payAmount) payAmount.textContent = formatMoney(total);
    if (billingFrequencyNote) {
      billingFrequencyNote.textContent = withForum
        ? 'Today: $697 one time. Forum: $0 for 30 days, then $69/month until canceled.'
        : 'One-time charge. No hidden fees.';
    }
  }

  if (forumCheckbox && forumBump) {
    forumCheckbox.addEventListener('change', updateOrderTotal);
  }

  if (upsellCheckbox && upsellBump) {
    upsellCheckbox.addEventListener('change', updateOrderTotal);
  }

  var selectedProduct = new URLSearchParams(window.location.search).get('product');
  if (upsellCheckbox) upsellCheckbox.checked = selectedProduct === 'bundle';
  updateOrderTotal();

  function getFields() {
    return {
      first: document.getElementById('first_name').value.trim(),
      last: document.getElementById('last_name').value.trim(),
      email: document.getElementById('email').value.trim()
    };
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateStep1() {
    var fields = getFields();
    return fields.first.length > 0 && fields.last.length > 0 && validEmail(fields.email);
  }

  function unlockPayment() {
    step1Complete = true;
    panel.classList.remove('step-locked');
    step1Badge.className = 'step-badge done';
    step1Badge.textContent = '✓';
    step2Badge.className = 'step-badge active';
    document.getElementById('first_name').readOnly = true;
    document.getElementById('last_name').readOnly = true;
    document.getElementById('email').readOnly = true;
    continueBtn.textContent = 'Step 1 Complete ✓';
    continueBtn.disabled = true;
    ok.classList.add('show');
    err.classList.remove('show');
  }

  function subscribeLead(fields) {
    var endpoint = '/api/subscribe-lead';
    var request = fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fields.first,
        lastName: fields.last,
        email: fields.email
      })
    });
    var timeout = new Promise(function (_, reject) {
      window.setTimeout(function () { reject(new Error('TinyEmail timed out.')); }, 1800);
    });
    return Promise.race([request, timeout]);
  }

  continueBtn.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    if (step1Complete) return;
    if (!validateStep1()) {
      err.classList.add('show');
      ok.classList.remove('show');
      return;
    }
    var fields = getFields();
    unlockPayment();
    // Lead capture is helpful but must never block a buyer from reaching payment.
    subscribeLead(fields).catch(function () {});
  }, true);

  checkoutButton.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    if (!step1Complete || !validateStep1()) return;
    checkoutError.classList.remove('show');
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Opening Secure Checkout…';
    var fields = getFields();
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fields.first,
        lastName: fields.last,
        email: fields.email,
        product: upsellCheckbox && upsellCheckbox.checked ? 'assessment_strategy_bundle' : 'assessment',
        includeForum: Boolean(upsellCheckbox && upsellCheckbox.checked && forumCheckbox && forumCheckbox.checked)
      })
    })
      .then(function (response) {
        if (!response.ok) return response.json().then(function (data) { throw new Error(data.error || 'Unable to start checkout.'); });
        return response.json();
      })
      .then(function (data) {
        if (!data.url) throw new Error('Stripe did not return a checkout URL.');
        window.location.assign(data.url);
      })
      .catch(function () {
        checkoutError.classList.add('show');
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Continue to Secure Stripe Checkout →';
      });
  }, true);

  ['first_name', 'last_name', 'email'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      if (validateStep1()) err.classList.remove('show');
    });
  });
})();
