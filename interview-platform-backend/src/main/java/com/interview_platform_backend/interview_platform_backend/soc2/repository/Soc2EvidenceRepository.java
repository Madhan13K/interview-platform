package com.interview_platform_backend.interview_platform_backend.soc2.repository;

import com.interview_platform_backend.interview_platform_backend.soc2.entity.Soc2Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Soc2EvidenceRepository extends JpaRepository<Soc2Evidence, UUID> {

    List<Soc2Evidence> findByControlId(UUID controlId);

    int countByControlId(UUID controlId);
}
