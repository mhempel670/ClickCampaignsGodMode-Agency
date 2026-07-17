# Graybeard Assessment — Stripe + Vercel Setup

## Where Stripe is connected

Stripe is connected in two places:

1. **Stripe Dashboard:** Create the products and prices.
2. **Vercel Project Settings:** Store the secret Stripe key and the three Stripe Price IDs as encrypted environment variables.

No secret keys belong in the HTML, ClickCampaigns assets, or GitHub repository.

ClickCampaigns remains the campaign workspace and synchronization destination. Vercel hosts the pages and secure server functions. Stripe hosts the payment screen and processes the card.

## Stripe products and prices

Create these one-time prices in Stripe:

| Product | Amount | Purpose |
|---|---:|---|
| The Graybeard Assessment | $199 | Assessment by itself |
| Assessment + Blueprint Strategy Session | $697 | Combined checkout package |
| Blueprint Strategy Session Add-On | $498 | Offered after a confirmed $199 Assessment purchase |

The $498 add-on makes the participant's total investment $697. It is not a $697 charge on top of the Assessment.

## Vercel environment variables

Add the following under the production Vercel project's environment-variable settings:

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ASSESSMENT=price_...
STRIPE_PRICE_ASSESSMENT_STRATEGY_BUNDLE=price_...
STRIPE_PRICE_STRATEGY_ADDON=price_...
PUBLIC_SITE_URL=https://graybeardassessment.com
```

Use Stripe test-mode values first. Replace them with live-mode values only after the complete test purchase succeeds.

## How the two-step checkout works

1. Step 1 validates the participant's name and email in the browser.
2. Step 2 sends the contact details and selected product to `/api/create-checkout-session`.
3. The Vercel function uses the secret Stripe key to create a Checkout Session.
4. The buyer completes payment on Stripe's secure hosted checkout.
5. Stripe returns the buyer to the thank-you page with the Checkout Session ID.

If the buyer purchased only the $199 Assessment, the thank-you-page button sends that paid Session ID to `/api/create-addon-session`. The server verifies the original Assessment payment before creating the $498 add-on checkout.

## Still required before launch

- Create the three Stripe prices.
- Add the test environment variables to Vercel.
- Deploy and complete test purchases for the $199 Assessment, $697 bundle, and $498 post-purchase add-on.
- Add a Stripe webhook for authoritative fulfillment. The webhook should respond to `checkout.session.completed`, record the purchase, and trigger the correct confirmation/delivery email.
- Decide which email/CRM system will send the delivery email and retain buyer records. Stripe and Vercel handle payment, but they do not replace a complete email/CRM workflow by themselves.
- After successful test-mode fulfillment, switch Vercel to the live Stripe key and live Price IDs, redeploy, and complete one low-risk live purchase.

