package com.interview_platform_backend.interview_platform_backend.webauthn;

import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webauthn")
public class WebAuthnController {

    private final WebAuthnService webAuthnService;
    private final UserRepository userRepository;

    public WebAuthnController(WebAuthnService webAuthnService, UserRepository userRepository) {
        this.webAuthnService = webAuthnService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register/start")
    public ResponseEntity<WebAuthnRegistrationResponse> startRegistration(@RequestBody WebAuthnRegistrationRequest request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();
        WebAuthnRegistrationResponse response = webAuthnService.startRegistration(
                userId, user.getEmail(), user.getFirstName() + " " + user.getLastName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/finish")
    public ResponseEntity<Map<String, Object>> finishRegistration(@RequestBody WebAuthnRegistrationFinishRequest request) {
        UUID userId = getCurrentUserId();
        WebAuthnCredential credential = webAuthnService.finishRegistration(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", credential.getId(),
                "credentialName", credential.getCredentialName(),
                "authenticatorType", credential.getAuthenticatorType(),
                "createdAt", credential.getCreatedAt().toString()
        ));
    }

    @PostMapping("/authenticate/start")
    public ResponseEntity<Map<String, Object>> startAuthentication(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        Map<String, Object> options = webAuthnService.startAuthentication(email);
        return ResponseEntity.ok(options);
    }

    @PostMapping("/authenticate/finish")
    public ResponseEntity<Map<String, Object>> finishAuthentication(@RequestBody WebAuthnAuthenticationRequest request) {
        WebAuthnCredential credential = webAuthnService.finishAuthentication(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", credential.getUserId(),
                "credentialName", credential.getCredentialName()
        ));
    }

    @GetMapping("/credentials")
    public ResponseEntity<List<WebAuthnCredential>> getCredentials() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(webAuthnService.getUserCredentials(userId));
    }

    @DeleteMapping("/credentials/{credentialId}")
    public ResponseEntity<Void> deleteCredential(@PathVariable UUID credentialId) {
        UUID userId = getCurrentUserId();
        webAuthnService.deleteCredential(userId, credentialId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/credentials/{credentialId}/toggle")
    public ResponseEntity<WebAuthnCredential> toggleCredential(@PathVariable UUID credentialId, @RequestParam boolean enabled) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(webAuthnService.toggleCredential(userId, credentialId, enabled));
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
