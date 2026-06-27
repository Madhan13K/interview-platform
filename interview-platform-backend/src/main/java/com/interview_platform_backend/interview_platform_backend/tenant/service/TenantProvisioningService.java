package com.interview_platform_backend.interview_platform_backend.tenant.service;

import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.tenant.entity.Organization;
import com.interview_platform_backend.interview_platform_backend.tenant.entity.TenantSchema;
import com.interview_platform_backend.interview_platform_backend.tenant.repository.OrganizationRepository;
import com.interview_platform_backend.interview_platform_backend.tenant.repository.TenantSchemaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Provisions new tenant schemas when organizations are created.
 * 
 * Flow:
 * 1. Admin creates organization via API
 * 2. This service creates a PostgreSQL schema (tenant_{slug})
 * 3. Runs the create_tenant_schema() function to set up tables
 * 4. Registers the schema in tenant_schemas table
 * 5. Organization is now ready to use
 */
@Service
@Transactional
public class TenantProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(TenantProvisioningService.class);
    private static final String SCHEMA_PREFIX = "tenant_";

    private final TenantSchemaRepository tenantSchemaRepository;
    private final OrganizationRepository organizationRepository;
    private final JdbcTemplate jdbcTemplate;

    public TenantProvisioningService(TenantSchemaRepository tenantSchemaRepository,
                                     OrganizationRepository organizationRepository,
                                     JdbcTemplate jdbcTemplate) {
        this.tenantSchemaRepository = tenantSchemaRepository;
        this.organizationRepository = organizationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Provision a new schema for an organization.
     * Called when a new organization is registered.
     */
    public TenantSchema provisionTenant(UUID organizationId) {
        if (tenantSchemaRepository.existsByOrganizationId(organizationId)) {
            throw new BadRequestException("Schema already exists for organization: " + organizationId);
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new BadRequestException("Organization not found: " + organizationId));

        String schemaName = generateSchemaName(org.getSlug());
        log.info("Provisioning tenant schema: {} for org: {} ({})", schemaName, org.getName(), organizationId);

        // Create the schema and tables using the stored function
        jdbcTemplate.execute("SELECT create_tenant_schema('" + schemaName + "')");

        // Register in tenant_schemas
        TenantSchema tenantSchema = TenantSchema.builder()
                .organizationId(organizationId)
                .schemaName(schemaName)
                .status("ACTIVE")
                .migratedAt(Instant.now())
                .build();

        tenantSchema = tenantSchemaRepository.save(tenantSchema);
        log.info("Tenant schema provisioned: {} (id: {})", schemaName, tenantSchema.getId());

        return tenantSchema;
    }

    /**
     * Suspend a tenant (mark as inactive, can be reactivated).
     */
    public void suspendTenant(UUID organizationId) {
        TenantSchema schema = tenantSchemaRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new BadRequestException("No schema for organization: " + organizationId));

        schema.setStatus("SUSPENDED");
        schema.setSuspendedAt(Instant.now());
        tenantSchemaRepository.save(schema);
        log.warn("Tenant suspended: {} (org: {})", schema.getSchemaName(), organizationId);
    }

    /**
     * Reactivate a suspended tenant.
     */
    public void reactivateTenant(UUID organizationId) {
        TenantSchema schema = tenantSchemaRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new BadRequestException("No schema for organization: " + organizationId));

        schema.setStatus("ACTIVE");
        schema.setSuspendedAt(null);
        tenantSchemaRepository.save(schema);
        log.info("Tenant reactivated: {} (org: {})", schema.getSchemaName(), organizationId);
    }

    /**
     * Delete a tenant schema (DANGER: destroys all data).
     */
    public void deleteTenant(UUID organizationId) {
        TenantSchema schema = tenantSchemaRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new BadRequestException("No schema for organization: " + organizationId));

        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + schema.getSchemaName() + " CASCADE");
        schema.setStatus("DELETED");
        tenantSchemaRepository.save(schema);
        log.warn("Tenant schema DELETED: {} (org: {})", schema.getSchemaName(), organizationId);
    }

    /**
     * Get the schema name for an organization.
     */
    public String getSchemaName(UUID organizationId) {
        return tenantSchemaRepository.findByOrganizationId(organizationId)
                .map(TenantSchema::getSchemaName)
                .orElse("public");
    }

    private String generateSchemaName(String slug) {
        // Sanitize: only allow lowercase letters, numbers, underscores
        String sanitized = slug.toLowerCase().replaceAll("[^a-z0-9]", "_");
        if (sanitized.length() > 50) sanitized = sanitized.substring(0, 50);
        return SCHEMA_PREFIX + sanitized;
    }
}
