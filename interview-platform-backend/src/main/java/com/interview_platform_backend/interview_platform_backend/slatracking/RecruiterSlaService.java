package com.interview_platform_backend.interview_platform_backend.slatracking;

import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Recruiter SLA Tracking Service.
 * Monitors response times, workload balancing, and identifies bottlenecks.
 */
@Service
public class RecruiterSlaService {

    private static final Logger log = LoggerFactory.getLogger(RecruiterSlaService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.sla.response-time-hours:48}")
    private int responseTimeSlaHours;

    @Value("${app.sla.feedback-time-hours:24}")
    private int feedbackTimeSlaHours;

    @Value("${app.sla.scheduling-time-hours:72}")
    private int schedulingTimeSlaHours;

    /**
     * Calculate SLA metrics for all recruiters.
     */
    public List<RecruiterSlaMetrics> calculateAllRecruiterMetrics() {
        List<Object[]> results = entityManager.createQuery(
                "SELECT i.scheduledBy.id, i.scheduledBy.firstName, i.scheduledBy.lastName, " +
                "COUNT(i), " +
                "AVG(EXTRACT(EPOCH FROM (i.createdAt - i.startTime)) / 3600), " +
                "SUM(CASE WHEN i.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN i.status = 'CANCELLED' THEN 1 ELSE 0 END) " +
                "FROM Interview i WHERE i.scheduledBy IS NOT NULL " +
                "AND i.createdAt > :since " +
                "GROUP BY i.scheduledBy.id, i.scheduledBy.firstName, i.scheduledBy.lastName",
                Object[].class)
                .setParameter("since", Instant.now().minus(30, ChronoUnit.DAYS))
                .getResultList();

        List<RecruiterSlaMetrics> metrics = new ArrayList<>();
        for (Object[] row : results) {
            UUID recruiterId = (UUID) row[0];
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            long totalInterviews = ((Number) row[3]).longValue();
            double avgResponseHours = row[4] != null ? ((Number) row[4]).doubleValue() : 0;
            long completed = ((Number) row[5]).longValue();
            long cancelled = ((Number) row[6]).longValue();

            boolean slaBreached = avgResponseHours > responseTimeSlaHours;

            metrics.add(new RecruiterSlaMetrics(
                    recruiterId,
                    firstName + " " + lastName,
                    totalInterviews,
                    completed,
                    cancelled,
                    Math.round(avgResponseHours * 10.0) / 10.0,
                    responseTimeSlaHours,
                    slaBreached,
                    totalInterviews > 0 ? (double) completed / totalInterviews * 100 : 0
            ));
        }

        return metrics;
    }

    /**
     * Get workload distribution across recruiters.
     */
    public Map<String, Object> getWorkloadDistribution() {
        List<Object[]> results = entityManager.createQuery(
                "SELECT i.scheduledBy.id, i.scheduledBy.firstName, i.scheduledBy.lastName, " +
                "COUNT(i) " +
                "FROM Interview i WHERE i.status = 'SCHEDULED' AND i.scheduledBy IS NOT NULL " +
                "GROUP BY i.scheduledBy.id, i.scheduledBy.firstName, i.scheduledBy.lastName " +
                "ORDER BY COUNT(i) DESC",
                Object[].class)
                .getResultList();

        List<Map<String, Object>> distribution = new ArrayList<>();
        long total = 0;
        for (Object[] row : results) {
            long count = ((Number) row[3]).longValue();
            total += count;
            distribution.add(Map.of(
                    "recruiterId", row[0],
                    "name", row[1] + " " + row[2],
                    "activeInterviews", count
            ));
        }

        double average = distribution.isEmpty() ? 0 : (double) total / distribution.size();
        List<Map<String, Object>> overloaded = distribution.stream()
                .filter(d -> ((Number) d.get("activeInterviews")).longValue() > average * 1.5)
                .toList();

        return Map.of(
                "distribution", distribution,
                "totalActive", total,
                "averagePerRecruiter", Math.round(average * 10.0) / 10.0,
                "overloaded", overloaded
        );
    }

    /**
     * Identify bottlenecks in the hiring process.
     */
    public Map<String, Object> identifyBottlenecks() {
        // Find stages where candidates are stuck
        List<Object[]> stuckCandidates = entityManager.createQuery(
                "SELECT cp.currentStage.name, COUNT(cp) " +
                "FROM CandidatePipeline cp WHERE cp.status = 'IN_PROGRESS' " +
                "AND cp.updatedAt < :staleDate " +
                "GROUP BY cp.currentStage.name " +
                "ORDER BY COUNT(cp) DESC",
                Object[].class)
                .setParameter("staleDate", Instant.now().minus(7, ChronoUnit.DAYS))
                .getResultList();

        List<Map<String, Object>> bottlenecks = new ArrayList<>();
        for (Object[] row : stuckCandidates) {
            bottlenecks.add(Map.of(
                    "stage", row[0] != null ? row[0] : "Unknown",
                    "stuckCandidates", ((Number) row[1]).longValue(),
                    "staleDays", 7
            ));
        }

        // Find interviews awaiting feedback
        long awaitingFeedback = (long) entityManager.createQuery(
                "SELECT COUNT(i) FROM Interview i WHERE i.status = 'COMPLETED' " +
                "AND NOT EXISTS (SELECT f FROM InterviewFeedBack f WHERE f.interview = i) " +
                "AND i.endTime < :cutoff")
                .setParameter("cutoff", Instant.now().minus(feedbackTimeSlaHours, ChronoUnit.HOURS))
                .getSingleResult();

        return Map.of(
                "stageBottlenecks", bottlenecks,
                "awaitingFeedback", awaitingFeedback,
                "feedbackSlaDays", feedbackTimeSlaHours / 24
        );
    }

    /**
     * Scheduled SLA breach check - alerts when thresholds are exceeded.
     */
    @Scheduled(cron = "0 0 8 * * MON-FRI") // Every weekday at 8 AM
    @SchedulerLock(name = "RecruiterSlaService_checkBreaches", lockAtMostFor = "PT10M")
    public void checkSlaBreaches() {
        log.info("Running SLA breach check...");
        List<RecruiterSlaMetrics> metrics = calculateAllRecruiterMetrics();
        long breached = metrics.stream().filter(RecruiterSlaMetrics::slaBreached).count();
        if (breached > 0) {
            log.warn("SLA BREACH: {} recruiters have exceeded response time SLA of {}h", breached, responseTimeSlaHours);
        }
    }

    public record RecruiterSlaMetrics(
            UUID recruiterId,
            String recruiterName,
            long totalInterviews,
            long completed,
            long cancelled,
            double avgResponseTimeHours,
            int slaTargetHours,
            boolean slaBreached,
            double completionRate
    ) {}
}
