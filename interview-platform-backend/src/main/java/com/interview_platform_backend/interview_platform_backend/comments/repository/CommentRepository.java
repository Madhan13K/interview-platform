package com.interview_platform_backend.interview_platform_backend.comments.repository;

import com.interview_platform_backend.interview_platform_backend.comments.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findByEntityTypeAndEntityIdOrderByCreatedAtAsc(String entityType, UUID entityId);

    List<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId);

    List<Comment> findByMentionsContaining(String userId);
}
