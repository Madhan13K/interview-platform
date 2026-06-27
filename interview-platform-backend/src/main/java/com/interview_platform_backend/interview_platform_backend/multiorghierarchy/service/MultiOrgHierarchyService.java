package com.interview_platform_backend.interview_platform_backend.multiorghierarchy.service;

import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.entity.OrgHierarchy;
import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.entity.OrgHierarchy.OrgRelationshipType;
import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.repository.OrgHierarchyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class MultiOrgHierarchyService {

    private static final Logger log = LoggerFactory.getLogger(MultiOrgHierarchyService.class);

    private final OrgHierarchyRepository orgHierarchyRepository;

    public MultiOrgHierarchyService(OrgHierarchyRepository orgHierarchyRepository) {
        this.orgHierarchyRepository = orgHierarchyRepository;
    }

    @Transactional
    public OrgHierarchy createRelationship(UUID parentId, UUID childId, OrgRelationshipType type) {
        if (orgHierarchyRepository.existsByParentOrgIdAndChildOrgId(parentId, childId)) {
            throw new IllegalArgumentException("Relationship already exists between these organizations");
        }

        OrgHierarchy hierarchy = OrgHierarchy.builder()
                .parentOrgId(parentId)
                .childOrgId(childId)
                .relationship(type)
                .sharedTemplates(true)
                .sharedQuestionBank(true)
                .consolidatedReporting(true)
                .build();

        OrgHierarchy saved = orgHierarchyRepository.save(hierarchy);
        log.info("Created org hierarchy relationship: {} -> {} ({})", parentId, childId, type);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<OrgHierarchy> getChildren(UUID parentOrgId) {
        return orgHierarchyRepository.findByParentOrgId(parentOrgId);
    }

    @Transactional(readOnly = true)
    public Optional<OrgHierarchy> getParent(UUID childOrgId) {
        return orgHierarchyRepository.findByChildOrgId(childOrgId);
    }

    @Transactional(readOnly = true)
    public List<OrgHierarchy> getFullHierarchy(UUID rootOrgId) {
        List<OrgHierarchy> fullHierarchy = new ArrayList<>();
        Queue<UUID> queue = new LinkedList<>();
        queue.add(rootOrgId);

        while (!queue.isEmpty()) {
            UUID currentOrgId = queue.poll();
            List<OrgHierarchy> children = orgHierarchyRepository.findByParentOrgId(currentOrgId);
            fullHierarchy.addAll(children);
            for (OrgHierarchy child : children) {
                queue.add(child.getChildOrgId());
            }
        }

        log.info("Retrieved full hierarchy for root org {}: {} nodes", rootOrgId, fullHierarchy.size());
        return fullHierarchy;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConsolidatedReport(UUID parentOrgId) {
        List<OrgHierarchy> reportingOrgs = orgHierarchyRepository
                .findByParentOrgIdAndConsolidatedReportingTrue(parentOrgId);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("parentOrgId", parentOrgId);
        report.put("childOrganizations", reportingOrgs.size());
        report.put("organizations", reportingOrgs);

        log.info("Generated consolidated report for org {}: {} child orgs", parentOrgId, reportingOrgs.size());
        return report;
    }

    @Transactional
    public Map<String, Object> shareTemplate(UUID templateId, UUID fromOrg, UUID toOrg) {
        boolean relationshipExists = orgHierarchyRepository.existsByParentOrgIdAndChildOrgId(fromOrg, toOrg)
                || orgHierarchyRepository.existsByParentOrgIdAndChildOrgId(toOrg, fromOrg);

        if (!relationshipExists) {
            throw new IllegalArgumentException("No hierarchy relationship exists between the organizations");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("templateId", templateId);
        result.put("fromOrg", fromOrg);
        result.put("toOrg", toOrg);
        result.put("shared", true);

        log.info("Shared template {} from org {} to org {}", templateId, fromOrg, toOrg);
        return result;
    }
}
