"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ResizableDivider from "@/components/ResizableDivider";
import { initCheerpJ, runTlc, isCheerpJReady } from "@/lib/cheerpj";
import { DIEHARD_SPEC, DIEHARD_CFG } from "@/lib/examples";
import { tlaplus, tlaCfg } from "@/lib/tlaplus-lang";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });

type EditorTab = "spec" | "cfg";

export default function Home() {
  const [spec, setSpec] = useState(DIEHARD_SPEC);
  const [cfg, setCfg] = useState(DIEHARD_CFG);
  const [activeTab, setActiveTab] = useState<EditorTab>("spec");
  const [rawOutput, setRawOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [workers, setWorkers] = useState(1);
  const [checkDeadlock, setCheckDeadlock] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(380);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(w => Math.max(250, Math.min(800, w - delta)));
  }, []);

  useEffect(() => {
    initCheerpJ()
      .then(() => setIsReady(true))
      .catch((err) => {
        setRawOutput(`Failed to initialize CheerpJ: ${err.message}\n\nMake sure tlaplus-web-cheerpj.jar is in the public/ directory.`);
      });
  }, []);

  const handleRun = useCallback(async () => {
    if (!isCheerpJReady()) return;
    setIsRunning(true);
    setRawOutput("");

    try {
      const result = await runTlc(spec, cfg, { workers, checkDeadlock }, (line) => {
        if (line.trim()) setRawOutput(prev => prev + line + "\n");
      });
      setRawOutput(result);
    } catch (err: any) {
      setRawOutput(`Error: ${err.message}\n\n${err.stack || ""}`);
    } finally {
      setIsRunning(false);
      setIsReady(false);
      setRawOutput(prev => prev + "\nReloading CheerpJ and TLC...");
      initCheerpJ()
        .then(() => {
          setIsReady(true);
          setRawOutput(prev => prev.replace("\nReloading CheerpJ and TLC...", ""));
        })
        .catch(() => setIsReady(false));
    }
  }, [spec, cfg, workers, checkDeadlock]);

  const tabStyle = (tab: EditorTab): React.CSSProperties => ({
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #7aa2f7" : "2px solid transparent",
    backgroundColor: "transparent",
    color: activeTab === tab ? "#c0caf5" : "#565f89",
    transition: "color 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#1a1b26" }}>
      {/* Header */}
      <header style={{
        padding: "6px 16px",
        backgroundColor: "#16161e",
        color: "#c0caf5",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
        borderBottom: "1px solid #292e42",
      }}>
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "-0.3px" }}>TLA+ Web</h1>
        <span style={{ fontSize: "12px", color: "#565f89" }}>TLC Model Checker in the Browser</span>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Tabbed editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: "flex",
            backgroundColor: "#16161e",
            borderBottom: "1px solid #292e42",
            flexShrink: 0,
          }}>
            <button style={tabStyle("spec")} onClick={() => setActiveTab("spec")}>
              Spec.tla
            </button>
            <button style={tabStyle("cfg")} onClick={() => setActiveTab("cfg")}>
              Spec.cfg
            </button>
          </div>

          {/* Editor area */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, display: activeTab === "spec" ? "block" : "none" }}>
              <CodeEditor value={spec} onChange={setSpec} language={tlaplus()} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: activeTab === "cfg" ? "block" : "none" }}>
              <CodeEditor value={cfg} onChange={setCfg} language={tlaCfg()} />
            </div>
          </div>
        </div>

        {/* Resizable divider */}
        <ResizableDivider direction="horizontal" onResize={handleSidebarResize} />

        {/* Right: Model Checking sidebar */}
        <div style={{
          width: `${sidebarWidth}px`,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #292e42",
          backgroundColor: "#1a1b26",
          overflow: "hidden",
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: "8px 12px",
            backgroundColor: "#16161e",
            borderBottom: "1px solid #292e42",
            fontSize: "12px",
            fontWeight: 600,
            color: "#565f89",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Model Checking
          </div>

          {/* Run controls */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #292e42" }}>
            <button
              onClick={handleRun}
              disabled={isRunning || !isReady}
              style={{
                width: "100%",
                padding: "7px 0",
                backgroundColor: isRunning ? "#414868" : isReady ? "#238636" : "#414868",
                color: isRunning || !isReady ? "#565f89" : "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: isRunning || !isReady ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "13px",
                marginBottom: "10px",
              }}
            >
              {isRunning ? "⏳ Running..." : isReady ? "▶ Run TLC" : "⏳ Loading CheerpJ..."}
            </button>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#7982a9" }}>
                Workers
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={workers}
                  onChange={(e) => setWorkers(parseInt(e.target.value) || 1)}
                  style={{
                    width: "40px",
                    padding: "2px 4px",
                    border: "1px solid #292e42",
                    borderRadius: "3px",
                    backgroundColor: "#24283b",
                    color: "#c0caf5",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#7982a9" }}>
                <input
                  type="checkbox"
                  checked={checkDeadlock}
                  onChange={(e) => setCheckDeadlock(e.target.checked)}
                  style={{ accentColor: "#7aa2f7" }}
                />
                Deadlock
              </label>
            </div>
          </div>

          {/* Output area */}
          <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
            <pre style={{
              margin: 0,
              fontFamily: "monospace",
              fontSize: "12px",
              color: rawOutput ? "#c0caf5" : "#565f89",
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
            }}>
              {rawOutput || "Press ▶ Run TLC to check the model.\n\nEdit Spec.tla and Spec.cfg using\nthe tabs on the left."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
