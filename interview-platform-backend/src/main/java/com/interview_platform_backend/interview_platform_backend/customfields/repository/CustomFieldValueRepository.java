package com.interview_platform_backend.interview_platform_backend.customfields.repository;

import com.interview_platform_backend.interview_platform_backend.customfields.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, UUID> {

    List<CustomFieldValue> findByEntityIdAndEntityType(UUID entityId, String entityType);

    List<CustomFieldValue> findByFieldDefinitionId(UUID fieldDefinitionId);

    void deleteByEntityIdAndEntityType(UUID entityId, String entityType);

    Optional<CustomFieldValue> findByFieldDefinitionIdAndEntityId(UUID fieldDefinitionId, UUID entityId);
}
