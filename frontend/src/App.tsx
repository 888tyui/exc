import { useEffect, useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import logo from "./logoa1.png";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const endpoint = clusterApiUrl("mainnet-beta");

function shorten(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function VideoBlock() {
  return (
    <div className="video-block">
      <div className="video-inner">
        <div className="play-circle">
          <span className="play-triangle" />
        </div>
        <p className="muted center">See how exc works (2m)</p>
      </div>
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: "What is exc.fun?",
      a: "A Solana-powered drop that lets you summon a warrior identity before launch.",
    },
    {
      q: "What happens when I connect?",
      a: "We reserve your warrior number and keep your address on the allowlist.",
    },
    {
      q: "Is Ledger or hardware required?",
      a: "No. We only use software wallets (Phantom, Solflare, Backpack, Glow).",
    },
    {
      q: "When does it launch?",
      a: "Early 2025. Join the waitlist to be notified first.",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq">
      <h2>Frequently asked questions</h2>
      <p className="muted center">
        Everything you need to know about exc.fun and the warrior launch.
      </p>
      <div className="faq-list">
        {items.map((item, idx) => {
          const active = open === idx;
          return (
            <button
              key={item.q}
              className={`faq-item ${active ? "active" : ""}`}
              onClick={() => setOpen(active ? null : idx)}
              type="button"
            >
              <span>{item.q}</span>
              <span className="faq-icon">{active ? "−" : "+"}</span>
              {active && <p className="faq-answer">{item.a}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WarriorStatus() {
  const { publicKey } = useWallet();
  const [warriorNumber, setWarriorNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle"
  );

  useEffect(() => {
    let cancelled = false;
    if (!publicKey) {
      setWarriorNumber(null);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setStatus("loading");
      try {
        const res = await fetch(`${apiBase}/warriors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: publicKey.toBase58() }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to register wallet");
        }

        const data: { warriorNumber: number } = await res.json();
        if (!cancelled) {
          setWarriorNumber(data.warriorNumber);
          setStatus("done");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setStatus("error");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [publicKey]);

  if (!publicKey) {
    return <p className="muted">Connect your Solana wallet to see your warrior number.</p>;
  }

  if (status === "loading") {
    return <p className="muted">Claiming your warrior number...</p>;
  }

  if (status === "error") {
    return (
      <p className="error">
        Could not claim your number. Please try again in a moment.
      </p>
    );
  }

  return (
    <div className="status">
      <p className="muted">Connected as {shorten(publicKey.toBase58())}</p>
      {warriorNumber ? (
        <p className="hero">You are #{warriorNumber} warrior.</p>
      ) : (
        <p className="muted">Securing your spot...</p>
      )}
    </div>
  );
}

function AppShell() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <main className="page">
            <div className="panel">
              <div className="logo-mark">
                <img src={logo} alt="exc.fun logo" />
              </div>
              <h1 className="hero-title">Summon your Solana warrior</h1>
              <p className="subtitle">
                Connect your wallet to reserve a warrior number and be first in when exc.fun launches.
              </p>

              <div className="actions hero-actions single-row">
                <WalletMultiButton className="btn primary" />
                <a
                  className="btn ghost"
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitter
                </a>
                <button className="btn disabled" disabled>
                  Game
                </button>
                <button className="btn disabled" disabled>
                  Docs
                </button>
              </div>

              <WarriorStatus />
            </div>

            <VideoBlock />

            <FAQ />
          </main>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default function App() {
  return <AppShell />;
}

