# NFC Auto-Connect Suspense Pattern

## Overview
React Suspense-based implementation for automatic NFC connection on page load, providing seamless user experience with the demon-slayer themed interface.

## Implementation Details
- **Resource Pattern**: NFCResource module immediately prompts for NFC tap when page loads using a resource pattern that throws promises
- **WebAuthn Timing**: 500ms delay before WebAuthn context initialization to prevent NFC cards from being read as regular tags on mobile
- **Connection Object**: Contains only address and account (not walletClient) since NFC cards sign directly without needing window.ethereum transport
- **Victory Effects**: Wilhelm scream plays 300ms after successful signature with victory text appearing 1 second later

## Technical Architecture
The Suspense pattern allows for declarative loading states while the NFC connection is being established, integrating seamlessly with React's concurrent features.

**Related files**: packages/frontend/src/lib/nfcResource.ts, packages/frontend/src/components/DemonSlayer.tsx, packages/frontend/src/App.tsx