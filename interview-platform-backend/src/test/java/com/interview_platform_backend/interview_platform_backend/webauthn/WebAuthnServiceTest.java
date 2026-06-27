package com.interview_platform_backend.interview_platform_backend.webauthn;

import com.interview_platform_backend.interview_platform_backend.webauthn.WebAuthnCredential;
import com.interview_platform_backend.interview_platform_backend.webauthn.WebAuthnCredentialRepository;
import com.interview_platform_backend.interview_platform_backend.webauthn.WebAuthnService;
import com.interview_platform_backend.interview_platform_backend.webauthn.WebAuthnRegistrationRequest;
import com.interview_platform_backend.interview_platform_backend.webauthn.WebAuthnRegistrationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WebAuthn Service Tests")
class WebAuthnServiceTest {

    @Mock private WebAuthnCredentialRepository credentialRepository;
    @InjectMocks private WebAuthnService webAuthnService;

    @Test
    @DisplayName("should start registration with challenge")
    void startRegistration() {
        ReflectionTestUtils.setField(webAuthnService, "rpId", "localhost");
        ReflectionTestUtils.setField(webAuthnService, "rpName", "Interview Platform");
        ReflectionTestUtils.setField(webAuthnService, "timeout", 60000L);

        WebAuthnRegistrationRequest request = new WebAuthnRegistrationRequest();
        request.setAuthenticatorType("platform");

        WebAuthnRegistrationResponse response = webAuthnService.startRegistration(
            UUID.randomUUID(), "test@example.com", "Test User", request);

        assertThat(response).isNotNull();
        assertThat(response.getChallenge()).isNotBlank();
        assertThat(response.getRp()).containsEntry("id", "localhost");
        assertThat(response.getTimeout()).isEqualTo(60000L);
    }

    @Test
    @DisplayName("should list user credentials")
    void getUserCredentials() {
        UUID userId = UUID.randomUUID();
        when(credentialRepository.findByUserId(userId)).thenReturn(List.of(
            WebAuthnCredential.builder().credentialName("YubiKey").build(),
            WebAuthnCredential.builder().credentialName("Touch ID").build()
        ));

        List<WebAuthnCredential> creds = webAuthnService.getUserCredentials(userId);

        assertThat(creds).hasSize(2);
    }

    @Test
    @DisplayName("should delete credential")
    void deleteCredential() {
        UUID userId = UUID.randomUUID();
        UUID credId = UUID.randomUUID();

        webAuthnService.deleteCredential(userId, credId);

        verify(credentialRepository).deleteByUserIdAndId(userId, credId);
    }
}
