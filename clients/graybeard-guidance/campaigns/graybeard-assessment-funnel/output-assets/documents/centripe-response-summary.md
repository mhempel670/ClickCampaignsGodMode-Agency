# Centripe Response Summary — March 2026

**From:** Zaid, Centripe Support  
**Status:** Vercel + Centripe confirmed. Schedule onboarding call to wire embeds.

---

## What Centripe Confirmed ✅

| Item | Answer |
|------|--------|
| Host pages on Vercel | **Yes** — no rebuild required |
| Embed forms/checkout in your HTML | **Yes** (Option A — recommended) |
| Redirect to Centripe checkout instead | **Yes** (Option B — simpler, less custom) |
| Post-purchase redirect to thank-you page | **Yes** |
| Custom delivery email (HTML, merge fields) | **Yes** |
| Send from matt@graybeardguidance.com (SPF/DKIM) | **Yes** |
| Later upsell automation (tags, 5–7 day workflow) | **Yes** |
| Onboarding video call | **Offered** — take it |

---

## What Centripe Does NOT Support ❌

| Item | Workaround |
|------|------------|
| Cart / add product at checkout | Create **two products**: Assessment $199 + Bundle $896 |
| One-click upsell (saved card) | Thank-you button → Centripe checkout ($697); buyer re-enters card |
| Pass name/email in redirect URL | Thank-you page stays universal (no personalization) — already planned |
| Auto credit toward premium coaching | Track manually with CRM tags / custom fields |
| Funnel analytics / A/B on external pages | Use Google Analytics on Vercel if needed later |

---

## Products to Create in Centripe

1. **The Graybeard Assessment** — $199  
2. **Assessment + Blueprint Strategy Session Bundle** — $896  
3. **Blueprint Strategy Session (standalone)** — $697 — for thank-you page + post-delivery upsell  
4. **Blueprint Strategy Session (late offer)** — $897 — optional separate product for 5–7 day email

*(Or one $697 product for thank-you and $897 for late email — your call.)*

---

## Recommended Path: Option A (Embed)

Keep your Vercel checkout design. On the onboarding call, ask Zaid for:

1. **Lead capture embed** — Step 1 (name, email only)  
2. **Checkout embed #1** — $199 Assessment only  
3. **Checkout embed #2** — $896 Bundle  
4. **Checkout embed #3** — $697 Strategy Session only (thank-you upsell)  
5. **Success redirect URL** for each → thank-you page  
6. **Delivery email** automation + merge fields  
7. **Tag rules** — purchased Assessment, purchased Bundle, purchased Session  

Checkbox on checkout **switches** between embed #1 and #2 (not a cart).

---

## Funnel Flow (Final)

```
Sales (Vercel)
  → Checkout (Vercel + Centripe embed)
       □ unchecked → $199 product
       ☑ checked   → $896 bundle
  → Thank-you (Vercel) + Matt video
       → optional $697 checkout (re-enter card)
  → Delivery email (Centripe) → Delivery page (Vercel)
  → Master Document (5–7 days)
  → Automated email: Session $897 if no Session purchased (Centripe workflow)
```

---

## Credits Toward Premium Coaching (when it launches)

Centripe cannot auto-apply. Process:

- Tag contacts: `spent-199`, `spent-896`, `spent-697`, etc.
- When they inquire about coaching, check tags and apply credit manually
- Mention policy on checkout, thank-you, and upsell pages (already there)

---

## Next Steps for Matt

1. **Reply to Zaid** — accept the onboarding call  
2. **In Centripe now:** Connect Stripe, create the 3–4 products above  
3. **On the call:** Bring this doc + your funnel URLs (see vercel-centripe-setup-guide.md)  
4. **After call:** Forward embed codes to Alex → he pastes into HTML  
5. **Deploy to Vercel** → test with Stripe test mode  
6. **Record thank-you video** → paste YouTube embed URL  

---

## Email Reply to Zaid (optional)

Subject: Re: External funnel setup — scheduling onboarding call

Hi Zaid,

Thank you — this is exactly what I needed. I'd like to schedule the onboarding call to wire everything up.

I'm using **Option A** (embed Centripe forms/checkout into my Vercel-hosted HTML pages).

Products I'll have ready:
- Graybeard Assessment — $199
- Assessment + Strategy Session Bundle — $896
- Strategy Session standalone — $697

Success redirect: https://graybeardassessment.com/html/graybeard-assessment-thank-you.html

Please let me know available times for a walkthrough.

Thanks,  
Matt
