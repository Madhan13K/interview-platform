package com.interview_platform_backend.interview_platform_backend.tenant.service;

import com.interview_platform_backend.interview_platform_backend.tenant.entity.OrganizationMember;
import com.interview_platform_backend.interview_platform_backend.tenant.repository.OrganizationMemberRepository;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves the current user's organization context for data isolation.
 * Used by services to scope queries to the user's tenant.
 */
@Service
public class TenantContextService {

    private final UserRepository userRepository;
    private final OrganizationMemberRepository orgMemberRepository;

    public TenantContextService(UserRepository userRepository,
                                OrganizationMemberRepository orgMemberRepository) {
        this.userRepository = userRepository;
        this.orgMemberRepository = orgMemberRepository;
    }

    /**
     * Get the current authenticated user's organization ID.
     * Returns empty if user has no organization (e.g., standalone candidate).
     */
    public Optional<UUID> getCurrentOrganizationId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();

        String email = auth.getName();
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) return Optional.empty();

        List<OrganizationMember> memberships = orgMemberRepository.findByUserId(user.get().getId());
        return memberships.stream()
                .findFirst()
                .map(m -> m.getOrganization().getId());
    }

    /**
     * Get the current user's ID from security context.
     */
    public Optional<UUID> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();

        String email = auth.getName();
        return userRepository.findByEmail(email).map(User::getId);
    }

    /**
     * Verify that the given organization ID matches the current user's org.
     * Throws if mismatch (cross-tenant access attempt).
     */
    public void verifyTenantAccess(UUID organizationId) {
        Optional<UUID> currentOrgId = getCurrentOrganizationId();
        if (currentOrgId.isPresent() && !currentOrgId.get().equals(organizationId)) {
            throw new SecurityException("Cross-tenant access denied. User org: " +
                    currentOrgId.get() + ", requested: " + organizationId);
        }
    }
}
