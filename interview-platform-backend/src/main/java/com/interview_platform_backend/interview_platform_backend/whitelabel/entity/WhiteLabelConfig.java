package com.interview_platform_backend.interview_platform_backend.whitelabel.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "white_label_configs")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class WhiteLabelConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false, unique = true)
    private UUID organizationId;

    @Column(name = "brand_name", nullable = false)
    private String brandName;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    @Column(name = "accent_color")
    private String accentColor;

    @Column(name = "custom_domain")
    private String customDomain;

    @Column(name = "email_from_name")
    private String emailFromName;

    @Column(name = "email_footer_html", columnDefinition = "TEXT")
    private String emailFooterHtml;

    @Column(name = "login_page_title")
    private String loginPageTitle;

    @Column(name = "login_page_subtitle")
    private String loginPageSubtitle;

    @Column(name = "dashboard_welcome_text")
    private String dashboardWelcomeText;

    @Column(name = "custom_css", columnDefinition = "TEXT")
    private String customCss;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
