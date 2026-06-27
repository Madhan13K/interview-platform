package com.interview_platform_backend.interview_platform_backend.costperhire.repository;

import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost;
import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost.CostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface HiringCostRepository extends JpaRepository<HiringCost, UUID> {

    List<HiringCost> findByJobPositionId(UUID jobPositionId);

    List<HiringCost> findByOrganizationId(UUID organizationId);

    List<HiringCost> findByOrganizationIdAndCreatedAtAfter(UUID organizationId, Instant since);

    List<HiringCost> findByOrganizationIdAndCostType(UUID organizationId, CostType costType);
}
