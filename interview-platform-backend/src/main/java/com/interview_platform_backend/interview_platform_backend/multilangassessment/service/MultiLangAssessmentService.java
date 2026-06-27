package com.interview_platform_backend.interview_platform_backend.multilangassessment.service;

import com.interview_platform_backend.interview_platform_backend.multilangassessment.entity.AssessmentLanguage;
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
public class MultiLangAssessmentService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<AssessmentLanguage> getSupportedLanguages() {
        log.info("Fetching all supported assessment languages");
        TypedQuery<AssessmentLanguage> query = entityManager.createQuery(
                "SELECT al FROM AssessmentLanguage al WHERE al.enabled = true ORDER BY al.languageName",
                AssessmentLanguage.class);
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public AssessmentLanguage getLanguageConfig(String code) {
        log.info("Fetching language config for code: {}", code);
        TypedQuery<AssessmentLanguage> query = entityManager.createQuery(
                "SELECT al FROM AssessmentLanguage al WHERE al.languageCode = :code",
                AssessmentLanguage.class);
        query.setParameter("code", code);
        List<AssessmentLanguage> results = query.getResultList();
        if (results.isEmpty()) {
            throw new IllegalArgumentException("Unsupported language: " + code);
        }
        return results.get(0);
    }

    public Map<String, Object> validateSubmission(String code, String language) {
        log.info("Validating submission for language: {}", language);
        Map<String, Object> result = new HashMap<>();
        AssessmentLanguage config = getLanguageConfig(language);

        result.put("language", config.getLanguageName());
        result.put("languageCode", config.getLanguageCode());

        if (code == null || code.isBlank()) {
            result.put("valid", false);
            result.put("error", "Code submission cannot be empty");
            return result;
        }

        if (!config.isEnabled()) {
            result.put("valid", false);
            result.put("error", "Language " + language + " is currently disabled");
            return result;
        }

        result.put("valid", true);
        result.put("fileExtension", config.getFileExtension());
        result.put("requiresCompilation", config.getCompileCommand() != null);
        return result;
    }

    public Map<String, Object> executeCode(String code, String language, String input) {
        log.info("Executing code in language: {}", language);
        AssessmentLanguage config = getLanguageConfig(language);

        Map<String, Object> result = new HashMap<>();
        result.put("language", config.getLanguageName());
        result.put("languageCode", config.getLanguageCode());
        result.put("runtimeImage", config.getRuntimeImage());
        result.put("timeoutSeconds", config.getTimeoutSeconds());
        result.put("memoryLimitMb", config.getMemoryLimitMb());

        // Delegate to code execution engine (placeholder)
        result.put("status", "QUEUED");
        result.put("message", "Code execution queued. Results will be available via callback.");
        result.put("compileCommand", config.getCompileCommand());
        result.put("runCommand", config.getRunCommand());

        return result;
    }
}
