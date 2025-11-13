# Session Knowledge Capture

<!-- This file captures raw knowledge during the current session -->
<!-- It will be processed by Mím and cleared after coalescing -->### [00:39] [frontend] NFC passcode prompts with default value
**Details**: Updated NFC passcode prompts and error messages to always mention that the default passcode is "0000" and emphasize that users must initialize their Burner card first at boot.burner.pro.

Key changes:
1. Prompt dialog now shows "The default passcode is: 0000" prominently
2. All error messages when passcode is required mention the default passcode
3. All messages emphasize users must initialize their card first before using it
4. Consistent messaging across all passcode-related errors:
   - When user cancels prompt
   - When authentication fails
   - When incorrect passcode is entered

This helps new users who haven't initialized their cards yet understand what the default passcode is and that they need to visit boot.burner.pro to set up their card before using it with the app.
**Files**: packages/frontend/src/lib/nfc.ts
---

