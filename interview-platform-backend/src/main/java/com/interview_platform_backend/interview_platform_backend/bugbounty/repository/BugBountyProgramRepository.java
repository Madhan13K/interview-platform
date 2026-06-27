package com.interview_platform_backend.interview_platform_backend.bugbounty.repository;

import com.interview_platform_backend.interview_platform_backend.bugbounty.entity.BugBountyProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BugBountyProgramRepository extends JpaRepository<BugBountyProgram, UUID> {

    List<BugBountyProgram> findByOrganizationId(UUID organizationId);

    List<BugBountyProgram> findByStatus(BugBountyProgram.Status status);
}
