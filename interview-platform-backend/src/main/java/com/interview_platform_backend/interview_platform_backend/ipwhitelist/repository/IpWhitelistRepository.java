package com.interview_platform_backend.interview_platform_backend.ipwhitelist.repository;

import com.interview_platform_backend.interview_platform_backend.ipwhitelist.entity.IpWhitelistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface IpWhitelistRepository extends JpaRepository<IpWhitelistEntry, UUID> {
    List<IpWhitelistEntry> findByOrganizationIdAndIsActiveTrue(UUID organizationId);
    boolean existsByOrganizationIdAndIpAddress(UUID organizationId, String ipAddress);
}
