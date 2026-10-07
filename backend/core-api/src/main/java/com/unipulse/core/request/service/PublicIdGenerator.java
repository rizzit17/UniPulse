package com.unipulse.core.request.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublicIdGenerator {

    private final JdbcTemplate jdbcTemplate;
    private final AtomicLong fallbackCounter = new AtomicLong(100000);

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS request_public_id_seq START WITH 100001");
            log.info("Initialized request_public_id_seq database sequence");
        } catch (Exception e) {
            log.warn("Sequence initialization skipped or already handled by Flyway: {}", e.getMessage());
        }
    }

    public String generatePublicId() {
        long seqValue;
        try {
            Long val = jdbcTemplate.queryForObject("SELECT nextval('request_public_id_seq')", Long.class);
            seqValue = (val != null) ? val : fallbackCounter.incrementAndGet();
        } catch (Exception e) {
            log.warn("Failed to fetch nextval from sequence, using fallback counter: {}", e.getMessage());
            seqValue = fallbackCounter.incrementAndGet();
        }

        int year = LocalDate.now().getYear();
        return String.format("UP-%d-%06d", year, seqValue);
    }
}
