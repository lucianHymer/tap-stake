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