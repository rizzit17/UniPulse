package com.unipulse.notification.channel;

import com.unipulse.notification.domain.NotificationDocument;
import com.unipulse.notification.repo.NotificationRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailNotificationChannel implements NotificationChannel {

    public static final String CHANNEL_NAME = "EMAIL";

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;

    @Value("${unipulse.mail.from:no-reply@unipulse.local}")
    private String fromAddress;

    @Override
    public String getChannelName() {
        return CHANNEL_NAME;
    }

    @Override
    @CircuitBreaker(name = "emailService", fallbackMethod = "emailFallback")
    @Retry(name = "emailService", fallbackMethod = "emailFallback")
    public boolean send(NotificationMessage message) {
        if (message.userEmail() == null || message.userEmail().isBlank()) {
            log.warn("No email address provided for user {}; skipping email dispatch.", message.userId());
            return false;
        }

        log.info("Sending email notification to {} ({}) for request {}",
                message.userEmail(), message.userId(), message.publicId());

        Instant now = Instant.now();
        NotificationDocument doc = NotificationDocument.builder()
                .eventId(message.eventId())
                .userId(message.userId())
                .userEmail(message.userEmail())
                .requestId(message.requestId())
                .publicId(message.publicId())
                .title(message.title())
                .message(message.body())
                .channel(CHANNEL_NAME)
                .status("DELIVERED")
                .metadata(message.metadata())
                .createdAt(now)
                .deliveredAt(now)
                .build();

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(fromAddress);
            mail.setTo(message.userEmail());
            mail.setSubject("[UniPulse] " + message.title());
            mail.setText(message.body());

            mailSender.send(mail);

            try {
                notificationRepository.save(doc);
            } catch (DuplicateKeyException e) {
                log.warn("Email notification record already exists for event {} user {}", message.eventId(), message.userId());
            }

            log.info("Email notification sent successfully to {}", message.userEmail());
            return true;
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", message.userEmail(), e.getMessage());
            throw e; // rethrow so resilience4j retry/fallback activates
        }
    }

    public boolean emailFallback(NotificationMessage message, Throwable t) {
        log.warn("Email dispatch fallback triggered for {} due to error: {}", message.userEmail(), t.getMessage());
        try {
            NotificationDocument doc = NotificationDocument.builder()
                    .eventId(message.eventId())
                    .userId(message.userId())
                    .userEmail(message.userEmail())
                    .requestId(message.requestId())
                    .publicId(message.publicId())
                    .title(message.title())
                    .message(message.body())
                    .channel(CHANNEL_NAME)
                    .status("FAILED")
                    .metadata(message.metadata())
                    .createdAt(Instant.now())
                    .build();
            notificationRepository.save(doc);
        } catch (Exception ignored) {
        }
        return false;
    }
}
