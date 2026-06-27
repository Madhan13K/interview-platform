package com.interview_platform_backend.interview_platform_backend.nps.repository;

import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsTrend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NpsTrendRepository extends JpaRepository<NpsTrend, UUID> {

    List<NpsTrend> findByOrganizationIdOrderByCalculatedAtDesc(UUID organizationId);
}
