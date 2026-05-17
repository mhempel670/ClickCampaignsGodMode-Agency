# HeyGen PPT/PDF to Video — Maven Home Services

Official guide: [PPT/PDF to Video](https://help.heygen.com/en/articles/13007313-ppt-pdf-to-video)

---

## What HeyGen actually needs

| You upload | What HeyGen does |
|------------|------------------|
| **One `.pptx` file** | Each slide = one scene |
| **Speaker notes on each slide** | Avatar narration (when you check **Use speaker notes as script**) |
| **Your avatar (chosen up front)** | Circular overlay, **bottom-right** on every slide |

HeyGen does **not** read the old `heygen-voice-paste/*.txt` files automatically. Those words now live in **PowerPoint speaker notes** inside each `.pptx`.

---

## Do you need 6 separate uploads?

**Yes — one PPTX per segment (6 videos).** Recommended:

| # | Upload this file | Slides | Final export name |
|---|------------------|--------|-------------------|
| 1 | `Maven-HS-Seg01-Hook-DARK.pptx` | 6 | `seg01-hook.mp4` ✅ |
| 2 | `Maven-HS-Seg02-Gaps-DARK.pptx` | 11 | `seg02-gaps.mp4` |
| 3 | `Maven-HS-Seg03-Demo-Intro-DARK.pptx` | 2 | See `SEGMENT-03-DEMO-WORKFLOW.md` |
| 4 | `Maven-HS-Seg04-Expect-DARK.pptx` | 4 | `seg04-expect.mp4` |
| 5 | `Maven-HS-Seg05-Objections-DARK.pptx` | 6 | `seg05-objections.mp4` |
| 6 | `Maven-HS-Seg06-Offer-DARK.pptx` | 6 | `seg06-offer.mp4` |

**Why not one giant 33-slide deck?**
- Easier to re-render one segment if something breaks
- Segment 3 demo is screen recording — keep it separate
- Stays under HeyGen’s **50MB** limit per file

**Segment 3 special case:** Only slides 1–2 in HeyGen. Growbotik screen recording + demo voiceover go in **CapCut** between intro and outro.

---

## Step-by-step (Segment 1 — do this now)

1. Open HeyGen → **Avatars** tab → **PPT/PDF to Video**
2. **Upload a presentation**
3. **Choose your avatar** (you — appears small circle bottom-right)
4. Upload: `heygen-ppt/Maven-HS-Seg01-Hook.pptx`
5. On import settings:
   - ✅ **Use speaker notes as script** (PPTX only — not available for PDF)
   - Pick **Image Background** or **Editable Template** (either works)
6. **Create Video** → **Edit in AI Studio**
7. Check each slide: script matches speaker notes; avatar bottom-right
8. Speaker notes use **Matt** and spelled-out numbers (see `TTS-SPEAKER-NOTES-GUIDE.md`)
9. Voice: your **cloned voice**
10. **Submit** export → **1080p** → save as `seg01-hook.mp4`

---

## Speaker notes rules (from HeyGen)

- Max **~1,000 characters per slide** script segment (longer text may split into extra scenes)
- **One slide = one scene = one script block**
- Script upload tips: [How to Write Scripts](https://help.heygen.com/en/articles/11381771-how-to-write-scripts-in-the-editing-studio)

---

## Files in this folder

| File | Purpose |
|------|---------|
| `Maven-HS-Seg01-Hook.pptx` | **Upload to HeyGen now** |
| `build_segment01_pptx.py` | Regenerate Seg01 if you edit copy |
| `HEYGEN-UPLOAD-INSTRUCTIONS.md` | This file |

Segments 2–6 PPTX: run `python build_all_segments.py` from this folder.

---

## After all 6 segments export

CapCut timeline: Seg01 → Seg02 → Seg03 (intro + **demo** + outro) → Seg04 → Seg05 → Seg06 → `maven-webinar-home-services-FINAL.mp4`

Demo voiceover text: `../heygen-voice-paste/segment-03-demo-voiceover.txt`
