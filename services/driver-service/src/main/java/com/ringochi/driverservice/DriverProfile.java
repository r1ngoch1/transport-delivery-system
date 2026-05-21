package com.ringochi.driverservice;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "driver_profiles")
public class DriverProfile {
    @Id
    private UUID id = UUID.randomUUID();
    private UUID userId;
    private String fullName;
    private String phone;
    private String licenseNumber;
    private String licenseCategory;
    private LocalDate licenseExpiresAt;
    @Enumerated(EnumType.STRING)
    private DriverAvailabilityStatus availabilityStatus = DriverAvailabilityStatus.UNAVAILABLE;
    private boolean active = true;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public String getLicenseCategory() { return licenseCategory; }
    public void setLicenseCategory(String licenseCategory) { this.licenseCategory = licenseCategory; }
    public LocalDate getLicenseExpiresAt() { return licenseExpiresAt; }
    public void setLicenseExpiresAt(LocalDate licenseExpiresAt) { this.licenseExpiresAt = licenseExpiresAt; }
    public DriverAvailabilityStatus getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(DriverAvailabilityStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
