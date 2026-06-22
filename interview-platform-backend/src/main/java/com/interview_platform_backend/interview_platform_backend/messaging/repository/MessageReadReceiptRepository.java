package com.interview_platform_backend.interview_platform_backend.messaging.repository;

import com.interview_platform_backend.interview_platform_backend.messaging.entity.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, UUID> {
    Optional<MessageReadReceipt> findByConversationIdAndUserId(UUID conversationId, UUID userId);
}
