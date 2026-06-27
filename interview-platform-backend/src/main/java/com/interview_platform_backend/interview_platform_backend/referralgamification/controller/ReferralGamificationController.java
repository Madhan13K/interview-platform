package com.interview_platform_backend.interview_platform_backend.referralgamification.controller;

import com.interview_platform_backend.interview_platform_backend.referralgamification.entity.ReferralLeaderboard;
import com.interview_platform_backend.interview_platform_backend.referralgamification.service.ReferralGamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/referral-gamification")
@RequiredArgsConstructor
public class ReferralGamificationController {

    private final ReferralGamificationService gamificationService;

    @PostMapping("/award")
    public ResponseEntity<ReferralLeaderboard> awardPoints(
            @RequestParam UUID userId,
            @RequestParam String action,
            @RequestParam int points) {
        ReferralLeaderboard result = gamificationService.awardPoints(userId, action, points);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/leaderboard/{orgId}")
    public ResponseEntity<List<ReferralLeaderboard>> getLeaderboard(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(gamificationService.getLeaderboard(orgId, limit));
    }

    @GetMapping("/badges/{userId}")
    public ResponseEntity<String> getBadges(@PathVariable UUID userId) {
        return ResponseEntity.ok(gamificationService.getBadges(userId));
    }

    @GetMapping("/streak/{userId}")
    public ResponseEntity<Map<String, Object>> getStreak(@PathVariable UUID userId) {
        return ResponseEntity.ok(gamificationService.getStreak(userId));
    }

    @PostMapping("/share/{referralId}")
    public ResponseEntity<Map<String, Object>> shareToSocial(
            @PathVariable UUID referralId,
            @RequestParam String platform) {
        return ResponseEntity.ok(gamificationService.shareToSocial(referralId, platform));
    }
}
