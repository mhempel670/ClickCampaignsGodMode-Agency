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
  const includeForum = product === 'assessment_strategy_bundle' && body.includeForum === true;
  const productName = product === 'assessment_strategy_bundle'
    ? 'Graybeard Assessment + 90-Day Blueprint'
    : 'Graybeard Assessment';
  const productDescription = product === 'assessment_strategy_bundle'
    ? 'Two on-demand guided conversations and two human-reviewed written deliverables: your personalized Assessment and practical 90-Day Blueprint.'
    : 'An on-demand guided conversation followed by your personalized, human-reviewed Assessment.';
  const unitAmount = product === 'assessment_strategy_bundle' ? '69700' : '19900';

  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) {
    return send(res, 400, { error: 'Valid contact information is required.' });
  }
  try {
    const origin = siteOrigin(req);
    const params = new URLSearchParams();
    params.set('mode', includeForum ? 'subscription' : 'payment');
    params.set('customer_email', email);
    // Supply clean checkout copy directly so legacy Stripe Product names,
    // HTML descriptions, and unrelated images can never appear here.
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', unitAmount);
    params.set('line_items[0][price_data][product_data][name]', productName);
    params.set('line_items[0][price_data][product_data][description]', productDescription);
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
      params.set('subscription_data[metadata][source_product]', product);
      params.set('subscription_data[metadata][first_name]', firstName);
      params.set('subscription_data[metadata][last_name]', lastName);
    }
    params.set('success_url', `${origin}/html/graybeard-assessment-thank-you.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${origin}/html/graybeard-assessment-checkout.html?checkout=cancelled`);
    params.set('metadata[product]', includeForum ? 'assessment_blueprint_forum' : product);
    params.set('metadata[first_name]', firstName);
    params.set('metadata[last_name]', lastName);
    params.set('metadata[forum_trial]', includeForum ? '30_days_then_69_monthly' : 'none');
    if (!includeForum) {
      params.set('payment_intent_data[metadata][product]', product);
      params.set('payment_intent_data[metadata][email]', email);
    }

    const session = await stripeRequest('/checkout/sessions', { method: 'POST', body: params });
    return send(res, 200, { url: session.url });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
