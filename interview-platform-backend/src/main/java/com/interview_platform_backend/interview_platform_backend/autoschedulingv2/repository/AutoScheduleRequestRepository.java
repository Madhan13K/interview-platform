package com.interview_platform_backend.interview_platform_backend.autoschedulingv2.repository;

import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.entity.AutoScheduleRequest;
import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.entity.AutoScheduleRequest.AutoScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutoScheduleRequestRepository extends JpaRepository<AutoScheduleRequest, UUID> {

    List<AutoScheduleRequest> findByInterviewId(UUID interviewId);

    List<AutoScheduleRequest> findByStatus(AutoScheduleStatus status);

    List<AutoScheduleRequest> findByCandidateId(UUID candidateId);
}
