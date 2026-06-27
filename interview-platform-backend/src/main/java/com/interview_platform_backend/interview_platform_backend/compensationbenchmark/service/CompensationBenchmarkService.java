package com.interview_platform_backend.interview_platform_backend.compensationbenchmark.service;

import com.interview_platform_backend.interview_platform_backend.compensationbenchmark.entity.CompensationBenchmark;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class CompensationBenchmarkService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public CompensationBenchmark getBenchmark(String role, String level, String location) {
        log.info("Getting benchmark for role={}, level={}, location={}", role, level, location);
        TypedQuery<CompensationBenchmark> query = entityManager.createQuery(
                "SELECT cb FROM CompensationBenchmark cb WHERE cb.roleTitle = :role AND cb.level = :level AND cb.location = :location",
                CompensationBenchmark.class);
        query.setParameter("role", role);
        query.setParameter("level", level);
        query.setParameter("location", location);
        List<CompensationBenchmark> results = query.getResultList();
        return results.isEmpty() ? null : results.get(0);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> compareOffer(double salary, String role, String level, String location) {
        log.info("Comparing offer: salary={}, role={}, level={}, location={}", salary, role, level, location);
        CompensationBenchmark benchmark = getBenchmark(role, level, location);
        Map<String, Object> result = new HashMap<>();

        if (benchmark == null) {
            result.put("error", "No benchmark data found for given criteria");
            return result;
        }

        String percentilePosition;
        if (salary <= benchmark.getP25()) {
            percentilePosition = "below_p25";
        } else if (salary <= benchmark.getP50()) {
            percentilePosition = "p25_to_p50";
        } else if (salary <= benchmark.getP75()) {
            percentilePosition = "p50_to_p75";
        } else if (salary <= benchmark.getP90()) {
            percentilePosition = "p75_to_p90";
        } else {
            percentilePosition = "above_p90";
        }

        result.put("salary", salary);
        result.put("percentilePosition", percentilePosition);
        result.put("benchmark", benchmark);
        result.put("competitiveness", salary >= benchmark.getP50() ? "COMPETITIVE" : "BELOW_MARKET");
        return result;
    }

    @Transactional(readOnly = true)
    public List<CompensationBenchmark> getMarketTrend(String role, String level) {
        log.info("Getting market trend for role={}, level={}", role, level);
        TypedQuery<CompensationBenchmark> query = entityManager.createQuery(
                "SELECT cb FROM CompensationBenchmark cb WHERE cb.roleTitle = :role AND cb.level = :level ORDER BY cb.lastUpdated DESC",
                CompensationBenchmark.class);
        query.setParameter("role", role);
        query.setParameter("level", level);
        return query.getResultList();
    }

    public List<CompensationBenchmark> bulkImport(List<CompensationBenchmark> benchmarks) {
        log.info("Bulk importing {} compensation benchmarks", benchmarks.size());
        for (CompensationBenchmark benchmark : benchmarks) {
            entityManager.persist(benchmark);
        }
        entityManager.flush();
        return benchmarks;
    }
}
