const crypto = require('crypto');

const TINYEMAIL_PURCHASE_FORM_URL = 'https://api-form.tinyemail.com/ext/formservice/form-provider/7082d812-5688-4e8a-816a-144c4c7afe2d/81f25805-2657-4056-bc23-3266c598a64d';
const TINYEMAIL_STRATEGY_FORM_URL = 'https://api-form.tinyemail.com/ext/formservice/form-provider/7082d812-5688-4e8a-816a-144c4c7afe2d/3bc80b2a-d648-4095-a139-9e9924459b4a';
const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v24.0';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function verifyStripeSignature(payload, signatureHeader, secret) {
  const entries = String(signatureHeader || '').split(',').map((part) => part.split('='));
  const timestamp = entries.find(([key]) => key === 't')?.[1];
  const signatures = entries.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload.toString('utf8')}`)
    .digest('hex');

  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  });
}

async function addCustomerToTinyEmail(session, formUrl) {
  const email = String(session.customer_details?.email || session.customer_email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Paid session has no valid customer email.');

  const firstName = String(session.metadata?.first_name || session.customer_details?.name || 'Graybeard').trim();
  const lastName = String(session.metadata?.last_name || 'Customer').trim();
  const response = await fetch(formUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://graybeardassessment.com',
      Referer: 'https://graybeardassessment.com/'
    },
    body: JSON.stringify({ firstName, lastName, email })
  });

  if (!response.ok) throw new Error(`TinyEmail rejected the purchaser (${response.status}).`);
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hash(value) {
  const normalized = normalize(value);
  return normalized ? crypto.createHash('sha256').update(normalized).digest('hex') : '';
}

function hashedArray(value) {
  const hashed = hash(value);
  return hashed ? [hashed] : undefined;
}

function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => {
    return value !== undefined && value !== null && value !== '';
  }));
}

function productName(product) {
  return product === 'assessment_strategy_bundle' || product === 'assessment_blueprint_forum'
    ? 'Graybeard Assessment + 90-Day Blueprint'
    : 'Graybeard Assessment';
}

async function sendMetaPurchase(event, session) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const details = session.customer_details || {};
  const address = details.address || {};
  const product = session.metadata?.product || 'assessment';
  const amount = Number(session.amount_total || 0) / 100;
  const currency = String(session.currency || 'usd').toUpperCase();
  const eventSourceUrl = session.metadata?.event_source_url || 'https://www.graybeardassessment.com/graybeard-assessment-checkout.html';
  const eventId = 'stripe_checkout_' + session.id;

  const userData = compact({
    em: hashedArray(details.email || session.customer_email),
    ph: hashedArray(details.phone),
    fn: hashedArray(session.metadata?.first_name),
    ln: hashedArray(session.metadata?.last_name),
    ct: hashedArray(address.city),
    st: hashedArray(address.state),
    zp: hashedArray(address.postal_code),
    country: hashedArray(address.country),
    external_id: hashedArray(session.customer || session.id),
    client_ip_address: session.metadata?.client_ip_address,
    client_user_agent: session.metadata?.client_user_agent,
    fbp: session.metadata?.fbp,
    fbc: session.metadata?.fbc
  });

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Number(event.created || Math.floor(Date.now() / 1000)),
      event_source_url: eventSourceUrl,
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        currency,
        value: amount,
        content_ids: [product],
        content_name: productName(product),
        content_type: 'product',
        contents: [{ id: product, quantity: 1, item_price: amount }],
        num_items: 1,
        order_id: session.id
      }
    }]
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  const endpoint = 'https://graph.facebook.com/' + META_GRAPH_VERSION + '/' + pixelId + '/events?access_token=' + encodeURIComponent(accessToken);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok || !result.events_received) {
    throw new Error('Meta Conversions API rejected the purchase (' + response.status + ').');
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return send(res, 503, { error: 'Stripe webhook is not configured.' });

  try {
    const rawBody = await readRawBody(req);
    if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'], webhookSecret)) {
      return send(res, 400, { error: 'Invalid Stripe signature.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const product = session.metadata?.product;
      const deliversAssessment = product === 'assessment' || product === 'assessment_strategy_bundle' || product === 'assessment_blueprint_forum';
      const includesBlueprint = product === 'assessment_strategy_bundle' || product === 'assessment_blueprint_forum';
      if (session.payment_status === 'paid') {
        const deliveries = [];
        if (deliversAssessment) deliveries.push(addCustomerToTinyEmail(session, TINYEMAIL_PURCHASE_FORM_URL));
        if (includesBlueprint) deliveries.push(addCustomerToTinyEmail(session, TINYEMAIL_STRATEGY_FORM_URL));
        await Promise.all(deliveries);
        if (session.metadata?.marketing_consent === 'granted') {
          try {
            await sendMetaPurchase(event, session);
          } catch (metaError) {
            console.error('Meta Conversions API purchase event failed:', metaError.message);
          }
        }
      }
    }

    return send(res, 200, { received: true });
  } catch (error) {
    return send(res, 500, { error: error.message });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
