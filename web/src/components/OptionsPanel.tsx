"use client";

import { useState } from "react";

interface OptionsPanelProps {
  onRun: (options: { workers: number; checkDeadlock: boolean }) => void;
  isRunning: boolean;
  isReady: boolean;
}

export default function OptionsPanel({ onRun, isRunning, isReady }: OptionsPanelProps) {
  const [workers, setWorkers] = useState(1);
  const [checkDeadlock, setCheckDeadlock] = useState(true);

  return (
    <div style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => onRun({ workers, checkDeadlock })}
          disabled={isRunning || !isReady}
          style={{
            padding: "8px 24px",
            backgroundColor: isRunning ? "#999" : isReady ? "#0070f3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isRunning || !isReady ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {isRunning ? "Running..." : isReady ? "▶ Run TLC" : "Loading CheerpJ..."}
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
          Workers:
          <input
            type="number"
            min={1}
            max={8}
            value={workers}
            onChange={(e) => setWorkers(parseInt(e.target.value) || 1)}
            style={{ width: "50px", padding: "4px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={checkDeadlock}
            onChange={(e) => setCheckDeadlock(e.target.checked)}
          />
          Check deadlock
        </label>
      </div>
    </div>
  );
}
