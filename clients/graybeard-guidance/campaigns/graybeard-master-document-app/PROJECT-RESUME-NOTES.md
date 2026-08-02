# Graybeard Workflow — Resume Notes

Last updated: 2026-07-22

## Current decision

Google Workspace Business Standard purchase and the 14-day trial are deferred. Do not start a trial, upgrade the six Business Starter licenses, enable Google Meet transcript automation, or incur a related charge without Matt's explicit approval.

## Intended future calendar architecture

- Customer-facing organizer: `matt@graybeardguidance.com`.
- Graybeard Guidance should own the booking page, Calendar event, Google Meet, Drive transcript, and participant invitation.
- Personal and Digital Access Pro calendars should be consulted for free/busy conflicts without exposing private event details.
- Current Google Calendar connector was authenticated as `matt@digitalaccesspro.com`; reconnect it as Graybeard Guidance before enabling participant booking automation.
- `matt@graybeardguidance.com` is a real Workspace user, not merely an alias.
- The organization currently has six Google Workspace Business Starter licenses. Starter does not provide native Meet transcription. Google normally upgrades the whole Workspace subscription rather than one Business user.

## Strategy-session workflow design

- Only purchasers of the $697 Assessment + Blueprint Strategy Session bundle, or the separate $498 upgrade, receive the booking CTA.
- Booking state is separate from Master Document state: eligible, link sent, booked, completed, canceled/rescheduled.
- A strategy-session transcript belongs to exactly one participant and remains distinct from Assessment voice-agent transcripts.
- The strategy-session transcript is input to a separate 90-Day Blueprint/Action Plan workflow; it must not be silently merged into the original Master Document.
- Transcript import must retain provider/event IDs, timestamps, source, consent/audit information, and idempotency.
- No invitation, document, plan, or participant email is sent without Matt's explicit approval.
- Google Meet transcription is the preferred future route if upgraded. Manual transcript intake remains the fallback.

## Master Document app status

- Production app: https://graybeard-master-document.vercel.app
- Neon-backed participants, multi-session transcripts, generation/versioning, approval, PDF rendering, and delivery controls exist.
- Matt-only final approval is enforced server-side.
- Additional operators may ingest, generate, review, and request revisions but may not give final approval.
- Synthetic tests, lint, and production build passed in the latest hardening pass.
- Voice ingestion is fail-closed: the encrypted `HUBONE_API_KEY` exists, while live voice-webhook enablement and webhook secret are absent.
- No live participant ingestion or participant email was enabled during setup.

## Hub1 blocker

Hub1 exposes API Keys, API Logs, Webhook Logs, Call Logs, Workflows, and Integrations, but its public documentation does not disclose an authoritative completed-call/transcript endpoint or payload schema. Do not guess a private endpoint. Live ingestion stays disabled until Hub1 supplies its supported API or webhook contract.

Information needed from Hub1:

1. Supported endpoint or webhook for completed calls and transcripts.
2. Authentication method and required headers.
3. Event names and full payload schema.
4. Stable call/session, agent, contact, and participant identifiers.
5. Partial versus final transcript semantics.
6. Retry, ordering, pagination, rate-limit, and signature-verification behavior.

## Messaging direction

- Lead with clarity and the participant's lived experience.
- Build toward community: individual next chapters pursued with peers, shared guidance, tools, and mutual support—not alone.
- Present AI as a uniquely capable current tool for organizing and activating experience, never as a replacement for decades of judgment, relationships, wins, losses, craft, and crystallized intelligence.
- Respect consulting, coaching, teaching, paid/fractional work, small business, mentoring, volunteer/community work, nonprofit/foundation/charity/board service, and blended paths.
- Do not describe the future Graybeard Forum/community as already available.
- Keep the $199 Assessment, $697 bundle/$498 upgrade, future community, and any group coaching promises distinct.

## Outstanding decisions and questions

1. Obtain Hub1's supported transcript API/webhook contract.
2. Decide later whether to upgrade all six Workspace licenses to Business Standard or use another transcription method.
3. When calendar work resumes, reconnect Calendar as `matt@graybeardguidance.com` and configure free/busy checks across the three calendars.
4. Confirm the canonical booking-page URL before inserting it into participant communications.
5. Complete and deploy the canonical messaging revisions after confirming which funnel pages are currently live.
6. Privacy cleanup: two participant names were removed from the current test tree, but an older standalone-repository commit still contains them. Rewriting Git history is destructive and requires Matt's explicit authorization; do not do it automatically.

## Non-negotiable privacy rules

- Never store participant transcripts, recordings, credentials, or private participant data in Git/GitHub or application logs.
- Use synthetic data for testing.
- Never infer approval.
- Never export or deliver a document or plan without Matt's explicit approval.
