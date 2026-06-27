package com.interview_platform_backend.interview_platform_backend.livetranscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptionEvent {

    private UUID sessionId;

    private TranscriptionEventType type;

    private String text;

    private String speaker;

    private double confidence;

    private long startTimeMs;

    private long endTimeMs;

    private boolean isFinal;

    public enum TranscriptionEventType {
        TRANSCRIPT_PARTIAL,
        TRANSCRIPT_FINAL,
        SPEAKER_CHANGE,
        ERROR,
        SESSION_END
    }
}
