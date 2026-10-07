package com.unipulse.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.unipulse.analytics.dto.*;
import com.unipulse.analytics.model.*;
import com.unipulse.analytics.repo.*;
import com.unipulse.common.event.EventEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsAggregationService {

    private final DailyRequestStatsRepository dailyRequestStatsRepository;
    private final TechnicianStatsRepository technicianStatsRepository;
    private final HotspotRepository hotspotRepository;
    private final ActivityFeedRepository activityFeedRepository;

    @Transactional
    public void processEvent(EventEnvelope<JsonNode> envelope) {
        String type = envelope.type();
        JsonNode payload = envelope.payload();
        Instant eventTime = envelope.occurredAt() != null ? envelope.occurredAt() : Instant.now();
        LocalDate eventDate = eventTime.atZone(ZoneOffset.UTC).toLocalDate();

        log.debug("Aggregating analytics for event {} of type {}", envelope.eventId(), type);

        switch (type) {
            case "request.created.v1" -> handleRequestCreated(envelope.aggregateId(), payload, eventTime, eventDate);
            case "request.assigned.v1" -> handleRequestAssigned(envelope.aggregateId(), payload, eventTime, eventDate);
            case "request.status-changed.v1" -> handleStatusChanged(envelope.aggregateId(), payload, eventTime, eventDate);
            case "request.comment-added.v1" -> handleCommentAdded(envelope.aggregateId(), payload, eventTime);
            case "sla.warning.v1" -> handleSlaWarning(envelope.aggregateId(), payload, eventTime, eventDate);
            case "sla.breached.v1" -> handleSlaBreached(envelope.aggregateId(), payload, eventTime, eventDate);
            default -> log.debug("Unhandled event type for analytics aggregation: {}", type);
        }
    }

    private void handleRequestCreated(UUID requestId, JsonNode payload, Instant eventTime, LocalDate eventDate) {
        UUID departmentId = parseUuid(payload, "departmentId");
        UUID categoryId = parseUuid(payload, "categoryId");
        String publicId = textOrNull(payload, "publicId");
        String title = textOrNull(payload, "title");
        String priority = textOrNull(payload, "priority");
        UUID requesterId = parseUuid(payload, "requesterId");

        String locationBlock = "General";
        String locationRoom = "Main";
        if (payload.has("location") && payload.get("location").isObject()) {
            JsonNode loc = payload.get("location");
            locationBlock = loc.has("block") ? loc.get("block").asText() : "General";
            locationRoom = loc.has("room") ? loc.get("room").asText() : "Main";
        }

        if (departmentId != null && categoryId != null) {
            dailyRequestStatsRepository.incrementCreated(eventDate, departmentId, categoryId);
            hotspotRepository.recordComplaint(locationBlock, locationRoom, categoryId, eventTime);
        }

        Map<String, Object> details = new HashMap<>();
        if (priority != null) details.put("priority", priority);
        if (departmentId != null) details.put("departmentId", departmentId.toString());
        if (categoryId != null) details.put("categoryId", categoryId.toString());
        details.put("location", locationBlock + " - " + locationRoom);

        activityFeedRepository.save(ActivityFeedEntry.builder()
                .requestId(requestId)
                .publicId(publicId)
                .eventType("REQUEST_CREATED")
                .actorId(requesterId)
                .actorRole("REQUESTER")
                .summary(title != null ? "Request raised: " + title : "Request created")
                .details(details)
                .timestamp(eventTime)
                .build());
    }

    private void handleRequestAssigned(UUID requestId, JsonNode payload, Instant eventTime, LocalDate eventDate) {
        String publicId = textOrNull(payload, "publicId");
        UUID technicianId = parseUuid(payload, "technicianId");
        if (technicianId == null) {
            technicianId = parseUuid(payload, "assigneeId");
        }
        UUID assignedBy = parseUuid(payload, "assignedBy");
        String assignedByName = textOrNull(payload, "assignedByName");

        if (technicianId != null) {
            technicianStatsRepository.incrementAssigned(eventDate, technicianId);
        }

        Map<String, Object> details = new HashMap<>();
        if (technicianId != null) details.put("technicianId", technicianId.toString());

        activityFeedRepository.save(ActivityFeedEntry.builder()
                .requestId(requestId)
                .publicId(publicId)
                .eventType("REQUEST_ASSIGNED")
                .actorId(assignedBy)
                .actorName(assignedByName != null ? assignedByName : "System Auto-Assign")
                .actorRole(assignedBy != null ? "DISPATCHER" : "SYSTEM")
                .summary(technicianId != null ? "Assigned to technician " + technicianId : "Technician assigned")
                .details(details)
                .timestamp(eventTime)
                .build());
    }

    private void handleStatusChanged(UUID requestId, JsonNode payload, Instant eventTime, LocalDate eventDate) {
        String publicId = textOrNull(payload, "publicId");
        String oldStatus = textOrNull(payload, "oldStatus");
        String newStatus = textOrNull(payload, "newStatus");
        UUID actorId = parseUuid(payload, "actorId");
        String actorRole = textOrNull(payload, "actorRole");
        String reason = textOrNull(payload, "reason");

        UUID departmentId = parseUuid(payload, "departmentId");
        UUID categoryId = parseUuid(payload, "categoryId");
        UUID technicianId = parseUuid(payload, "assigneeId");
        if (technicianId == null) {
            technicianId = parseUuid(payload, "technicianId");
        }

        if ("RESOLVED".equalsIgnoreCase(newStatus) && departmentId != null && categoryId != null) {
            dailyRequestStatsRepository.incrementResolved(eventDate, departmentId, categoryId);

            long durationSeconds = payload.has("durationSeconds") ? payload.get("durationSeconds").asLong() : 1800L;
            if (technicianId != null) {
                technicianStatsRepository.incrementResolved(eventDate, technicianId, Math.max(60L, durationSeconds));
            }
        }

        Map<String, Object> details = new HashMap<>();
        if (oldStatus != null) details.put("oldStatus", oldStatus);
        if (newStatus != null) details.put("newStatus", newStatus);
        if (reason != null) details.put("reason", reason);

        activityFeedRepository.save(ActivityFeedEntry.builder()
                .requestId(requestId)
                .publicId(publicId)
                .eventType("STATUS_CHANGED")
                .actorId(actorId)
                .actorRole(actorRole != null ? actorRole : "SYSTEM")
                .summary("Status changed: " + oldStatus + " \u2192 " + newStatus)
                .details(details)
                .timestamp(eventTime)
                .build());
    }

    private void handleCommentAdded(UUID requestId, JsonNode payload, Instant eventTime) {
        String publicId = textOrNull(payload, "publicId");
        UUID authorId = parseUuid(payload, "authorId");
        boolean internal = payload.has("internal") && payload.get("internal").asBoolean();
        String preview = textOrNull(payload, "preview");

        Map<String, Object> details = new HashMap<>();
        details.put("internal", internal);
        if (preview != null) details.put("preview", preview);

        activityFeedRepository.save(ActivityFeedEntry.builder()
                .requestId(requestId)
                .publicId(publicId)
                .eventType("COMMENT_ADDED")
                .actorId(authorId)
                .summary(internal ? "Internal note posted" : "Comment added")
                .details(details)
                .timestamp(eventTime)
                .build());
    }

    private void handleSlaWarning(UUID requestId, JsonNode payload, Instant eventTime, LocalDate eventDate) {
        String publicId = textOrNull(payload, "publicId");
        UUID departmentId = parseUuid(payload, "departmentId");
        UUID categoryId = parseUuid(payload, "categoryId");
        int minutesRemaining = payload.has("timeRemainingMinutes") ? payload.get("timeRemainingMinutes").asInt() : 30;

        if (departmentId != null && categoryId != null) {
            dailyRequestStatsRepository.incrementWarning(eventDate, departmentId, categoryId);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("minutesRemaining", minutesRemaining);

        activityFeedRepository.save(ActivityFeedEntry.builder()
                .requestId(requestId)
                .publicId(publicId)
                .eventType("SLA_WARNING")
                .summary("SLA Warning: " + minutesRemaining + " minutes remaining before breach")
                .details(details)
                .timestamp(eventTime)
                .build());
    }

    private void handleSlaBreached(UUID requestId, JsonNode payload, Instant eventTime, LocalDate eventDate) {
        String publicId = textOrNull(payload, "publicId");
        UUID departmentId = parseUuid(payload, "departmentId");
        UUID categoryId = parseUuid(payload, "categoryId");
        String escalatedTo = textOrNull(payload, "escalatedTo");
        int level = payload.has("level") ? payload.get("level").asInt() : 1;

        if (departmentId != null && categoryId != null) {
            dailyRequestStatsRepository.incrementBreached(eventDate, departmentId, categoryId);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("level", level);
        if (escalatedTo != null) details.put("escalatedTo", escalatedTo);

        activityFeedRepository.save(ActivityFeedEntry.builder()
                .requestId(requestId)
                .publicId(publicId)
                .eventType("SLA_BREACHED")
                .summary("SLA Breached: Escalated to " + (escalatedTo != null ? escalatedTo : "Level " + level))
                .details(details)
                .timestamp(eventTime)
                .build());
    }

    @Transactional(readOnly = true)
    public OverviewStatsResponse getOverview(LocalDate startDate, LocalDate endDate, UUID departmentId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<DailyRequestStats> stats = departmentId != null
                ? dailyRequestStatsRepository.findByDepartmentBetweenDates(departmentId, start, end)
                : dailyRequestStatsRepository.findBetweenDates(start, end);

        long totalCreated = stats.stream().mapToLong(DailyRequestStats::getCreatedCount).sum();
        long totalResolved = stats.stream().mapToLong(DailyRequestStats::getResolvedCount).sum();
        long totalBreached = stats.stream().mapToLong(DailyRequestStats::getBreachedCount).sum();
        long totalWarnings = stats.stream().mapToLong(DailyRequestStats::getSlaWarningCount).sum();

        double complianceRate = totalResolved == 0
                ? 100.0
                : Math.max(0.0, Math.min(100.0, ((double) (totalResolved - totalBreached) / totalResolved) * 100.0));

        List<TechnicianStats> techStats = technicianStatsRepository.findBetweenDates(start, end);
        long totalResolveSeconds = techStats.stream().mapToLong(TechnicianStats::getTotalResolveSeconds).sum();
        long techResolvedCount = techStats.stream().mapToLong(TechnicianStats::getResolvedCount).sum();
        int avgResolveMinutes = techResolvedCount == 0 ? 0 : (int) ((totalResolveSeconds / techResolvedCount) / 60);

        long activeHotspots = hotspotRepository.count();

        Map<LocalDate, List<DailyRequestStats>> groupedByDate = stats.stream()
                .collect(Collectors.groupingBy(s -> s.getId().getDate()));

        List<DailyTrendDto> dailyTrend = groupedByDate.entrySet().stream()
                .map(e -> new DailyTrendDto(
                        e.getKey(),
                        e.getValue().stream().mapToInt(DailyRequestStats::getCreatedCount).sum(),
                        e.getValue().stream().mapToInt(DailyRequestStats::getResolvedCount).sum(),
                        e.getValue().stream().mapToInt(DailyRequestStats::getBreachedCount).sum()
                ))
                .sorted(Comparator.comparing(DailyTrendDto::date))
                .toList();

        return new OverviewStatsResponse(
                totalCreated,
                totalResolved,
                totalBreached,
                totalWarnings,
                Math.round(complianceRate * 10.0) / 10.0,
                avgResolveMinutes,
                activeHotspots,
                dailyTrend
        );
    }

    @Transactional(readOnly = true)
    public SlaMetricsResponse getSlaMetrics(LocalDate startDate, LocalDate endDate, UUID departmentId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<DailyRequestStats> stats = departmentId != null
                ? dailyRequestStatsRepository.findByDepartmentBetweenDates(departmentId, start, end)
                : dailyRequestStatsRepository.findBetweenDates(start, end);

        long totalCreated = stats.stream().mapToLong(DailyRequestStats::getCreatedCount).sum();
        long totalResolved = stats.stream().mapToLong(DailyRequestStats::getResolvedCount).sum();
        long totalBreached = stats.stream().mapToLong(DailyRequestStats::getBreachedCount).sum();
        long totalWarnings = stats.stream().mapToLong(DailyRequestStats::getSlaWarningCount).sum();

        double complianceRate = totalResolved == 0
                ? 100.0
                : Math.max(0.0, Math.min(100.0, ((double) (totalResolved - totalBreached) / totalResolved) * 100.0));

        Map<UUID, List<DailyRequestStats>> groupedByDept = stats.stream()
                .collect(Collectors.groupingBy(s -> s.getId().getDepartmentId()));

        List<DepartmentSlaDto> departmentBreakdown = groupedByDept.entrySet().stream()
                .map(e -> {
                    long deptCreated = e.getValue().stream().mapToLong(DailyRequestStats::getCreatedCount).sum();
                    long deptResolved = e.getValue().stream().mapToLong(DailyRequestStats::getResolvedCount).sum();
                    long deptBreached = e.getValue().stream().mapToLong(DailyRequestStats::getBreachedCount).sum();
                    double deptRate = deptResolved == 0
                            ? 100.0
                            : Math.max(0.0, Math.min(100.0, ((double) (deptResolved - deptBreached) / deptResolved) * 100.0));
                    return new DepartmentSlaDto(e.getKey(), deptCreated, deptResolved, deptBreached, Math.round(deptRate * 10.0) / 10.0);
                })
                .toList();

        return new SlaMetricsResponse(
                totalCreated,
                totalBreached,
                totalWarnings,
                Math.round(complianceRate * 10.0) / 10.0,
                departmentBreakdown
        );
    }

    @Transactional(readOnly = true)
    public List<HotspotDto> getTopHotspots(int limit) {
        int boundedLimit = Math.min(100, Math.max(1, limit));
        List<Hotspot> hotspots = hotspotRepository.findTopHotspots(PageRequest.of(0, boundedLimit));
        return hotspots.stream()
                .map(h -> new HotspotDto(
                        h.getId().getLocationBlock(),
                        h.getId().getLocationRoom(),
                        h.getId().getCategoryId(),
                        h.getCount30d(),
                        h.getLastReportedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TechnicianWorkloadDto> getTechnicianWorkloads(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<TechnicianStats> stats = technicianStatsRepository.findBetweenDates(start, end);

        Map<UUID, List<TechnicianStats>> groupedByTech = stats.stream()
                .collect(Collectors.groupingBy(s -> s.getId().getTechnicianId()));

        return groupedByTech.entrySet().stream()
                .map(e -> {
                    UUID techId = e.getKey();
                    int assigned = e.getValue().stream().mapToInt(TechnicianStats::getAssignedCount).sum();
                    int resolved = e.getValue().stream().mapToInt(TechnicianStats::getResolvedCount).sum();
                    long totalSeconds = e.getValue().stream().mapToLong(TechnicianStats::getTotalResolveSeconds).sum();
                    int avgSeconds = resolved == 0 ? 0 : (int) (totalSeconds / resolved);
                    double avgMinutes = Math.round((avgSeconds / 60.0) * 10.0) / 10.0;
                    return new TechnicianWorkloadDto(techId, assigned, resolved, avgSeconds, avgMinutes);
                })
                .sorted(Comparator.comparingInt(TechnicianWorkloadDto::assignedCount).reversed())
                .toList();
    }

    public List<ActivityFeedDto> getRequestActivity(UUID requestId) {
        List<ActivityFeedEntry> entries = activityFeedRepository.findByRequestIdOrderByTimestampDesc(requestId);
        return entries.stream()
                .map(e -> new ActivityFeedDto(
                        e.getId(),
                        e.getRequestId(),
                        e.getPublicId(),
                        e.getEventType(),
                        e.getActorId(),
                        e.getActorName(),
                        e.getActorRole(),
                        e.getSummary(),
                        e.getDetails(),
                        e.getTimestamp()
                ))
                .toList();
    }

    private UUID parseUuid(JsonNode node, String field) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            try {
                return UUID.fromString(node.get(field).asText());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }

    private String textOrNull(JsonNode node, String field) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return null;
    }
}
