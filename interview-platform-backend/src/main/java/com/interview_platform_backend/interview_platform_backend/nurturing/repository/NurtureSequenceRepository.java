package com.interview_platform_backend.interview_platform_backend.nurturing.repository;

import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence.SequenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NurtureSequenceRepository extends JpaRepository<NurtureSequence, UUID> {

    List<NurtureSequence> findByOrganizationId(UUID organizationId);

    List<NurtureSequence> findByStatus(SequenceStatus status);
}
