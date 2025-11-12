import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import {
  type Hex,
  type TransactionSerializable,
  keccak256,
  serializeTransaction,
} from "viem";
import {
  type Authorization,
  hashAuthorization,
  recoverAuthorizationAddress,
  verifyAuthorization,
} from "viem/experimental";

export interface NFCCardData {
  address: `0x${string}`;
  publicKey: string;
  passcode?: string; // Stored passcode for slot 8
}

interface HaloSignCommand {
  name: "sign";
  keyNo: number;
  rpId: string;
  digest?: string;
  message?: string | Hex;
  format?: "text" | "hex";
  password?: string; // For slot 8
  publicKeyHex?: string; // Required when using password
}

// Simple mobile detection
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Helper function to get valid RP ID for WebAuthn
const getRpId = () => {
  const hostname = window.location.hostname;
  // WebAuthn doesn't support IP addresses as RP ID
  // Check if hostname is an IP address (IPv4 or IPv6)
  const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-fA-F:]+\]?$/.test(
    hostname,
  );

  if (isIPAddress) {
    throw new Error(
      `Cannot use NFC with IP address (${hostname}). Use ngrok for mobile testing: npx ngrok http 3001`,
    );
  }

  return hostname;
};

// In-memory storage for slot 8 public key (clears on refresh)
let slot8PublicKey: string | null = null;

// Get stored passcode for a specific public key
const getStoredPasscode = (publicKey: string): string | null => {
  try {
    const key = `nfc_passcode_${publicKey.slice(0, 20)}`; // Use first 20 chars of pubkey as identifier
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// Save passcode for a specific public key
const savePasscode = (publicKey: string, passcode: string): void => {
  try {
    const key = `nfc_passcode_${publicKey.slice(0, 20)}`;
    localStorage.setItem(key, passcode);
    console.log("📱 NFC: Passcode saved for this card");
  } catch (error) {
    console.warn("Failed to save passcode:", error);
  }
};

const promptForPasscode = async (): Promise<string | null> => {
  const passcode = window.prompt(
    "This NFC card requires a passcode. Please enter your 4-6 digit passcode:",
  );
  return passcode;
};

export const getCardData = async (onBeforeTap?: () => void): Promise<NFCCardData> => {
  console.log("📱 NFC: Starting getCardData...");
  console.log("📱 NFC: Platform:", {
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
  });

  try {
    // Note: This requires either:
    // 1. HaLo Bridge running on desktop (with USB NFC reader)
    // 2. Android Chrome with NFC enabled
    // Will fail on desktop browsers without HaLo Bridge
    const rpId = getRpId();
    console.log("📱 NFC: Using rpId:", rpId);

    // Get slot 8 using get_key_info command
    console.log("📱 NFC: Getting slot 8 with get_key_info command...");

    // Call the callback right before the actual NFC prompt
    onBeforeTap?.();

    const slot8Result = await execHaloCmdWeb({
      name: "get_key_info",
      keyNo: 8,
      rpId: rpId,
    });
    console.log("📱 NFC: Slot 8 get_key_info result:", slot8Result);

    // get_key_info returns publicKey but not address - derive it from the public key
    const publicKey = slot8Result.publicKey;

    // Derive Ethereum address from public key
    // Remove the 0x04 prefix (uncompressed public key marker) and hash the rest
    let address: `0x${string}` | undefined;
    if (publicKey) {
      const pubKeyHex = publicKey.startsWith("0x") ? publicKey.slice(2) : publicKey;
      // Remove the 04 prefix if it's an uncompressed public key
      const pubKeyBytes = pubKeyHex.startsWith("04") ? pubKeyHex.slice(2) : pubKeyHex;
      // Hash it and take the last 20 bytes (40 hex chars)
      const hash = keccak256(`0x${pubKeyBytes}`);
      address = `0x${hash.slice(-40)}` as `0x${string}`;
      console.log("📱 NFC: Derived address from public key:", address);
    }

    if (!address || !publicKey) {
      console.error("📱 NFC: Missing slot 8 data in result:", {
        hasAddress: !!address,
        hasPublicKey: !!publicKey,
        etherAddresses: slot8Result.etherAddresses,
        publicKeys: slot8Result.publicKeys,
      });
      throw new Error("Failed to extract slot 8 card data");
    }

    // Check if this is a different card than before
    if (slot8PublicKey && slot8PublicKey !== publicKey) {
      console.log("📱 NFC: Different card detected, will not use previous card's passcode");
    }

    // Store the public key globally in memory for signing operations
    slot8PublicKey = publicKey;

    console.log("📱 NFC: Slot 8 card data retrieved successfully:", {
      address,
      publicKeyLength: publicKey.length,
    });
    console.log("📱 NFC: Public key saved in memory for this session");

    return { address, publicKey };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("📱 NFC: Failed to get card data:", {
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack?.split("\n").slice(0, 3).join("\n"),
    });

    // Simple error handling: Mobile users vs Desktop users
    if (
      errorObj.message?.includes("NotAllowedError") ||
      errorObj.message?.includes("device can't be used") ||
      errorObj.message?.includes("not supported")
    ) {
      if (isMobile()) {
        // On mobile: recommend Chrome/Safari or refresh
        throw new Error(
          "NFC_BROWSER_UNSUPPORTED: Use Chrome or Safari on mobile for NFC support. " +
            "If you're already using a compatible browser, try refreshing the page.",
        );
      }
      // On desktop: direct to mobile
      throw new Error(
        "NFC_DESKTOP_UNSUPPORTED: Please use Chrome or Safari on your mobile device for NFC support.",
      );
    }

    // Generic fallback error
    throw new Error(
      "NFC_CARD_READ_FAILED: Failed to read NFC card. Please ensure your card is properly positioned and try again.",
    );
  }
};

export const signWithNFC = async (
  message: string | Hex,
  isRawDigest = false,
): Promise<Hex> => {
  // Ensure we have the public key from slot 8
  if (!slot8PublicKey) {
    throw new Error(
      "Slot 8 public key not available. Please read card data first.",
    );
  }

  const command: HaloSignCommand = {
    name: "sign",
    keyNo: 8, // Using slot 8 now
    rpId: getRpId(),
    publicKeyHex: slot8PublicKey, // Required for password-protected slots
  };

  // Set up the message/digest
  if (isRawDigest) {
    // For raw digests (like transaction hashes), use digest parameter
    let digestHex = typeof message === "string" ? message : message;
    // Remove 0x prefix if present for libhalo
    if (digestHex.startsWith("0x")) {
      digestHex = digestHex.slice(2);
    }
    // Validate it's exactly 32 bytes (64 hex chars)
    if (digestHex.length !== 64) {
      throw new Error(
        `Digest must be exactly 32 bytes (64 hex chars), got ${digestHex.length} chars`,
      );
    }
    command.digest = digestHex;
  } else if (typeof message === "string" && !message.startsWith("0x")) {
    // For text messages, use message with text format
    command.message = message;
    command.format = "text";
  } else {
    // For hex messages, use message with hex format (default)
    command.message = message;
    command.format = "hex";
  }

  // Try different passcodes in order
  const passcodesToTry: string[] = [];

  // Try stored passcode for this specific public key
  const storedPasscode = getStoredPasscode(slot8PublicKey);
  if (storedPasscode) {
    passcodesToTry.push(storedPasscode);
  }
  passcodesToTry.push("0000"); // Then try default

  let lastError: Error | null = null;

  for (const passcode of passcodesToTry) {
    try {
      command.password = passcode;
      console.log(`📱 NFC: Trying slot 8 with passcode: ${passcode === "0000" ? "default" : "stored for this card"}`);

      const startTime = Date.now();
      const result = await execHaloCmdWeb(command);
      const elapsed = Date.now() - startTime;
      console.log(`📱 NFC: Sign completed in ${elapsed}ms`);

      if (!result.signature) {
        throw new Error(`No signature returned from card`);
      }

      // Success! Save the passcode for this specific card if it's not already saved
      if (passcode !== storedPasscode) {
        savePasscode(slot8PublicKey, passcode);
      }

      return result.signature.ether as Hex;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`📱 NFC: Failed with passcode ${passcode === "0000" ? "default" : "stored"}:`, lastError.message);

      // Check if it's a wrong password error
      if (
        lastError.message.includes("ERROR_CODE_WRONG_PWD") ||
        lastError.message.includes("wrong password") ||
        lastError.message.includes("Wrong password")
      ) {
        continue; // Try next passcode
      } else {
        // Some other error - don't try more passcodes
        throw lastError;
      }
    }
  }

  // All passcodes failed, prompt user
  console.log("📱 NFC: All stored passcodes failed, prompting user...");

  const userPasscode = await promptForPasscode();
  if (!userPasscode) {
    throw new Error("Passcode required for this NFC card");
  }

  try {
    command.password = userPasscode;
    console.log("📱 NFC: Trying with user-provided passcode...");

    const result = await execHaloCmdWeb(command);

    if (!result.signature) {
      throw new Error(`No signature returned from card`);
    }

    // Success! Save the new passcode for this specific card
    savePasscode(slot8PublicKey, userPasscode);
    console.log("📱 NFC: User passcode worked, saved for this card");

    return result.signature.ether as Hex;
  } catch (error) {
    console.error("NFC signing failed with user passcode:", error);
    throw new Error(
      `NFC Sign Failed: Unable to authenticate with slot 8. Please check your passcode.`,
    );
  }
};

export const createNFCAccount = (address: `0x${string}`) => {
  return {
    type: "local" as const,
    address,
    signMessage: async ({ message }: { message: string | { raw: Hex } }) => {
      // Check if this is an EIP-7702 authorization message
      // EIP-7702 messages start with 0x05 magic byte
      let isEIP7702 = false;
      let messageToSign: string | Hex;

      if (typeof message === "object" && "raw" in message) {
        const rawHex = message.raw;
        // Check if this looks like an EIP-7702 message (starts with 0x05)
        if (rawHex.length > 4 && rawHex.slice(0, 4) === "0x05") {
          console.log("📱 NFC: Detected EIP-7702 authorization message");
          isEIP7702 = true;
          // For EIP-7702, we need to hash the message and sign the raw digest
          const digest = keccak256(message.raw);
          console.log("📱 NFC: EIP-7702 digest to sign:", digest);
          messageToSign = digest;
        } else {
          messageToSign = message.raw;
        }
      } else {
        // String message
        messageToSign = message;
      }

      // Sign with NFC - use raw digest mode for EIP-7702
      const signature = await signWithNFC(messageToSign, isEIP7702);
      return signature;
    },
    signTransaction: async (transaction: TransactionSerializable) => {
      console.log("NFC signTransaction called with:", {
        to: transaction.to,
        from: address,
        value: transaction.value?.toString(),
        data:
          typeof transaction.data === "string"
            ? `${transaction.data.slice(0, 10)}...`
            : transaction.data,
        nonce: transaction.nonce,
        gas: transaction.gas?.toString(),
        chainId: transaction.chainId,
      });

      const serialized = serializeTransaction(transaction);
      console.log("📱 NFC: Serialized transaction:", serialized);

      const hash = keccak256(serialized);
      console.log("📱 NFC: Transaction hash to sign:", hash);

      // Pass true for isRawDigest since this is a transaction hash
      const signature = await signWithNFC(hash, true);
      console.log("📱 NFC: Transaction signature received:", signature);

      // Parse signature components
      const r = `0x${signature.slice(2, 66)}` as Hex;
      const s = `0x${signature.slice(66, 130)}` as Hex;
      const v = Number.parseInt(signature.slice(130, 132), 16);
      const yParity = v === 27 ? 0 : 1;

      // Serialize the signed transaction
      const signedTx = serializeTransaction(transaction, {
        r,
        s,
        yParity,
      });

      console.log("📱 NFC: Signed transaction:", signedTx);
      return signedTx;
    },
    signTypedData: async () => {
      throw new Error("Typed data signing not yet implemented");
    },
    signAuthorization: async (authorization: Authorization) => {
      console.log("📱 NFC: signAuthorization called with:", authorization);

      // Use viem's hashAuthorization to get the proper hash
      const hash = hashAuthorization(authorization);
      console.log("📱 NFC: Authorization hash from viem:", hash);

      // Sign the raw digest with NFC
      const signature = await signWithNFC(hash, true);
      console.log("📱 NFC: Authorization signature:", signature);

      // Parse signature components
      const r = `0x${signature.slice(2, 66)}` as Hex;
      const s = `0x${signature.slice(66, 130)}` as Hex;
      const v = Number.parseInt(signature.slice(130, 132), 16);
      const yParity = v === 27 ? 0 : 1;

      // Return the signed authorization with all required fields
      const result = {
        ...authorization,
        r,
        s,
        yParity,
        v: BigInt(v),
      };

      console.log("📱 NFC: Signed authorization:", result);

      // Verify the signature and recover the address
      try {
        const recoveredAddress = await recoverAuthorizationAddress({
          authorization: result,
        });
        console.log(
          "📱 NFC: Recovered address from authorization:",
          recoveredAddress,
        );
        console.log("📱 NFC: Expected address (EOA):", address);
        console.log(
          "📱 NFC: Address match:",
          recoveredAddress.toLowerCase() === address.toLowerCase(),
        );

        const isValid = await verifyAuthorization({
          authorization: result,
          address: address,
        });
        console.log("📱 NFC: Authorization verification result:", isValid);
      } catch (error) {
        console.error("📱 NFC: Failed to verify authorization:", error);
      }

      return result;
    },
  };
};
