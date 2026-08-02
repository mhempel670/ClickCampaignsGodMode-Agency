# Graybeard Assessment — Stripe + Vercel Setup

## Where Stripe is connected

Stripe is connected in two places:

1. **Stripe Dashboard:** Create the products and prices.
2. **Vercel Project Settings:** Store the secret Stripe key as an encrypted environment variable.

No secret keys belong in the HTML, ClickCampaigns assets, or GitHub repository.

ClickCampaigns remains the campaign workspace and synchronization destination. Vercel hosts the pages and secure server functions. Stripe hosts the payment screen and processes the card.

## Stripe products and prices

Create these prices in Stripe:

| Product | Amount | Purpose |
|---|---:|---|
| The Graybeard Assessment | $199 | Assessment by itself |
| Assessment + Graybeard Blueprint | $697 one time | Combined checkout package |
| Graybeard Forum | $69/month recurring | Optional 30-day free trial available only with the Blueprint |

The buyer makes one product choice before payment. There is no post-purchase Blueprint upgrade: Assessment-only buyers pay $199, and complete Assessment + Blueprint buyers pay $697.

## Vercel environment variables

Add the following under the production Vercel project's environment-variable settings:

```text
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_SITE_URL=https://graybeardassessment.com
```

Create the Forum price as a recurring monthly Stripe Price. The application applies the 30-day trial only when the customer explicitly selects the optional Forum checkbox. Use Stripe test-mode values first. Replace them with live-mode values only after the complete test purchase succeeds.

## How the two-step checkout works

1. Step 1 validates the participant's name and email in the browser.
2. Step 2 sends the contact details, selected product, and explicit Forum choice to `/api/create-checkout-session`.
3. The Vercel function uses the secret Stripe key to create a Checkout Session.
4. The buyer completes payment on Stripe's secure hosted checkout.
5. Stripe returns the buyer to the thank-you page with the Checkout Session ID.

The purchase choice is final at checkout. Assessment-only buyers continue through Assessment delivery. Buyers whose Stripe metadata confirms the complete package receive Blueprint access only after their Assessment has been approved.

## Still required before launch

- Confirm the $199 Assessment, $697 complete package, and recurring $69/month Forum pricing in Stripe.
- Add the test environment variables to Vercel.
- Enable Stripe's trial-ending reminder emails and customer subscription-management portal.
- Deploy and complete test purchases for the $199 Assessment, $697 complete package, and $697 package plus Forum trial.
- Add a Stripe webhook for authoritative fulfillment. The webhook should respond to `checkout.session.completed`, record the purchase, and trigger the correct confirmation/delivery email.
- Decide which email/CRM system will send the delivery email and retain buyer records. Stripe and Vercel handle payment, but they do not replace a complete email/CRM workflow by themselves.
- After successful test-mode fulfillment, switch Vercel to the live Stripe key and live Price IDs, redeploy, and complete one low-risk live purchase.
