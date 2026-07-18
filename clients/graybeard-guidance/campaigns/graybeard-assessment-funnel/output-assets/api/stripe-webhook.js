const crypto = require('crypto');

const TINYEMAIL_PURCHASE_FORM_URL = 'https://api-form.tinyemail.com/ext/formservice/form-provider/7082d812-5688-4e8a-816a-144c4c7afe2d/81f25805-2657-4056-bc23-3266c598a64d';

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

async function addCustomerToTinyEmail(session) {
  const email = String(session.customer_details?.email || session.customer_email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Paid session has no valid customer email.');

  const firstName = String(session.metadata?.first_name || session.customer_details?.name || 'Graybeard').trim();
  const lastName = String(session.metadata?.last_name || 'Customer').trim();
  const response = await fetch(TINYEMAIL_PURCHASE_FORM_URL, {
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
      const deliversAssessment = product === 'assessment' || product === 'assessment_strategy_bundle';
      if (session.payment_status === 'paid' && deliversAssessment) await addCustomerToTinyEmail(session);
    }

    return send(res, 200, { received: true });
  } catch (error) {
    return send(res, 500, { error: error.message });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
