package com.interview_platform_backend.interview_platform_backend.talentcommunity.service;

import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.CommunityEvent;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.TalentCommunityMember;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.TalentCommunityMember.Source;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.repository.CommunityEventRepository;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.repository.TalentCommunityMemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TalentCommunityService {

    private static final Logger log = LoggerFactory.getLogger(TalentCommunityService.class);

    private final TalentCommunityMemberRepository memberRepository;
    private final CommunityEventRepository eventRepository;

    @Transactional
    public TalentCommunityMember joinCommunity(String email, String firstName, String lastName,
                                                String interests, String source) {
        log.info("New member joining community: [{}] from source [{}]", email, source);

        if (memberRepository.findByEmail(email).isPresent()) {
            log.warn("Member with email [{}] already exists", email);
            throw new IllegalArgumentException("Email already registered: " + email);
        }

        Source memberSource;
        try {
            memberSource = Source.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            memberSource = Source.WEBSITE;
        }

        TalentCommunityMember member = TalentCommunityMember.builder()
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .interests(interests)
                .source(memberSource)
                .subscribed(true)
                .engagementScore(1.0)
                .joinedAt(Instant.now())
                .lastActiveAt(Instant.now())
                .build();

        TalentCommunityMember saved = memberRepository.save(member);
        log.info("Member [{}] joined the talent community", saved.getId());
        return saved;
    }

    @Transactional
    public CommunityEvent createEvent(CommunityEvent event) {
        log.info("Creating community event: [{}] of type [{}]", event.getTitle(), event.getEventType());
        event.setCreatedAt(Instant.now());
        CommunityEvent saved = eventRepository.save(event);
        log.info("Community event [{}] created", saved.getId());
        return saved;
    }

    @Transactional
    public Map<String, Object> registerForEvent(UUID memberId, UUID eventId) {
        log.info("Member [{}] registering for event [{}]", memberId, eventId);

        TalentCommunityMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        CommunityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));

        event.setRegistrationCount(event.getRegistrationCount() + 1);
        eventRepository.save(event);

        member.setLastActiveAt(Instant.now());
        member.setEngagementScore(member.getEngagementScore() + 5.0);
        memberRepository.save(member);

        return Map.of(
                "memberId", memberId,
                "eventId", eventId,
                "eventTitle", event.getTitle(),
                "status", "REGISTERED"
        );
    }

    @Transactional
    public TalentCommunityMember trackEngagement(UUID memberId, String action) {
        log.debug("Tracking engagement for member [{}], action: [{}]", memberId, action);

        TalentCommunityMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        member.setLastActiveAt(Instant.now());
        switch (action.toUpperCase()) {
            case "EVENT_ATTENDED" -> {
                member.setEventsAttended(member.getEventsAttended() + 1);
                member.setEngagementScore(member.getEngagementScore() + 10.0);
            }
            case "NEWSLETTER_OPENED" -> {
                member.setNewslettersOpened(member.getNewslettersOpened() + 1);
                member.setEngagementScore(member.getEngagementScore() + 2.0);
            }
            case "PRE_APPLICATION" -> {
                member.setPreApplications(member.getPreApplications() + 1);
                member.setEngagementScore(member.getEngagementScore() + 20.0);
            }
            default -> member.setEngagementScore(member.getEngagementScore() + 1.0);
        }

        return memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<TalentCommunityMember> getActiveMembers() {
        log.debug("Fetching active community members");
        return memberRepository.findTop50BySubscribedTrueOrderByEngagementScoreDesc();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> sendNewsletter(String subject, String content) {
        log.info("Sending newsletter: [{}]", subject);
        List<TalentCommunityMember> subscribers = memberRepository.findBySubscribedTrueOrderByEngagementScoreDesc();
        return Map.of(
                "subject", subject,
                "recipientCount", subscribers.size(),
                "status", "QUEUED"
        );
    }

    @Transactional(readOnly = true)
    public List<TalentCommunityMember> getPreApplications() {
        log.debug("Fetching members with pre-applications");
        return memberRepository.findByPreApplicationsGreaterThan(0);
    }

    @Transactional(readOnly = true)
    public List<TalentCommunityMember> getMembersByInterest(String interest) {
        log.debug("Fetching members interested in [{}]", interest);
        return memberRepository.findByInterest(interest);
    }
}
