package com.interview_platform_backend.interview_platform_backend.costperhire.service;

import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost;
import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost.CostType;
import com.interview_platform_backend.interview_platform_backend.costperhire.repository.HiringCostRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CostPerHireService {

    private static final Logger log = LoggerFactory.getLogger(CostPerHireService.class);

    private final HiringCostRepository costRepository;

    public HiringCost addCost(HiringCost cost) {
        log.info("Adding hiring cost: type={}, amount={} {}, job={}",
                cost.getCostType(), cost.getAmount(), cost.getCurrency(), cost.getJobPositionId());

        HiringCost saved = costRepository.save(cost);
        log.info("Hiring cost [{}] added successfully", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<HiringCost> getCostsForPosition(UUID jobId) {
        log.debug("Fetching costs for job position [{}]", jobId);
        return costRepository.findByJobPositionId(jobId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> calculateCostPerHire(UUID jobId) {
        log.info("Calculating cost-per-hire for job position [{}]", jobId);

        List<HiringCost> costs = costRepository.findByJobPositionId(jobId);
        double totalCost = costs.stream().mapToDouble(HiringCost::getAmount).sum();

        Map<String, Double> breakdown = costs.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCostType().name(),
                        Collectors.summingDouble(HiringCost::getAmount)
                ));

        return Map.of(
                "jobPositionId", jobId.toString(),
                "totalCost", totalCost,
                "breakdown", breakdown,
                "costCount", costs.size()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAvgCostPerHire(UUID orgId) {
        log.info("Calculating average cost-per-hire for org [{}]", orgId);

        List<HiringCost> costs = costRepository.findByOrganizationId(orgId);

        if (costs.isEmpty()) {
            return Map.of("organizationId", orgId.toString(), "averageCostPerHire", 0.0, "totalPositions", 0);
        }

        Map<UUID, Double> costByPosition = costs.stream()
                .collect(Collectors.groupingBy(
                        HiringCost::getJobPositionId,
                        Collectors.summingDouble(HiringCost::getAmount)
                ));

        double avgCost = costByPosition.values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        return Map.of(
                "organizationId", orgId.toString(),
                "averageCostPerHire", avgCost,
                "totalPositions", costByPosition.size()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Double> getCostBreakdown(UUID orgId, Instant since) {
        log.info("Getting cost breakdown for org [{}] since [{}]", orgId, since);

        List<HiringCost> costs = costRepository.findByOrganizationIdAndCreatedAtAfter(orgId, since);

        return costs.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCostType().name(),
                        Collectors.summingDouble(HiringCost::getAmount)
                ));
    }

    @Transactional(readOnly = true)
    public List<Map.Entry<String, Double>> getTopExpenseCategories(UUID orgId) {
        log.info("Getting top expense categories for org [{}]", orgId);

        List<HiringCost> costs = costRepository.findByOrganizationId(orgId);

        Map<String, Double> breakdown = costs.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCostType().name(),
                        Collectors.summingDouble(HiringCost::getAmount)
                ));

        return breakdown.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toList());
    }
}
