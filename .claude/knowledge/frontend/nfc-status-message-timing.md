# NFC Status Message Timing

## Overview
Improved NFC status message timing to show accurate feedback during the NFC interaction flow.

## Implementation Pattern
The app distinguishes between processing and actual NFC prompts:

### Status States
- **processing**: Initial state when button clicked, nonce fetching, preparing transaction
- **signing/waiting_for_tap**: Active NFC prompt state when user should tap their card

### Message Display
- **"Preparing..."**: Shown during processing state
- **"Tap your card now..."**: Shown only when NFC prompt is active

### Implementation Flow
1. Set status to "processing" when button clicked
2. Perform preparatory operations (nonce, transaction building)
3. Set status to "signing"/"waiting_for_tap" immediately before NFC API calls
4. Call getCardData() or signAuthorization() for actual NFC interaction

## Benefits
- Users know exactly when to tap their card
- Prevents confusion during preparation phase
- Accurate reflection of device readiness
- Consistent pattern across all NFC interactions

## Applied Components
This pattern is consistently used across:
- ConnectCard/ConnectPage
- ChoicesCard/ChoicesPage
- WithdrawCard/WithdrawPage

**Related files**: packages/frontend/src/components/ConnectCard.tsx, packages/frontend/src/pages/ConnectPage.tsx, packages/frontend/src/components/ChoicesCard.tsx, packages/frontend/src/pages/ChoicesPage.tsx, packages/frontend/src/components/WithdrawCard.tsx, packages/frontend/src/pages/WithdrawPage.tsx