import React, { useEffect, useRef, useState } from "react";
import Connect from "@mono.co/connect.js";
import { api } from "./api.js";

/**
 * Note on coverage: this links Nigerian BANK accounts. Investment platforms
 * (Bamboo, RiseVest, Cowrywise, PiggyVest) aren't Mono-linkable the same
 * way — use the manual account form on the Accounts screen for those.
 */
export default function ConnectBankButton({ onLinked }) {
  const connectRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | linking | error

  useEffect(() => {
    connectRef.current = new Connect({
      key: import.meta.env.VITE_MONO_PUBLIC_KEY,
      scope: "auth",
      data: {
        // Mono needs either a real Mono customer ID it already knows, or a
        // name+email to create a brand-new customer. Our app's own random
        // userId isn't a Mono ID, so passing it as { id: ... } made Mono
        // look up a customer that doesn't exist and throw a generic error.
        customer: {
          name: "SapaProof Test User",
          email: `${api.getUserId()}@sapaproof-demo.test`,
        },
      },
      onSuccess: async ({ code }) => {
        setStatus("linking");
        try {
          const result = await api.exchangeToken(code);
          setStatus("idle");
          onLinked?.(result);
        } catch (err) {
          console.error(err);
          setStatus("error");
        }
      },
      onClose: () => setStatus((s) => (s === "linking" ? s : "idle")),
    });
    connectRef.current.setup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      className="connect-cta"
      onClick={() => connectRef.current?.open()}
      disabled={status === "linking"}
    >
      + {status === "linking" ? "Linking..." : "Connect a bank account"}
      {status === "error" && <span className="inline-error"> — try again</span>}
    </button>
  );
}
