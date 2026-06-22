package com.interview_platform_backend.interview_platform_backend.messaging.repository;

import com.interview_platform_backend.interview_platform_backend.messaging.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    List<Message> findByParentMessageIdOrderByCreatedAtAsc(UUID parentMessageId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.createdAt > " +
           "(SELECT COALESCE(r.lastReadAt, TIMESTAMP '1970-01-01') FROM MessageReadReceipt r " +
           "WHERE r.conversationId = :conversationId AND r.userId = :userId)")
    long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
