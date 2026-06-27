package com.interview_platform_backend.interview_platform_backend.availabilityforecasting.service;

import com.interview_platform_backend.interview_platform_backend.availabilityforecasting.entity.AvailabilityForecast;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@Transactional
public class AvailabilityForecastService {

    @PersistenceContext
    private EntityManager entityManager;

    public List<AvailabilityForecast> generateForecast(UUID interviewerId, int daysAhead) {
        log.info("Generating availability forecast for interviewer {} for {} days ahead", interviewerId, daysAhead);
        List<AvailabilityForecast> forecasts = new ArrayList<>();
        LocalDate startDate = LocalDate.now().plusDays(1);

        for (int i = 0; i < daysAhead; i++) {
            LocalDate forecastDate = startDate.plusDays(i);
            int dayOfWeek = forecastDate.getDayOfWeek().getValue();
            boolean isWeekend = dayOfWeek >= 6;

            AvailabilityForecast forecast = AvailabilityForecast.builder()
                    .interviewerId(interviewerId)
                    .forecastDate(forecastDate)
                    .predictedAvailableSlots(isWeekend ? 0 : 4)
                    .conflictProbability(isWeekend ? 1.0 : 0.2)
                    .busyHours("[\"09:00-10:00\",\"12:00-13:00\"]")
                    .recommendedSlots("[\"10:00-11:00\",\"14:00-15:00\",\"15:00-16:00\",\"16:00-17:00\"]")
                    .build();

            entityManager.persist(forecast);
            forecasts.add(forecast);
        }
        return forecasts;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConflicts(UUID interviewerId, Instant proposedTime) {
        log.info("Checking conflicts for interviewer {} at {}", interviewerId, proposedTime);
        Map<String, Object> result = new HashMap<>();
        result.put("interviewerId", interviewerId);
        result.put("proposedTime", proposedTime);

        TypedQuery<AvailabilityForecast> query = entityManager.createQuery(
                "SELECT af FROM AvailabilityForecast af WHERE af.interviewerId = :iid AND af.forecastDate = :fd",
                AvailabilityForecast.class);
        query.setParameter("iid", interviewerId);
        query.setParameter("fd", proposedTime.atZone(java.time.ZoneOffset.UTC).toLocalDate());

        List<AvailabilityForecast> forecasts = query.getResultList();
        if (forecasts.isEmpty()) {
            result.put("hasConflict", false);
            result.put("conflictProbability", 0.0);
        } else {
            AvailabilityForecast forecast = forecasts.get(0);
            result.put("hasConflict", forecast.getConflictProbability() > 0.5);
            result.put("conflictProbability", forecast.getConflictProbability());
            result.put("busyHours", forecast.getBusyHours());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getBestSlotsForTeam(List<UUID> interviewerIds, int daysAhead) {
        log.info("Finding best slots for team of {} interviewers, {} days ahead", interviewerIds.size(), daysAhead);
        List<Map<String, Object>> bestSlots = new ArrayList<>();
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = startDate.plusDays(daysAhead);

        TypedQuery<AvailabilityForecast> query = entityManager.createQuery(
                "SELECT af FROM AvailabilityForecast af WHERE af.interviewerId IN :ids AND af.forecastDate BETWEEN :start AND :end ORDER BY af.conflictProbability ASC",
                AvailabilityForecast.class);
        query.setParameter("ids", interviewerIds);
        query.setParameter("start", startDate);
        query.setParameter("end", endDate);

        List<AvailabilityForecast> forecasts = query.getResultList();
        for (AvailabilityForecast forecast : forecasts) {
            if (forecast.getPredictedAvailableSlots() > 0) {
                Map<String, Object> slot = new HashMap<>();
                slot.put("date", forecast.getForecastDate());
                slot.put("interviewerId", forecast.getInterviewerId());
                slot.put("availableSlots", forecast.getPredictedAvailableSlots());
                slot.put("recommendedSlots", forecast.getRecommendedSlots());
                slot.put("conflictProbability", forecast.getConflictProbability());
                bestSlots.add(slot);
            }
        }
        return bestSlots;
    }
}
