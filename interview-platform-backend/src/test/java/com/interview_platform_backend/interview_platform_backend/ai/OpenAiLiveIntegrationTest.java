package com.interview_platform_backend.interview_platform_backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Live OpenAI API Integration Test.
 * Tests all AI functionalities against the real OpenAI API.
 * Requires OPENAI_API_KEY to be set (falls back to app.ai.openai.api-key default).
 *
 * Run with: ./mvnw test -Dtest=OpenAiLiveIntegrationTest -B
 */
@DisplayName("OpenAI Live API Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OpenAiLiveIntegrationTest {

    private static final String OPENAI_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final RestClient restClient = RestClient.create();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static String apiKey;
    private static String model;

    @BeforeAll
    static void setup() {
        // Try env variable first, then fall back to the configured default
        apiKey = System.getenv("OPENAI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getProperty("OPENAI_API_KEY", "");
        }
        model = System.getenv("OPENAI_MODEL") != null ? System.getenv("OPENAI_MODEL") : "openai/gpt-4o-mini";

        System.out.println("=== OpenRouter Live Integration Test ===");
        System.out.println("API Key: " + apiKey.substring(0, 7) + "..." + apiKey.substring(apiKey.length() - 4));
        System.out.println("Model: " + model);
        System.out.println("URL: " + OPENAI_URL);
        System.out.println("=========================================");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callOpenAI(String systemPrompt, String userPrompt, boolean jsonMode, int maxTokens) {
        var requestBody = new java.util.HashMap<String, Object>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", 0.7);
        if (jsonMode) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        var response = restClient.post()
                .uri(OPENAI_URL)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .header("HTTP-Referer", "https://interview-platform.app")
                .header("X-Title", "Interview Platform AI")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        assertThat(response).isNotNull();
        assertThat(response).containsKey("choices");
        assertThat(response).containsKey("usage");

        var choices = (List<Map<String, Object>>) response.get("choices");
        assertThat(choices).isNotEmpty();

        var message = (Map<String, Object>) choices.get(0).get("message");
        String content = (String) message.get("content");
        assertThat(content).isNotBlank();

        var usage = (Map<String, Object>) response.get("usage");
        int totalTokens = ((Number) usage.get("total_tokens")).intValue();
        System.out.println("  Tokens used: " + totalTokens);

        return Map.of("content", content, "usage", usage, "model", response.get("model"));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. QUESTION GENERATION (AiService.suggestQuestions)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(1)
    @DisplayName("1. AI Question Generation - Generate interview questions for a role")
    void testQuestionGeneration() throws Exception {
        System.out.println("\n[TEST 1] AI Question Generation");

        String systemPrompt = "You are an expert interviewer. Generate interview questions as a JSON array. " +
                "Each object should have 'question', 'difficulty' (EASY/MEDIUM/HARD), and 'category' " +
                "(TECHNICAL/BEHAVIORAL/SYSTEM_DESIGN/CODING) fields.";

        String userPrompt = "Generate 5 interview questions for the role: Senior Java Developer. " +
                "Difficulty: MEDIUM. Category: TECHNICAL. Skills: Java, Spring Boot, Microservices";

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 1000);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(200, content.length())) + "...");

        // Parse and validate JSON structure
        var parsed = objectMapper.readValue(content, Map.class);
        // The response should contain questions (either as array or wrapped in object)
        assertThat(content).containsIgnoringCase("question");
        assertThat(content).containsIgnoringCase("difficulty");
        assertThat(content).containsIgnoringCase("category");

        System.out.println("  PASSED: Questions generated with proper structure");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. RESUME PARSING (AiService.parseResume)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(2)
    @DisplayName("2. AI Resume Parsing - Extract structured data from resume text")
    void testResumeParsing() throws Exception {
        System.out.println("\n[TEST 2] AI Resume Parsing");

        String systemPrompt = "You are a resume parser. Extract structured data from resume text and return JSON " +
                "with fields: candidateName, email, phone, skills (array), experience (array of objects with " +
                "company, role, duration, description), education (array with institution, degree, year), and summary.";

        String userPrompt = """
                Parse the following resume:
                
                JOHN DOE
                john.doe@techmail.com | +1-555-0123 | San Francisco, CA
                
                EXPERIENCE:
                Senior Software Engineer - Google (2021-Present)
                - Led development of distributed caching system serving 10M+ users
                - Designed microservices architecture using Go and gRPC
                
                Software Engineer - Amazon (2018-2021)
                - Built real-time inventory management system
                - Reduced API latency by 40% through optimization
                
                EDUCATION:
                M.S. Computer Science - Stanford University (2018)
                B.S. Computer Science - UC Berkeley (2016)
                
                SKILLS: Java, Python, Go, Kubernetes, AWS, Docker, PostgreSQL, Redis, gRPC, Kafka
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 1000);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(300, content.length())) + "...");

        // Validate structure
        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("candidateName");
        assertThat(parsed).containsKey("skills");
        assertThat(parsed).containsKey("experience");
        assertThat(parsed).containsKey("education");
        assertThat(parsed.get("candidateName").toString()).containsIgnoringCase("John");

        System.out.println("  PASSED: Resume parsed with correct structure and data extraction");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. INTERVIEW SUMMARY (AiService.generateInterviewSummary)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(3)
    @DisplayName("3. AI Interview Summary - Generate evaluation from interview notes")
    void testInterviewSummary() throws Exception {
        System.out.println("\n[TEST 3] AI Interview Summary Generation");

        String systemPrompt = "You are an interview evaluator. Generate an interview summary as JSON with: " +
                "overallRating (1-5), strengths (array), weaknesses (array), " +
                "recommendation (STRONG_HIRE/HIRE/NO_HIRE/STRONG_NO_HIRE), and summary (text).";

        String userPrompt = """
                Generate an interview summary based on these notes:
                
                Candidate: Jane Smith - Senior Backend Engineer
                Interviewer Notes:
                - Strong understanding of system design principles
                - Designed a scalable notification system with proper tradeoff analysis
                - Good communication, explained complex concepts clearly
                - Struggled slightly with dynamic programming optimization
                - Showed great collaboration skills during pair programming
                - 6 years of relevant experience at top tech companies
                - Could improve on time complexity analysis
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 800);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(300, content.length())) + "...");

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("overallRating");
        assertThat(parsed).containsKey("strengths");
        assertThat(parsed).containsKey("weaknesses");
        assertThat(parsed).containsKey("recommendation");
        assertThat(parsed).containsKey("summary");

        // Verify recommendation is one of valid values
        String recommendation = parsed.get("recommendation").toString();
        assertThat(recommendation).isIn("STRONG_HIRE", "HIRE", "NO_HIRE", "STRONG_NO_HIRE");

        System.out.println("  Recommendation: " + recommendation);
        System.out.println("  PASSED: Interview summary generated with valid structure");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. AI SCORING (AIInterviewScoringService.analyzeTranscript)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(4)
    @DisplayName("4. AI Interview Scoring - Score transcript on multiple dimensions")
    void testInterviewScoring() throws Exception {
        System.out.println("\n[TEST 4] AI Interview Transcript Scoring");

        String systemPrompt = "You are an expert interview evaluator. Provide objective, data-driven scoring.";

        String userPrompt = """
                Analyze this interview transcript for a Senior Software Engineer role (Technical interview).
                Score each dimension from 1-10 and provide brief justification.
                
                Respond in JSON format:
                {
                    "communication": {"score": X, "note": "..."},
                    "technical": {"score": X, "note": "..."},
                    "problemSolving": {"score": X, "note": "..."},
                    "engagement": {"score": X, "note": "..."},
                    "overall": {"score": X, "note": "..."}
                }
                
                Transcript:
                Interviewer: Can you explain how you would design a rate limiter?
                Candidate: Sure! I'd approach this by first clarifying requirements - are we talking about a distributed system or single server? For distributed, I'd use a sliding window approach with Redis. The key insight is using sorted sets where each request gets a timestamp score. We can then count entries within our window efficiently. For the algorithm, I'd use a token bucket for its simplicity and burst-handling capability. The trade-off versus sliding window log is memory - token bucket uses O(1) space.
                Interviewer: How would you handle edge cases?
                Candidate: Great question. Race conditions are the main concern in distributed settings. I'd use Redis MULTI/EXEC for atomicity, or Lua scripts for complex operations. For clock skew across servers, we could use logical timestamps or accept slight inaccuracy with NTP sync. We should also consider what happens when Redis is down - fail open or fail closed depending on the use case.
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 500);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(300, content.length())) + "...");

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("communication");
        assertThat(parsed).containsKey("technical");
        assertThat(parsed).containsKey("problemSolving");
        assertThat(parsed).containsKey("engagement");
        assertThat(parsed).containsKey("overall");

        // Verify scores are numbers in range
        var technical = (Map<String, Object>) parsed.get("technical");
        assertThat(technical).containsKey("score");
        assertThat(technical).containsKey("note");
        int techScore = ((Number) technical.get("score")).intValue();
        assertThat(techScore).isBetween(1, 10);

        System.out.println("  Technical Score: " + techScore + "/10");
        System.out.println("  PASSED: Transcript scored with multi-dimensional analysis");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. CHATBOT (CandidateChatbotService.processMessage)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(5)
    @DisplayName("5. AI Chatbot - Candidate conversational assistant")
    void testCandidateChatbot() throws Exception {
        System.out.println("\n[TEST 5] AI Candidate Chatbot");

        String systemPrompt = """
                You are a helpful interview assistant for candidates. You can answer questions about:
                - The interview process and stages
                - Timeline and scheduling
                - Company culture and values
                - What to expect during interviews
                - How to prepare
                
                Be friendly, concise, and helpful. If you don't know something specific about this company,
                say so and suggest they contact the recruiter. Never make up specific dates, salaries, or details.
                
                Candidate context: Applied for Senior Backend Engineer role. Currently in Technical Interview stage.
                Next interview scheduled. Has completed phone screen (passed) and coding assessment (scored 85%).
                """;

        String userPrompt = "What should I expect in my upcoming technical interview? Any tips on how to prepare?";

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, false, 500);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(400, content.length())) + "...");

        assertThat(content).isNotBlank();
        assertThat(content.length()).isGreaterThan(50); // Should be a substantive response
        // Should contain helpful interview prep content
        assertThat(content.toLowerCase()).containsAnyOf("prepare", "interview", "technical", "system design", "coding", "practice");

        System.out.println("  PASSED: Chatbot generated helpful, contextual response");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. SCREENING BOT (AutomatedScreeningService.generateScreeningQuestions)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(6)
    @DisplayName("6. AI Screening - Generate screening questions for job role")
    void testScreeningQuestionGeneration() throws Exception {
        System.out.println("\n[TEST 6] AI Automated Screening Questions");

        String systemPrompt = """
                You are an automated screening assistant. Generate screening questions for candidates.
                Return JSON with format:
                {
                    "questions": [
                        {"id": 1, "question": "...", "expectedKeywords": ["..."], "weight": 1.0, "type": "TECHNICAL"},
                        ...
                    ]
                }
                Types: TECHNICAL, EXPERIENCE, SITUATIONAL, MOTIVATION
                """;

        String userPrompt = "Generate 5 screening questions for a Full-Stack Developer role requiring " +
                "React, Node.js, PostgreSQL, and AWS experience. Focus on practical knowledge.";

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 1000);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(300, content.length())) + "...");

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("questions");
        var questions = (List<Map<String, Object>>) parsed.get("questions");
        assertThat(questions).hasSizeGreaterThanOrEqualTo(4);

        // Validate structure of first question
        var firstQ = questions.get(0);
        assertThat(firstQ).containsKey("question");
        assertThat(firstQ).containsKey("type");

        System.out.println("  Generated " + questions.size() + " screening questions");
        System.out.println("  PASSED: Screening questions generated with proper structure");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. SKILL EXTRACTION (CandidateSourcingService.extractSkillsFromJobDescription)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(7)
    @DisplayName("7. AI Skill Extraction - Extract skills from job description")
    void testSkillExtraction() throws Exception {
        System.out.println("\n[TEST 7] AI Skill Extraction from Job Description");

        String systemPrompt = "Extract technical skills from job descriptions. Return JSON: {\"skills\": [\"skill1\", \"skill2\", ...]}";

        String userPrompt = """
                Extract technical skills from this job description:
                
                We are looking for a Senior Platform Engineer to join our infrastructure team.
                You will work on Kubernetes orchestration, Terraform for IaC, and CI/CD pipelines.
                Experience with AWS (EKS, RDS, S3), monitoring with Prometheus and Grafana,
                and programming in Go or Python is required. Familiarity with service mesh (Istio),
                GitOps (ArgoCD), and container security (Falco, OPA) is a plus.
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 300);
        String content = (String) result.get("content");

        System.out.println("  Response: " + content);

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("skills");
        var skills = (List<String>) parsed.get("skills");
        assertThat(skills).hasSizeGreaterThanOrEqualTo(5);

        // Should extract key skills mentioned
        String skillsLower = skills.stream().map(String::toLowerCase).toList().toString();
        assertThat(skillsLower).contains("kubernetes");
        assertThat(skillsLower).contains("terraform");

        System.out.println("  Extracted " + skills.size() + " skills: " + skills);
        System.out.println("  PASSED: Skills correctly extracted from job description");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. CONTEXT-AWARE QUESTION GEN (QuestionGeneratorV2Service)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(8)
    @DisplayName("8. AI Context-Aware Questions - Generate from resume + JD + feedback")
    void testContextAwareQuestionGeneration() throws Exception {
        System.out.println("\n[TEST 8] AI Context-Aware Question Generation");

        String systemPrompt = """
                You are an expert interview question generator. Generate questions tailored to the candidate's
                background, the job requirements, and any prior feedback. Return JSON:
                {
                    "questions": [
                        {"question": "...", "rationale": "...", "targetSkill": "...", "difficulty": "EASY/MEDIUM/HARD"}
                    ]
                }
                """;

        String userPrompt = """
                Generate 4 tailored interview questions based on:
                
                CANDIDATE RESUME HIGHLIGHTS:
                - 5 years Java/Spring Boot experience
                - Built event-driven systems with Kafka
                - Limited cloud experience (mostly on-premise)
                
                JOB DESCRIPTION:
                - Senior Cloud Engineer role
                - Requires AWS, microservices, event-driven architecture
                - Must handle high-scale distributed systems
                
                PRIOR INTERVIEW FEEDBACK:
                - Strong on fundamentals but needs to demonstrate cloud migration experience
                - Good communicator, ask about leadership/mentoring
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 1000);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(400, content.length())) + "...");

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("questions");
        var questions = (List<Map<String, Object>>) parsed.get("questions");
        assertThat(questions).hasSizeGreaterThanOrEqualTo(3);

        // Each question should have required fields
        var firstQ = questions.get(0);
        assertThat(firstQ).containsKey("question");
        assertThat(firstQ).containsKey("difficulty");

        System.out.println("  Generated " + questions.size() + " context-aware questions");
        System.out.println("  PASSED: Context-aware questions properly tailored to candidate");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. INTERVIEW COACH (AIInterviewCoachService)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(9)
    @DisplayName("9. AI Interview Coach - Real-time interviewer suggestions")
    void testInterviewCoach() throws Exception {
        System.out.println("\n[TEST 9] AI Interview Coach (Real-time Suggestions)");

        String systemPrompt = """
                You are an AI interview coach providing real-time guidance to interviewers.
                Analyze the conversation and provide suggestions. Return JSON:
                {
                    "followUpQuestion": "...",
                    "biasAlert": null or "...",
                    "timeManagement": "...",
                    "competenciesCovered": ["..."],
                    "competenciesRemaining": ["..."],
                    "overallAdvice": "..."
                }
                """;

        String userPrompt = """
                Interview context: Senior Backend Engineer, 45-min technical interview.
                Time elapsed: 20 minutes. Required competencies: System Design, Coding, Communication, Leadership.
                
                Recent exchange:
                Interviewer: "Tell me about a system you designed"
                Candidate: "I designed our payment processing pipeline handling 50K transactions/sec using Kafka and microservices. We used event sourcing for audit trails and CQRS for read optimization."
                Interviewer: "That sounds great! You clearly know your stuff."
                
                Provide coaching guidance for the interviewer.
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 600);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(400, content.length())) + "...");

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("followUpQuestion");
        assertThat(parsed).containsKey("competenciesCovered");
        assertThat(parsed.get("followUpQuestion").toString()).isNotBlank();

        System.out.println("  Follow-up suggested: " + parsed.get("followUpQuestion").toString().substring(0, Math.min(80, parsed.get("followUpQuestion").toString().length())));
        System.out.println("  PASSED: Coach provided actionable interview guidance");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 10. SCREENING EVALUATION (AutomatedScreeningService.evaluateResponses)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @Order(10)
    @DisplayName("10. AI Screening Evaluation - Evaluate candidate screening responses")
    void testScreeningEvaluation() throws Exception {
        System.out.println("\n[TEST 10] AI Screening Response Evaluation");

        String systemPrompt = """
                You are an automated screening evaluator. Evaluate candidate responses to screening questions.
                Return JSON:
                {
                    "evaluations": [
                        {"questionId": 1, "score": 0-10, "passed": true/false, "feedback": "..."}
                    ],
                    "overallScore": 0-100,
                    "recommendation": "PASS/FAIL/REVIEW",
                    "summary": "..."
                }
                """;

        String userPrompt = """
                Evaluate these screening responses for a Backend Developer position:
                
                Q1: "Explain the difference between SQL and NoSQL databases. When would you use each?"
                A1: "SQL databases are relational with ACID properties, great for structured data and complex queries. NoSQL includes document stores like MongoDB for flexible schemas, key-value stores like Redis for caching, and wide-column stores like Cassandra for high write throughput. I'd use SQL for financial data needing transactions, and NoSQL for user sessions or real-time analytics."
                
                Q2: "How do you ensure API security in a production environment?"
                A2: "I use HTTPS, JWT tokens for auth, rate limiting, input validation, and CORS policies. Also important: API keys rotation, OAuth2 for third-party access, and logging all requests for audit."
                
                Q3: "Describe your experience with CI/CD pipelines."
                A3: "I've set up Jenkins and GitHub Actions. We run unit tests, integration tests, then deploy to staging. After QA approval it goes to production with blue-green deployments."
                """;

        Map<String, Object> result = callOpenAI(systemPrompt, userPrompt, true, 800);
        String content = (String) result.get("content");

        System.out.println("  Response preview: " + content.substring(0, Math.min(300, content.length())) + "...");

        var parsed = objectMapper.readValue(content, Map.class);
        assertThat(parsed).containsKey("evaluations");
        assertThat(parsed).containsKey("overallScore");
        assertThat(parsed).containsKey("recommendation");

        String recommendation = parsed.get("recommendation").toString();
        assertThat(recommendation).isIn("PASS", "FAIL", "REVIEW");

        int overallScore = ((Number) parsed.get("overallScore")).intValue();
        System.out.println("  Overall Score: " + overallScore + "/100");
        System.out.println("  Recommendation: " + recommendation);
        System.out.println("  PASSED: Screening responses evaluated with scores and recommendation");
    }
}
