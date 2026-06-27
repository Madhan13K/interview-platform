package com.interview_platform_backend.interview_platform_backend.multiorghierarchy.repository;

import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.entity.OrgHierarchy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrgHierarchyRepository extends JpaRepository<OrgHierarchy, UUID> {

    List<OrgHierarchy> findByParentOrgId(UUID parentOrgId);

    Optional<OrgHierarchy> findByChildOrgId(UUID childOrgId);

    List<OrgHierarchy> findByParentOrgIdAndConsolidatedReportingTrue(UUID parentOrgId);

    boolean existsByParentOrgIdAndChildOrgId(UUID parentOrgId, UUID childOrgId);
}
