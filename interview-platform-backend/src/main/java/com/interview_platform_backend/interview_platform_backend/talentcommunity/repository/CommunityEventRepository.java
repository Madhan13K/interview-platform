package com.interview_platform_backend.interview_platform_backend.talentcommunity.repository;

import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.CommunityEvent;
import com.interview_platform_backend.interview_platform_backend.talentcommunity.entity.CommunityEvent.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommunityEventRepository extends JpaRepository<CommunityEvent, UUID> {

    List<CommunityEvent> findByStatus(EventStatus status);

    List<CommunityEvent> findByStatusOrderByScheduledAtAsc(EventStatus status);
}
