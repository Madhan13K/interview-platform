package com.interview_platform_backend.interview_platform_backend.whitelabel.repository;

import com.interview_platform_backend.interview_platform_backend.whitelabel.entity.WhiteLabelConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WhiteLabelRepository extends JpaRepository<WhiteLabelConfig, UUID> {

    Optional<WhiteLabelConfig> findByOrganizationId(UUID orgId);

    Optional<WhiteLabelConfig> findByCustomDomain(String domain);

    boolean existsByOrganizationId(UUID orgId);
}
