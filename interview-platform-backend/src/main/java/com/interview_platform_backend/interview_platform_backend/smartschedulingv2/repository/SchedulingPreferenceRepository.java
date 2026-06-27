package com.interview_platform_backend.interview_platform_backend.smartschedulingv2.repository;

import com.interview_platform_backend.interview_platform_backend.smartschedulingv2.entity.SchedulingPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchedulingPreferenceRepository extends JpaRepository<SchedulingPreference, UUID> {

    Optional<SchedulingPreference> findByInterviewerId(UUID interviewerId);
}
