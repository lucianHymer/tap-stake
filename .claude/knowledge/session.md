# Session Knowledge Capture

<!-- This file captures raw knowledge during the current session -->
<!-- It will be processed by Mím and cleared after coalescing -->
### [22:00] [architecture] NFC Key Slot 8 with Passcode Support
**Details**: Key slot 8 on HaLo cards requires password protection with default passcode "0000". When using password-protected slots:
1. Must provide three parameters together: keyNo, password, and publicKeyHex
2. Error codes: ERROR_CODE_WRONG_PWD for incorrect password, ERROR_CODE_INVALID_DATA when missing password
3. Failed authentication counter (keySlotFailedAuthCtr) tracks failed attempts
4. Password must be UTF-8 string, 6-32 bytes
5. For slot 8, need to first try default "0000", then prompt for user passcode if that fails
6. Store successful passcode in localStorage for future use
7. Unlike slot 1, slot 8 requires password even for basic operations
**Files**: packages/frontend/src/lib/nfc.ts
---

### [00:51] [frontend] NFC Status Message Timing
**Details**: Improved NFC status message timing to show accurate feedback to users. The app now shows "Preparing..." when processing begins (clicking button, getting nonce, etc.), then switches to "Tap your card now..." only when the actual NFC prompt is initiated via getCardData() or signAuthorization(). This provides better user feedback by accurately reflecting when they should tap their card, preventing confusion about when the device is ready to read the NFC card.

Key implementation:
1. Added "processing" status state in addition to "signing"
2. Set status to "processing" initially when button clicked
3. Set status to "signing"/"waiting_for_tap" right before NFC API calls
4. Updated all status messages to say "Preparing..." for processing and "Tap your card now..." for actual NFC prompts

This pattern is used consistently across ConnectCard/ConnectPage, ChoicesCard/ChoicesPage, and WithdrawCard/WithdrawPage.
**Files**: packages/frontend/src/components/ConnectCard.tsx, packages/frontend/src/pages/ConnectPage.tsx, packages/frontend/src/components/ChoicesCard.tsx, packages/frontend/src/pages/ChoicesPage.tsx, packages/frontend/src/components/WithdrawCard.tsx, packages/frontend/src/pages/WithdrawPage.tsx
---

