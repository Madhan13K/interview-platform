package com.interview_platform_backend.interview_platform_backend.offernegotiation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "offer_negotiations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferNegotiation {

    public enum Status {
        INITIAL, COUNTER_OFFERED, NEGOTIATING, ACCEPTED, DECLINED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID offerId;

    @Column(nullable = false)
    private UUID candidateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String currentOffer;

    @Column(columnDefinition = "TEXT")
    private String counterOffer;

    @Builder.Default
    private int rounds = 0;

    @Column(columnDefinition = "TEXT")
    private String competingOffers;

    @Column(columnDefinition = "TEXT")
    private String aiSuggestion;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = Status.INITIAL;
        }
    }
}
