package com.ringochi.bookingservice;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProcessedPaymentEventRepository {
    private final JdbcTemplate jdbcTemplate;

    public ProcessedPaymentEventRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int insertIfAbsent(UUID eventId) {
        return jdbcTemplate.update("""
                insert into processed_payment_events (event_id, processed_at)
                values (?, ?)
                on conflict (event_id) do nothing
                """, eventId, Timestamp.from(Instant.now()));
    }
}
