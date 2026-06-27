package com.interview_platform_backend.interview_platform_backend.comments.service;

import com.interview_platform_backend.interview_platform_backend.comments.entity.Comment;
import com.interview_platform_backend.interview_platform_backend.comments.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private static final Logger log = LoggerFactory.getLogger(CommentService.class);

    private final CommentRepository commentRepository;

    @Transactional
    public Comment addComment(Comment comment) {
        log.info("Adding comment by author={} on entity={}/{}", comment.getAuthorId(), comment.getEntityType(), comment.getEntityId());
        return commentRepository.save(comment);
    }

    @Transactional
    public Comment replyToComment(UUID parentId, Comment reply) {
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found: " + parentId));
        reply.setParentId(parentId);
        reply.setEntityType(parent.getEntityType());
        reply.setEntityId(parent.getEntityId());
        log.info("Reply to comment {} by author={}", parentId, reply.getAuthorId());
        return commentRepository.save(reply);
    }

    @Transactional
    public Comment editComment(UUID commentId, String newContent) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        comment.setContent(newContent);
        comment.setEdited(true);
        log.info("Comment {} edited", commentId);
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        log.info("Deleting comment {}", commentId);
        commentRepository.deleteById(commentId);
    }

    @Transactional(readOnly = true)
    public List<Comment> getMentionsForUser(UUID userId) {
        return commentRepository.findByMentionsContaining(userId.toString());
    }

    @Transactional(readOnly = true)
    public List<Comment> getThreadedComments(String entityType, UUID entityId) {
        return commentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtAsc(entityType, entityId);
    }

    @Transactional(readOnly = true)
    public List<Comment> getReplies(UUID parentId) {
        return commentRepository.findByParentIdOrderByCreatedAtAsc(parentId);
    }
}
