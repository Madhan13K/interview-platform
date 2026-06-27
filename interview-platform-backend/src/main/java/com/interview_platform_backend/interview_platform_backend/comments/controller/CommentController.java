package com.interview_platform_backend.interview_platform_backend.comments.controller;

import com.interview_platform_backend.interview_platform_backend.comments.entity.Comment;
import com.interview_platform_backend.interview_platform_backend.comments.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<Comment> addComment(@RequestBody Comment comment) {
        return ResponseEntity.ok(commentService.addComment(comment));
    }

    @PostMapping("/{parentId}/reply")
    public ResponseEntity<Comment> replyToComment(@PathVariable UUID parentId, @RequestBody Comment reply) {
        return ResponseEntity.ok(commentService.replyToComment(parentId, reply));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comment> editComment(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(commentService.editComment(id, body.get("content")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<Comment>> getThreadedComments(@PathVariable String entityType, @PathVariable UUID entityId) {
        return ResponseEntity.ok(commentService.getThreadedComments(entityType, entityId));
    }

    @GetMapping("/{parentId}/replies")
    public ResponseEntity<List<Comment>> getReplies(@PathVariable UUID parentId) {
        return ResponseEntity.ok(commentService.getReplies(parentId));
    }

    @GetMapping("/mentions/{userId}")
    public ResponseEntity<List<Comment>> getMentionsForUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(commentService.getMentionsForUser(userId));
    }
}
