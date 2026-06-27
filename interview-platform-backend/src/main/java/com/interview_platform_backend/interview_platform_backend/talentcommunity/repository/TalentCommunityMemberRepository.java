package com.interview_platform_backend.interview_platform_backend.talentcommunity.repository;

import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.TalentCommunityMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TalentCommunityMemberRepository extends JpaRepository<TalentCommunityMember, UUID> {

    Optional<TalentCommunityMember> findByEmail(String email);

    List<TalentCommunityMember> findBySubscribedTrueOrderByEngagementScoreDesc();

    @Query("SELECT m FROM TalentCommunityMember m WHERE m.interests LIKE %:interest% AND m.subscribed = true")
    List<TalentCommunityMember> findByInterest(@Param("interest") String interest);

    List<TalentCommunityMember> findByPreApplicationsGreaterThan(int minApplications);

    List<TalentCommunityMember> findTop50BySubscribedTrueOrderByEngagementScoreDesc();
}
