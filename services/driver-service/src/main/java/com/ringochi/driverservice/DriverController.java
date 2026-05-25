package com.ringochi.driverservice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final DriverAvailabilitySlotRepository availabilitySlots;

    public DriverController(DriverProfileRepository drivers, DriverAvailabilitySlotRepository availabilitySlots) {
        this.drivers = drivers;
        this.availabilitySlots = availabilitySlots;
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

    @GetMapping("/me/availability")
    public List<DriverAvailabilitySlot> myAvailability(@RequestHeader("X-User-Id") UUID userId) {
        DriverProfile profile = byUserId(userId);
        return availabilitySlots.findByDriverProfileIdOrderByStartAtAsc(profile.getId());
    }

    @PostMapping("/me/availability")
    @ResponseStatus(HttpStatus.CREATED)
    public DriverAvailabilitySlot createAvailabilitySlot(@RequestHeader("X-User-Id") UUID userId,
                                                         @RequestBody DriverAvailabilitySlot request) {
        DriverProfile profile = byUserId(userId);
        request.setDriverProfileId(profile.getId());
        validateAvailabilitySlot(request);
        ensureNoAvailabilityOverlap(request, null);
        touch(request);
        return availabilitySlots.save(request);
    }

    @PatchMapping("/me/availability/{id}")
    public DriverAvailabilitySlot updateAvailabilitySlot(@RequestHeader("X-User-Id") UUID userId,
                                                         @PathVariable UUID id,
                                                         @RequestBody DriverAvailabilitySlot request) {
        DriverProfile profile = byUserId(userId);
        DriverAvailabilitySlot slot = availabilitySlotById(profile, id);
        if (request.getStartAt() != null) slot.setStartAt(request.getStartAt());
        if (request.getEndAt() != null) slot.setEndAt(request.getEndAt());
        if (request.getNote() != null) slot.setNote(request.getNote());
        validateAvailabilitySlot(slot);
        ensureNoAvailabilityOverlap(slot, slot.getId());
        touch(slot);
        return availabilitySlots.save(slot);
    }

    @DeleteMapping("/me/availability/{id}")
    public ResponseEntity<Void> deleteAvailabilitySlot(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        DriverProfile profile = byUserId(userId);
        DriverAvailabilitySlot slot = availabilitySlotById(profile, id);
        availabilitySlots.delete(slot);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me")
    @ResponseStatus(HttpStatus.CREATED)
    public DriverProfile createMe(@RequestHeader("X-User-Id") UUID userId,
                                  @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                  @RequestBody DriverProfile request) {
        requireDriver(roles);
        request.setUserId(userId);
        return createProfile(request);
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
        return createProfile(request);
    }

    private DriverProfile createProfile(DriverProfile request) {
        if (drivers.existsByUserId(request.getUserId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver profile already exists for user");
        }
        request.setAvailabilityStatus(DriverAvailabilityStatus.UNAVAILABLE);
        request.setActive(true);
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

    private DriverAvailabilitySlot availabilitySlotById(DriverProfile profile, UUID id) {
        DriverAvailabilitySlot slot = availabilitySlots.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver availability slot not found"));
        if (!profile.getId().equals(slot.getDriverProfileId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another driver's availability slot");
        }
        return slot;
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

    private void touch(DriverAvailabilitySlot slot) {
        Instant now = Instant.now();
        if (slot.getCreatedAt() == null) {
            slot.setCreatedAt(now);
        }
        slot.setUpdatedAt(now);
    }

    private void validateAvailabilitySlot(DriverAvailabilitySlot slot) {
        if (slot.getStartAt() == null || slot.getEndAt() == null || !slot.getEndAt().isAfter(slot.getStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Driver availability slot end must be after start");
        }
    }

    private void ensureNoAvailabilityOverlap(DriverAvailabilitySlot slot, UUID excludedId) {
        if (!availabilitySlots.findOverlappingSlots(slot.getDriverProfileId(), slot.getStartAt(), slot.getEndAt(), excludedId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver availability overlaps existing slot");
        }
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found");
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    private void requireDriver(String roles) {
        if (roles == null || !roles.contains("DRIVER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "DRIVER role required");
        }
    }
}
