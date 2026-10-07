package com.unipulse.notification.channel;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class NotificationChannelFactoryTest {

    @Test
    @DisplayName("Factory discovers and returns registered channels by name")
    void shouldFindRegisteredChannels() {
        NotificationChannel inApp = mock(NotificationChannel.class);
        when(inApp.getChannelName()).thenReturn("IN_APP");

        NotificationChannel email = mock(NotificationChannel.class);
        when(email.getChannelName()).thenReturn("EMAIL");

        NotificationChannelFactory factory = new NotificationChannelFactory(List.of(inApp, email));

        Optional<NotificationChannel> foundInApp = factory.getChannel("in_app");
        Optional<NotificationChannel> foundEmail = factory.getChannel("EMAIL");
        Optional<NotificationChannel> foundUnknown = factory.getChannel("SMS");

        assertThat(foundInApp).isPresent().contains(inApp);
        assertThat(foundEmail).isPresent().contains(email);
        assertThat(foundUnknown).isEmpty();
        assertThat(factory.getAllChannels()).containsExactlyInAnyOrder(inApp, email);
    }
}
