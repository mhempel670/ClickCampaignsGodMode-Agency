# Maven Webinar Slide Design Spec
## Home Services (all segments) — aligns with Maven website + HeyGen PPT upload

---

## Verdict: green on white is NOT optimal

| Approach | Use for Maven? | Why |
|----------|----------------|-----|
| **Green text on white** | No | Looks like a generic template; fights your website; weak premium/trust signal for B2B owners |
| **Dark navy + white + emerald accents** | **Yes** | Matches `website-digitalaccesspros.html`; reads “data / authority”; standard for high-ticket webinar funnels |

---

## Brand palette (use on every slide)

| Role | Hex | Use |
|------|-----|-----|
| Background | `#0F172A` | Full slide fill |
| Primary text | `#FFFFFF` | Headlines, main message |
| Accent | `#10B981` | One keyword, subtitle line, or stat only |
| Secondary | `#94A3B8` | Optional sublines (sparingly) |
| Footer | `#64748B` | Small “MAVEN by Digital Access Inc” |

---

## Webinar / presentation rules (B2B home services)

1. **One idea per slide** — large type, max ~15 words on screen when possible.
2. **High contrast** — white on navy passes readability on laptop and phone.
3. **Emerald = accent only** — never full paragraphs in green (harder to read, feels “marketing bro”).
4. **Avatar safe zone** — HeyGen puts you **bottom-right**. Keep all text in the **left 70%** of the slide (built into our PPTX generator).
5. **No bullet walls** — narration carries detail; slides are signposts.
6. **Consistent deck** — same background every slide so the final stitched video feels like one training, not a patchwork.

---

## HeyGen-specific

- Upload **PPTX** with dark slides; enable **Use speaker notes as script**.
- Avatar circle bottom-right is automatic — do not put critical text on the right edge.
- Export **1080p** to match site and ads.

---

## Regenerate Segment 1 after copy changes

```bash
python build_segment01_pptx.py
```

Output: `Maven-HS-Seg01-Hook.pptx`
