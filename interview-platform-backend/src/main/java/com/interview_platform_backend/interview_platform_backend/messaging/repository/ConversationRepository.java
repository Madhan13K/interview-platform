package com.interview_platform_backend.interview_platform_backend.messaging.repository;

import com.interview_platform_backend.interview_platform_backend.messaging.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findByParticipantId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c JOIN c.participants p1 JOIN c.participants p2 " +
           "WHERE c.type = 'DIRECT' AND p1.id = :user1Id AND p2.id = :user2Id")
    List<Conversation> findDirectConversation(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
}
