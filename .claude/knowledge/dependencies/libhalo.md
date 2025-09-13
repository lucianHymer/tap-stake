# LibHalo NFC Library

## WebAuthn Integration
- Uses @arx-research/libhalo/api/web which uses WebAuthn under the hood
- rpId parameter is set to window.location.hostname in get_pkeys and sign commands
- This causes errors when accessing over network because WebAuthn requires rpId to match origin domain

## Platform Requirements
HaLo NFC cards aren't standard FIDO2 authenticators, requiring:
- **Desktop browsers**: HaLo Bridge (USB NFC reader + WebSocket server)
- **Mobile browsers**: Native NFC support (Android Chrome)
- Without either, Chrome shows 'Your device can't be used with this site' error

**Related files**: packages/frontend/src/lib/nfc.ts