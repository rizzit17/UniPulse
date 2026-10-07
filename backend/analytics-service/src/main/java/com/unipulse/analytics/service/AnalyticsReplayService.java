package com.unipulse.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.unipulse.analytics.repo.*;
import com.unipulse.common.event.EventEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsReplayService {

    private final DailyRequestStatsRepository dailyRequestStatsRepository;
    private final TechnicianStatsRepository technicianStatsRepository;
    private final HotspotRepository hotspotRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final ActivityFeedRepository activityFeedRepository;
    private final AnalyticsAggregationService aggregationService;

    @Transactional
    public void resetAllAggregates() {
        log.warn("Resetting all analytics pre-aggregated data and activity feeds for replay");
        dailyRequestStatsRepository.deleteAll();
        technicianStatsRepository.deleteAll();
        hotspotRepository.deleteAll();
        processedEventRepository.deleteAll();
        activityFeedRepository.deleteAll();
        log.info("Successfully cleared all analytics tables and collections");
    }

    @Transactional
    public int replayBatch(List<EventEnvelope<JsonNode>> events) {
        log.info("Replaying batch of {} events into analytics engine", events.size());
        int count = 0;
        for (EventEnvelope<JsonNode> event : events) {
            aggregationService.processEvent(event);
            count++;
        }
        log.info("Completed replay of {} events", count);
        return count;
    }
}
