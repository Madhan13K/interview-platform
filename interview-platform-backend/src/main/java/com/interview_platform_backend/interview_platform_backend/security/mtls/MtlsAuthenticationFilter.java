package com.interview_platform_backend.interview_platform_backend.security.mtls;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.cert.X509Certificate;
import java.util.List;

/**
 * Security filter that authenticates requests using X.509 client certificates (mTLS).
 *
 * <p>This filter extracts the client certificate from the TLS handshake
 * (available via the {@code jakarta.servlet.request.X509Certificate} request attribute),
 * validates it against configured policies, and establishes a Spring Security
 * authentication context.
 *
 * <p>When mTLS is active, this filter runs BEFORE the JWT filter, allowing
 * service-to-service calls to authenticate via certificate without needing a JWT token.
 *
 * <p>Activation: Only active when {@code app.mtls.enabled=true}
 *
 * <h3>Request Flow:</h3>
 * <pre>
 * Client ──(mTLS handshake)──► Tomcat validates cert chain
 *                                    │
 *                              MtlsAuthenticationFilter
 *                                    │
 *                              ├─ Extracts X509Certificate from request attribute
 *                              ├─ Validates against policies (CN patterns, org, expiry)
 *                              ├─ Sets SecurityContext with certificate identity
 *                              └─ Continues filter chain
 * </pre>
 */
@Component
@Order(1) // Run before JWT filter
@ConditionalOnProperty(name = "app.mtls.enabled", havingValue = "true")
public class MtlsAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(MtlsAuthenticationFilter.class);
    private static final String X509_CERT_ATTRIBUTE = "jakarta.servlet.request.X509Certificate";

    private final CertificateValidationService validationService;
    private final MtlsProperties mtlsProperties;

    public MtlsAuthenticationFilter(CertificateValidationService validationService,
                                    MtlsProperties mtlsProperties) {
        this.validationService = validationService;
        this.mtlsProperties = mtlsProperties;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Skip if already authenticated (e.g., by JWT filter in optional mTLS mode)
        if (SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip public endpoints
        if (isPublicEndpoint(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract client certificate from the TLS handshake
        X509Certificate[] certificates = (X509Certificate[]) request.getAttribute(X509_CERT_ATTRIBUTE);

        if (certificates == null || certificates.length == 0) {
            log.debug("No client certificate found in request to {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        // The first certificate in the array is the client's certificate
        X509Certificate clientCert = certificates[0];

        try {
            // Validate the certificate against our policies
            CertificateValidationService.CertificateValidationResult result =
                    validationService.validate(clientCert);

            // Create authentication token with the certificate identity
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_MTLS_CLIENT"),
                    new SimpleGrantedAuthority("ROLE_SERVICE")
            );

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    result.identity(),  // principal = extracted identity (CN, SAN, etc.)
                    clientCert,         // credentials = the certificate itself
                    authorities
            );

            // Attach additional details (remote IP, session ID, etc.)
            authToken.setDetails(new MtlsAuthenticationDetails(
                    request,
                    result.identity(),
                    result.organization(),
                    result.organizationalUnit(),
                    result.serialNumber(),
                    result.expiresAt()
            ));

            SecurityContextHolder.getContext().setAuthentication(authToken);

            log.info("mTLS authentication successful. Identity: {}, Org: {}, Remote: {}",
                    result.identity(),
                    result.organization(),
                    request.getRemoteAddr());

        } catch (CertificateIdentityException e) {
            log.warn("mTLS authentication failed for {}: {}", request.getRemoteAddr(), e.getMessage());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Certificate Authentication Failed\",\"message\":\"" +
                            e.getMessage().replace("\"", "'") + "\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String uri) {
        return mtlsProperties.getPublicEndpoints().stream()
                .anyMatch(uri::startsWith);
    }
}
