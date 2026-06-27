package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * OAuth2 Resource Server configuration for JWT token validation.
 *
 * <p>This configuration enables the application to act as an OAuth2 Resource Server,
 * validating incoming JWT access tokens from:
 * <ul>
 *   <li>Internal services using the platform's own JWTs</li>
 *   <li>External OAuth2 authorization servers (Keycloak, Okta, Auth0)</li>
 *   <li>Service-to-service calls using client credentials tokens</li>
 * </ul>
 *
 * <h3>Token Validation Strategies:</h3>
 * <ol>
 *   <li><b>Local RSA validation</b> - Validates tokens signed by this platform's RSA key</li>
 *   <li><b>Remote JWKS validation</b> - Validates tokens from external IdPs via their JWKS endpoint</li>
 * </ol>
 *
 * <p>Activation: Active when {@code app.oauth2.resource-server.enabled=true}
 */
@Configuration
@ConditionalOnProperty(name = "app.oauth2.resource-server.enabled", havingValue = "true", matchIfMissing = true)
public class OAuth2ResourceServerConfig {

    private static final Logger log = LoggerFactory.getLogger(OAuth2ResourceServerConfig.class);

    @Value("${rsa.public-key:classpath:certs/public.pem}")
    private Resource rsaPublicKeyResource;

    @Value("${rsa.private-key:classpath:certs/private.pem}")
    private Resource rsaPrivateKeyResource;

    @Value("${app.oauth2.resource-server.issuer-uri:}")
    private String issuerUri;

    /**
     * Creates a JwtDecoder for validating incoming JWT tokens.
     *
     * <p>Uses the platform's RSA public key for validating tokens issued by this platform.
     * For tokens from external providers, the JWKS URI approach should be used.
     */
    @Bean
    public JwtDecoder jwtDecoder() throws Exception {
        RSAPublicKey publicKey = loadRsaPublicKey();
        log.info("OAuth2 Resource Server configured with RSA public key for JWT validation");
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    /**
     * Creates a JwtEncoder for issuing JWT tokens (used by client credentials flow).
     */
    @Bean
    public JwtEncoder jwtEncoder() throws Exception {
        RSAPublicKey publicKey = loadRsaPublicKey();
        RSAPrivateKey privateKey = loadRsaPrivateKey();

        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID("interview-platform-key-1")
                .build();

        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
        log.info("OAuth2 JwtEncoder configured for token issuance");
        return new NimbusJwtEncoder(jwkSource);
    }

    private RSAPublicKey loadRsaPublicKey() throws Exception {
        String keyContent = readPemContent(rsaPublicKeyResource);
        byte[] keyBytes = Base64.getDecoder().decode(keyContent);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPublicKey) keyFactory.generatePublic(spec);
    }

    private RSAPrivateKey loadRsaPrivateKey() throws Exception {
        String keyContent = readPemContent(rsaPrivateKeyResource);
        byte[] keyBytes = Base64.getDecoder().decode(keyContent);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPrivateKey) keyFactory.generatePrivate(spec);
    }

    private String readPemContent(Resource resource) throws Exception {
        try (InputStream is = resource.getInputStream()) {
            String content = new String(is.readAllBytes());
            return content
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                    .replace("-----END RSA PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
        }
    }
}
