package com.unipulse.common.consumer;

import java.util.UUID;

public interface IdempotencyStore {
    boolean isProcessed(String consumerName, UUID eventId);
    void markProcessed(String consumerName, UUID eventId);
}
