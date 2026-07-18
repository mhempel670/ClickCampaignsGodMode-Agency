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

  function formatMoney(value) {
    return '$' + value.toFixed(2).replace(/\.00$/, '');
  }

  function updateOrderTotal() {
    var withBundle = upsellCheckbox && upsellCheckbox.checked;
    var total = withBundle ? 697 : 199;
    if (upsellLine) upsellLine.classList.toggle('hidden', !withBundle);
    if (upsellBump) upsellBump.classList.toggle('selected', withBundle);
    if (orderTotal) orderTotal.textContent = formatMoney(total) + '.00';
    if (payAmount) payAmount.textContent = formatMoney(total);
  }

  if (upsellCheckbox && upsellBump) {
    upsellCheckbox.addEventListener('change', updateOrderTotal);
    upsellBump.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A' && event.target.type !== 'checkbox') {
        upsellCheckbox.checked = !upsellCheckbox.checked;
        updateOrderTotal();
      }
    });
  }

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
    continueBtn.disabled = true;
    continueBtn.textContent = 'Saving your information…';
    subscribeLead(getFields()).catch(function () {}).then(unlockPayment);
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
        product: upsellCheckbox && upsellCheckbox.checked ? 'assessment_strategy_bundle' : 'assessment'
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
