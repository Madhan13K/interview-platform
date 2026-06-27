package com.interview_platform_backend.interview_platform_backend.eventsourcing.listener;

import com.interview_platform_backend.interview_platform_backend.event.FeedbackSubmittedEvent;
import com.interview_platform_backend.interview_platform_backend.event.InterviewCancelledEvent;
import com.interview_platform_backend.interview_platform_backend.event.InterviewRescheduledEvent;
import com.interview_platform_backend.interview_platform_backend.event.InterviewScheduledEvent;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.service.EventStoreService;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class InterviewEventSourcingListener {

    private static final Logger log = LoggerFactory.getLogger(InterviewEventSourcingListener.class);
    private static final String AGGREGATE_TYPE_INTERVIEW = "Interview";

    private final EventStoreService eventStoreService;
    private final UserRepository userRepository;

    @EventListener
    public void onInterviewScheduled(InterviewScheduledEvent event) {
        log.debug("Capturing InterviewScheduledEvent for interview [{}]", event.getInterviewId());

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("interviewId", event.getInterviewId());
        eventData.put("title", event.getTitle());
        eventData.put("candidateEmail", event.getCandidateEmail());
        eventData.put("candidateName", event.getCandidateName());
        eventData.put("interviewerEmails", event.getInterviewerEmails());
        eventData.put("startTime", event.getStartTime());
        eventData.put("endTime", event.getEndTime());
        eventData.put("scheduledByName", event.getScheduledByName());

        UUID userId = getCurrentUserId();
        eventStoreService.append(
                event.getInterviewId(),
                AGGREGATE_TYPE_INTERVIEW,
                "INTERVIEW_SCHEDULED",
                eventData,
                userId,
                null
        );
    }

    @EventListener
    public void onInterviewCancelled(InterviewCancelledEvent event) {
        log.debug("Capturing InterviewCancelledEvent for interview [{}]", event.getInterviewId());

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("interviewId", event.getInterviewId());
        eventData.put("reason", event.getReason());

        UUID userId = getCurrentUserId();
        eventStoreService.append(
                event.getInterviewId(),
                AGGREGATE_TYPE_INTERVIEW,
                "INTERVIEW_CANCELLED",
                eventData,
                userId,
                null
        );
    }

    @EventListener
    public void onInterviewRescheduled(InterviewRescheduledEvent event) {
        log.debug("Capturing InterviewRescheduledEvent for interview [{}]", event.getInterviewId());

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("interviewId", event.getInterviewId());
        eventData.put("newStartTime", event.getNewStartTime());
        eventData.put("newEndTime", event.getNewEndTime());

        UUID userId = getCurrentUserId();
        eventStoreService.append(
                event.getInterviewId(),
                AGGREGATE_TYPE_INTERVIEW,
                "INTERVIEW_RESCHEDULED",
                eventData,
                userId,
                null
        );
    }

    @EventListener
    public void onFeedbackSubmitted(FeedbackSubmittedEvent event) {
        log.debug("Capturing FeedbackSubmittedEvent for interview [{}]", event.getInterviewId());

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("interviewId", event.getInterviewId());
        eventData.put("interviewTitle", event.getInterviewTitle());
        eventData.put("interviewerName", event.getInterviewerName());
        eventData.put("interviewerEmail", event.getInterviewerEmail());
        eventData.put("candidateName", event.getCandidateName());
        eventData.put("rating", event.getRating());
        eventData.put("recommendation", event.getRecommendation());

        UUID userId = getCurrentUserId();
        eventStoreService.append(
                event.getInterviewId(),
                AGGREGATE_TYPE_INTERVIEW,
                "FEEDBACK_SUBMITTED",
                eventData,
                userId,
                null
        );
    }

    private UUID getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
                return userRepository.findByEmail(email)
                        .map(User::getId)
                        .orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not retrieve current user ID from security context: {}", e.getMessage());
        }
        return null;
    }
}
