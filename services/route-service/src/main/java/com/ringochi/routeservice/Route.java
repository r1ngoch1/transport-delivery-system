package com.ringochi.routeservice;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "routes")
public class Route {
    @Id
    private UUID id = UUID.randomUUID();
    private UUID fromCityId;
    private UUID toCityId;
    private int distanceKm;
    private int estimatedDurationMinutes;
    private boolean active = true;

    public UUID getId() { return id; }
    public UUID getFromCityId() { return fromCityId; }
    public void setFromCityId(UUID fromCityId) { this.fromCityId = fromCityId; }
    public UUID getToCityId() { return toCityId; }
    public void setToCityId(UUID toCityId) { this.toCityId = toCityId; }
    public int getDistanceKm() { return distanceKm; }
    public void setDistanceKm(int distanceKm) { this.distanceKm = distanceKm; }
    public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(int estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
