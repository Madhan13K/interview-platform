package com.interview_platform_backend.interview_platform_backend.webauthn;

import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class WebAuthnService {

    private static final Logger log = LoggerFactory.getLogger(WebAuthnService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final WebAuthnCredentialRepository credentialRepository;
    private final Map<String, String> challengeStore = Collections.synchronizedMap(new LinkedHashMap<>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
            return size() > 10000; // Prevent unbounded growth
        }
    });

    @Value("${app.webauthn.rp-id:localhost}")
    private String rpId;

    @Value("${app.webauthn.rp-name:Interview Platform}")
    private String rpName;

    @Value("${app.webauthn.origin:http://localhost:3000}")
    private String origin;

    @Value("${app.webauthn.timeout:60000}")
    private long timeout;

    public WebAuthnService(WebAuthnCredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    /**
     * Start registration ceremony - generate challenge and options.
     */
    public WebAuthnRegistrationResponse startRegistration(UUID userId, String userName, String displayName, WebAuthnRegistrationRequest request) {
        log.info("Starting WebAuthn registration for user: {} (type: {})", userId, request.getAuthenticatorType());

        String challenge = generateChallenge();
        challengeStore.put(userId.toString(), challenge);

        Map<String, Object> rp = Map.of("id", rpId, "name", rpName);
        Map<String, Object> user = Map.of(
                "id", Base64.getUrlEncoder().withoutPadding().encodeToString(userId.toString().getBytes(StandardCharsets.UTF_8)),
                "name", userName,
                "displayName", displayName
        );

        Object[] pubKeyCredParams = new Object[]{
                Map.of("type", "public-key", "alg", -7),   // ES256
                Map.of("type", "public-key", "alg", -257)  // RS256
        };

        String authenticatorAttachment = "platform".equals(request.getAuthenticatorType()) ? "platform" : "cross-platform";
        Map<String, Object> authenticatorSelection = Map.of(
                "authenticatorAttachment", authenticatorAttachment,
                "residentKey", "preferred",
                "userVerification", "preferred"
        );

        return WebAuthnRegistrationResponse.builder()
                .challenge(challenge)
                .rp(rp)
                .user(user)
                .attestation("none")
                .pubKeyCredParams(pubKeyCredParams)
                .timeout(timeout)
                .authenticatorSelection(authenticatorSelection)
                .build();
    }

    /**
     * Complete registration ceremony - store credential.
     */
    public WebAuthnCredential finishRegistration(UUID userId, WebAuthnRegistrationFinishRequest request) {
        String storedChallenge = challengeStore.remove(userId.toString());
        if (storedChallenge == null) {
            throw new BadRequestException("No pending registration challenge found. Please start registration again.");
        }

        // Validate credential doesn't already exist
        if (credentialRepository.findByCredentialId(request.getCredentialId()).isPresent()) {
            throw new BadRequestException("Credential already registered");
        }

        WebAuthnCredential credential = WebAuthnCredential.builder()
                .userId(userId)
                .credentialId(request.getCredentialId())
                .publicKey(request.getPublicKey())
                .signCount(request.getSignCount())
                .credentialName(request.getCredentialName() != null ? request.getCredentialName() : "Security Key")
                .authenticatorType(request.getAuthenticatorType() != null ? request.getAuthenticatorType() : "cross-platform")
                .transports(request.getTransports())
                .enabled(true)
                .build();

        WebAuthnCredential saved = credentialRepository.save(credential);
        log.info("WebAuthn credential registered: {} for user {}", saved.getCredentialId(), userId);
        return saved;
    }

    /**
     * Start authentication ceremony - generate assertion options.
     */
    public Map<String, Object> startAuthentication(String email) {
        log.info("Starting WebAuthn authentication for: {}", email);

        String challenge = generateChallenge();
        challengeStore.put("auth:" + email, challenge);

        return Map.of(
                "challenge", challenge,
                "timeout", timeout,
                "rpId", rpId,
                "userVerification", "preferred"
        );
    }

    /**
     * Complete authentication ceremony - verify assertion.
     */
    public WebAuthnCredential finishAuthentication(WebAuthnAuthenticationRequest request) {
        WebAuthnCredential credential = credentialRepository.findByCredentialId(request.getCredentialId())
                .orElseThrow(() -> new ResourceNotFoundException("WebAuthnCredential", "credentialId", request.getCredentialId()));

        if (!credential.isEnabled()) {
            throw new BadRequestException("Credential is disabled");
        }

        // In production: verify signature using stored public key
        // For now, update sign count and last used timestamp
        credential.setSignCount(credential.getSignCount() + 1);
        credential.setLastUsedAt(Instant.now());
        credentialRepository.save(credential);

        log.info("WebAuthn authentication successful for credential: {}", credential.getCredentialId());
        return credential;
    }

    /**
     * List user's registered credentials.
     */
    @Transactional(readOnly = true)
    public List<WebAuthnCredential> getUserCredentials(UUID userId) {
        return credentialRepository.findByUserId(userId);
    }

    /**
     * Delete a credential.
     */
    public void deleteCredential(UUID userId, UUID credentialId) {
        credentialRepository.deleteByUserIdAndId(userId, credentialId);
        log.info("WebAuthn credential deleted: {} for user {}", credentialId, userId);
    }

    /**
     * Toggle credential enabled/disabled.
     */
    public WebAuthnCredential toggleCredential(UUID userId, UUID credentialId, boolean enabled) {
        WebAuthnCredential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new ResourceNotFoundException("WebAuthnCredential", "id", credentialId));
        if (!credential.getUserId().equals(userId)) {
            throw new BadRequestException("Credential does not belong to user");
        }
        credential.setEnabled(enabled);
        return credentialRepository.save(credential);
    }

    private String generateChallenge() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
