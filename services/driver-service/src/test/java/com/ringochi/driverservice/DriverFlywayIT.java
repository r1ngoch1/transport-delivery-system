package com.ringochi.driverservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@ActiveProfiles("test")
@SpringBootTest
class DriverFlywayIT {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private DriverProfileRepository drivers;
    @Autowired
    private DriverAvailabilitySlotRepository availabilitySlots;

    @Test
    void flywayCreatesDriverProfilesTableOnPostgres() {
        DriverProfile profile = new DriverProfile();
        UUID userId = UUID.randomUUID();
        profile.setUserId(userId);
        profile.setFullName("Ivan Driver");
        profile.setPhone("+79000000000");
        profile.setLicenseNumber("DRV-123456");
        profile.setLicenseCategory("B");
        profile.setLicenseExpiresAt(LocalDate.of(2030, 1, 1));
        profile.setAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE);

        drivers.save(profile);

        assertThat(drivers.findByUserId(userId))
                .isPresent()
                .get()
                .satisfies(saved -> {
                    assertThat(saved.getLicenseNumber()).isEqualTo("DRV-123456");
                    assertThat(saved.getAvailabilityStatus()).isEqualTo(DriverAvailabilityStatus.AVAILABLE);
                    assertThat(saved.isActive()).isTrue();
                });
    }

    @Test
    void flywayCreatesDriverAvailabilitySlotsTableOnPostgres() {
        DriverProfile profile = new DriverProfile();
        profile.setUserId(UUID.randomUUID());
        profile.setFullName("Ivan Driver");
        profile.setPhone("+79000000000");
        profile.setLicenseNumber("DRV-123456");
        profile.setLicenseCategory("B");
        profile.setLicenseExpiresAt(LocalDate.of(2030, 1, 1));
        profile = drivers.save(profile);

        DriverAvailabilitySlot slot = new DriverAvailabilitySlot();
        slot.setDriverProfileId(profile.getId());
        slot.setStartAt(Instant.parse("2026-06-01T08:00:00Z"));
        slot.setEndAt(Instant.parse("2026-06-01T18:00:00Z"));
        slot.setNote("Day shift");
        availabilitySlots.save(slot);

        assertThat(availabilitySlots.findByDriverProfileIdOrderByStartAtAsc(profile.getId()))
                .hasSize(1)
                .first()
                .satisfies(saved -> {
                    assertThat(saved.getStartAt()).isEqualTo(Instant.parse("2026-06-01T08:00:00Z"));
                    assertThat(saved.getNote()).isEqualTo("Day shift");
                });
    }
}
