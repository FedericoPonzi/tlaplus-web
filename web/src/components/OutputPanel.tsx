"use client";

import { useEffect, useRef } from "react";

interface OutputPanelProps {
  output: string;
}

export default function OutputPanel({ output }: OutputPanelProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <pre
      ref={outputRef}
      style={{
        flex: 1,
        margin: 0,
        padding: "12px",
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: "13px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {output || "Click \"Run TLC\" to start model checking.\n\nThe TLA+ specification editor is on the left.\nThe model configuration is below.\n\nThis tool runs TLC entirely in your browser using CheerpJ."}
    </pre>
  );
}
