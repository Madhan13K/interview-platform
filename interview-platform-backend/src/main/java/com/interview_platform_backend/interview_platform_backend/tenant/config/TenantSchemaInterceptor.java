package com.interview_platform_backend.interview_platform_backend.tenant.config;

import com.interview_platform_backend.interview_platform_backend.tenant.filter.TenantContext;
import com.interview_platform_backend.interview_platform_backend.tenant.repository.TenantSchemaRepository;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Sets the PostgreSQL search_path based on the current tenant.
 * This causes all unqualified table references to resolve to the tenant's schema.
 * 
 * The search_path is set to: tenant_schema, public
 * - Business tables resolve to tenant_schema (interviews, documents, etc.)
 * - Shared tables resolve to public (users, organizations, etc.)
 */
@Component
@ConditionalOnProperty(name = "app.multitenancy.schema-per-tenant", havingValue = "true", matchIfMissing = false)
public class TenantSchemaInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantSchemaInterceptor.class);

    private final EntityManager entityManager;
    private final TenantSchemaRepository tenantSchemaRepository;

    public TenantSchemaInterceptor(EntityManager entityManager,
                                   TenantSchemaRepository tenantSchemaRepository) {
        this.entityManager = entityManager;
        this.tenantSchemaRepository = tenantSchemaRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            // No tenant context — use public schema (admin endpoints, shared resources)
            setSearchPath("public");
            return true;
        }

        try {
            var tenantSchema = tenantSchemaRepository.findByOrganizationId(
                    java.util.UUID.fromString(tenantId));

            if (tenantSchema.isPresent() && "ACTIVE".equals(tenantSchema.get().getStatus())) {
                String schema = tenantSchema.get().getSchemaName();
                setSearchPath(schema + ", public");
                log.debug("Set search_path to: {}, public", schema);
            } else {
                setSearchPath("public");
            }
        } catch (Exception e) {
            log.warn("Failed to resolve tenant schema for: {}. Falling back to public.", tenantId);
            setSearchPath("public");
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        // Reset to public after request completes
        setSearchPath("public");
    }

    private void setSearchPath(String searchPath) {
        entityManager.unwrap(Session.class).doWork(connection ->
                connection.createStatement().execute("SET search_path TO " + searchPath));
    }
}
