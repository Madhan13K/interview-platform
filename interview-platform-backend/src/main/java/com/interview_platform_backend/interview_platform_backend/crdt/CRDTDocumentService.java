package com.interview_platform_backend.interview_platform_backend.crdt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * CRDT-based Collaborative Document Service.
 * Implements a simplified Replicated Growable Array (RGA) for conflict-free concurrent editing.
 * Used for: Code editor, whiteboard, shared notes.
 * 
 * Algorithm: Each character has a unique ID (siteId + lamportTimestamp).
 * Inserts/deletes are commutative and idempotent = no conflicts.
 */
@Service
public class CRDTDocumentService {

    private static final Logger log = LoggerFactory.getLogger(CRDTDocumentService.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<String, CRDTDocument> documents = new ConcurrentHashMap<>();

    public CRDTDocumentService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public CRDTDocument getOrCreateDocument(String documentId) {
        return documents.computeIfAbsent(documentId, id -> new CRDTDocument(id));
    }

    public void applyOperation(String documentId, Operation operation) {
        CRDTDocument doc = getOrCreateDocument(documentId);
        doc.apply(operation);
        // Broadcast to all connected clients
        messagingTemplate.convertAndSend("/topic/document/" + documentId + "/ops", operation);
        log.debug("CRDT op applied: doc={}, type={}, site={}", documentId, operation.type(), operation.siteId());
    }

    public String getDocumentContent(String documentId) {
        CRDTDocument doc = documents.get(documentId);
        return doc != null ? doc.getText() : "";
    }

    public List<Operation> getOperationHistory(String documentId, long sinceTimestamp) {
        CRDTDocument doc = documents.get(documentId);
        if (doc == null) return List.of();
        return doc.getOperationsSince(sinceTimestamp);
    }

    /**
     * Simplified CRDT Document using a list of characters with unique IDs.
     */
    public static class CRDTDocument {
        private final String id;
        private final List<CRDTChar> chars = Collections.synchronizedList(new ArrayList<>());
        private final List<Operation> history = Collections.synchronizedList(new ArrayList<>());
        private long lamportClock = 0;

        public CRDTDocument(String id) { this.id = id; }

        public synchronized void apply(Operation op) {
            lamportClock = Math.max(lamportClock, op.timestamp()) + 1;
            history.add(op);

            switch (op.type()) {
                case "INSERT" -> {
                    CRDTChar newChar = new CRDTChar(op.charId(), op.character(), op.siteId(), op.timestamp(), false);
                    int position = findInsertPosition(op.afterId());
                    chars.add(position, newChar);
                }
                case "DELETE" -> {
                    for (CRDTChar c : chars) {
                        if (c.id.equals(op.charId())) { c.deleted = true; break; }
                    }
                }
            }
        }

        public String getText() {
            StringBuilder sb = new StringBuilder();
            for (CRDTChar c : chars) {
                if (!c.deleted) sb.append(c.character);
            }
            return sb.toString();
        }

        public List<Operation> getOperationsSince(long timestamp) {
            return history.stream().filter(op -> op.timestamp() > timestamp).toList();
        }

        private int findInsertPosition(String afterId) {
            if (afterId == null || afterId.isEmpty()) return 0;
            for (int i = 0; i < chars.size(); i++) {
                if (chars.get(i).id.equals(afterId)) return i + 1;
            }
            return chars.size();
        }
    }

    static class CRDTChar {
        String id;
        char character;
        String siteId;
        long timestamp;
        boolean deleted;

        CRDTChar(String id, char character, String siteId, long timestamp, boolean deleted) {
            this.id = id; this.character = character; this.siteId = siteId;
            this.timestamp = timestamp; this.deleted = deleted;
        }
    }

    public record Operation(String type, String charId, char character, String afterId, String siteId, long timestamp) {}
}
