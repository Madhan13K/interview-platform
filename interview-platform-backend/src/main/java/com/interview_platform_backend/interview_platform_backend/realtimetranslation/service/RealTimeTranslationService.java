package com.interview_platform_backend.interview_platform_backend.realtimetranslation.service;

import com.interview_platform_backend.interview_platform_backend.realtimetranslation.entity.TranslationSession;
import com.interview_platform_backend.interview_platform_backend.realtimetranslation.entity.TranslationSession.TranslationSessionStatus;
import com.interview_platform_backend.interview_platform_backend.realtimetranslation.repository.TranslationSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;

@Service
public class RealTimeTranslationService {

    private static final Logger log = LoggerFactory.getLogger(RealTimeTranslationService.class);

    private final TranslationSessionRepository translationSessionRepository;
    private final RestClient restClient;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    private static final List<Map<String, String>> SUPPORTED_LANGUAGES = List.of(
            Map.of("code", "en", "name", "English"),
            Map.of("code", "es", "name", "Spanish"),
            Map.of("code", "fr", "name", "French"),
            Map.of("code", "de", "name", "German"),
            Map.of("code", "it", "name", "Italian"),
            Map.of("code", "pt", "name", "Portuguese"),
            Map.of("code", "zh", "name", "Chinese (Mandarin)"),
            Map.of("code", "ja", "name", "Japanese"),
            Map.of("code", "ko", "name", "Korean"),
            Map.of("code", "ar", "name", "Arabic"),
            Map.of("code", "hi", "name", "Hindi"),
            Map.of("code", "ru", "name", "Russian"),
            Map.of("code", "nl", "name", "Dutch"),
            Map.of("code", "pl", "name", "Polish"),
            Map.of("code", "tr", "name", "Turkish"),
            Map.of("code", "vi", "name", "Vietnamese"),
            Map.of("code", "th", "name", "Thai"),
            Map.of("code", "sv", "name", "Swedish"),
            Map.of("code", "da", "name", "Danish"),
            Map.of("code", "fi", "name", "Finnish"),
            Map.of("code", "uk", "name", "Ukrainian"),
            Map.of("code", "he", "name", "Hebrew")
    );

    public RealTimeTranslationService(TranslationSessionRepository translationSessionRepository) {
        this.translationSessionRepository = translationSessionRepository;
        this.restClient = RestClient.create();
    }

    @Transactional
    public TranslationSession startSession(UUID interviewId, String sourceLang, String targetLang) {
        TranslationSession session = TranslationSession.builder()
                .interviewId(interviewId)
                .sourceLanguage(sourceLang)
                .targetLanguage(targetLang)
                .status(TranslationSessionStatus.ACTIVE)
                .provider("openrouter")
                .build();

        TranslationSession saved = translationSessionRepository.save(session);
        log.info("Started translation session {} for interview {} ({} -> {})",
                saved.getId(), interviewId, sourceLang, targetLang);
        return saved;
    }

    @Transactional
    public Map<String, Object> translateSegment(UUID sessionId, String text) {
        TranslationSession session = translationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Translation session not found: " + sessionId));

        long startTime = System.currentTimeMillis();
        String translatedText = performTranslation(text, session.getSourceLanguage(), session.getTargetLanguage());
        long latency = System.currentTimeMillis() - startTime;

        // Update session metrics
        int newSegmentCount = session.getSegmentsTranslated() + 1;
        long newAvgLatency = ((session.getAvgLatencyMs() * session.getSegmentsTranslated()) + latency) / newSegmentCount;
        session.setSegmentsTranslated(newSegmentCount);
        session.setAvgLatencyMs(newAvgLatency);
        translationSessionRepository.save(session);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", sessionId);
        result.put("originalText", text);
        result.put("translatedText", translatedText);
        result.put("sourceLanguage", session.getSourceLanguage());
        result.put("targetLanguage", session.getTargetLanguage());
        result.put("latencyMs", latency);
        result.put("segmentNumber", newSegmentCount);

        log.debug("Translated segment {} in session {} ({}ms)", newSegmentCount, sessionId, latency);
        return result;
    }

    @Transactional
    public TranslationSession endSession(UUID sessionId) {
        TranslationSession session = translationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Translation session not found: " + sessionId));

        session.setStatus(TranslationSessionStatus.COMPLETED);
        session.setEndedAt(Instant.now());

        TranslationSession saved = translationSessionRepository.save(session);
        log.info("Ended translation session {}: {} segments, avg latency {}ms",
                sessionId, saved.getSegmentsTranslated(), saved.getAvgLatencyMs());
        return saved;
    }

    public List<Map<String, String>> getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }

    @Transactional(readOnly = true)
    public TranslationSession getSession(UUID sessionId) {
        return translationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Translation session not found: " + sessionId));
    }

    private String performTranslation(String text, String sourceLang, String targetLang) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.warn("OpenAI API key not configured. Returning mock translation.");
            return "[Translated from " + sourceLang + " to " + targetLang + "] " + text;
        }

        try {
            String prompt = "Translate the following text from " + sourceLang + " to " + targetLang
                    + ". Only return the translated text, nothing else:\n\n" + text;

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are a professional real-time interpreter. Translate accurately and naturally. Only output the translation."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 500,
                    "temperature", 0.3
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("Translation API call failed: {}", e.getMessage());
        }

        return "[Translated from " + sourceLang + " to " + targetLang + "] " + text;
    }
}
