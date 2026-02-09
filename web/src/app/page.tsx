"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import OptionsPanel from "@/components/OptionsPanel";
import OutputPanel from "@/components/OutputPanel";
import { initCheerpJ, runTlc, isCheerpJReady } from "@/lib/cheerpj";
import { DIEHARD_SPEC, DIEHARD_CFG } from "@/lib/examples";

// CodeMirror must be loaded client-side only
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });

export default function Home() {
  const [spec, setSpec] = useState(DIEHARD_SPEC);
  const [cfg, setCfg] = useState(DIEHARD_CFG);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initCheerpJ()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("[tlaplus-web] Full initialization error:", err);
        setOutput(`Failed to initialize CheerpJ: ${err.message}\n\nStack: ${err.stack || "N/A"}\n\nMake sure tlaplus-web-cheerpj.jar is in the public/ directory.\n\nCheck browser console for more details.`);
      });
  }, []);

  const handleRun = useCallback(
    async (options: { workers: number; checkDeadlock: boolean }) => {
      if (!isCheerpJReady()) return;
      setIsRunning(true);
      setOutput("Starting TLC model checker...\n");

      try {
        const result = await runTlc(spec, cfg, options);
        setOutput(result);
      } catch (err: any) {
        setOutput(`Error: ${err.message}\n\n${err.stack || ""}`);
      } finally {
        setIsRunning(false);
      }
    },
    [spec, cfg]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <header
        style={{
          padding: "8px 16px",
          backgroundColor: "#24292e",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>TLA+ Web</h1>
        <span style={{ fontSize: "13px", color: "#8b949e" }}>
          TLC Model Checker in the Browser
        </span>
      </header>

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel: Spec editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "2px solid #ccc",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              backgroundColor: "#f6f8fa",
              borderBottom: "1px solid #ccc",
              fontSize: "13px",
              fontWeight: 600,
              color: "#24292e",
            }}
          >
            Spec.tla
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <CodeEditor value={spec} onChange={setSpec} />
          </div>
        </div>

        {/* Right panel: Options + Output + Config */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Options bar */}
          <OptionsPanel onRun={handleRun} isRunning={isRunning} isReady={isReady} />

          {/* Output */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                backgroundColor: "#f6f8fa",
                borderBottom: "1px solid #ccc",
                fontSize: "13px",
                fontWeight: 600,
                color: "#24292e",
              }}
            >
              TLC Output
            </div>
            <OutputPanel output={output} />
          </div>

          {/* Config editor */}
          <div
            style={{
              height: "200px",
              display: "flex",
              flexDirection: "column",
              borderTop: "2px solid #ccc",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                backgroundColor: "#f6f8fa",
                borderBottom: "1px solid #ccc",
                fontSize: "13px",
                fontWeight: 600,
                color: "#24292e",
              }}
            >
              Spec.cfg
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <CodeEditor value={cfg} onChange={setCfg} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
