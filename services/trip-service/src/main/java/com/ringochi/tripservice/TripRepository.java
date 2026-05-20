package com.ringochi.tripservice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByRouteId(UUID routeId);

    @Query("select t from Trip t where t.routeId = :routeId and t.departureTime >= :from and t.departureTime < :to")
    List<Trip> search(@Param("routeId") UUID routeId, @Param("from") Instant from, @Param("to") Instant to);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Trip t where t.id = :id")
    java.util.Optional<Trip> findLocked(@Param("id") UUID id);
}
