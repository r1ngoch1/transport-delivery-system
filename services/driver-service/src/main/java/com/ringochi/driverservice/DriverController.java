package com.ringochi.driverservice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {
    private final DriverProfileRepository drivers;

    public DriverController(DriverProfileRepository drivers) {
        this.drivers = drivers;
    }

    @GetMapping("/me")
    public DriverProfile me(@RequestHeader("X-User-Id") UUID userId) {
        return byUserId(userId);
    }

    @PatchMapping("/me")
    public DriverProfile updateMe(@RequestHeader("X-User-Id") UUID userId, @RequestBody DriverProfile request) {
        DriverProfile profile = byUserId(userId);
        applyEditableFields(profile, request);
        touch(profile);
        return drivers.save(profile);
    }

    @GetMapping
    public List<DriverProfile> all(@RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        return drivers.findAll();
    }

    @GetMapping("/available")
    public List<DriverProfile> available() {
        return drivers.findByActiveTrueAndAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE);
    }

    @GetMapping("/{id}")
    public DriverProfile byId(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id) {
        requireAdmin(roles);
        return byId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DriverProfile create(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                @RequestBody DriverProfile request) {
        requireAdmin(roles);
        if (drivers.existsByUserId(request.getUserId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver profile already exists for user");
        }
        if (request.getAvailabilityStatus() == null) {
            request.setAvailabilityStatus(DriverAvailabilityStatus.UNAVAILABLE);
        }
        Instant now = Instant.now();
        if (request.getCreatedAt() == null) {
            request.setCreatedAt(now);
        }
        if (request.getUpdatedAt() == null) {
            request.setUpdatedAt(request.getCreatedAt());
        }
        return drivers.save(request);
    }

    @PatchMapping("/{id}")
    public DriverProfile update(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id,
                                @RequestBody DriverProfile request) {
        requireAdmin(roles);
        DriverProfile profile = byId(id);
        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        applyEditableFields(profile, request);
        profile.setActive(request.isActive());
        touch(profile);
        return drivers.save(profile);
    }

    private DriverProfile byUserId(UUID userId) {
        return drivers.findByUserId(userId).orElseThrow(() -> notFound());
    }

    private DriverProfile byId(UUID id) {
        return drivers.findById(id).orElseThrow(() -> notFound());
    }

    private void applyEditableFields(DriverProfile profile, DriverProfile request) {
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getLicenseNumber() != null) profile.setLicenseNumber(request.getLicenseNumber());
        if (request.getLicenseCategory() != null) profile.setLicenseCategory(request.getLicenseCategory());
        if (request.getLicenseExpiresAt() != null) profile.setLicenseExpiresAt(request.getLicenseExpiresAt());
        if (request.getAvailabilityStatus() != null) profile.setAvailabilityStatus(request.getAvailabilityStatus());
    }

    private void touch(DriverProfile profile) {
        Instant updatedAt = Instant.now();
        if (profile.getCreatedAt() != null && !updatedAt.isAfter(profile.getCreatedAt())) {
            updatedAt = profile.getCreatedAt().plusNanos(1);
        }
        profile.setUpdatedAt(updatedAt);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found");
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }
}
