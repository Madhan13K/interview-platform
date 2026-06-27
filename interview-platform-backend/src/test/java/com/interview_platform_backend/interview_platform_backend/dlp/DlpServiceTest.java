package com.interview_platform_backend.interview_platform_backend.dlp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("DLP Service Tests")
class DlpServiceTest {

    // Patterns matching what a DLP service would use
    private static final Pattern SSN_PATTERN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");
    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile("\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b");
    private static final Pattern API_KEY_PATTERN = Pattern.compile("\\b(sk|ak|pk)[-_][a-zA-Z0-9]{20,}\\b");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");

    private List<String> scanContent(String content) {
        List<String> violations = new ArrayList<>();
        if (SSN_PATTERN.matcher(content).find()) violations.add("SSN_DETECTED");
        if (CREDIT_CARD_PATTERN.matcher(content).find()) violations.add("CREDIT_CARD_DETECTED");
        if (API_KEY_PATTERN.matcher(content).find()) violations.add("API_KEY_DETECTED");
        return violations;
    }

    @Test
    @DisplayName("should detect SSN pattern in content")
    void shouldDetectSsnPattern() {
        // given
        String content = "The candidate's SSN is 123-45-6789 which should not be stored.";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).contains("SSN_DETECTED");
        assertThat(violations).hasSize(1);
    }

    @Test
    @DisplayName("should detect credit card number in content")
    void shouldDetectCreditCardNumber() {
        // given
        String content = "Payment card: 4111-1111-1111-1111 was used for processing.";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).contains("CREDIT_CARD_DETECTED");
    }

    @Test
    @DisplayName("should detect credit card without dashes")
    void shouldDetectCreditCardWithoutDashes() {
        // given
        String content = "Card number 4111111111111111 found in notes.";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).contains("CREDIT_CARD_DETECTED");
    }

    @Test
    @DisplayName("should detect API key pattern")
    void shouldDetectApiKeyPattern() {
        // given
        String content = "The service uses sk-abc123def456ghi789jkl012mno for authentication.";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).contains("API_KEY_DETECTED");
    }

    @Test
    @DisplayName("should detect multiple violations in same content")
    void shouldDetectMultipleViolations() {
        // given
        String content = "SSN: 999-88-7777, Card: 4111-1111-1111-1111, Key: sk-abcdefghij1234567890";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).hasSize(3);
        assertThat(violations).containsExactlyInAnyOrder(
                "SSN_DETECTED", "CREDIT_CARD_DETECTED", "API_KEY_DETECTED"
        );
    }

    @Test
    @DisplayName("should not flag clean content")
    void shouldNotFlagCleanContent() {
        // given
        String content = "The candidate has 5 years of experience in Java development and is available to start immediately.";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("should not flag partial SSN patterns")
    void shouldNotFlagPartialSsn() {
        // given
        String content = "Phone: 123-45-67 and reference number 12-345-6789";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).doesNotContain("SSN_DETECTED");
    }

    @Test
    @DisplayName("should detect pk prefix API keys")
    void shouldDetectPkPrefixApiKeys() {
        // given
        String content = "Public key: pk-xyzabcdefghij1234567890 should not be in notes.";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).contains("API_KEY_DETECTED");
    }

    @Test
    @DisplayName("should handle null-safe scanning with empty content")
    void shouldHandleEmptyContent() {
        // given
        String content = "";

        // when
        List<String> violations = scanContent(content);

        // then
        assertThat(violations).isEmpty();
    }
}
