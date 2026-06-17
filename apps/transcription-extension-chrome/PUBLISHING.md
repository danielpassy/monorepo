# Publishing Checklist

## Current status

This extension is close to a test submission. The repo now includes icons, a packaging script, and listing/privacy text, but it is not fully store-ready yet.

## Likely blockers

1. Missing Chrome Web Store screenshots
2. The privacy policy still needs a final hosted HTTPS URL
3. Sensitive permissions and host access will likely trigger extra review:
   - `activeTab`
   - host access to `https://meet.google.com/*`
   - host access to `https://api.rafaellapontes.com.br/*`

## Minimum before upload

1. Prepare screenshots for the Chrome Web Store listing
2. Host the privacy policy text on a public HTTPS URL
3. Verify the extension works from the zipped package
4. Review permission wording so the reviewer can understand why each permission exists
5. Copy the final store text from `STORE_LISTING.md`
6. Confirm the production API domain is reachable from the published extension

## Upload flow

1. Create a developer account in the Chrome Web Store dashboard
2. Pay the one-time registration fee
3. Upload the zip built by `./package.sh`
4. Fill in listing metadata, privacy disclosures, and screenshots
5. Submit for review

## Local packaging

Run:

```bash
cd apps/transcription-extension-chrome
./package.sh
```

The zip will be created at `apps/transcription-extension-chrome/dist/transcription-extension-chrome.zip`.
