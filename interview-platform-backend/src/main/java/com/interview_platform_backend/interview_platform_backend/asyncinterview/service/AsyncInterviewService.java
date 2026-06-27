package com.interview_platform_backend.interview_platform_backend.asyncinterview.service;

import com.interview_platform_backend.interview_platform_backend.asyncinterview.dto.*;
import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.*;
import com.interview_platform_backend.interview_platform_backend.asyncinterview.repository.*;
import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.exception.ResourceNotFoundException;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@Transactional
public class AsyncInterviewService {

    private final AsyncInterviewRepository asyncInterviewRepository;
    private final AsyncInterviewQuestionRepository questionRepository;
    private final AsyncInterviewInvitationRepository invitationRepository;
    private final AsyncInterviewResponseRepository responseRepository;
    private final AsyncInterviewReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public AsyncInterviewService(AsyncInterviewRepository asyncInterviewRepository,
                                 AsyncInterviewQuestionRepository questionRepository,
                                 AsyncInterviewInvitationRepository invitationRepository,
                                 AsyncInterviewResponseRepository responseRepository,
                                 AsyncInterviewReviewRepository reviewRepository,
                                 UserRepository userRepository) {
        this.asyncInterviewRepository = asyncInterviewRepository;
        this.questionRepository = questionRepository;
        this.invitationRepository = invitationRepository;
        this.responseRepository = responseRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    // ==================== Interview Management ====================

    public AsyncInterviewResponseDto createAsyncInterview(AsyncInterviewRequest request, UUID userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        AsyncInterview interview = AsyncInterview.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(creator)
                .deadline(request.getDeadline())
                .maxResponseTime(request.getMaxResponseTime() != null ? request.getMaxResponseTime() : 120)
                .maxRetakes(request.getMaxRetakes() != null ? request.getMaxRetakes() : 3)
                .status("DRAFT")
                .build();

        AsyncInterview savedInterview = asyncInterviewRepository.save(interview);

        // Create questions
        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            List<AsyncInterviewQuestion> questions = IntStream.range(0, request.getQuestions().size())
                    .mapToObj(i -> {
                        AsyncInterviewRequest.QuestionItem item = request.getQuestions().get(i);
                        return AsyncInterviewQuestion.builder()
                                .asyncInterview(savedInterview)
                                .questionText(item.getQuestionText())
                                .questionOrder(i + 1)
                                .thinkingTime(item.getThinkingTime() != null ? item.getThinkingTime() : 30)
                                .maxResponseTime(item.getMaxResponseTime() != null ? item.getMaxResponseTime() : savedInterview.getMaxResponseTime())
                                .required(item.getRequired() != null ? item.getRequired() : true)
                                .build();
                    })
                    .toList();
            questionRepository.saveAll(questions);
        }

        return toResponseDto(savedInterview);
    }

    public AsyncInterviewResponseDto publishInterview(UUID interviewId) {
        AsyncInterview interview = asyncInterviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("AsyncInterview", "id", interviewId));

        if (!"DRAFT".equals(interview.getStatus())) {
            throw new BadRequestException("Interview can only be published from DRAFT status");
        }

        interview.setStatus("PUBLISHED");
        AsyncInterview saved = asyncInterviewRepository.save(interview);
        return toResponseDto(saved);
    }

    public AsyncInterviewResponseDto closeInterview(UUID interviewId) {
        AsyncInterview interview = asyncInterviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("AsyncInterview", "id", interviewId));

        if (!"PUBLISHED".equals(interview.getStatus())) {
            throw new BadRequestException("Only published interviews can be closed");
        }

        interview.setStatus("CLOSED");
        AsyncInterview saved = asyncInterviewRepository.save(interview);
        return toResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public AsyncInterviewResponseDto getInterview(UUID interviewId) {
        AsyncInterview interview = asyncInterviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("AsyncInterview", "id", interviewId));
        return toResponseDto(interview);
    }

    @Transactional(readOnly = true)
    public List<AsyncInterviewResponseDto> getInterviewsByOrg(UUID organizationId) {
        return asyncInterviewRepository.findByOrganizationId(organizationId).stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AsyncInterviewResponseDto> getInterviewsByStatus(String status) {
        return asyncInterviewRepository.findByStatus(status).stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AsyncInterviewResponseDto> getInterviewsByCreator(UUID userId) {
        return asyncInterviewRepository.findByCreatedById(userId).stream()
                .map(this::toResponseDto)
                .toList();
    }

    // ==================== Invitation Management ====================

    public AsyncInterviewInvitation inviteCandidate(UUID interviewId, String candidateEmail, UUID inviterId) {
        AsyncInterview interview = asyncInterviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("AsyncInterview", "id", interviewId));

        if (!"PUBLISHED".equals(interview.getStatus())) {
            throw new BadRequestException("Candidates can only be invited to published interviews");
        }

        User candidate = userRepository.findByEmail(candidateEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", candidateEmail));

        String token = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();

        AsyncInterviewInvitation invitation = AsyncInterviewInvitation.builder()
                .asyncInterview(interview)
                .candidate(candidate)
                .candidateEmail(candidateEmail)
                .status("INVITED")
                .inviteToken(token)
                .build();

        return invitationRepository.save(invitation);
    }

    // ==================== Candidate Flow ====================

    @Transactional(readOnly = true)
    public AsyncInterviewResponseDto getInterviewByToken(String inviteToken) {
        AsyncInterviewInvitation invitation = invitationRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", inviteToken));

        return toResponseDto(invitation.getAsyncInterview());
    }

    public void startInterview(String inviteToken) {
        AsyncInterviewInvitation invitation = invitationRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", inviteToken));

        if (!"INVITED".equals(invitation.getStatus())) {
            throw new BadRequestException("Interview has already been started or completed");
        }

        invitation.setStatus("STARTED");
        invitation.setStartedAt(Instant.now());
        invitationRepository.save(invitation);
    }

    public AsyncInterviewResponse submitResponse(String inviteToken, UUID questionId, String videoS3Key, Integer durationSeconds) {
        AsyncInterviewInvitation invitation = invitationRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", inviteToken));

        if (!"STARTED".equals(invitation.getStatus())) {
            throw new BadRequestException("Interview must be started before submitting responses");
        }

        AsyncInterviewQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        // Check retake limit
        List<AsyncInterviewResponse> existingResponses = responseRepository
                .findByInvitationIdAndQuestionId(invitation.getId(), questionId);

        int retakeNumber = existingResponses.size() + 1;
        int maxRetakes = invitation.getAsyncInterview().getMaxRetakes();

        if (retakeNumber > maxRetakes) {
            throw new BadRequestException("Maximum retakes (" + maxRetakes + ") exceeded for this question");
        }

        AsyncInterviewResponse response = AsyncInterviewResponse.builder()
                .invitation(invitation)
                .question(question)
                .videoS3Key(videoS3Key)
                .durationSeconds(durationSeconds)
                .retakeNumber(retakeNumber)
                .build();

        return responseRepository.save(response);
    }

    public void completeInterview(String inviteToken) {
        AsyncInterviewInvitation invitation = invitationRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", inviteToken));

        if (!"STARTED".equals(invitation.getStatus())) {
            throw new BadRequestException("Interview must be in STARTED status to complete");
        }

        invitation.setStatus("COMPLETED");
        invitation.setCompletedAt(Instant.now());
        invitationRepository.save(invitation);
    }

    // ==================== Review Flow ====================

    @Transactional(readOnly = true)
    public List<AsyncInterviewResponse> getInterviewResponses(UUID invitationId) {
        if (!invitationRepository.existsById(invitationId)) {
            throw new ResourceNotFoundException("Invitation", "id", invitationId);
        }
        return responseRepository.findByInvitationId(invitationId);
    }

    public AsyncInterviewReview submitReview(UUID invitationId, UUID reviewerId, SubmitReviewRequest request) {
        AsyncInterviewInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", invitationId));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reviewerId));

        AsyncInterviewReview review = AsyncInterviewReview.builder()
                .invitation(invitation)
                .reviewer(reviewer)
                .overallRating(request.getOverallRating())
                .notes(request.getNotes())
                .decision(request.getDecision())
                .build();

        return reviewRepository.save(review);
    }

    // ==================== Helpers ====================

    private AsyncInterviewResponseDto toResponseDto(AsyncInterview interview) {
        List<AsyncInterviewQuestion> questions = questionRepository
                .findByAsyncInterviewIdOrderByQuestionOrder(interview.getId());
        List<AsyncInterviewInvitation> invitations = invitationRepository
                .findByAsyncInterviewId(interview.getId());

        User creator = interview.getCreatedBy();
        String creatorName = creator != null ? creator.getFirstName() + " " + creator.getLastName() : null;

        List<AsyncInterviewResponseDto.QuestionDto> questionDtos = questions.stream()
                .map(q -> AsyncInterviewResponseDto.QuestionDto.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .questionOrder(q.getQuestionOrder())
                        .thinkingTime(q.getThinkingTime())
                        .maxResponseTime(q.getMaxResponseTime())
                        .required(q.getRequired())
                        .build())
                .toList();

        return AsyncInterviewResponseDto.builder()
                .id(interview.getId())
                .title(interview.getTitle())
                .description(interview.getDescription())
                .organizationId(interview.getOrganizationId())
                .createdById(creator != null ? creator.getId() : null)
                .createdByName(creatorName)
                .deadline(interview.getDeadline())
                .maxResponseTime(interview.getMaxResponseTime())
                .maxRetakes(interview.getMaxRetakes())
                .status(interview.getStatus())
                .createdAt(interview.getCreatedAt())
                .updatedAt(interview.getUpdatedAt())
                .questionCount(questions.size())
                .invitationCount(invitations.size())
                .questions(questionDtos)
                .build();
    }
}
