package com.interview_platform_backend.interview_platform_backend.tenant.repository;

import com.interview_platform_backend.interview_platform_backend.tenant.entity.TenantAccessPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantAccessPolicyRepository extends JpaRepository<TenantAccessPolicy, UUID> {

    List<TenantAccessPolicy> findByOrganizationId(UUID organizationId);

    List<TenantAccessPolicy> findByOrganizationIdAndResourceType(UUID organizationId, String resourceType);
}
