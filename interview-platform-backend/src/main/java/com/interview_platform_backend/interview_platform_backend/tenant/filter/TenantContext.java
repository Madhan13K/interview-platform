package com.interview_platform_backend.interview_platform_backend.tenant.filter;

/**
 * ThreadLocal holder for the current tenant ID.
 * Populated by TenantContextFilter, consumed by services/repositories.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
