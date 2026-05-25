package com.ringochi.driverservice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DriverAvailabilitySlotRepository extends JpaRepository<DriverAvailabilitySlot, UUID> {
    List<DriverAvailabilitySlot> findByDriverProfileIdOrderByStartAtAsc(UUID driverProfileId);

    @Query("""
            select slot
            from DriverAvailabilitySlot slot
            where slot.driverProfileId = :driverProfileId
              and (:excludedId is null or slot.id <> :excludedId)
              and slot.startAt < :endAt
              and slot.endAt > :startAt
            """)
    List<DriverAvailabilitySlot> findOverlappingSlots(@Param("driverProfileId") UUID driverProfileId,
                                                      @Param("startAt") Instant startAt,
                                                      @Param("endAt") Instant endAt,
                                                      @Param("excludedId") UUID excludedId);
}
