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
public class TranscriptionConfig {

    private UUID interviewId;

    @Builder.Default
    private String provider = "deepgram";

    @Builder.Default
    private String language = "en";

    @Builder.Default
    private boolean enableSpeakerDiarization = true;

    @Builder.Default
    private boolean enablePunctuation = true;

    @Builder.Default
    private String model = "nova-2";
}
