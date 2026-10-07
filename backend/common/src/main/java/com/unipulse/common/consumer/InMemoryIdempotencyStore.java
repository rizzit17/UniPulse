package com.unipulse.common.consumer;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryIdempotencyStore implements IdempotencyStore {

    private final Set<String> processedKeys = ConcurrentHashMap.newKeySet();

    @Override
    public boolean isProcessed(String consumerName, UUID eventId) {
        return processedKeys.contains(buildKey(consumerName, eventId));
    }

    @Override
    public void markProcessed(String consumerName, UUID eventId) {
        processedKeys.add(buildKey(consumerName, eventId));
    }

    private String buildKey(String consumerName, UUID eventId) {
        return consumerName + ":" + eventId;
    }
}
