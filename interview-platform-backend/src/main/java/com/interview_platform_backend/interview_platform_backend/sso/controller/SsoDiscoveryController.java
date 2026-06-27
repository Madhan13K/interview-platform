package com.interview_platform_backend.interview_platform_backend.sso.controller;

import com.interview_platform_backend.interview_platform_backend.sso.dto.SsoDiscoveryResponse;
import com.interview_platform_backend.interview_platform_backend.sso.entity.TenantDomain;
import com.interview_platform_backend.interview_platform_backend.sso.repository.TenantDomainRepository;
import com.interview_platform_backend.interview_platform_backend.sso.service.SsoDiscoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/sso")
@Tag(name = "SSO Discovery", description = "Email-based SSO identity provider discovery. " +
        "The frontend calls this endpoint to determine whether to show email/password or redirect to an IdP.")
public class SsoDiscoveryController {

    private final SsoDiscoveryService ssoDiscoveryService;
    private final TenantDomainRepository tenantDomainRepository;

    public SsoDiscoveryController(SsoDiscoveryService ssoDiscoveryService,
                                  TenantDomainRepository tenantDomainRepository) {
        this.ssoDiscoveryService = ssoDiscoveryService;
        this.tenantDomainRepository = tenantDomainRepository;
    }

    @Operation(
            summary = "Discover SSO provider for an email",
            description = "Given a user's email address, determines if their organization has SSO configured. " +
                    "If SSO is enabled, returns the login URL to redirect the user to their identity provider. " +
                    "If not, the frontend should show the standard email/password form.\n\n" +
                    "**Frontend flow:**\n" +
                    "1. User enters email\n" +
                    "2. Frontend calls this endpoint\n" +
                    "3. If `ssoEnabled=true` → redirect to `ssoLoginUrl`\n" +
                    "4. If `ssoEnabled=false` → show password field"
    )
    @ApiResponse(responseCode = "200", description = "Discovery result (always 200, check ssoEnabled flag)")
    @GetMapping("/discover")
    public ResponseEntity<SsoDiscoveryResponse> discover(
            @Parameter(description = "User's email address", example = "user@acme.com")
            @RequestParam @NotBlank String email) {
        return ResponseEntity.ok(ssoDiscoveryService.discover(email));
    }

    @Operation(
            summary = "Discover SSO provider by organization slug",
            description = "Given an organization slug (subdomain), returns the SSO configuration. " +
                    "Used for subdomain-based SSO detection (e.g., acme.interview-platform.com → slug='acme').\n\n" +
                    "**Frontend flow:**\n" +
                    "1. Middleware detects subdomain from URL\n" +
                    "2. Passes slug as `?org=acme` query param to login page\n" +
                    "3. Login page calls this endpoint\n" +
                    "4. If SSO found → auto-redirect to IdP"
    )
    @ApiResponse(responseCode = "200", description = "Discovery result")
    @GetMapping("/discover/org")
    public ResponseEntity<SsoDiscoveryResponse> discoverByOrg(
            @Parameter(description = "Organization slug/subdomain", example = "acme")
            @RequestParam @NotBlank String slug) {
        return ResponseEntity.ok(ssoDiscoveryService.discoverBySlug(slug));
    }

    // --- Admin endpoints for managing tenant domain mappings ---

    @Operation(summary = "Register a domain for a tenant",
            description = "Maps an email domain to a tenant so that users with that domain are redirected to the tenant's SSO provider.")
    @PostMapping("/domains")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TenantDomain> registerDomain(
            @RequestParam UUID tenantId,
            @RequestParam String domain,
            @RequestParam(defaultValue = "false") boolean verified) {
        TenantDomain tenantDomain = TenantDomain.builder()
                .tenantId(tenantId)
                .domain(domain.toLowerCase().trim())
                .verified(verified)
                .primaryDomain(false)
                .build();
        return ResponseEntity.ok(tenantDomainRepository.save(tenantDomain));
    }

    @Operation(summary = "List domains for a tenant")
    @GetMapping("/domains/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TenantDomain>> getDomainsForTenant(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(tenantDomainRepository.findByTenantId(tenantId));
    }

    @Operation(summary = "Delete a domain mapping")
    @DeleteMapping("/domains/{domainId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDomain(@PathVariable UUID domainId) {
        tenantDomainRepository.deleteById(domainId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Verify a domain",
            description = "Marks a domain as verified. Only verified domains trigger SSO redirect.")
    @PatchMapping("/domains/{domainId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TenantDomain> verifyDomain(@PathVariable UUID domainId) {
        TenantDomain domain = tenantDomainRepository.findById(domainId)
                .orElseThrow(() -> new RuntimeException("Domain not found"));
        domain.setVerified(true);
        return ResponseEntity.ok(tenantDomainRepository.save(domain));
    }
}
