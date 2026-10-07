package com.unipulse.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.notification.channel.NotificationChannel;
import com.unipulse.notification.channel.NotificationChannelFactory;
import com.unipulse.notification.channel.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationEventDispatcher {

    private final NotificationChannelFactory channelFactory;

    public int dispatch(EventEnvelope<JsonNode> envelope) {
        String type = envelope.type();
        JsonNode payload = envelope.payload();
        UUID eventId = envelope.eventId();
        UUID requestId = envelope.aggregateId();

        List<NotificationMessage> messages = buildNotificationMessages(type, eventId, requestId, payload);
        if (messages.isEmpty()) {
            log.debug("No recipients identified for event {} of type {}", eventId, type);
            return 0;
        }

        int count = 0;
        List<NotificationChannel> channels = channelFactory.getAllChannels();

        for (NotificationMessage message : messages) {
            for (NotificationChannel channel : channels) {
                try {
                    boolean success = channel.send(message);
                    if (success) {
                        count++;
                    }
                } catch (Exception e) {
                    log.error("Failed sending notification via channel {} to user {}: {}",
                            channel.getChannelName(), message.userId(), e.getMessage());
                }
            }
        }

        return count;
    }

    private List<NotificationMessage> buildNotificationMessages(
            String type,
            UUID eventId,
            UUID requestId,
            JsonNode payload
    ) {
        List<NotificationMessage> messages = new ArrayList<>();
        if (payload == null) {
            return messages;
        }

        String publicId = payload.hasNonNull("publicId") ? payload.get("publicId").asText() : "UP-" + requestId.toString().substring(0, 8);

        switch (type) {
            case "RequestCreated", "request.created.v1" -> {
                if (payload.hasNonNull("requesterId")) {
                    UUID requesterId = UUID.fromString(payload.get("requesterId").asText());
                    String email = payload.hasNonNull("requesterEmail")
                            ? payload.get("requesterEmail").asText()
                            : requesterId + "@unipulse.local";
                    messages.add(NotificationMessage.of(
                            eventId,
                            requesterId,
                            email,
                            requestId,
                            publicId,
                            "Request Logged: " + publicId,
                            "Your service request " + publicId + " has been successfully submitted and is pending assignment."
                    ));
                }
            }
            case "RequestAssigned", "request.assigned.v1" -> {
                if (payload.hasNonNull("assigneeId")) {
                    UUID assigneeId = UUID.fromString(payload.get("assigneeId").asText());
                    String email = payload.hasNonNull("assigneeEmail")
                            ? payload.get("assigneeEmail").asText()
                            : assigneeId + "@unipulse.local";
                    messages.add(NotificationMessage.of(
                            eventId,
                            assigneeId,
                            email,
                            requestId,
                            publicId,
                            "Task Assigned: " + publicId,
                            "You have been assigned to service request " + publicId + ". Please review the details."
                    ));
                }
            }
            case "RequestStatusChanged", "request.status-changed.v1" -> {
                String newStatus = payload.hasNonNull("newStatus") ? payload.get("newStatus").asText() : "UPDATED";
                if (payload.hasNonNull("actorId")) {
                    UUID actorId = UUID.fromString(payload.get("actorId").asText());
                    String email = actorId + "@unipulse.local";
                    messages.add(NotificationMessage.of(
                            eventId,
                            actorId,
                            email,
                            requestId,
                            publicId,
                            "Status Updated: " + publicId + " -> " + newStatus,
                            "The status of request " + publicId + " has transitioned to " + newStatus + "."
                    ));
                }
            }
            case "CommentAdded", "RequestCommentAdded", "request.comment-added.v1" -> {
                if (payload.hasNonNull("authorId")) {
                    UUID authorId = UUID.fromString(payload.get("authorId").asText());
                    String email = authorId + "@unipulse.local";
                    messages.add(NotificationMessage.of(
                            eventId,
                            authorId,
                            email,
                            requestId,
                            publicId,
                            "New Comment on " + publicId,
                            "A new comment was posted on service request " + publicId + "."
                    ));
                }
            }
            case "SlaWarning", "sla.warning.v1" -> {
                if (payload.hasNonNull("assigneeId")) {
                    UUID assigneeId = UUID.fromString(payload.get("assigneeId").asText());
                    String email = assigneeId + "@unipulse.local";
                    messages.add(NotificationMessage.of(
                            eventId,
                            assigneeId,
                            email,
                            requestId,
                            publicId,
                            "SLA Warning: " + publicId,
                            "Service request " + publicId + " is approaching its SLA resolution window!"
                    ));
                }
            }
            case "SlaBreached", "sla.breached.v1" -> {
                if (payload.hasNonNull("assigneeId")) {
                    UUID assigneeId = UUID.fromString(payload.get("assigneeId").asText());
                    String email = assigneeId + "@unipulse.local";
                    messages.add(NotificationMessage.of(
                            eventId,
                            assigneeId,
                            email,
                            requestId,
                            publicId,
                            "SLA Breached: " + publicId,
                            "Service request " + publicId + " has exceeded its SLA resolution deadline."
                    ));
                }
            }
            default -> log.debug("Unhandled notification event type: {}", type);
        }

        return messages;
    }
}
