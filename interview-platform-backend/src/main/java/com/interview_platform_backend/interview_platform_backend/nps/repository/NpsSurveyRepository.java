package com.interview_platform_backend.interview_platform_backend.nps.repository;

import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsSurvey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface NpsSurveyRepository extends JpaRepository<NpsSurvey, UUID> {

    List<NpsSurvey> findByInterviewId(UUID interviewId);

    List<NpsSurvey> findByCandidateId(UUID candidateId);

    List<NpsSurvey> findByCreatedAtAfter(Instant since);
}
