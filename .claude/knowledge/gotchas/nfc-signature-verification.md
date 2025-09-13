# NFC Signature Verification

## [2025-09-13] Signature Verification Mismatch
The signature verification was failing because of a mismatch in message hashing. The NFC card signs raw hashes directly, but viem's recoverMessageAddress expects signatures of messages WITH the Ethereum prefix ("\x19Ethereum Signed Message:\n"). 

**Solution**: Do NOT hash the message in signMessage - instead pass the raw message string to the NFC card, which will handle the prefixing and hashing correctly. Alternatively, if the NFC card only signs hashes, we need to manually add the prefix before hashing, or use recoverAddress with the raw hash instead of recoverMessageAddress.

**Related files**: packages/frontend/src/lib/nfc.ts