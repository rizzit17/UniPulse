package com.unipulse.notification.channel;

import com.unipulse.notification.domain.NotificationDocument;
import com.unipulse.notification.repo.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailNotificationChannelTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NotificationRepository notificationRepository;

    private EmailNotificationChannel channel;

    @BeforeEach
    void setUp() {
        channel = new EmailNotificationChannel(mailSender, notificationRepository);
        ReflectionTestUtils.setField(channel, "fromAddress", "no-reply@unipulse.local");
    }

    @Test
    @DisplayName("Sends email message and persists delivery record in MongoDB")
    void shouldSendEmailSuccessfully() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        NotificationMessage message = NotificationMessage.of(
                eventId,
                userId,
                "student@campus.edu",
                requestId,
                "UP-2026-000001",
                "New Request",
                "Request UP-2026-000001 has been logged."
        );

        boolean result = channel.send(message);

        assertThat(result).isTrue();

        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(mailCaptor.capture());
        SimpleMailMessage sentMail = mailCaptor.getValue();
        assertThat(sentMail.getTo()).contains("student@campus.edu");
        assertThat(sentMail.getSubject()).isEqualTo("[UniPulse] New Request");

        ArgumentCaptor<NotificationDocument> docCaptor = ArgumentCaptor.forClass(NotificationDocument.class);
        verify(notificationRepository).save(docCaptor.capture());
        NotificationDocument savedDoc = docCaptor.getValue();
        assertThat(savedDoc.getChannel()).isEqualTo("EMAIL");
        assertThat(savedDoc.getStatus()).isEqualTo("DELIVERED");
    }

    @Test
    @DisplayName("Skips email dispatch when user email is missing")
    void shouldSkipWhenEmailIsMissing() {
        NotificationMessage message = NotificationMessage.of(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                UUID.randomUUID(),
                "UP-2026-000001",
                "New Request",
                "Body"
        );

        boolean result = channel.send(message);

        assertThat(result).isFalse();
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Executes fallback and records FAILED status on mail exception")
    void shouldRecordFailedStatusOnMailException() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        NotificationMessage message = NotificationMessage.of(
                eventId,
                userId,
                "student@campus.edu",
                requestId,
                "UP-2026-000001",
                "New Request",
                "Body"
        );

        boolean fallbackResult = channel.emailFallback(message, new MailSendException("SMTP connection refused"));

        assertThat(fallbackResult).isFalse();

        ArgumentCaptor<NotificationDocument> docCaptor = ArgumentCaptor.forClass(NotificationDocument.class);
        verify(notificationRepository).save(docCaptor.capture());
        NotificationDocument savedDoc = docCaptor.getValue();
        assertThat(savedDoc.getStatus()).isEqualTo("FAILED");
    }
}
