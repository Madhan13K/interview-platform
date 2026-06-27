package com.interview_platform_backend.interview_platform_backend.referralgamification.repository;

import com.interview_platform_backend.interview_platform_backend.referralgamification.entity.ReferralLeaderboard;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReferralLeaderboardRepository extends JpaRepository<ReferralLeaderboard, UUID> {

    Optional<ReferralLeaderboard> findByUserId(UUID userId);

    List<ReferralLeaderboard> findByOrganizationIdOrderByPointsDesc(UUID organizationId, Pageable pageable);

    Optional<ReferralLeaderboard> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}
