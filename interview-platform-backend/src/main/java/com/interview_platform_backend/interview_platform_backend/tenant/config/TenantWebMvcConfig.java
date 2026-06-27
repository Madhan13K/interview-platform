package com.interview_platform_backend.interview_platform_backend.tenant.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@ConditionalOnProperty(name = "app.multitenancy.schema-per-tenant", havingValue = "true", matchIfMissing = false)
public class TenantWebMvcConfig implements WebMvcConfigurer {

    private final TenantSchemaInterceptor tenantSchemaInterceptor;

    public TenantWebMvcConfig(TenantSchemaInterceptor tenantSchemaInterceptor) {
        this.tenantSchemaInterceptor = tenantSchemaInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantSchemaInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/v1/auth/**", "/api/v1/sso/**", "/actuator/**");
    }
}
