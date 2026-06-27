package com.interview_platform_backend.interview_platform_backend.dlp.service;

import com.interview_platform_backend.interview_platform_backend.dlp.dto.DlpViolation;
import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpIncident;
import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpPolicy;
import com.interview_platform_backend.interview_platform_backend.dlp.repository.DlpIncidentRepository;
import com.interview_platform_backend.interview_platform_backend.dlp.repository.DlpPolicyRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class DlpService {

    private final DlpPolicyRepository policyRepository;
    private final DlpIncidentRepository incidentRepository;

    private static final Map<String, String> BUILT_IN_PATTERNS = new LinkedHashMap<>();

    static {
        BUILT_IN_PATTERNS.put("SSN", "\\d{3}-\\d{2}-\\d{4}");
        BUILT_IN_PATTERNS.put("CREDIT_CARD", "\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}");
        BUILT_IN_PATTERNS.put("API_KEY", "sk-[a-zA-Z0-9]{20,}");
        BUILT_IN_PATTERNS.put("EMAIL", "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        BUILT_IN_PATTERNS.put("PHONE", "\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
    }

    @PostConstruct
    public void initBuiltInPolicies() {
        log.info("DLP Service initialized with {} built-in patterns", BUILT_IN_PATTERNS.size());
    }

    public DlpPolicy createPolicy(DlpPolicy policy) {
        log.info("Creating DLP policy: {}", policy.getName());
        // Validate regex pattern
        Pattern.compile(policy.getDataPattern());
        return policyRepository.save(policy);
    }

    public List<DlpViolation> scanContent(String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        List<DlpViolation> violations = new ArrayList<>();
        List<DlpPolicy> activePolicies = policyRepository.findByEnabledTrue();

        for (DlpPolicy policy : activePolicies) {
            try {
                Pattern pattern = Pattern.compile(policy.getDataPattern());
                Matcher matcher = pattern.matcher(content);
                int count = 0;
                String firstMatch = null;

                while (matcher.find()) {
                    count++;
                    if (firstMatch == null) {
                        String match = matcher.group();
                        firstMatch = redactMatch(match);
                    }
                }

                if (count > 0) {
                    violations.add(DlpViolation.builder()
                            .policyId(policy.getId())
                            .policyName(policy.getName())
                            .dataType(policy.getDataType())
                            .action(policy.getAction())
                            .severity(policy.getSeverity())
                            .matchedSnippet(firstMatch)
                            .matchCount(count)
                            .build());

                    // Update policy stats
                    policy.setMatchCount(policy.getMatchCount() + count);
                    policy.setLastTriggered(Instant.now());
                    policyRepository.save(policy);
                }
            } catch (Exception e) {
                log.warn("Error evaluating DLP policy {}: {}", policy.getName(), e.getMessage());
            }
        }

        // Also scan with built-in patterns
        for (Map.Entry<String, String> entry : BUILT_IN_PATTERNS.entrySet()) {
            boolean alreadyCovered = activePolicies.stream()
                    .anyMatch(p -> p.getDataPattern().equals(entry.getValue()));
            if (alreadyCovered) continue;

            Pattern pattern = Pattern.compile(entry.getValue());
            Matcher matcher = pattern.matcher(content);
            int count = 0;
            String firstMatch = null;

            while (matcher.find()) {
                count++;
                if (firstMatch == null) {
                    firstMatch = redactMatch(matcher.group());
                }
            }

            if (count > 0) {
                violations.add(DlpViolation.builder()
                        .policyName("Built-in: " + entry.getKey())
                        .dataType(inferDataType(entry.getKey()))
                        .action(DlpPolicy.DlpAction.ALERT)
                        .severity(DlpPolicy.Severity.HIGH)
                        .matchedSnippet(firstMatch)
                        .matchCount(count)
                        .build());
            }
        }

        if (!violations.isEmpty()) {
            log.warn("DLP scan found {} violations", violations.size());
        }

        return violations;
    }

    public List<DlpViolation> scanRequest(HttpServletRequest request) {
        try {
            BufferedReader reader = request.getReader();
            String body = reader.lines().collect(Collectors.joining("\n"));
            return scanContent(body);
        } catch (IOException e) {
            log.error("Failed to read request body for DLP scan", e);
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<DlpPolicy> getActivePolicies() {
        return policyRepository.findByEnabledTrue();
    }

    public DlpIncident recordIncident(DlpIncident incident) {
        log.warn("Recording DLP incident for policy: {}, user: {}", incident.getPolicyId(), incident.getUserId());
        return incidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public List<DlpIncident> getIncidentsByUser(UUID userId) {
        return incidentRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getIncidentStats(Instant since) {
        List<DlpIncident> incidents = incidentRepository.findByTimestampAfter(since);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalIncidents", incidents.size());
        stats.put("blockedCount", incidents.stream().filter(DlpIncident::isBlocked).count());
        stats.put("since", since.toString());

        Map<String, Long> byDataType = incidents.stream()
                .filter(i -> i.getDataType() != null)
                .collect(Collectors.groupingBy(DlpIncident::getDataType, Collectors.counting()));
        stats.put("byDataType", byDataType);

        Map<String, Long> byAction = incidents.stream()
                .filter(i -> i.getActionTaken() != null)
                .collect(Collectors.groupingBy(DlpIncident::getActionTaken, Collectors.counting()));
        stats.put("byAction", byAction);

        return stats;
    }

    @Transactional(readOnly = true)
    public List<DlpPolicy> getTopViolatedPolicies() {
        return policyRepository.findAllByOrderByMatchCountDesc()
                .stream()
                .limit(10)
                .collect(Collectors.toList());
    }

    public DlpPolicy togglePolicy(UUID policyId) {
        DlpPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new NoSuchElementException("DLP Policy not found: " + policyId));
        policy.setEnabled(!policy.isEnabled());
        log.info("DLP policy {} toggled to enabled={}", policy.getName(), policy.isEnabled());
        return policyRepository.save(policy);
    }

    private String redactMatch(String match) {
        if (match == null || match.length() <= 4) {
            return "****";
        }
        int visible = Math.min(4, match.length() / 4);
        return match.substring(0, visible) + "****" + match.substring(match.length() - visible);
    }

    private DlpPolicy.DataType inferDataType(String patternName) {
        return switch (patternName) {
            case "SSN", "PHONE" -> DlpPolicy.DataType.PII;
            case "CREDIT_CARD" -> DlpPolicy.DataType.PCI;
            case "API_KEY" -> DlpPolicy.DataType.CREDENTIALS;
            case "EMAIL" -> DlpPolicy.DataType.PII;
            default -> DlpPolicy.DataType.CUSTOM;
        };
    }
}
