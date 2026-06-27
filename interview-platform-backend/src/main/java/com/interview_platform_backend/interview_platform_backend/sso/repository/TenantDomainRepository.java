package com.interview_platform_backend.interview_platform_backend.sso.repository;

import com.interview_platform_backend.interview_platform_backend.sso.entity.TenantDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantDomainRepository extends JpaRepository<TenantDomain, UUID> {

    Optional<TenantDomain> findByDomain(String domain);

    List<TenantDomain> findByTenantId(UUID tenantId);

    boolean existsByDomain(String domain);

    List<TenantDomain> findByTenantIdAndVerifiedTrue(UUID tenantId);
}
