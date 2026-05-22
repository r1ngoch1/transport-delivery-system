package com.ringochi.driverservice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverProfileRepository extends JpaRepository<DriverProfile, UUID> {
    Optional<DriverProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
    List<DriverProfile> findByActiveTrueAndAvailabilityStatus(DriverAvailabilityStatus availabilityStatus);
}
