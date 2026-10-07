package com.unipulse.notification.controller;

import com.unipulse.notification.domain.NotificationDocument;
import com.unipulse.notification.repo.NotificationRepository;
import com.unipulse.notification.service.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SseEmitterRegistry sseEmitterRegistry;
    private final NotificationRepository notificationRepository;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(
            @RequestParam(required = false) UUID userId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        UUID effectiveUserId = resolveUserId(userId, userIdHeader);
        log.info("Client subscribed to SSE notification stream for user {}", effectiveUserId);
        return sseEmitterRegistry.register(effectiveUserId);
    }

    @GetMapping
    public List<NotificationDocument> getNotifications(
            @RequestParam(required = false) UUID userId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(defaultValue = "20") int limit
    ) {
        UUID effectiveUserId = resolveUserId(userId, userIdHeader);
        int effectiveLimit = Math.min(Math.max(limit, 1), 100);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId, PageRequest.of(0, effectiveLimit));
    }

    private UUID resolveUserId(UUID paramUserId, String headerUserId) {
        if (paramUserId != null) {
            return paramUserId;
        }
        if (headerUserId != null && !headerUserId.isBlank()) {
            try {
                return UUID.fromString(headerUserId);
            } catch (IllegalArgumentException ignored) {
            }
        }
        throw new IllegalArgumentException("User ID must be provided via query param 'userId' or header 'X-User-Id'");
    }
}
