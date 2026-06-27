package com.interview_platform_backend.interview_platform_backend.customfields.service;

import com.interview_platform_backend.interview_platform_backend.customfields.dto.*;
import com.interview_platform_backend.interview_platform_backend.customfields.entity.CustomFieldDefinition;
import com.interview_platform_backend.interview_platform_backend.customfields.entity.CustomFieldValue;
import com.interview_platform_backend.interview_platform_backend.customfields.entity.FieldType;
import com.interview_platform_backend.interview_platform_backend.customfields.repository.CustomFieldDefinitionRepository;
import com.interview_platform_backend.interview_platform_backend.customfields.repository.CustomFieldValueRepository;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CustomFieldService {

    private final CustomFieldDefinitionRepository definitionRepository;
    private final CustomFieldValueRepository valueRepository;
    private final UserRepository userRepository;

    public CustomFieldService(CustomFieldDefinitionRepository definitionRepository,
                              CustomFieldValueRepository valueRepository,
                              UserRepository userRepository) {
        this.definitionRepository = definitionRepository;
        this.valueRepository = valueRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FieldDefinitionResponse createFieldDefinition(FieldDefinitionRequest request, UUID orgId, UUID userId) {
        // Validate uniqueness
        if (definitionRepository.existsByOrganizationIdAndEntityTypeAndFieldKey(orgId, request.getEntityType(), request.getFieldKey())) {
            throw new IllegalArgumentException("Field key '" + request.getFieldKey() + "' already exists for entity type '" + request.getEntityType() + "'");
        }

        User createdBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        CustomFieldDefinition definition = CustomFieldDefinition.builder()
                .organizationId(orgId)
                .entityType(request.getEntityType())
                .fieldName(request.getFieldName())
                .fieldKey(request.getFieldKey())
                .fieldType(FieldType.valueOf(request.getFieldType()))
                .description(request.getDescription())
                .isRequired(request.getIsRequired() != null ? request.getIsRequired() : false)
                .defaultValue(request.getDefaultValue())
                .options(request.getOptions())
                .validationRegex(request.getValidationRegex())
                .createdBy(createdBy)
                .build();

        CustomFieldDefinition saved = definitionRepository.save(definition);
        return toResponse(saved);
    }

    @Transactional
    public FieldDefinitionResponse updateFieldDefinition(UUID defId, FieldDefinitionRequest request) {
        CustomFieldDefinition definition = definitionRepository.findById(defId)
                .orElseThrow(() -> new RuntimeException("Custom field definition not found: " + defId));

        if (request.getFieldName() != null) {
            definition.setFieldName(request.getFieldName());
        }
        if (request.getDescription() != null) {
            definition.setDescription(request.getDescription());
        }
        if (request.getIsRequired() != null) {
            definition.setIsRequired(request.getIsRequired());
        }
        if (request.getDefaultValue() != null) {
            definition.setDefaultValue(request.getDefaultValue());
        }
        if (request.getOptions() != null) {
            definition.setOptions(request.getOptions());
        }
        if (request.getValidationRegex() != null) {
            definition.setValidationRegex(request.getValidationRegex());
        }
        if (request.getFieldType() != null) {
            definition.setFieldType(FieldType.valueOf(request.getFieldType()));
        }

        CustomFieldDefinition saved = definitionRepository.save(definition);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FieldDefinitionResponse> getFieldDefinitions(UUID orgId, String entityType) {
        List<CustomFieldDefinition> definitions;
        if (entityType != null && !entityType.isBlank()) {
            definitions = definitionRepository.findByOrganizationIdAndEntityType(orgId, entityType);
        } else {
            definitions = definitionRepository.findByOrganizationIdAndIsActiveTrue(orgId);
        }
        return definitions.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteFieldDefinition(UUID defId) {
        if (!definitionRepository.existsById(defId)) {
            throw new RuntimeException("Custom field definition not found: " + defId);
        }
        definitionRepository.deleteById(defId);
    }

    @Transactional
    public FieldValueResponse setFieldValue(UUID defId, UUID entityId, String entityType, Object value) {
        CustomFieldDefinition definition = definitionRepository.findById(defId)
                .orElseThrow(() -> new RuntimeException("Custom field definition not found: " + defId));

        // Validate value
        validateValue(definition, value);

        // Upsert value
        CustomFieldValue fieldValue = valueRepository.findByFieldDefinitionIdAndEntityId(defId, entityId)
                .orElse(CustomFieldValue.builder()
                        .fieldDefinition(definition)
                        .entityId(entityId)
                        .entityType(entityType)
                        .build());

        // Set value based on type
        switch (definition.getFieldType()) {
            case TEXT, URL, EMAIL -> fieldValue.setValueText(value != null ? value.toString() : null);
            case NUMBER -> {
                if (value != null) {
                    fieldValue.setValueNumber(new BigDecimal(value.toString()));
                } else {
                    fieldValue.setValueNumber(null);
                }
            }
            case DATE -> {
                if (value != null) {
                    fieldValue.setValueDate(Instant.parse(value.toString()));
                } else {
                    fieldValue.setValueDate(null);
                }
            }
            case BOOLEAN -> {
                if (value != null) {
                    fieldValue.setValueBoolean(Boolean.parseBoolean(value.toString()));
                } else {
                    fieldValue.setValueBoolean(null);
                }
            }
            case SELECT -> fieldValue.setValueText(value != null ? value.toString() : null);
            case MULTI_SELECT -> fieldValue.setValueJson(value);
        }

        CustomFieldValue saved = valueRepository.save(fieldValue);
        return toValueResponse(saved, definition);
    }

    @Transactional(readOnly = true)
    public List<FieldValueResponse> getFieldValues(UUID entityId, String entityType) {
        List<CustomFieldValue> values = valueRepository.findByEntityIdAndEntityType(entityId, entityType);
        return values.stream().map(v -> toValueResponse(v, v.getFieldDefinition())).collect(Collectors.toList());
    }

    @Transactional
    public void deleteFieldValue(UUID defId, UUID entityId) {
        CustomFieldValue value = valueRepository.findByFieldDefinitionIdAndEntityId(defId, entityId)
                .orElseThrow(() -> new RuntimeException("Field value not found for definition " + defId + " and entity " + entityId));
        valueRepository.delete(value);
    }

    public void validateValue(CustomFieldDefinition definition, Object value) {
        // Check required
        if (Boolean.TRUE.equals(definition.getIsRequired()) && (value == null || value.toString().isBlank())) {
            throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' is required");
        }

        if (value == null) return;

        String strValue = value.toString();

        // Type validation
        switch (definition.getFieldType()) {
            case NUMBER -> {
                try {
                    new BigDecimal(strValue);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' must be a valid number");
                }
            }
            case DATE -> {
                try {
                    Instant.parse(strValue);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' must be a valid ISO-8601 date");
                }
            }
            case BOOLEAN -> {
                if (!strValue.equalsIgnoreCase("true") && !strValue.equalsIgnoreCase("false")) {
                    throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' must be true or false");
                }
            }
            case SELECT -> {
                if (definition.getOptions() != null && !definition.getOptions().contains(strValue)) {
                    throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' value must be one of: " + definition.getOptions());
                }
            }
            case EMAIL -> {
                if (!strValue.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
                    throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' must be a valid email address");
                }
            }
            case URL -> {
                if (!strValue.matches("^https?://.*")) {
                    throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' must be a valid URL");
                }
            }
            default -> { /* TEXT and MULTI_SELECT don't need type validation */ }
        }

        // Regex validation
        if (definition.getValidationRegex() != null && !definition.getValidationRegex().isBlank()) {
            if (!Pattern.matches(definition.getValidationRegex(), strValue)) {
                throw new IllegalArgumentException("Field '" + definition.getFieldName() + "' does not match the required pattern");
            }
        }
    }

    private FieldDefinitionResponse toResponse(CustomFieldDefinition definition) {
        return FieldDefinitionResponse.builder()
                .id(definition.getId())
                .organizationId(definition.getOrganizationId())
                .entityType(definition.getEntityType())
                .fieldName(definition.getFieldName())
                .fieldKey(definition.getFieldKey())
                .fieldType(definition.getFieldType().name())
                .description(definition.getDescription())
                .isRequired(definition.getIsRequired())
                .defaultValue(definition.getDefaultValue())
                .options(definition.getOptions())
                .validationRegex(definition.getValidationRegex())
                .displayOrder(definition.getDisplayOrder())
                .isActive(definition.getIsActive())
                .createdAt(definition.getCreatedAt())
                .build();
    }

    private FieldValueResponse toValueResponse(CustomFieldValue value, CustomFieldDefinition definition) {
        Object resolvedValue = switch (definition.getFieldType()) {
            case TEXT, URL, EMAIL, SELECT -> value.getValueText();
            case NUMBER -> value.getValueNumber();
            case DATE -> value.getValueDate();
            case BOOLEAN -> value.getValueBoolean();
            case MULTI_SELECT -> value.getValueJson();
        };

        return FieldValueResponse.builder()
                .fieldKey(definition.getFieldKey())
                .fieldName(definition.getFieldName())
                .fieldType(definition.getFieldType().name())
                .value(resolvedValue)
                .entityId(value.getEntityId())
                .build();
    }
}
