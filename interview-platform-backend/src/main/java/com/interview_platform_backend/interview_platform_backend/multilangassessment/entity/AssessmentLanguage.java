package com.interview_platform_backend.interview_platform_backend.multilangassessment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessment_languages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentLanguage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String languageName;

    @Column(nullable = false, unique = true)
    private String languageCode;

    @Column(nullable = false)
    private String runtimeImage;

    @Column(nullable = false)
    private String fileExtension;

    private String compileCommand;

    @Column(nullable = false)
    private String runCommand;

    @Builder.Default
    private int timeoutSeconds = 30;

    @Builder.Default
    private int memoryLimitMb = 256;

    @Builder.Default
    private boolean enabled = true;

    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
