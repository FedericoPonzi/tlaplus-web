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

    static {
        System.setProperty("com.sun.management.jmxremote", "false");
        System.setProperty("javax.management.builder.initial", "me.fponzi.tlaplusweb.NoOpMBeanServerBuilder");
    }

    /**
     * Run TLC model checker with the given spec and config.
     */
    public static String run(String specContent, String cfgContent, int workers, boolean checkDeadlock) {
        return runInternal(specContent, cfgContent, workers, checkDeadlock, false, "/files");
    }

    /**
     * Run TLC in simulation mode (random DFS — faster but non-deterministic).
     */
    public static String runSimulate(String specContent, String cfgContent, int workers, boolean checkDeadlock) {
        return runInternal(specContent, cfgContent, workers, checkDeadlock, true, "/files");
    }

    private static String runInternal(String specContent, String cfgContent, int workers, boolean checkDeadlock, boolean simulate, String baseDir) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintStream capture = new PrintStream(baos, true);
        PrintStream originalOut = System.out;
        PrintStream originalErr = System.err;

        try {
            String moduleName = "Spec";
            for (String line : specContent.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.contains("MODULE")) {
                    int idx = trimmed.indexOf("MODULE");
                    String after = trimmed.substring(idx + 6).trim();
                    after = after.replaceAll("-+$", "").trim();
                    if (!after.isEmpty()) {
                        moduleName = after;
                    }
                    break;
                }
            }

            File dir = new File(baseDir);
            dir.mkdirs();

            File specFile = new File(dir, moduleName + ".tla");
            try (FileWriter fw = new FileWriter(specFile)) {
                fw.write(specContent);
            }

            File cfgFile = new File(dir, moduleName + ".cfg");
            try (FileWriter fw = new FileWriter(cfgFile)) {
                fw.write(cfgContent);
            }

            System.setOut(capture);
            System.setErr(capture);
            ToolIO.reset();
            ToolIO.setMode(ToolIO.SYSTEM);

            List<String> args = new ArrayList<>();
            args.add("-config");
            args.add(baseDir + "/" + moduleName + ".cfg");
            args.add("-workers");
            args.add(String.valueOf(workers));
            args.add("-noGenerateSpecTE");
            args.add("-metadir");
            args.add(baseDir + "/tlc-states");
            if (!checkDeadlock) {
                args.add("-deadlock");
            }
            if (simulate) {
                args.add("-simulate");
                args.add("-depth");
                args.add("20");
            }
            args.add(baseDir + "/" + moduleName + ".tla");

            TLC tlc = new TLC();
            capture.println("Parsing parameters...");
            boolean paramsOk = tlc.handleParameters(args.toArray(new String[0]));
            if (!paramsOk) {
                capture.println("Error: Failed to parse TLC parameters.");
            } else {
                String specDir = FileUtil.parseDirname(tlc.getMainFile());
                if (!specDir.isEmpty()) {
                    tlc.setResolver(new SimpleFilenameToStream(specDir));
                } else {
                    tlc.setResolver(new SimpleFilenameToStream());
                }
                capture.println("Starting TLC on module " + tlc.getMainFile() + "...");

                int errorCode = tlc.process();

                String[] buffered = ToolIO.getAllMessages();
                for (String msg : buffered) {
                    capture.println(msg);
                }

                capture.println("TLC finished with exit code: " + errorCode);
                capture.flush();
                return baos.toString();
            }

        } catch (Exception e) {
            capture.println("Error running TLC: " + e.getMessage());
            e.printStackTrace(capture);
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

    /**
     * Write a file to the virtual filesystem.
     * Used to write library specs (e.g., Pips.tla) before running TLC
     * on a module that INSTANCE-imports them.
     */
    public static void writeFile(String path, String content) {
        try {
            File f = new File(path);
            f.getParentFile().mkdirs();
            try (FileWriter fw = new FileWriter(f)) {
                fw.write(content);
            }
        } catch (Exception e) {
            System.err.println("Error writing file " + path + ": " + e.getMessage());
        }
    }
}
