package com.interview_platform_backend.interview_platform_backend.livetranscription.service;

import com.interview_platform_backend.interview_platform_backend.livetranscription.dto.TranscriptionConfig;
import com.interview_platform_backend.interview_platform_backend.livetranscription.dto.TranscriptionEvent;
import com.interview_platform_backend.interview_platform_backend.livetranscription.dto.TranscriptionEvent.TranscriptionEventType;
import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSegment;
import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSession;
import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSession.TranscriptionStatus;
import com.interview_platform_backend.interview_platform_backend.livetranscription.repository.TranscriptionSegmentRepository;
import com.interview_platform_backend.interview_platform_backend.livetranscription.repository.TranscriptionSessionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LiveTranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(LiveTranscriptionService.class);

    private final TranscriptionSessionRepository sessionRepository;
    private final TranscriptionSegmentRepository segmentRepository;

    @Value("${app.transcription.provider:deepgram}")
    private String defaultProvider;

    @Value("${app.transcription.deepgram-api-key:}")
    private String deepgramApiKey;

    @Value("${app.transcription.whisper-endpoint:}")
    private String whisperEndpoint;

    private final ConcurrentHashMap<UUID, Integer> sequenceCounters = new ConcurrentHashMap<>();
    private final Random random = new Random();

    private static final String[] MOCK_PHRASES = {
            "I have experience working with microservices architecture.",
            "In my previous role, I led a team of five developers.",
            "We used agile methodology and continuous integration.",
            "I'm passionate about writing clean, maintainable code.",
            "I handled database optimization that improved performance by 40%.",
            "My approach to problem-solving involves breaking down complex issues.",
            "I'm comfortable with both frontend and backend development.",
            "I have strong experience with cloud services like AWS and GCP."
    };

    @Transactional
    public TranscriptionSession startSession(TranscriptionConfig config) {
        log.info("Starting transcription session for interview: {}", config.getInterviewId());

        String provider = config.getProvider() != null ? config.getProvider() : defaultProvider;

        TranscriptionSession session = TranscriptionSession.builder()
                .interviewId(config.getInterviewId())
                .status(TranscriptionStatus.ACTIVE)
                .provider(provider)
                .language(config.getLanguage() != null ? config.getLanguage() : "en")
                .startedAt(Instant.now())
                .build();

        TranscriptionSession saved = sessionRepository.save(session);
        sequenceCounters.put(saved.getId(), 0);

        log.info("Transcription session started: {} with provider: {}", saved.getId(), provider);
        return saved;
    }

    @Transactional
    public TranscriptionEvent processAudioChunk(UUID sessionId, byte[] audioData) {
        TranscriptionSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (session.getStatus() != TranscriptionStatus.ACTIVE) {
            return TranscriptionEvent.builder()
                    .sessionId(sessionId)
                    .type(TranscriptionEventType.ERROR)
                    .text("Session is not active")
                    .build();
        }

        if (hasValidApiKey()) {
            return callProviderApi(session, audioData);
        }

        return generateMockTranscription(session, audioData);
    }

    @Transactional
    public TranscriptionSession endSession(UUID sessionId) {
        TranscriptionSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        session.setStatus(TranscriptionStatus.COMPLETED);
        session.setEndedAt(Instant.now());

        if (session.getStartedAt() != null) {
            session.setTotalDurationMs(Duration.between(session.getStartedAt(), session.getEndedAt()).toMillis());
        }

        List<TranscriptionSegment> segments = segmentRepository.findBySessionIdOrderBySequenceNumberAsc(sessionId);

        StringBuilder fullTranscript = new StringBuilder();
        int totalWords = 0;
        double totalConfidence = 0.0;
        long finalSegments = 0;

        for (TranscriptionSegment segment : segments) {
            if (segment.isFinal()) {
                if (!fullTranscript.isEmpty()) {
                    fullTranscript.append(" ");
                }
                if (segment.getSpeakerLabel() != null) {
                    fullTranscript.append("[").append(segment.getSpeakerLabel()).append("]: ");
                }
                fullTranscript.append(segment.getText());
                totalWords += segment.getText().split("\\s+").length;
                totalConfidence += segment.getConfidence();
                finalSegments++;
            }
        }

        session.setFullTranscript(fullTranscript.toString());
        session.setWordCount(totalWords);
        session.setConfidenceAvg(finalSegments > 0 ? totalConfidence / finalSegments : 0.0);

        long distinctSpeakers = segments.stream()
                .map(TranscriptionSegment::getSpeakerLabel)
                .filter(s -> s != null && !s.isEmpty())
                .distinct()
                .count();
        session.setSpeakerCount((int) distinctSpeakers);

        sequenceCounters.remove(sessionId);

        log.info("Transcription session ended: {} - {} words, {} speakers",
                sessionId, totalWords, distinctSpeakers);

        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<TranscriptionSegment> getTranscript(UUID sessionId) {
        return segmentRepository.findBySessionIdOrderBySequenceNumberAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public TranscriptionSession getSessionByInterview(UUID interviewId) {
        return sessionRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No transcription session found for interview: " + interviewId));
    }

    private boolean hasValidApiKey() {
        return deepgramApiKey != null && !deepgramApiKey.isBlank();
    }

    private TranscriptionEvent callProviderApi(TranscriptionSession session, byte[] audioData) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl("https://api.deepgram.com/v1")
                    .defaultHeader("Authorization", "Token " + deepgramApiKey)
                    .defaultHeader("Content-Type", "audio/wav")
                    .build();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/listen?model=nova-2&language={lang}&punctuate=true&diarize=true",
                            session.getLanguage())
                    .body(audioData)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                return parseDeepgramResponse(session, response);
            }

            return generateMockTranscription(session, audioData);
        } catch (Exception e) {
            log.warn("Deepgram API call failed, falling back to mock: {}", e.getMessage());
            return generateMockTranscription(session, audioData);
        }
    }

    @SuppressWarnings("unchecked")
    private TranscriptionEvent parseDeepgramResponse(TranscriptionSession session, Map<String, Object> response) {
        try {
            Map<String, Object> results = (Map<String, Object>) response.get("results");
            List<Map<String, Object>> channels = (List<Map<String, Object>>) results.get("channels");
            Map<String, Object> channel = channels.get(0);
            List<Map<String, Object>> alternatives = (List<Map<String, Object>>) channel.get("alternatives");
            Map<String, Object> alternative = alternatives.get(0);

            String transcript = (String) alternative.get("transcript");
            double confidence = alternative.get("confidence") != null
                    ? ((Number) alternative.get("confidence")).doubleValue() : 0.85;

            int seq = sequenceCounters.merge(session.getId(), 1, Integer::sum);

            TranscriptionSegment segment = TranscriptionSegment.builder()
                    .sessionId(session.getId())
                    .speakerLabel("Speaker 1")
                    .text(transcript)
                    .startTimeMs(System.currentTimeMillis() - session.getStartedAt().toEpochMilli())
                    .endTimeMs(System.currentTimeMillis() - session.getStartedAt().toEpochMilli() + 3000)
                    .confidence(confidence)
                    .isFinal(true)
                    .sequenceNumber(seq)
                    .build();

            segmentRepository.save(segment);

            return TranscriptionEvent.builder()
                    .sessionId(session.getId())
                    .type(TranscriptionEventType.TRANSCRIPT_FINAL)
                    .text(transcript)
                    .speaker("Speaker 1")
                    .confidence(confidence)
                    .startTimeMs(segment.getStartTimeMs())
                    .endTimeMs(segment.getEndTimeMs())
                    .isFinal(true)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Deepgram response: {}", e.getMessage());
            return generateMockTranscription(session, new byte[0]);
        }
    }

    private TranscriptionEvent generateMockTranscription(TranscriptionSession session, byte[] audioData) {
        int seq = sequenceCounters.merge(session.getId(), 1, Integer::sum);
        String mockText = MOCK_PHRASES[random.nextInt(MOCK_PHRASES.length)];
        String speaker = "Speaker " + (random.nextInt(2) + 1);
        double confidence = 0.85 + (random.nextDouble() * 0.14);
        long elapsedMs = Duration.between(session.getStartedAt(), Instant.now()).toMillis();

        TranscriptionSegment segment = TranscriptionSegment.builder()
                .sessionId(session.getId())
                .speakerLabel(speaker)
                .text(mockText)
                .startTimeMs(elapsedMs)
                .endTimeMs(elapsedMs + 3000)
                .confidence(confidence)
                .isFinal(true)
                .sequenceNumber(seq)
                .build();

        segmentRepository.save(segment);

        log.debug("Generated mock transcription segment #{} for session: {}", seq, session.getId());

        return TranscriptionEvent.builder()
                .sessionId(session.getId())
                .type(TranscriptionEventType.TRANSCRIPT_FINAL)
                .text(mockText)
                .speaker(speaker)
                .confidence(confidence)
                .startTimeMs(elapsedMs)
                .endTimeMs(elapsedMs + 3000)
                .isFinal(true)
                .build();
    }
}
