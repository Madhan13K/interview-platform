package com.interview_platform_backend.interview_platform_backend.tenant.repository;

import com.interview_platform_backend.interview_platform_backend.tenant.entity.TenantSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface TenantSchemaRepository extends JpaRepository<TenantSchema, UUID> {
    Optional<TenantSchema> findByOrganizationId(UUID organizationId);
    Optional<TenantSchema> findBySchemaName(String schemaName);
    List<TenantSchema> findByStatus(String status);
    boolean existsByOrganizationId(UUID organizationId);
}
