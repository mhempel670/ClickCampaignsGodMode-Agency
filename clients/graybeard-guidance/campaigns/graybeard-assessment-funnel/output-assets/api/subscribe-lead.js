const TINYEMAIL_FORM_URL = 'https://api-form.tinyemail.com/ext/formservice/form-provider/7082d812-5688-4e8a-816a-144c4c7afe2d/b2aab7af-aa34-49b9-b892-24b99b3e2d97';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const email = String(body.email || '').trim();
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) {
    return send(res, 400, { error: 'Valid contact information is required.' });
  }

  try {
    const response = await fetch(TINYEMAIL_FORM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://graybeardassessment.com',
        Referer: 'https://graybeardassessment.com/'
      },
      body: JSON.stringify({ firstName, lastName, email })
    });
    if (!response.ok) return send(res, 502, { error: 'TinyEmail rejected the subscription.' });
    return send(res, 200, { subscribed: true });
  } catch (error) {
    return send(res, 502, { error: 'Unable to reach TinyEmail.' });
  }
};
