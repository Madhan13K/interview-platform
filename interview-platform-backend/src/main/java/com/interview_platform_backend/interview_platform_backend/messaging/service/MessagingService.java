package com.interview_platform_backend.interview_platform_backend.messaging.service;

import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.exception.ResourceNotFoundException;
import com.interview_platform_backend.interview_platform_backend.messaging.dto.*;
import com.interview_platform_backend.interview_platform_backend.messaging.entity.*;
import com.interview_platform_backend.interview_platform_backend.messaging.repository.*;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessagingService {

    private static final Logger log = LoggerFactory.getLogger(MessagingService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageReadReceiptRepository readReceiptRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessagingService(ConversationRepository conversationRepository,
                           MessageRepository messageRepository,
                           MessageReadReceiptRepository readReceiptRepository,
                           UserRepository userRepository,
                           SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.readReceiptRepository = readReceiptRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public ConversationResponse createConversation(CreateConversationRequest request, UUID currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Set<User> participants = new HashSet<>();
        participants.add(currentUser);

        for (UUID participantId : request.getParticipantIds()) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", participantId));
            participants.add(participant);
        }

        Conversation.ConversationType type = "GROUP".equalsIgnoreCase(request.getType()) ?
                Conversation.ConversationType.GROUP : Conversation.ConversationType.DIRECT;

        // For DIRECT conversations, check if one already exists
        if (type == Conversation.ConversationType.DIRECT && participants.size() == 2) {
            List<UUID> ids = participants.stream().map(User::getId).collect(Collectors.toList());
            List<Conversation> existing = conversationRepository.findDirectConversation(ids.get(0), ids.get(1));
            if (!existing.isEmpty()) {
                return mapToResponse(existing.get(0), currentUserId);
            }
        }

        String title = request.getTitle();
        if (title == null || title.isBlank()) {
            title = participants.stream()
                    .filter(p -> !p.getId().equals(currentUserId))
                    .map(p -> p.getFirstName() + " " + p.getLastName())
                    .collect(Collectors.joining(", "));
        }

        Conversation conversation = Conversation.builder()
                .title(title)
                .type(type)
                .participants(participants)
                .build();

        conversation = conversationRepository.save(conversation);
        log.info("Conversation created: {} by user {}", conversation.getId(), currentUserId);
        return mapToResponse(conversation, currentUserId);
    }

    public List<ConversationResponse> getMyConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findByParticipantId(userId);
        return conversations.stream()
                .map(c -> mapToResponse(c, userId))
                .collect(Collectors.toList());
    }

    public MessageResponse sendMessage(UUID conversationId, SendMessageRequest request, UUID senderId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        // Verify sender is a participant
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(senderId));
        if (!isParticipant) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        Message.MessageType type = Message.MessageType.TEXT;
        if (request.getType() != null) {
            try { type = Message.MessageType.valueOf(request.getType()); } catch (Exception ignored) {}
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent())
                .type(type)
                .parentMessageId(request.getParentMessageId())
                .build();

        message = messageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        MessageResponse response = mapMessageToResponse(message);

        // Push via WebSocket to all participants
        for (User participant : conversation.getParticipants()) {
            messagingTemplate.convertAndSendToUser(
                    participant.getId().toString(),
                    "/queue/messages",
                    response
            );
        }

        log.info("Message sent in conversation {} by user {}", conversationId, senderId);
        return response;
    }

    public Page<MessageResponse> getMessages(UUID conversationId, UUID userId, int page, int size) {
        // Verify user is participant
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));
        if (!isParticipant) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversationId, PageRequest.of(page, size));
        return messages.map(this::mapMessageToResponse);
    }

    public void markAsRead(UUID conversationId, UUID userId, UUID messageId) {
        MessageReadReceipt receipt = readReceiptRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElse(MessageReadReceipt.builder()
                        .conversationId(conversationId)
                        .userId(userId)
                        .build());

        receipt.setLastReadMessageId(messageId);
        receipt.setLastReadAt(Instant.now());
        readReceiptRepository.save(receipt);
    }

    public List<MessageResponse> getThreadReplies(UUID parentMessageId) {
        return messageRepository.findByParentMessageIdOrderByCreatedAtAsc(parentMessageId)
                .stream()
                .map(this::mapMessageToResponse)
                .collect(Collectors.toList());
    }

    public void deleteMessage(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));
        if (!message.getSender().getId().equals(userId)) {
            throw new BadRequestException("You can only delete your own messages");
        }
        messageRepository.delete(message);
    }

    private ConversationResponse mapToResponse(Conversation conversation, UUID currentUserId) {
        List<ConversationResponse.ParticipantInfo> participants = conversation.getParticipants().stream()
                .map(p -> ConversationResponse.ParticipantInfo.builder()
                        .id(p.getId())
                        .firstName(p.getFirstName())
                        .lastName(p.getLastName())
                        .email(p.getEmail())
                        .build())
                .collect(Collectors.toList());

        // Get last message
        Page<Message> lastMessages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversation.getId(), PageRequest.of(0, 1));
        MessageResponse lastMessage = lastMessages.hasContent() ?
                mapMessageToResponse(lastMessages.getContent().get(0)) : null;

        // Get unread count
        long unreadCount = messageRepository.countUnreadMessages(conversation.getId(), currentUserId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .type(conversation.getType().name())
                .participants(participants)
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private MessageResponse mapMessageToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .content(message.getContent())
                .type(message.getType().name())
                .parentMessageId(message.getParentMessageId())
                .isEdited(message.getIsEdited())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
