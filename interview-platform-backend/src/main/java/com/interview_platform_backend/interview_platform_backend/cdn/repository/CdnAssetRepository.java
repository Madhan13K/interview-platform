package com.interview_platform_backend.interview_platform_backend.cdn.repository;

import com.interview_platform_backend.interview_platform_backend.cdn.entity.CdnAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CdnAssetRepository extends JpaRepository<CdnAsset, UUID> {

    List<CdnAsset> findByOrganizationId(UUID orgId);

    Optional<CdnAsset> findByAssetKey(String key);

    List<CdnAsset> findByStatus(CdnAsset.Status status);
}
