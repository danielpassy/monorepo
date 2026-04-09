# Transcription Extension Chrome Handoff

## What this project is

This app is a Chrome extension for Google Meet session capture.

The current MVP direction is:

- inject a capture control inside active Google Meet calls
- guide the user through browser tab/audio sharing
- capture session audio together with microphone audio
- upload the resulting recording to the backend
- keep the flow as automatic as possible

## Conversation summary

The early idea was a generic transcription product, but the scope narrowed to a therapist-oriented Google Meet capture tool.

The main product decision was to prefer a Chrome extension over raw audio processing because it reduces user setup and technical burden. The extension was modeled after existing Meet transcript-capture approaches.

The team also decided to keep the MVP simple:

- no RAG
- no AI-first workflow yet
- no expanded meeting-platform support yet
- no heavy data model or clinical workflow complexity

## Current extension state

The repository already contains a dedicated app at `apps/transcription-extension-chrome`.

Key pieces already present:

- `manifest.json`
- `background.js`
- `content-google-meet.js`
- `popup.html` / `popup.js`
- `mic-test.html` / `mic-test.js`
- `meetings.html` / `meetings.js`
- `offscreen.html` / `offscreen.js`
- `README.md`
- `PUBLISHING.md`
- `PRIVACY.md`
- `STORE_LISTING.md`

The README describes the app as a focused MVP for Chrome Web Store test submission.

## Decisions already made

- Google Meet is the only supported surface for now
- the UI should be in Portuguese and should avoid exposing technical details by default
- the capture flow should start automatically when possible
- the backend endpoint is `https://api.rafaellapontes.com.br`
- the extension initially used a temporary hardcoded cookie/auth approach
- the secret/auth flow still needs to be properly designed

## Problems found during the conversation

- backend auth initially rejected upload requests with `401 Unauthorized`
- some early capture attempts produced unrelated or gibberish content
- the Meet transcription language defaulted incorrectly at times
- the flow felt clunky because of extra clicks and browser sharing dialogs
- a regression appeared where closing the Meet tab no longer stopped the capture page automatically
- the Portuguese UI copy needed cleanup

## Secret injection work

This part is not done yet.

The open issue is how the user receives or injects the secret needed by the extension after install. The conversation established that the current hardcoded approach is temporary and should be replaced with a proper install/setup flow.

Important constraints that came up:

- do not override the existing celery broker secret in the cluster
- keep settings and CORS changes grouped sensibly
- separate secrets from code
- keep the extension install flow simple for the user

## Store readiness work

The extension is not fully Chrome Web Store ready yet, but the repo now has the main supporting docs.

### Known blockers

1. Chrome Web Store screenshots are still needed
2. the privacy policy needs a final public HTTPS URL
3. permissions and host access need careful wording for review
4. the zip/package should be verified before upload

### Listing draft

The draft store listing is in `apps/transcription-extension-chrome/STORE_LISTING.md`.

It currently includes:

- name: `Meet Session Capture`
- summary: capture Google Meet session audio with a therapist-oriented workflow
- description of the in-Meet capture button, guided sharing flow, audio capture, backend upload, and automatic stop behavior
- suggested screenshots
- permissions explanation

### Privacy draft

The draft privacy policy is in `apps/transcription-extension-chrome/PRIVACY.md`.

It states that:

- the extension helps capture Google Meet session audio through a user-initiated browser sharing flow
- it handles Meet page context only as needed for the control
- it uploads the recorded audio to `https://api.rafaellapontes.com.br`
- it should be hosted on a public HTTPS URL before submission

## Publishing checklist

The publishing notes are in `apps/transcription-extension-chrome/PUBLISHING.md`.

The practical next steps are:

1. prepare Chrome Web Store screenshots
2. host the privacy policy on a public HTTPS URL
3. verify the packaged zip works
4. review permission wording for the store reviewer
5. confirm the production backend remains reachable from the published extension

## Good next step

Continue with the secret-injection/setup flow first, then finish the store assets and submission details.
