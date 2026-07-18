const STRIPE_API = 'https://api.stripe.com/v1';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function siteOrigin(req) {
  const configured = process.env.PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${req.headers.host}`;
}

async function stripeRequest(path, options = {}) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Stripe request failed.');
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (!(process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key) || !process.env.STRIPE_PRICE_STRATEGY_ADDON) {
    return send(res, 503, { error: 'Stripe is not configured.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const originalSessionId = String(body.originalSessionId || '').trim();
  if (!/^cs_(test_|live_)/.test(originalSessionId)) {
    return send(res, 400, { error: 'A valid paid Assessment checkout is required.' });
  }

  try {
    const original = await stripeRequest(`/checkout/sessions/${encodeURIComponent(originalSessionId)}`);
    if (original.payment_status !== 'paid') return send(res, 403, { error: 'The Assessment payment has not been confirmed.' });
    if (original.metadata?.product === 'assessment_strategy_bundle') {
      return send(res, 409, { error: 'Your Strategy Session is already included.' });
    }

    const email = original.customer_details?.email || original.customer_email;
    const origin = siteOrigin(req);
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    if (email) params.set('customer_email', email);
    params.set('line_items[0][price]', process.env.STRIPE_PRICE_STRATEGY_ADDON);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${origin}/html/graybeard-assessment-thank-you.html?strategy_session=added`);
    params.set('cancel_url', `${origin}/html/graybeard-assessment-thank-you.html?session_id=${encodeURIComponent(originalSessionId)}`);
    params.set('metadata[product]', 'strategy_session_addon');
    params.set('metadata[original_session_id]', originalSessionId);

    const session = await stripeRequest('/checkout/sessions', { method: 'POST', body: params });
    return send(res, 200, { url: session.url });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
