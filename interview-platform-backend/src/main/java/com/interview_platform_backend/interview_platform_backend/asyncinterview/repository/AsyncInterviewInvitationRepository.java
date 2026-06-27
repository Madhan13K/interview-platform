package com.interview_platform_backend.interview_platform_backend.asyncinterview.repository;

import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterviewInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AsyncInterviewInvitationRepository extends JpaRepository<AsyncInterviewInvitation, UUID> {

    List<AsyncInterviewInvitation> findByAsyncInterviewId(UUID asyncInterviewId);

    List<AsyncInterviewInvitation> findByCandidateId(UUID candidateId);

    Optional<AsyncInterviewInvitation> findByInviteToken(String inviteToken);

    List<AsyncInterviewInvitation> findByStatus(String status);
}
