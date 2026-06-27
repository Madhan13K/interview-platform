package com.interview_platform_backend.interview_platform_backend.asyncinterview.repository;

import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterviewReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsyncInterviewReviewRepository extends JpaRepository<AsyncInterviewReview, UUID> {

    List<AsyncInterviewReview> findByInvitationId(UUID invitationId);

    List<AsyncInterviewReview> findByReviewerId(UUID reviewerId);
}
