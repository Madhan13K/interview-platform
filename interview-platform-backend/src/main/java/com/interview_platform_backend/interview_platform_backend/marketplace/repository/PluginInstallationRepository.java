package com.interview_platform_backend.interview_platform_backend.marketplace.repository;

import com.interview_platform_backend.interview_platform_backend.marketplace.entity.PluginInstallation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PluginInstallationRepository extends JpaRepository<PluginInstallation, UUID> {

    List<PluginInstallation> findByOrganizationId(UUID organizationId);

    List<PluginInstallation> findByPluginId(UUID pluginId);

    boolean existsByPluginIdAndOrganizationId(UUID pluginId, UUID organizationId);
}
