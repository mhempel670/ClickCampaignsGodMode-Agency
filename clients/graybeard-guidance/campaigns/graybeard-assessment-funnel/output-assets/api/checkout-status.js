const STRIPE_API = 'https://api.stripe.com/v1';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
  const secret = process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
  if (!secret) return send(res, 503, { error: 'Stripe is not configured.' });

  const sessionId = String(req.query?.session_id || '').trim();
  if (!/^cs_(test_|live_)/.test(sessionId)) return send(res, 400, { error: 'Invalid session.' });

  try {
    const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const session = await response.json();
    if (!response.ok) throw new Error(session?.error?.message || 'Unable to retrieve checkout.');

    const product = session.metadata?.product || 'unknown';
    const paid = session.payment_status === 'paid' || (session.mode === 'subscription' && session.status === 'complete');
    return send(res, 200, {
      paid,
      includesBlueprint: product === 'assessment_strategy_bundle' || product === 'assessment_blueprint_forum',
      includesForum: product === 'assessment_blueprint_forum',
      product
    });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
