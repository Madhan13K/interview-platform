package com.interview_platform_backend.interview_platform_backend.asyncinterview.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InviteCandidateRequest {

    @NotBlank(message = "Candidate email is required")
    @Email(message = "Invalid email format")
    private String candidateEmail;
}
