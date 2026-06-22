package com.interview_platform_backend.interview_platform_backend.chatbot;

import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.jobposition.repository.JobPositionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Candidate-facing Conversational AI Chatbot.
 * Answers questions about interview process, timeline, company info.
 * Integrates with OpenAI for natural language understanding.
 */
@Service
public class CandidateChatbotService {

    private static final Logger log = LoggerFactory.getLogger(CandidateChatbotService.class);

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String model;

    private final InterviewRepository interviewRepository;
    private final JobPositionRepository jobPositionRepository;
    private final RestClient restClient = RestClient.create();

    private static final String SYSTEM_PROMPT = """
        You are a helpful interview assistant for candidates. You can answer questions about:
        - The interview process and stages
        - Timeline and scheduling
        - Company culture and values
        - Benefits and perks
        - What to expect during interviews
        - How to prepare
        
        Be friendly, concise, and helpful. If you don't know something specific about this company,
        say so and suggest they contact the recruiter. Never make up specific dates, salaries, or details.
        """;

    public CandidateChatbotService(InterviewRepository interviewRepository,
                                    JobPositionRepository jobPositionRepository) {
        this.interviewRepository = interviewRepository;
        this.jobPositionRepository = jobPositionRepository;
    }

    /**
     * Process a candidate's message and generate a response.
     */
    public ChatResponse processMessage(UUID candidateId, String message, List<ChatMessage> history) {
        log.info("Processing chatbot message from candidate: {}", candidateId);

        // Build context about the candidate's status
        String candidateContext = buildCandidateContext(candidateId);

        if (openAiApiKey != null && !openAiApiKey.isBlank()) {
            return callOpenAI(message, history, candidateContext);
        }

        // Fallback: keyword-based responses
        return generateFallbackResponse(message);
    }

    private ChatResponse callOpenAI(String message, List<ChatMessage> history, String context) {
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT + "\n\nCandidate context: " + context));

            if (history != null) {
                for (ChatMessage h : history) {
                    messages.add(Map.of("role", h.role(), "content", h.content()));
                }
            }
            messages.add(Map.of("role", "user", "content", message));

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", messages,
                    "max_tokens", 500,
                    "temperature", 0.7
            );

            var response = restClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                var choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    var msgObj = (Map<String, String>) choices.get(0).get("message");
                    return new ChatResponse(msgObj.get("content"), "ai", null);
                }
            }
            return generateFallbackResponse(message);
        } catch (Exception e) {
            log.error("OpenAI chatbot call failed: {}", e.getMessage());
            return generateFallbackResponse(message);
        }
    }

    private ChatResponse generateFallbackResponse(String message) {
        String lower = message.toLowerCase();

        if (lower.contains("process") || lower.contains("stages") || lower.contains("steps")) {
            return new ChatResponse(
                    "Our interview process typically includes: 1) Initial phone screen (30 min), " +
                    "2) Technical assessment (60 min), 3) Team interview (45 min), and " +
                    "4) Final round with hiring manager (30 min). The entire process usually takes 2-3 weeks.",
                    "fallback", null);
        }
        if (lower.contains("prepare") || lower.contains("tips")) {
            return new ChatResponse(
                    "Here are some tips to prepare: Review the job description, prepare STAR examples for behavioral questions, " +
                    "research our company and products, and test your tech setup for video interviews. " +
                    "Don't hesitate to ask your recruiter for specific guidance!",
                    "fallback", null);
        }
        if (lower.contains("timeline") || lower.contains("when") || lower.contains("schedule")) {
            return new ChatResponse(
                    "Timeline varies by role, but we aim to move quickly. You should hear back within 48 hours " +
                    "after each stage. Your recruiter can provide more specific timing for your process.",
                    "fallback", null);
        }
        if (lower.contains("status") || lower.contains("update")) {
            return new ChatResponse(
                    "For the most up-to-date status on your application, please check your dashboard " +
                    "or reach out to your assigned recruiter directly.",
                    "fallback", null);
        }

        return new ChatResponse(
                "I'd be happy to help! I can answer questions about our interview process, how to prepare, " +
                "timeline expectations, and company culture. What would you like to know?",
                "fallback", null);
    }

    private String buildCandidateContext(UUID candidateId) {
        try {
            long interviewCount = interviewRepository.countByCandidateId(candidateId);
            return "Candidate has " + interviewCount + " interviews in the system.";
        } catch (Exception e) {
            return "No specific context available.";
        }
    }

    public record ChatMessage(String role, String content) {}
    public record ChatResponse(String content, String source, String error) {}
}
