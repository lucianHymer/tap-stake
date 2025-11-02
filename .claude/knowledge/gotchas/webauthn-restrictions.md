# WebAuthn Restrictions and Gotchas

## [2025-09-13] RP ID Cannot Use IP Addresses
WebAuthn requires RP ID to be a domain, not an IP address. The error occurs because window.location.hostname returns IP addresses (e.g., '10.88.0.74') which are not allowed as RP IDs. Only domain format of host is allowed. For network access, either use a domain name or configure localhost with port forwarding.

**Related files**: packages/frontend/src/lib/nfc.ts

## [2025-09-13] NotAllowedError Common Causes
NotAllowedError occurs when:
1. user.name field exceeds 64 UTF8 bytes
2. userVerification is set to 'preferred' on some devices
3. Timeout occurs (default 120s)
4. User cancels operation
5. Platform restrictions

For NFC operations with libhalo, this may indicate missing user interaction or incorrect WebAuthn parameters.

**Related files**: packages/frontend/src/lib/nfc.ts

## WebAuthn Requires User Gesture for NFC
libhalo's execHaloCmdWeb uses WebAuthn under the hood, which requires a user gesture (click, tap, etc) to work. Automatically triggering NFC connection on page load via React Suspense causes a "The operation either timed out or was not allowed" error because there's no user gesture.

**Solution**: Show a "CONNECT NFC" button that users must click before initiating the NFC connection. The button click counts as a user gesture, allowing WebAuthn to work properly.

**Error signature**: "Failed to execute command. Error: The operation either timed out or was not allowed." from NFCOperationError.

**Related files**: packages/frontend/src/lib/nfc.ts, packages/frontend/src/lib/nfcResource.ts, packages/frontend/src/App.tsx, packages/frontend/src/components/NFCPrompt.tsx