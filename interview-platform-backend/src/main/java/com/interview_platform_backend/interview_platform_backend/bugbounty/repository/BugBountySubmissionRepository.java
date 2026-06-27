package com.interview_platform_backend.interview_platform_backend.bugbounty.repository;

import com.interview_platform_backend.interview_platform_backend.bugbounty.entity.BugBountySubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BugBountySubmissionRepository extends JpaRepository<BugBountySubmission, UUID> {

    List<BugBountySubmission> findByProgramId(UUID programId);

    List<BugBountySubmission> findByStatus(BugBountySubmission.SubmissionStatus status);

    List<BugBountySubmission> findByProgramIdAndStatus(UUID programId, BugBountySubmission.SubmissionStatus status);

    int countByProgramId(UUID programId);

    int countByProgramIdAndStatusIn(UUID programId, List<BugBountySubmission.SubmissionStatus> statuses);

    @Query("SELECT s.reporterAlias, SUM(s.reward) as totalReward, COUNT(s) as count " +
            "FROM BugBountySubmission s WHERE s.programId = :programId AND s.status = 'RESOLVED' " +
            "GROUP BY s.reporterAlias ORDER BY totalReward DESC")
    List<Object[]> findLeaderboardByProgramId(UUID programId);
}
