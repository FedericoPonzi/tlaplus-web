import type { Metadata } from "next";
import Script from "next/script";

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
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
        <Script
          src="https://cjrtnc.leaningtech.com/4.2/loader.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
