import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TLA+ Web — Model Checker in the Browser",
  description: "Run the TLA+ TLC model checker entirely in your browser using CheerpJ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#1a1b26", color: "#e0e0e0" }}>
        {children}
      </body>
    </html>
  );
}
