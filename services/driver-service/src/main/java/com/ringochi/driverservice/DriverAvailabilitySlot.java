package com.ringochi.driverservice;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "driver_availability_slots")
public class DriverAvailabilitySlot {
    @Id
    private UUID id = UUID.randomUUID();
    private UUID driverProfileId;
    private Instant startAt;
    private Instant endAt;
    private String note;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getDriverProfileId() { return driverProfileId; }
    public void setDriverProfileId(UUID driverProfileId) { this.driverProfileId = driverProfileId; }
    public Instant getStartAt() { return startAt; }
    public void setStartAt(Instant startAt) { this.startAt = startAt; }
    public Instant getEndAt() { return endAt; }
    public void setEndAt(Instant endAt) { this.endAt = endAt; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
