# TLA+ Web — TLC Model Checker in the Browser

Run the [TLA+ TLC model checker](https://github.com/tlaplus/tlaplus) entirely in your browser — no backend server needed. Powered by [CheerpJ](https://cheerpj.com/) (Java in WebAssembly).

The Java wrapper writes spec/config files to CheerpJ's virtual filesystem, invokes TLC, captures stdout/stderr, and returns the output to JavaScript.

## Prerequisites

- **Java 11** (for building the Java wrapper)
- **Node.js 18+** (for the Next.js frontend)
- **FedericoPonzi/tlaplus fork** with the RMI patch applied (see below)

## Quick Start

### 0. Patch the tlaplus fork (one-time setup)

CheerpJ doesn't support Java RMI (native sockets). TLC's `FPSet` class extends `UnicastRemoteObject` which triggers RMI on construction. Apply the included patch to your tlaplus fork:

```bash
cd /path/to/your/tlaplus-fork
git apply /path/to/tlaplus-web/fpset-patch.diff
```

The patch changes `FPSet` to implement `Serializable` instead of extending `UnicastRemoteObject`. This disables distributed TLC (not needed in the browser) but keeps everything else working.

After patching, rebuild and publish the fork to JitPack (push the commit).

### 1. Build the Java wrapper

```bash
cd java-wrapper
./gradlew buildWebJar
```

This produces `java-wrapper/build/libs/tlaplus-web-cheerpj.jar`.

### 2. Copy the JAR to the web project

```bash
cp java-wrapper/build/libs/tlaplus-web-cheerpj.jar web/public/
```

### 3. Install frontend dependencies and run

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Known Limitations

- **First load is slow** — CheerpJ needs to download and initialize the JVM + JAR (~30MB+)
- **Threading** — Default is 1 worker. Multi-threading works via Web Workers but may have browser-specific quirks
- **No file I/O** — Specs must be entered in the editor (no file upload yet)
- **Browser only** — Requires a modern browser with WebAssembly support (Chrome, Firefox, Edge)
