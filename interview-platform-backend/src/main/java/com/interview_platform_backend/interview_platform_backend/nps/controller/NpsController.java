package com.interview_platform_backend.interview_platform_backend.nps.controller;

import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsSurvey;
import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsTrend;
import com.interview_platform_backend.interview_platform_backend.nps.service.NpsSurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/nps")
@RequiredArgsConstructor
public class NpsController {

    private final NpsSurveyService npsSurveyService;

    @PostMapping("/surveys/send")
    public ResponseEntity<NpsSurvey> sendSurvey(@RequestParam UUID interviewId,
                                                 @RequestParam UUID candidateId) {
        NpsSurvey survey = npsSurveyService.sendSurvey(interviewId, candidateId);
        return ResponseEntity.ok(survey);
    }

    @PostMapping("/surveys/{surveyId}/respond")
    public ResponseEntity<NpsSurvey> recordResponse(@PathVariable UUID surveyId,
                                                     @RequestParam int score,
                                                     @RequestParam(required = false) String feedback) {
        NpsSurvey survey = npsSurveyService.recordResponse(surveyId, score, feedback);
        return ResponseEntity.ok(survey);
    }

    @GetMapping("/calculate/{orgId}")
    public ResponseEntity<NpsTrend> calculateNps(@PathVariable UUID orgId,
                                                  @RequestParam Instant since) {
        NpsTrend trend = npsSurveyService.calculateNps(orgId, since);
        return ResponseEntity.ok(trend);
    }

    @GetMapping("/trends/{orgId}")
    public ResponseEntity<List<NpsTrend>> getTrends(@PathVariable UUID orgId) {
        List<NpsTrend> trends = npsSurveyService.getTrends(orgId);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/correlation/{orgId}")
    public ResponseEntity<Map<String, Double>> getCorrelation(@PathVariable UUID orgId) {
        double correlation = npsSurveyService.getCorrelationToOfferAcceptance(orgId);
        return ResponseEntity.ok(Map.of("correlationToOfferAcceptance", correlation));
    }
}
