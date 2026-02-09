// CheerpJ type declarations
declare global {
  function cheerpjInit(options?: {
    status?: string;
    version?: number;
    javaProperties?: string[];
  }): Promise<void>;
  function cheerpjRunLibrary(classPath: string): Promise<any>;
}

export interface TlcOptions {
  workers: number;
  checkDeadlock: boolean;
}

let initPromise: Promise<void> | null = null;
let cheerpjReady = false;
let TlcRunnerClass: any = null;

function waitForCheerpJ(): Promise<void> {
  return new Promise((resolve) => {
    console.log("[tlaplus-web] Waiting for CheerpJ loader...");
    if (typeof cheerpjInit !== "undefined") {
      console.log("[tlaplus-web] CheerpJ loader already available");
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (typeof cheerpjInit !== "undefined") {
        clearInterval(interval);
        console.log("[tlaplus-web] CheerpJ loader is now available");
        resolve();
      }
    }, 100);
  });
}

async function doInit(): Promise<void> {
  await waitForCheerpJ();
  console.log("[tlaplus-web] Calling cheerpjInit with version: 11...");
  try {
    await cheerpjInit({
      status: "none",
      version: 11,
      javaProperties: [
        "java.awt.headless=true",
        "com.sun.management.jmxremote=false",
      ],
    });
    console.log("[tlaplus-web] cheerpjInit succeeded");
  } catch (err) {
    console.error("[tlaplus-web] cheerpjInit FAILED:", err);
    throw err;
  }

  console.log("[tlaplus-web] Loading JAR via cheerpjRunLibrary...");
  try {
    // /app/ maps to the web server root; basePath must be included for subdirectory deploys
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const jarPath = `/app${basePath}/tlaplus-web-cheerpj.jar`;
    console.log("[tlaplus-web] JAR path:", jarPath);
    const lib = await cheerpjRunLibrary(jarPath);
    console.log("[tlaplus-web] JAR loaded, resolving TlcRunner class...");
    TlcRunnerClass = await lib.me.fponzi.tlaplusweb.TlcRunner;
    console.log("[tlaplus-web] TlcRunner class resolved successfully");
  } catch (err) {
    console.error("[tlaplus-web] JAR/class loading FAILED:", err);
    throw err;
  }

  cheerpjReady = true;
  console.log("[tlaplus-web] CheerpJ fully initialized and ready");
}

// Singleton: no matter how many times this is called, init runs only once
export function initCheerpJ(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit();
  }
  return initPromise;
}

export async function runTlc(
  spec: string,
  cfg: string,
  options: TlcOptions
): Promise<string> {
  if (!cheerpjReady || !TlcRunnerClass) {
    throw new Error("CheerpJ not initialized. Call initCheerpJ() first.");
  }

  console.log("[tlaplus-web] Calling TlcRunner.run()...");

  // Capture console output as fallback in case System.setOut doesn't work in CheerpJ
  const capturedLines: string[] = [];
  const origLog = console.log;
  const origError = console.error;
  const capture = (...args: any[]) => {
    const line = args.map(a => String(a)).join(" ");
    capturedLines.push(line);
    origLog.apply(console, args);
  };
  console.log = capture;
  console.error = capture;

  try {
    const result = await TlcRunnerClass.run(
      spec,
      cfg,
      options.workers,
      options.checkDeadlock
    );

    console.log = origLog;
    console.error = origError;

    const javaResult = result ? String(result) : "";
    console.log("[tlaplus-web] TlcRunner.run() returned, result length:", javaResult.length);

    // If Java captured output, use it; otherwise fall back to console capture
    if (javaResult.trim().length > 0) {
      return javaResult;
    } else if (capturedLines.length > 0) {
      return capturedLines.join("\n");
    } else {
      return "TLC completed but produced no output.";
    }
  } catch (err) {
    console.log = origLog;
    console.error = origError;
    console.error("[tlaplus-web] TlcRunner.run() FAILED:", err);

    // Even if it threw, there might be console output
    if (capturedLines.length > 0) {
      return capturedLines.join("\n") + "\n\nError: " + String(err);
    }
    throw err;
  }
}

export function isCheerpJReady(): boolean {
  return cheerpjReady;
}
