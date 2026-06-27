package com.interview_platform_backend.interview_platform_backend.webauthn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, UUID> {
    List<WebAuthnCredential> findByUserId(UUID userId);
    Optional<WebAuthnCredential> findByCredentialId(String credentialId);
    boolean existsByUserIdAndEnabled(UUID userId, boolean enabled);
    long countByUserId(UUID userId);
    void deleteByUserIdAndId(UUID userId, UUID id);
}
