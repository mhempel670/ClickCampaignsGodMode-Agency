# Graybeard Assessment — Vercel + Centripe Setup Guide

**For:** Matt / Graybeard Guidance  
**Purpose:** Host funnel pages on Vercel; run forms, payments, email, and CRM in Centripe.

---

## Part A — Email to Send Centripe Support (copy/paste)

See the full question list in this document under **“Centripe Support Questions.”** Send that section as your email, or copy from the chat version Alex provided.

---

## Part B — What Goes Where (big picture)

| What | Where it lives |
|------|----------------|
| Sales page, checkout page, thank-you page, delivery page | **Vercel** (your domain: graybeardassessment.com) |
| Name + email capture (Step 1) | **Centripe** — your HTML form posts to their URL |
| Payment / Stripe | **Centripe** |
| Post-purchase email with delivery link | **Centripe** |
| Contact list / CRM | **Centripe** |
| Matt’s welcome video | **YouTube or Vimeo** (embedded on thank-you page) |

You are **not** rebuilding pages inside Centripe. Centripe handles money and email; Vercel shows the pages.

---

## Part C — Step-by-Step: GitHub (one time)

You need your funnel files in a GitHub repo so Vercel can publish them.

### C1. Create a GitHub account (if you don’t have one)

1. Go to **https://github.com**
2. Sign up (free)

### C2. Create a new repository

1. Click the **+** (top right) → **New repository**
2. Name it something like: `graybeard-assessment-funnel`
3. Set it to **Private** (recommended)
4. Do **not** check “Add a README” — leave it empty
5. Click **Create repository**

### C3. Upload your funnel folder

**Easiest method (no Git commands):**

1. On the empty repo page, click **uploading an existing file**
2. Open this folder on your computer:  
   `clients/graybeard-guidance/campaigns/graybeard-assessment-funnel/output-assets`
3. Drag the entire contents into GitHub (**html**, **images**, **emails**, **documents** folders)
4. Scroll down → **Commit changes**

**Alternative:** If your whole ClickCampaignsGodMode-Agency repo is already on GitHub, you can connect Vercel to that repo and point it at the `output-assets` subfolder (see Part D, step 4).

---

## Part D — Step-by-Step: Vercel (one time)

### D1. Create a Vercel account

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub** (simplest — links the two accounts)

### D2. Import your project

1. Vercel dashboard → **Add New…** → **Project**
2. Find your repository (`graybeard-assessment-funnel` or `ClickCampaignsGodMode-Agency`)
3. Click **Import**

### D3. Configure the project

On the import screen, set:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Other (or leave as detected static) |
| **Root Directory** | If you uploaded only `output-assets` contents → leave blank (root). If using the full agency repo → click **Edit** and set to: `clients/graybeard-guidance/campaigns/graybeard-assessment-funnel/output-assets` |
| **Build Command** | Leave empty |
| **Output Directory** | Leave empty |

4. Click **Deploy**
5. Wait 1–2 minutes. Vercel gives you a free URL like `graybeard-assessment-funnel.vercel.app`

### D4. Test your pages

Open these URLs (replace with your Vercel URL):

- `https://YOUR-PROJECT.vercel.app/html/graybeard-assessment-sales-page.html`
- `https://YOUR-PROJECT.vercel.app/html/graybeard-assessment-checkout.html`
- `https://YOUR-PROJECT.vercel.app/html/graybeard-assessment-thank-you.html`
- `https://YOUR-PROJECT.vercel.app/html/graybeard-assessment-delivery.html`

Check that **images load** on the sales page. If they do, deployment is correct.

### D5. Connect your custom domain (graybeardassessment.com)

1. Vercel project → **Settings** → **Domains**
2. Type `graybeardassessment.com` → **Add**
3. Also add `www.graybeardassessment.com` if you use www
4. Vercel shows **DNS records** to add at your domain registrar (GoDaddy, Namecheap, etc.)
5. Log into wherever you bought the domain → **DNS settings** → add the records Vercel shows
6. Wait 5–60 minutes for DNS to propagate
7. Vercel will show a green check when the domain is connected

**Your live sales page will be:**  
`https://graybeardassessment.com/html/graybeard-assessment-sales-page.html`  
(Clean URLs like `/checkout` can be added later — ask Alex.)

### D6. Updating pages later

When Alex changes HTML files in the repo:

- If using GitHub web upload: upload changed files again
- If repo syncs from your computer: push changes to GitHub  
Vercel **automatically redeploys** within a minute or two.

---

## Part E — Step-by-Step: Wire Centripe Into Your Pages

Do this **after** Centripe support answers your questions. You will paste URLs they give you into specific spots in the HTML files (Alex can do this for you when you have answers).

### E1. Connect Stripe in Centripe

1. Centripe → **Settings** → **Payments**
2. Connect your **Stripe** account
3. Create two products:
   - **The Graybeard Assessment** — $199
   - **Blueprint Strategy Session** — $697

### E2. Step 1 — Name + email capture (checkout page)

**File:** `html/graybeard-assessment-checkout.html`  
**Find:** `[CENTRIPE_STEP1_FORM_URL]`  
**Replace with:** URL Centripe gives you for the “lead capture” or Step 1 form

**Fields the form sends (must match):**

- `first_name`
- `last_name`
- `email`

**What it does:** Adds the person to your Centripe list even if they abandon before paying.

### E3. Step 2 — Payment (checkout page)

**File:** `html/graybeard-assessment-checkout.html`  
**Find:** `[CENTRIPE_ORDER_FORM_URL]`  
**Replace with:** Centripe order/checkout URL or embed code

Also replace the gray **Stripe placeholder box** with Centripe’s payment embed (if they provide one).

**Hidden fields sent on payment:**

- `first_name`, `last_name`, `email`
- `blueprint_strategy_session` = `yes_697` or `no` (order bump)
- `phone` (optional)

**Order bump:** Ask Centripe how to add $697 when `blueprint_strategy_session` = `yes_697` (total charge $896).

### E4. After payment — redirect to thank-you page

In Centripe payment settings, set **Success URL** to:

`https://graybeardassessment.com/html/graybeard-assessment-thank-you.html`

(Use your real domain once connected.)

### E5. Post-purchase delivery email

**Template file (reference):** `emails/graybeard-assessment-delivery-email.html`  
Rebuild this **inside Centripe’s email editor** (Centripe usually does not import HTML files directly — copy/paste sections).

**Must include:**

- Merge field for buyer first name: `[FIRST_NAME]` or Centripe’s equivalent
- Button link: **unique delivery URL** per buyer →  
  `https://graybeardassessment.com/html/graybeard-assessment-delivery.html`  
  (Ask Centripe if they support unique tokens or pass email as a query parameter.)

**Send:** Automatically when Assessment purchase completes.

### E6. Thank-you page — Strategy Session upsell

**File:** `html/graybeard-assessment-thank-you.html`  
**Find:** `[CENTRIPE_STRATEGY_SESSION_UPSELL_URL]`  
**Replace with:** Centripe one-click upsell URL OR simple $697 checkout link

**Find:** `[MATT_WELCOME_VIDEO_URL]`  
**Replace with:** YouTube/Vimeo embed URL after you record your video

### E7. Matt’s welcome video

1. Record on iPhone (landscape / horizontal)
2. Upload to **YouTube** → set visibility to **Unlisted**
3. YouTube → **Share** → **Embed** → copy the `src="..."` URL from the iframe code
4. Paste into thank-you page where `[MATT_WELCOME_VIDEO_URL]` appears

### E8. Post–Master Document upsell ($897)

**Page:** `html/graybeard-blueprint-strategy-session.html`  
Used in email **after** Master Document is delivered.  
Button links to a Centripe checkout for **$897** (or $697 credit-adjusted — confirm with Centripe).

---

## Part F — Funnel URL Map (give Centripe these)

| Page | URL |
|------|-----|
| Sales | `https://graybeardassessment.com/html/graybeard-assessment-sales-page.html` |
| Checkout | `https://graybeardassessment.com/html/graybeard-assessment-checkout.html` |
| Thank you | `https://graybeardassessment.com/html/graybeard-assessment-thank-you.html` |
| Delivery (voice agent) | `https://graybeardassessment.com/html/graybeard-assessment-delivery.html` |
| Strategy Session info | `https://graybeardassessment.com/html/graybeard-blueprint-strategy-session.html` |

---

## Part G — Testing Checklist (before going live)

- [ ] Sales page loads; all 3 images visible
- [ ] Checkout Step 1 submits → contact appears in Centripe CRM
- [ ] Test payment (Stripe test mode) → $199 succeeds
- [ ] Order bump checked → charges $896 (or correct total)
- [ ] After payment → lands on thank-you page on your domain
- [ ] Delivery email arrives with working link
- [ ] Delivery page loads; voice agent widget appears
- [ ] Thank-you upsell button works (or goes to $697 checkout)
- [ ] Email from matt@graybeardguidance.com is not going to spam (SPF/DKIM in Centripe)

---

## Part H — Centripe Support Questions

*(Full list — copy this section into your email to Centripe.)*

### Hosting model

1. We are hosting our funnel pages (HTML/CSS) on **Vercel** at our own domain (**graybeardassessment.com**). Centripe will handle forms, payments, CRM, and email only. **Does Centripe fully support this external-page model?**

### Step 1 — Lead capture (abandon recovery)

2. Our checkout page has a **Step 1 form** that captures first name, last name, and email **before** payment. Can we POST this form from our external page to Centripe? What is the form action URL format?

3. Field names we use: `first_name`, `last_name`, `email`. Do these need to match specific Centripe field names?

4. When Step 1 submits, should the buyer **stay on our page** (AJAX/webhook) or **redirect** to a Centripe URL? We prefer staying on our page for a 2-step checkout experience.

### Step 2 — Payment on external page

5. Can we embed Centripe/Stripe payment on our **own checkout page**, or must buyers redirect to a Centripe-hosted checkout page?

6. If embed is supported, please provide embed code instructions and any required JavaScript snippet.

7. We use **Stripe** through Centripe. Confirm we connect Stripe under Centripe Settings → Payments — we do not need a separate Stripe integration on Vercel.

### Products and pricing

8. We have two products:
   - **The Graybeard Assessment** — $199 (one-time)
   - **Blueprint Strategy Session** — $697 (one-time add-on)

9. Our checkout has an **order bump** (checkbox). If checked, total should be **$896** ($199 + $697). How do we configure this — single order form with conditional line item, two products on one order, or separate checkout?

10. Hidden field we send: `blueprint_strategy_session` with values `yes_697` or `no`. Can Centripe read this field to add the $697 product?

### Post-purchase redirect

11. After successful payment, can we redirect buyers to our external thank-you page?  
    URL: `https://graybeardassessment.com/html/graybeard-assessment-thank-you.html`

12. Can we pass buyer data (name, email, order ID) in the redirect URL or as query parameters for personalization?

### Thank-you page one-click upsell

13. Our thank-you page offers the **Blueprint Strategy Session ($697)** again for buyers who skipped the order bump. Can Centripe charge the **same card** without re-entering payment (true one-click upsell)?

14. If one-click is supported, what URL or button code do we use on our external thank-you page?

15. If one-click is **not** supported, what is the recommended fallback (pre-filled checkout link, SMS invoice, etc.)?

16. Some buyers will **already** have purchased the Strategy Session at checkout. We show the same thank-you page to everyone (no conditional pages). Is duplicate purchase blocked if they click the upsell again?

### Post-purchase email — delivery link

17. We need an automated email sent immediately after purchase with a link to our **delivery page** on Vercel:  
    `https://graybeardassessment.com/html/graybeard-assessment-delivery.html`

18. Can Centripe send **HTML emails** using our template? If not, can we paste HTML into your email builder?

19. Does Centripe support a **unique link per buyer** (tokenized URL) for the delivery page, or is one shared URL acceptable?

20. What merge fields are available? We need at minimum: first name, email, order ID.

21. Confirm sender domain: emails should come from **matt@graybeardguidance.com**. What DNS records (SPF, DKIM) do we need to add?

### Later upsell — after Master Document ($897)

22. We will email buyers **5–7 days later** offering the Strategy Session at **$897** if they did not buy at $697. Can Centripe automate this based on tags (purchased Assessment but not Strategy Session)?

23. Can Centripe track who bought which products for segmentation?

### Credit toward future coaching

24. We credit all spend ($199 + $697) toward our **premium group coaching program** when it launches. Does Centripe support coupons/credits, or should we track this manually in CRM tags?

### Import / HTML pages

25. Confirm: we do **not** need to rebuild our pages in Centripe’s page builder if we use external hosting — correct?

26. Is there any feature we lose by hosting pages externally (A/B testing, analytics, funnel reporting)?

### Support requests

27. Please provide exact **form action URLs**, **embed codes**, and **redirect URL configuration steps** for our setup once confirmed.

28. Is there a dedicated onboarding call or documentation for **external HTML funnel + Centripe backend**?

---

## Need help?

When Centripe replies, forward their answers to Alex. He will paste the URLs into your HTML files and walk you through any remaining steps.
