package com.ringochi.tripservice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface TripRepository extends JpaRepository<Trip, UUID>, JpaSpecificationExecutor<Trip> {
    List<Trip> findByRouteId(UUID routeId);

    @Query("select t from Trip t where t.routeId = :routeId and t.departureTime >= :from and t.departureTime < :to")
    List<Trip> search(@Param("routeId") UUID routeId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select t from Trip t
            where t.driverId = :driverId
              and t.id <> :excludedTripId
              and t.status in (com.ringochi.tripservice.TripStatus.SCHEDULED, com.ringochi.tripservice.TripStatus.IN_PROGRESS)
              and t.departureTime < :arrivalTime
              and t.arrivalTime > :departureTime
            """)
    List<Trip> findDriverScheduleConflicts(@Param("driverId") UUID driverId,
                                           @Param("departureTime") Instant departureTime,
                                           @Param("arrivalTime") Instant arrivalTime,
                                           @Param("excludedTripId") UUID excludedTripId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Trip t where t.id = :id")
    java.util.Optional<Trip> findLocked(@Param("id") UUID id);
}
