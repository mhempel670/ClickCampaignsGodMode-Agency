const webhook = require('../clients/graybeard-guidance/campaigns/graybeard-assessment-funnel/output-assets/api/stripe-webhook.js');

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (process.env.VERCEL_ENV !== 'preview') return reply(res, 404, { error: 'Not found.' });
  if (req.method !== 'GET') return reply(res, 405, { error: 'Method not allowed.' });

  const expectedCode = String(process.env.META_TEST_EVENT_CODE || '');
  const suppliedCode = String(req.query?.code || '');
  if (!expectedCode || suppliedCode !== expectedCode) return reply(res, 403, { error: 'Forbidden.' });
  if (!process.env.META_PIXEL_ID || !process.env.META_CAPI_ACCESS_TOKEN) {
    return reply(res, 503, { error: 'Meta test configuration is incomplete.' });
  }

  try {
    const stamp = Date.now();
    const eventId = 'meta_capi_test_' + stamp;
    await webhook.sendMetaPurchase(
      { created: Math.floor(stamp / 1000) },
      {
        id: eventId,
        amount_total: 19900,
        currency: 'usd',
        customer: 'meta_capi_test',
        customer_details: { email: 'meta-capi-test@graybeardassessment.com' },
        metadata: {
          product: 'assessment',
          first_name: 'Meta',
          last_name: 'Test',
          event_source_url: 'https://www.graybeardassessment.com/graybeard-assessment-checkout.html'
        }
      }
    );
    return reply(res, 200, { sent: true, eventId });
  } catch (error) {
    return reply(res, 502, { error: error.message });
  }
};
