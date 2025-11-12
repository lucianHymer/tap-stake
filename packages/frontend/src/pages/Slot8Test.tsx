import { useState } from "react";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import { getCardData, signWithNFC } from "../lib/nfc";
import { recoverMessageAddress } from "viem";

export default function Slot8Test() {
  const [status, setStatus] = useState<string>("Ready to test slot 8");
  const [cardData, setCardData] = useState<any>(null);
  const [rawPkeysData, setRawPkeysData] = useState<any>(null);
  const [signature, setSignature] = useState<string>("");

  const handleGetRawPkeys = async () => {
    try {
      setStatus("Reading all public keys from card...");
      const hostname = window.location.hostname;

      // Try without keyNo first (default behavior)
      const result = await execHaloCmdWeb({
        name: "get_pkeys",
        rpId: hostname,
      });

      // Also try with keyNo 8 specifically
      let slot8Result = null;
      try {
        slot8Result = await execHaloCmdWeb({
          name: "get_pkeys",
          keyNo: 8,
          rpId: hostname,
        });
      } catch (e) {
        console.log("get_pkeys with keyNo 8 failed:", e);
      }

      // Try get_key_info for slot 8
      let keyInfoResult = null;
      try {
        keyInfoResult = await execHaloCmdWeb({
          name: "get_key_info",
          keyNo: 8,
          rpId: hostname,
        });
      } catch (e) {
        console.log("get_key_info for slot 8 failed:", e);
      }

      setRawPkeysData({
        default: result,
        slot8_direct: slot8Result,
        slot8_keyinfo: keyInfoResult,
      });
      setStatus("✅ Raw pkeys data retrieved");
    } catch (error: any) {
      console.error("Error reading raw pkeys:", error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleGetCardData = async () => {
    try {
      setStatus("Reading card data from slot 8...");
      const data = await getCardData();
      setCardData(data);
      setStatus(`✅ Card read successfully! Address: ${data.address}`);
    } catch (error: any) {
      console.error("Error reading card:", error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleTestSign = async () => {
    if (!cardData) {
      setStatus("Please read card first!");
      return;
    }

    try {
      setStatus("Signing test message with slot 8...");
      const message = "Test message for slot 8";
      const sig = await signWithNFC(message);
      setSignature(sig);

      // Verify the signature
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: sig,
      });

      if (recoveredAddress.toLowerCase() === cardData.address.toLowerCase()) {
        setStatus(`✅ Signature verified! Signer matches slot 8 address`);
      } else {
        setStatus(`⚠️ Signature mismatch! Expected: ${cardData.address}, Got: ${recoveredAddress}`);
      }
    } catch (error: any) {
      console.error("Error signing:", error);
      setStatus(`❌ Sign error: ${error.message}`);
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem("nfc_slot8_passcode");
    setStatus("✅ Cleared stored passcode");
  };

  return (
    <div style={{ padding: "10px", fontFamily: "monospace", fontSize: "14px" }}>
      <h2>Slot 8 Debug</h2>

      <p>Status: {status}</p>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleGetRawPkeys}>Get Raw Pkeys</button>{" "}
        <button onClick={handleGetCardData}>Read Slot 8</button>{" "}
        <button onClick={handleTestSign} disabled={!cardData}>Test Sign</button>{" "}
        <button onClick={handleClearStorage}>Clear Passcode</button>
      </div>

      {rawPkeysData && (
        <div>
          <h3>Raw get_pkeys Results:</h3>

          {rawPkeysData.default && (
            <div>
              <p><strong>Default get_pkeys:</strong></p>
              <p>Slots: {Object.keys(rawPkeysData.default.etherAddresses || {}).join(", ")}</p>
              {Object.entries(rawPkeysData.default.etherAddresses || {}).map(([slot, address]) => (
                <div key={slot} style={{ fontSize: "12px", marginLeft: "10px" }}>
                  Slot {slot}: {(address as string).slice(0, 10)}...
                </div>
              ))}
            </div>
          )}

          {rawPkeysData.slot8_direct && (
            <div style={{ marginTop: "10px" }}>
              <p><strong>get_pkeys with keyNo:8:</strong></p>
              <p style={{ fontSize: "12px", marginLeft: "10px" }}>
                {JSON.stringify(rawPkeysData.slot8_direct).slice(0, 100)}...
              </p>
            </div>
          )}

          {rawPkeysData.slot8_keyinfo && (
            <div style={{ marginTop: "10px" }}>
              <p><strong>get_key_info for slot 8:</strong></p>
              <p style={{ fontSize: "12px", marginLeft: "10px" }}>
                {JSON.stringify(rawPkeysData.slot8_keyinfo).slice(0, 100)}...
              </p>
            </div>
          )}

          {!rawPkeysData.slot8_direct && !rawPkeysData.slot8_keyinfo && (
            <p style={{ color: "red", marginTop: "10px" }}>
              ❌ Neither get_pkeys(keyNo:8) nor get_key_info(keyNo:8) returned data
            </p>
          )}
        </div>
      )}

      {cardData && (
        <div>
          <h3>Card Data:</h3>
          <p>Address: {cardData.address}</p>
          <p>PublicKey: {cardData.publicKey?.substring(0, 30)}...</p>
        </div>
      )}

      {signature && (
        <div>
          <h3>Signature:</h3>
          <p style={{ wordBreak: "break-all", fontSize: "12px" }}>{signature}</p>
        </div>
      )}
    </div>
  );
}