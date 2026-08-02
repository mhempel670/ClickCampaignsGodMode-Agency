# Graybeard Radio Podcast Signup

- TinyEmail form: `Graybeard Radio Podcast Signup`
- Status: Published
- Allowed domain: `https://graybeardradio.com`
- Destination audience: `GB Assessment Leads`
- Form/source ID: `d1d09eea-e40e-4940-87aa-1510c571f1fb`
- Source label: `GB Radio`
- Fields: First name, last name, email address
- Button: `Get Podcast Updates`

## Installation

Replace the current GrooveMail embed on `/matt-contact` with the contents of `../html/tinyemail-embed.html`.

## Performance limitation

The published TinyEmail embed still depends on TinyEmail's external renderer. It should be tested against the current GrooveMail embed, but it cannot guarantee instant rendering. An immediate-rendering native HTML form requires TinyEmail API access.

TinyEmail's current API documentation states that API access is Enterprise-only and that the API key must be requested from TinyEmail support. Once issued, store it as `TINYEMAIL_API_KEY` in the repository-root `.env`; that file is gitignored.

## Tagging

TinyEmail records submissions against this dedicated form, which provides source-level attribution for Graybeard Radio. A draft workflow named `GB Radio Signup Tagging` was created, but it was not activated because the account's rule selector did not expose a selectable form-submission trigger. Do not activate it until the trigger can be configured and verified.
