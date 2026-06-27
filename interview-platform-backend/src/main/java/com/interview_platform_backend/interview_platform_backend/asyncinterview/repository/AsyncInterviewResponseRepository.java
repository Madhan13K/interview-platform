package com.interview_platform_backend.interview_platform_backend.asyncinterview.repository;

import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterviewResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsyncInterviewResponseRepository extends JpaRepository<AsyncInterviewResponse, UUID> {

    List<AsyncInterviewResponse> findByInvitationId(UUID invitationId);

    List<AsyncInterviewResponse> findByInvitationIdAndQuestionId(UUID invitationId, UUID questionId);
}
