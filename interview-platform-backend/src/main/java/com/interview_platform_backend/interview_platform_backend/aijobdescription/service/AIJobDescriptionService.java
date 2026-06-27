package com.interview_platform_backend.interview_platform_backend.aijobdescription.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.aijobdescription.entity.GeneratedJobDescription;
import com.interview_platform_backend.interview_platform_backend.aijobdescription.repository.GeneratedJobDescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AIJobDescriptionService {

    private static final Logger log = LoggerFactory.getLogger(AIJobDescriptionService.class);

    private final GeneratedJobDescriptionRepository jobDescriptionRepository;
    private final ObjectMapper objectMapper;

    private static final List<String> NON_INCLUSIVE_TERMS = List.of(
            "rockstar", "ninja", "guru", "manpower", "chairman",
            "aggressive", "dominant", "mankind", "fireman", "policeman"
    );

    @Transactional
    public GeneratedJobDescription generate(String jobTitle, String department,
                                             List<String> requirements, String tone) {
        log.info("Generating job description for [{}] in department [{}], tone: [{}]",
                jobTitle, department, tone);

        String requirementsJson = serializeList(requirements);

        // Generate content (placeholder for OpenRouter integration)
        String generatedContent = generateContent(jobTitle, department, requirements, tone);
        int wordCount = generatedContent.split("\\s+").length;
        double readability = getReadabilityScore(generatedContent);
        Map<String, Object> deiResult = checkDeiLanguage(generatedContent);

        GeneratedJobDescription jd = GeneratedJobDescription.builder()
                .jobTitle(jobTitle)
                .department(department)
                .requirements(requirementsJson)
                .generatedContent(generatedContent)
                .deiScore((double) deiResult.get("score"))
                .inclusiveLanguageFlags(serializeList((List<String>) deiResult.get("flags")))
                .toneAnalysis(tone)
                .readabilityScore(readability)
                .wordCount(wordCount)
                .status(GeneratedJobDescription.Status.DRAFT)
                .generatedAt(Instant.now())
                .build();

        GeneratedJobDescription saved = jobDescriptionRepository.save(jd);
        log.info("Generated job description [{}] with DEI score [{}] and readability [{}]",
                saved.getId(), saved.getDeiScore(), saved.getReadabilityScore());
        return saved;
    }

    public Map<String, Object> checkDeiLanguage(String content) {
        log.debug("Checking DEI language compliance");
        List<String> flags = new ArrayList<>();
        String lowerContent = content.toLowerCase();

        for (String term : NON_INCLUSIVE_TERMS) {
            if (lowerContent.contains(term)) {
                flags.add(term);
            }
        }

        double score = flags.isEmpty() ? 95.0 : Math.max(0, 100.0 - (flags.size() * 15.0));

        return Map.of(
                "score", score,
                "flags", flags,
                "isInclusive", flags.isEmpty()
        );
    }

    public String improveInclusivity(String content) {
        log.info("Improving inclusivity of content");
        String improved = content;
        improved = improved.replaceAll("(?i)rockstar", "talented professional");
        improved = improved.replaceAll("(?i)ninja", "skilled practitioner");
        improved = improved.replaceAll("(?i)guru", "expert");
        improved = improved.replaceAll("(?i)manpower", "workforce");
        improved = improved.replaceAll("(?i)chairman", "chairperson");
        improved = improved.replaceAll("(?i)aggressive", "ambitious");
        improved = improved.replaceAll("(?i)dominant", "leading");
        return improved;
    }

    public double getReadabilityScore(String content) {
        if (content == null || content.isBlank()) {
            return 0.0;
        }
        String[] sentences = content.split("[.!?]+");
        String[] words = content.split("\\s+");
        int syllableCount = estimateSyllables(content);

        if (sentences.length == 0 || words.length == 0) {
            return 0.0;
        }

        // Flesch Reading Ease formula
        double avgSentenceLength = (double) words.length / sentences.length;
        double avgSyllablesPerWord = (double) syllableCount / words.length;
        double score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        return Math.max(0, Math.min(100, score));
    }

    private String generateContent(String jobTitle, String department,
                                    List<String> requirements, String tone) {
        StringBuilder content = new StringBuilder();
        content.append("Job Title: ").append(jobTitle).append("\n\n");
        content.append("Department: ").append(department).append("\n\n");
        content.append("About the Role:\n");
        content.append("We are looking for a talented ").append(jobTitle);
        content.append(" to join our ").append(department).append(" team. ");
        content.append("This is an exciting opportunity to make a meaningful impact.\n\n");
        content.append("Requirements:\n");
        for (String req : requirements) {
            content.append("- ").append(req).append("\n");
        }
        content.append("\nWe are an equal opportunity employer committed to diversity and inclusion.");
        return content.toString();
    }

    private int estimateSyllables(String text) {
        String[] words = text.toLowerCase().split("\\s+");
        int total = 0;
        for (String word : words) {
            total += Math.max(1, word.replaceAll("[^aeiouy]", "").length());
        }
        return total;
    }

    @SuppressWarnings("unchecked")
    private String serializeList(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize list: {}", e.getMessage());
            return "[]";
        }
    }
}
