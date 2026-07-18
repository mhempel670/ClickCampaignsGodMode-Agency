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
  if (!(process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key)) {
    return send(res, 503, { error: 'Stripe is not configured.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const email = String(body.email || '').trim();
  const product = body.product === 'assessment_strategy_bundle' ? 'assessment_strategy_bundle' : 'assessment';
  const priceId = product === 'assessment_strategy_bundle'
    ? process.env.STRIPE_PRICE_ASSESSMENT_STRATEGY_BUNDLE
    : process.env.STRIPE_PRICE_ASSESSMENT;

  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) {
    return send(res, 400, { error: 'Valid contact information is required.' });
  }
  if (!priceId) return send(res, 503, { error: 'This product is not configured in Stripe.' });

  try {
    const origin = siteOrigin(req);
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('customer_email', email);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${origin}/html/graybeard-assessment-thank-you.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${origin}/html/graybeard-assessment-checkout.html?checkout=cancelled`);
    params.set('metadata[product]', product);
    params.set('metadata[first_name]', firstName);
    params.set('metadata[last_name]', lastName);
    params.set('payment_intent_data[metadata][product]', product);
    params.set('payment_intent_data[metadata][email]', email);

    const session = await stripeRequest('/checkout/sessions', { method: 'POST', body: params });
    return send(res, 200, { url: session.url });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
