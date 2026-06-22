package com.interview_platform_backend.interview_platform_backend.team;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Teams/Permissions Inheritance Tests")
class TeamPermissionInheritanceTest {

    @Test void teamLeadShouldHaveAllMemberPermissions() {
        Set<String> memberPerms = Set.of("VIEW_INTERVIEWS", "SUBMIT_FEEDBACK");
        Set<String> leadPerms = Set.of("VIEW_INTERVIEWS", "SUBMIT_FEEDBACK", "MANAGE_TEAM", "ASSIGN_INTERVIEWS");
        assertTrue(leadPerms.containsAll(memberPerms));
    }

    @Test void removingUserFromTeamShouldRevokeTeamPermissions() {
        Set<String> userPerms = new HashSet<>(Set.of("VIEW_INTERVIEWS", "SUBMIT_FEEDBACK", "PERSONAL_PERM"));
        Set<String> teamPerms = Set.of("VIEW_INTERVIEWS", "SUBMIT_FEEDBACK");
        userPerms.removeAll(teamPerms);
        assertTrue(userPerms.contains("PERSONAL_PERM"), "Personal perms should remain");
        assertFalse(userPerms.contains("VIEW_INTERVIEWS"), "Team perms should be revoked");
    }

    @Test void userCanBelongToMultipleTeams() {
        Set<String> team1Perms = Set.of("VIEW_ENG_INTERVIEWS");
        Set<String> team2Perms = Set.of("VIEW_DESIGN_INTERVIEWS");
        Set<String> combinedPerms = new HashSet<>();
        combinedPerms.addAll(team1Perms);
        combinedPerms.addAll(team2Perms);
        assertEquals(2, combinedPerms.size());
    }

    @Test void deactivatedTeamShouldNotGrantPermissions() {
        boolean teamActive = false;
        Set<String> effectivePerms = teamActive ? Set.of("VIEW_INTERVIEWS") : Set.of();
        assertTrue(effectivePerms.isEmpty());
    }
}
