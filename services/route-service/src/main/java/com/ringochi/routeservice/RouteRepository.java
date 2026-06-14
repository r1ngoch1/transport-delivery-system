package com.ringochi.routeservice;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRepository extends JpaRepository<Route, UUID> {
    List<Route> findByFromCityIdAndToCityId(UUID fromCityId, UUID toCityId);
    boolean existsByFromCityIdOrToCityId(UUID fromCityId, UUID toCityId);
}
