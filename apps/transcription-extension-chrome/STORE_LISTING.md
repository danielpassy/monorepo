# Store Listing Draft

## Name

Meet Session Capture

## Summary

Capture Google Meet session audio with a therapist-oriented workflow.

## Description

Meet Session Capture adds a capture control directly inside Google Meet so the therapist can start a session capture without leaving the call flow.

Current MVP capabilities:

- inject a capture button inside Google Meet
- start a guided browser audio-sharing flow for the current session
- capture session audio and microphone together
- upload the resulting recording to the connected backend
- send captured recordings to `https://api.rafaellapontes.com.br`
- stop automatically when screen sharing ends

Current limitations:

- Google Meet only
- the browser still requires the user to confirm tab/audio sharing
- the backend must be available at `https://api.rafaellapontes.com.br`

## Suggested screenshots

1. The injected "Iniciar captura" button inside Meet
2. The capture page showing the guided session flow
3. The extension popup with the session action visible

## Permissions explanation

- `activeTab`: identify the current Meet tab when starting capture
- `https://meet.google.com/*`: inject the in-Meet capture control
- `https://api.rafaellapontes.com.br/*`: upload captured recordings to the production backend
