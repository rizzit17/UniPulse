package com.unipulse.common.consumer;

import java.util.Map;

public interface DlqPublisher {
    void sendToDlq(String originalTopic, String key, String payload, Exception cause, Map<String, String> headers);
}
