package me.fponzi.tlaplusweb;

import javax.management.MBeanServer;
import javax.management.MBeanServerBuilder;
import javax.management.MBeanServerDelegate;
import java.lang.management.ManagementFactory;

/**
 * A no-op MBeanServerBuilder that returns an MBeanServer which silently
 * ignores all registration attempts. This prevents RMI socket binding
 * errors in CheerpJ's browser environment where networking is not supported.
 */
public class NoOpMBeanServerBuilder extends MBeanServerBuilder {

    @Override
    public MBeanServer newMBeanServer(String defaultDomain, MBeanServer outer, MBeanServerDelegate delegate) {
        return new NoOpMBeanServer(defaultDomain, outer, delegate);
    }

    @Override
    public MBeanServerDelegate newMBeanServerDelegate() {
        return new MBeanServerDelegate();
    }
}
