# Privacy Policy

## What the extension does

Meet Session Capture helps capture Google Meet session audio through a user-initiated browser sharing flow.

## Data handled by the extension

- Google Meet page context needed to render the in-page capture control
- user-selected session audio from the browser sharing flow
- microphone audio when the user starts a mixed capture flow

## What is sent to the backend

When capture is started, the recorded audio file is uploaded to the configured backend endpoint at `https://api.rafaellapontes.com.br`.

The extension does not need to send browsing history, unrelated page content, or full page scraping data to work.

## User control

- capture starts only after an explicit user action
- browser-level sharing still requires user confirmation
- capture stops when sharing ends or when the user stops it

## Public policy note

Before Chrome Web Store submission, this exact policy should be hosted on a public HTTPS URL and linked in the developer dashboard.
