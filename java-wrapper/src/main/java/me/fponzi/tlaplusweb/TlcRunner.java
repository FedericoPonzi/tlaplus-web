package me.fponzi.tlaplusweb;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;

import tlc2.TLC;
import util.SimpleFilenameToStream;
import util.FileUtil;
import util.ToolIO;

/**
 * Minimal wrapper around TLC for browser execution via CheerpJ.
 * Uses TLC's handleParameters() + process() directly to avoid System.exit().
 */
public class TlcRunner {

    /**
     * Run TLC model checker with the given spec and config.
     *
     * @param specContent  The TLA+ specification content
     * @param cfgContent   The TLC configuration content
     * @param workers      Number of worker threads (default: 1)
     * @param checkDeadlock Whether to check for deadlocks
     * @return The captured TLC output (stdout + stderr)
     */
    public static String run(String specContent, String cfgContent, int workers, boolean checkDeadlock) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintStream captureStream = new PrintStream(baos);
        PrintStream originalOut = System.out;
        PrintStream originalErr = System.err;

        try {
            // Extract module name from spec content (e.g., "---- MODULE DieHard ----")
            String moduleName = "Spec";
            for (String line : specContent.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.contains("MODULE")) {
                    int idx = trimmed.indexOf("MODULE");
                    String after = trimmed.substring(idx + 6).trim();
                    // Remove trailing dashes
                    after = after.replaceAll("-+$", "").trim();
                    if (!after.isEmpty()) {
                        moduleName = after;
                    }
                    break;
                }
            }

            // Write spec and config to filesystem using the module name
            File dir = new File("/files");
            dir.mkdirs();

            File specFile = new File(dir, moduleName + ".tla");
            try (FileWriter fw = new FileWriter(specFile)) {
                fw.write(specContent);
            }

            File cfgFile = new File(dir, moduleName + ".cfg");
            try (FileWriter fw = new FileWriter(cfgFile)) {
                fw.write(cfgContent);
            }

            // Redirect System.out/err so any direct prints are captured
            System.setOut(captureStream);
            System.setErr(captureStream);

            // Disable JMX — unsupported in CheerpJ browser environment
            System.setProperty("com.sun.management.jmxremote", "false");
            System.setProperty("javax.management.builder.initial", "me.fponzi.tlaplusweb.NoOpMBeanServerBuilder");

            // Use TOOL mode so TLC writes to ToolIO internal buffers
            ToolIO.reset();
            ToolIO.setMode(ToolIO.TOOL);

            // Build TLC arguments
            List<String> args = new ArrayList<>();
            args.add("-config");
            args.add("/files/" + moduleName + ".cfg");
            args.add("-workers");
            args.add(String.valueOf(workers));
            args.add("-noGenerateSpecTE");
            args.add("-metadir");
            args.add("/files/tlc-states");
            if (!checkDeadlock) {
                args.add("-deadlock");
            }
            args.add("/files/" + moduleName + ".tla");

            // Use TLC's API directly instead of main() to avoid System.exit()
            TLC tlc = new TLC();
            originalOut.println("Parsing parameters...");
            boolean paramsOk = tlc.handleParameters(args.toArray(new String[0]));
            if (!paramsOk) {
                captureStream.println("Error: Failed to parse TLC parameters.");
            } else {
                String specDir = FileUtil.parseDirname(tlc.getMainFile());
                if (!specDir.isEmpty()) {
                    tlc.setResolver(new SimpleFilenameToStream(specDir));
                } else {
                    tlc.setResolver(new SimpleFilenameToStream());
                }
                originalOut.println("Starting TLC on module " + tlc.getMainFile() + "...");
                int errorCode = tlc.process();
                originalOut.println("TLC finished with exit code: " + errorCode);
                captureStream.flush();

                // Collect ToolIO messages (where TLC actually writes output)
                String[] toolMessages = ToolIO.getAllMessages();
                StringBuilder sb = new StringBuilder();
                for (String msg : toolMessages) {
                    if (msg != null) {
                        sb.append(msg).append("\n");
                    }
                }
                // Append any System.out/err output
                String sysOutput = baos.toString();
                if (!sysOutput.isEmpty()) {
                    sb.append(sysOutput);
                }
                sb.append("\nTLC finished with exit code: ").append(errorCode);
                return sb.toString();
            }

        } catch (Exception e) {
            captureStream.println("Error running TLC: " + e.getMessage());
            e.printStackTrace(captureStream);
        } finally {
            System.setOut(originalOut);
            System.setErr(originalErr);
            ToolIO.setMode(ToolIO.SYSTEM);
        }

        return baos.toString();
    }

    public static void main(String[] args) {
        System.out.println("TlcRunner ready.");
    }
}
