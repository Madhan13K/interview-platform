package com.interview_platform_backend.interview_platform_backend.bulk.repository;

import com.interview_platform_backend.interview_platform_backend.bulk.entity.BulkOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BulkOperationRepository extends JpaRepository<BulkOperation, UUID> {

    List<BulkOperation> findByOrganizationId(UUID organizationId);

    List<BulkOperation> findBySubmittedById(UUID submittedById);

    List<BulkOperation> findByStatus(String status);
}
