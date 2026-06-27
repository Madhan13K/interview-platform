package com.interview_platform_backend.interview_platform_backend.talentcommunity.controller;

import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.CommunityEvent;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.TalentCommunityMember;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.service.TalentCommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/talent-community")
@RequiredArgsConstructor
public class TalentCommunityController {

    private final TalentCommunityService communityService;

    @PostMapping("/join")
    public ResponseEntity<TalentCommunityMember> joinCommunity(
            @RequestParam String email,
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam(required = false) String interests,
            @RequestParam(defaultValue = "WEBSITE") String source) {
        TalentCommunityMember member = communityService.joinCommunity(
                email, firstName, lastName, interests, source);
        return ResponseEntity.ok(member);
    }

    @PostMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommunityEvent> createEvent(@RequestBody CommunityEvent event) {
        CommunityEvent created = communityService.createEvent(event);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/events/{eventId}/register")
    public ResponseEntity<Map<String, Object>> registerForEvent(
            @PathVariable UUID eventId,
            @RequestParam UUID memberId) {
        Map<String, Object> result = communityService.registerForEvent(memberId, eventId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/engagement/{memberId}")
    public ResponseEntity<TalentCommunityMember> trackEngagement(
            @PathVariable UUID memberId,
            @RequestParam String action) {
        TalentCommunityMember member = communityService.trackEngagement(memberId, action);
        return ResponseEntity.ok(member);
    }

    @GetMapping("/members/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TalentCommunityMember>> getActiveMembers() {
        return ResponseEntity.ok(communityService.getActiveMembers());
    }

    @PostMapping("/newsletter")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendNewsletter(
            @RequestParam String subject,
            @RequestBody String content) {
        Map<String, Object> result = communityService.sendNewsletter(subject, content);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pre-applications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TalentCommunityMember>> getPreApplications() {
        return ResponseEntity.ok(communityService.getPreApplications());
    }

    @GetMapping("/members/by-interest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TalentCommunityMember>> getMembersByInterest(@RequestParam String interest) {
        return ResponseEntity.ok(communityService.getMembersByInterest(interest));
    }
}
