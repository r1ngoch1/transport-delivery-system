package com.ringochi.tripservice;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trips")
public class Trip {
    @Id
    private UUID id = UUID.randomUUID();
    private UUID routeId;
    private UUID driverId;
    private Instant departureTime;
    private Instant arrivalTime;
    private int totalSeats;
    private int availableSeats;
    private double totalCargoVolume;
    private double availableCargoVolume;
    private BigDecimal price;
    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.SCHEDULED;
    @Version
    private long version;

    public UUID getId() { return id; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getDriverId() { return driverId; }
    public void setDriverId(UUID driverId) { this.driverId = driverId; }
    public Instant getDepartureTime() { return departureTime; }
    public void setDepartureTime(Instant departureTime) { this.departureTime = departureTime; }
    public Instant getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(Instant arrivalTime) { this.arrivalTime = arrivalTime; }
    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }
    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }
    public double getTotalCargoVolume() { return totalCargoVolume; }
    public void setTotalCargoVolume(double totalCargoVolume) { this.totalCargoVolume = totalCargoVolume; }
    public double getAvailableCargoVolume() { return availableCargoVolume; }
    public void setAvailableCargoVolume(double availableCargoVolume) { this.availableCargoVolume = availableCargoVolume; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public TripStatus getStatus() { return status; }
    public void setStatus(TripStatus status) { this.status = status; }
}
