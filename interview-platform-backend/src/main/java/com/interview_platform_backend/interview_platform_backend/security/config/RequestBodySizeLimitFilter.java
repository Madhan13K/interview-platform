package com.interview_platform_backend.interview_platform_backend.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Limits the size of non-multipart request bodies to prevent DoS attacks
 * via excessively large JSON payloads.
 *
 * Multipart uploads are already limited by spring.servlet.multipart.max-file-size.
 * This filter covers regular JSON/form POST/PUT/PATCH requests.
 */
@Component
public class RequestBodySizeLimitFilter extends OncePerRequestFilter {

    @Value("${app.security.max-request-body-size:2097152}") // 2MB default
    private long maxRequestBodySize;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Only check requests that have a body (POST, PUT, PATCH)
        String method = request.getMethod();
        if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {

            // Skip multipart requests (handled by Spring's multipart config)
            String contentType = request.getContentType();
            if (contentType != null && contentType.toLowerCase().contains("multipart")) {
                filterChain.doFilter(request, response);
                return;
            }

            // Check Content-Length header
            long contentLength = request.getContentLengthLong();
            if (contentLength > maxRequestBodySize) {
                response.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value());
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"status\":413,\"error\":\"Payload Too Large\"," +
                        "\"message\":\"Request body exceeds maximum allowed size of " +
                        (maxRequestBodySize / 1024 / 1024) + "MB\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
