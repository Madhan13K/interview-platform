package com.interview_platform_backend.interview_platform_backend.mlscoring.repository;

import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel.MLModelStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MLModelRepository extends JpaRepository<MLModel, UUID> {

    List<MLModel> findByOrganizationId(UUID organizationId);

    Optional<MLModel> findByOrganizationIdAndStatus(UUID organizationId, MLModelStatus status);

    Optional<MLModel> findTopByOrganizationIdAndStatusOrderByTrainedAtDesc(UUID organizationId, MLModelStatus status);
}
