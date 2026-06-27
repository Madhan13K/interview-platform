package com.interview_platform_backend.interview_platform_backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * API Versioning v2 — Header-based versioning with sunset policy.
 *
 * Clients specify the API version via:
 *   - Header: X-API-Version: 2
 *   - Or URL path: /api/v2/...
 *   - Default: v1 (if no version specified)
 *
 * Sunset policy: deprecated versions return Sunset and Deprecation headers
 * per RFC 8594 (HTTP Sunset Header) and draft-ietf-httpapi-deprecation-header.
 */
@Configuration
public class ApiVersioningConfig {

    @Bean
    public FilterRegistrationBean<ApiVersionFilter> apiVersionFilter() {
        FilterRegistrationBean<ApiVersionFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new ApiVersionFilter());
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1);
        return registration;
    }

    public static class ApiVersionFilter extends OncePerRequestFilter {

        // Sunset schedule: version -> sunset date
        private static final Map<String, LocalDate> SUNSET_SCHEDULE = Map.of(
                "1", LocalDate.of(2027, 3, 1)  // v1 sunsets March 1, 2027
        );

        private static final String CURRENT_VERSION = "2";
        private static final String DEFAULT_VERSION = "1";

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {

            // Determine requested version
            String version = request.getHeader("X-API-Version");
            if (version == null || version.isBlank()) {
                // Check URL path: /api/v2/...
                String path = request.getRequestURI();
                if (path.contains("/api/v2/")) {
                    version = "2";
                } else {
                    version = DEFAULT_VERSION;
                }
            }

            // Set version in request attribute for controllers
            request.setAttribute("api.version", version);

            // Always return current version info
            response.setHeader("X-API-Version", version);
            response.setHeader("X-API-Latest-Version", CURRENT_VERSION);

            // Add sunset/deprecation headers for old versions
            LocalDate sunsetDate = SUNSET_SCHEDULE.get(version);
            if (sunsetDate != null) {
                response.setHeader("Sunset", sunsetDate.format(DateTimeFormatter.ISO_DATE));
                response.setHeader("Deprecation", "true");
                response.setHeader("Link", "</api/v2/>; rel=\"successor-version\"");

                // If past sunset date, reject with 410 Gone
                if (LocalDate.now().isAfter(sunsetDate)) {
                    response.setStatus(410);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"status\":410,\"error\":\"Gone\"," +
                            "\"message\":\"API v" + version + " has been retired. Use X-API-Version: " +
                            CURRENT_VERSION + " or migrate to /api/v2/ endpoints.\"," +
                            "\"successor\":\"/api/v2/\"}"
                    );
                    return;
                }
            }

            filterChain.doFilter(request, response);
        }
    }
}
