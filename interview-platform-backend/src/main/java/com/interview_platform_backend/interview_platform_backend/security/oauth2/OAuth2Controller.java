package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/oauth2")
public class OAuth2Controller {

    @Value("${app.sso.keycloak.enabled:true}")
    private boolean keycloakEnabled;

    @GetMapping("/providers")
    public ResponseEntity<Map<String, String>> providers() {
        Map<String, String> providerMap = new LinkedHashMap<>();
        providerMap.put("google", "/oauth2/authorization/google");
        providerMap.put("github", "/oauth2/authorization/github");
        providerMap.put("microsoft", "/oauth2/authorization/microsoft");
        providerMap.put("okta", "/oauth2/authorization/okta");
        if (keycloakEnabled) {
            providerMap.put("keycloak", "/oauth2/authorization/keycloak");
        }
        return ResponseEntity.ok(providerMap);
    }

    /**
     * Returns SSO login URL using Okta OIDC as primary provider
     * with Keycloak as fallback (handled automatically by OAuth2FailureHandler).
     */
    @GetMapping("/sso")
    public ResponseEntity<Map<String, Object>> ssoProviders() {
        Map<String, Object> sso = new LinkedHashMap<>();
        sso.put("primary", Map.of(
                "provider", "okta",
                "name", "Okta (OpenID Connect)",
                "loginUrl", "/oauth2/authorization/okta"
        ));
        if (keycloakEnabled) {
            sso.put("fallback", Map.of(
                    "provider", "keycloak",
                    "name", "Keycloak (Fallback)",
                    "loginUrl", "/oauth2/authorization/keycloak"
            ));
        }
        sso.put("note", "If Okta is unreachable, the system automatically falls back to Keycloak.");
        return ResponseEntity.ok(sso);
    }
}
