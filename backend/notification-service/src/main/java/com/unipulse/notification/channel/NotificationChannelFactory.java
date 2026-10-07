package com.unipulse.notification.channel;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class NotificationChannelFactory {

    private final Map<String, NotificationChannel> channels;
    private final List<NotificationChannel> channelList;

    public NotificationChannelFactory(List<NotificationChannel> channelBeans) {
        this.channelList = Collections.unmodifiableList(channelBeans);
        this.channels = channelBeans.stream()
                .collect(Collectors.toMap(
                        channel -> channel.getChannelName().toUpperCase(),
                        channel -> channel
                ));
    }

    public Optional<NotificationChannel> getChannel(String channelName) {
        if (channelName == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(channels.get(channelName.toUpperCase()));
    }

    public List<NotificationChannel> getAllChannels() {
        return channelList;
    }
}
