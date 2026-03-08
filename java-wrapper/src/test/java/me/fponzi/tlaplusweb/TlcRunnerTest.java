package me.fponzi.tlaplusweb;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import static org.junit.Assert.*;

public class TlcRunnerTest {

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    private static final String DIEHARD_SPEC = String.join("\n",
        "---- MODULE DieHard ----",
        "EXTENDS Naturals",
        "VARIABLES small, big",
        "",
        "Init == small = 0 /\\ big = 0",
        "",
        "FillSmall == small' = 3 /\\ big' = big",
        "FillBig   == big' = 5 /\\ small' = small",
        "EmptySmall == small' = 0 /\\ big' = big",
        "EmptyBig   == big' = 0 /\\ small' = small",
        "",
        "SmallToBig == IF small + big <= 5",
        "               THEN big' = small + big /\\ small' = 0",
        "               ELSE big' = 5 /\\ small' = small + big - 5",
        "",
        "BigToSmall == IF small + big <= 3",
        "               THEN small' = small + big /\\ big' = 0",
        "               ELSE small' = 3 /\\ big' = small + big - 3",
        "",
        "Next == FillSmall \\/ FillBig \\/ EmptySmall \\/ EmptyBig \\/ SmallToBig \\/ BigToSmall",
        "",
        "===="
    );

    private static final String DIEHARD_CFG = String.join("\n",
        "INIT Init",
        "NEXT Next"
    );

    @Test
    public void testTlcRunnerCompletesSuccessfully() {
        String baseDir = tempFolder.getRoot().getAbsolutePath();
        String output = TlcRunner.run(DIEHARD_SPEC, DIEHARD_CFG, 1, false, baseDir);

        assertNotNull("TLC output should not be null", output);
        assertFalse("TLC output should not be empty", output.isEmpty());
        assertFalse("TLC should not fail due to missing dependencies",
            output.contains("ClassNotFoundException") || output.contains("NoClassDefFoundError"));
        assertTrue("TLC should report finishing, got: " + output,
            output.contains("finished") || output.contains("Finished"));
    }

    @Test
    public void testTlcRunnerFindsAllStates() {
        String baseDir = tempFolder.getRoot().getAbsolutePath();
        String output = TlcRunner.run(DIEHARD_SPEC, DIEHARD_CFG, 1, false, baseDir);

        // DieHard has exactly 16 distinct states
        assertTrue("TLC should find 16 distinct states, got: " + output,
            output.contains("16 distinct states"));
    }
}
