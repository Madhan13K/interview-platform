package com.interview_platform_backend.interview_platform_backend.recordinghighlights.service;

import com.interview_platform_backend.interview_platform_backend.recordinghighlights.entity.RecordingHighlight;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecordingHighlightService {

    private static final Logger log = LoggerFactory.getLogger(RecordingHighlightService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    @Value("${app.ai.openrouter.api-key:}")
    private String openRouterApiKey;

    @Transactional
    public List<RecordingHighlight> generateHighlights(UUID recordingId, UUID interviewId, String fullTranscript) {
        // Uses OpenRouter AI to analyze transcript and identify key moments.
        // In production, this calls the OpenRouter API with the transcript to extract highlights.
        log.info("Generating AI highlights for recording [{}] of interview [{}]", recordingId, interviewId);

        // Placeholder: create a single KEY_MOMENT highlight as demonstration
        RecordingHighlight highlight = RecordingHighlight.builder()
                .recordingId(recordingId)
                .interviewId(interviewId)
                .type(RecordingHighlight.HighlightType.KEY_MOMENT)
                .startTimeMs(0)
                .endTimeMs(60000)
                .transcript(fullTranscript != null && fullTranscript.length() > 500
                        ? fullTranscript.substring(0, 500)
                        : fullTranscript)
                .aiScore(0.0)
                .aiReason("AI analysis pending - OpenRouter integration")
                .build();

        entityManager.persist(highlight);
        log.info("Generated {} highlight(s) for recording [{}]", 1, recordingId);
        return List.of(highlight);
    }

    @Transactional(readOnly = true)
    public List<RecordingHighlight> getHighlights(UUID recordingId) {
        TypedQuery<RecordingHighlight> query = entityManager.createQuery(
                "SELECT h FROM RecordingHighlight h WHERE h.recordingId = :recordingId ORDER BY h.startTimeMs ASC",
                RecordingHighlight.class);
        query.setParameter("recordingId", recordingId);
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public List<RecordingHighlight> getByInterview(UUID interviewId) {
        TypedQuery<RecordingHighlight> query = entityManager.createQuery(
                "SELECT h FROM RecordingHighlight h WHERE h.interviewId = :interviewId ORDER BY h.startTimeMs ASC",
                RecordingHighlight.class);
        query.setParameter("interviewId", interviewId);
        return query.getResultList();
    }

    @Transactional
    public RecordingHighlight bookmarkClip(UUID recordingId, UUID interviewId,
                                           RecordingHighlight.HighlightType type,
                                           long startTimeMs, long endTimeMs,
                                           String transcript, String reason) {
        RecordingHighlight highlight = RecordingHighlight.builder()
                .recordingId(recordingId)
                .interviewId(interviewId)
                .type(type)
                .startTimeMs(startTimeMs)
                .endTimeMs(endTimeMs)
                .transcript(transcript)
                .aiScore(0.0)
                .aiReason(reason)
                .build();

        entityManager.persist(highlight);
        log.info("Bookmarked clip [{} - {}ms] for recording [{}]", startTimeMs, endTimeMs, recordingId);
        return highlight;
    }
}
