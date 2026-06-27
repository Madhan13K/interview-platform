package com.interview_platform_backend.interview_platform_backend.customfields.repository;

import com.interview_platform_backend.interview_platform_backend.customfields.entity.CustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomFieldDefinitionRepository extends JpaRepository<CustomFieldDefinition, UUID> {

    List<CustomFieldDefinition> findByOrganizationIdAndEntityType(UUID organizationId, String entityType);

    List<CustomFieldDefinition> findByOrganizationIdAndIsActiveTrue(UUID organizationId);

    boolean existsByOrganizationIdAndEntityTypeAndFieldKey(UUID organizationId, String entityType, String fieldKey);
}
