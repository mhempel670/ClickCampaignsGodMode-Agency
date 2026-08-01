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
  const originalSessionId = String(body.originalSessionId || '').trim();
  const includeForum = body.includeForum === true;
  if (!/^cs_(test_|live_)/.test(originalSessionId)) {
    return send(res, 400, { error: 'A valid paid Assessment checkout is required.' });
  }
  try {
    const original = await stripeRequest(`/checkout/sessions/${encodeURIComponent(originalSessionId)}`);
    if (original.payment_status !== 'paid') return send(res, 403, { error: 'The Assessment payment has not been confirmed.' });
    if (original.metadata?.product === 'assessment_strategy_bundle' || original.metadata?.product === 'assessment_blueprint_forum') {
      return send(res, 409, { error: 'Your Graybeard Blueprint is already included.' });
    }

    const email = original.customer_details?.email || original.customer_email;
    const origin = siteOrigin(req);
    const params = new URLSearchParams();
    params.set('mode', includeForum ? 'subscription' : 'payment');
    if (email) params.set('customer_email', email);
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', '49800');
    params.set('line_items[0][price_data][product_data][name]', 'Graybeard 90-Day Blueprint');
    params.set('line_items[0][price_data][product_data][description]', 'Your second on-demand guided conversation and human-reviewed written 90-Day Blueprint, continuing from your approved Assessment.');
    params.set('line_items[0][quantity]', '1');
    if (includeForum) {
      params.set('line_items[1][price_data][currency]', 'usd');
      params.set('line_items[1][price_data][unit_amount]', '6900');
      params.set('line_items[1][price_data][recurring][interval]', 'month');
      params.set('line_items[1][price_data][product_data][name]', 'Graybeard Forum');
      params.set('line_items[1][price_data][product_data][description]', 'Ongoing community, resources, practical guidance, and hands-on assistance. First 30 days free, then $69/month until canceled.');
      params.set('line_items[1][quantity]', '1');
      params.set('subscription_data[trial_period_days]', '30');
      params.set('subscription_data[metadata][product]', 'graybeard_forum');
      params.set('subscription_data[metadata][original_session_id]', originalSessionId);
    }
    params.set('success_url', `${origin}/html/graybeard-assessment-delivery.html?strategy_session=added`);
    params.set('cancel_url', `${origin}/html/graybeard-assessment-thank-you.html?session_id=${encodeURIComponent(originalSessionId)}`);
    params.set('metadata[product]', includeForum ? 'blueprint_addon_forum' : 'blueprint_addon');
    params.set('metadata[original_session_id]', originalSessionId);
    params.set('metadata[forum_trial]', includeForum ? '30_days_then_69_monthly' : 'none');

    const session = await stripeRequest('/checkout/sessions', { method: 'POST', body: params });
    return send(res, 200, { url: session.url });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
