package com.ringochi.driverservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DriverControllerTest {
    @Mock
    private DriverProfileRepository drivers;
    @Mock
    private DriverAvailabilitySlotRepository availabilitySlots;

    private DriverController controller;

    @BeforeEach
    void setUp() {
        controller = new DriverController(drivers, availabilitySlots);
    }

    @Test
    void meReturnsCurrentUserDriverProfile() {
        DriverProfile profile = profile(UUID.randomUUID());
        when(drivers.findByUserId(profile.getUserId())).thenReturn(Optional.of(profile));

        DriverProfile result = controller.me(profile.getUserId());

        assertThat(result).isSameAs(profile);
    }

    @Test
    void meFailsWhenCurrentUserHasNoDriverProfile() {
        UUID userId = UUID.randomUUID();
        when(drivers.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.me(userId))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(exception.getReason()).isEqualTo("Driver profile not found");
                });
    }

    @Test
    void updateMeChangesEditableDriverFields() {
        DriverProfile profile = profile(UUID.randomUUID());
        DriverProfile request = new DriverProfile();
        request.setPhone("+79990000000");
        request.setLicenseNumber("NEW-123456");
        request.setLicenseCategory("D");
        request.setLicenseExpiresAt(LocalDate.of(2031, 5, 20));
        request.setAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE);
        when(drivers.findByUserId(profile.getUserId())).thenReturn(Optional.of(profile));
        when(drivers.save(any(DriverProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverProfile result = controller.updateMe(profile.getUserId(), request);

        assertThat(result.getPhone()).isEqualTo("+79990000000");
        assertThat(result.getLicenseNumber()).isEqualTo("NEW-123456");
        assertThat(result.getLicenseCategory()).isEqualTo("D");
        assertThat(result.getLicenseExpiresAt()).isEqualTo(LocalDate.of(2031, 5, 20));
        assertThat(result.getAvailabilityStatus()).isEqualTo(DriverAvailabilityStatus.AVAILABLE);
        assertThat(result.getUpdatedAt()).isAfter(result.getCreatedAt());
        verify(drivers).save(profile);
    }

    @Test
    void currentDriverCreatesOwnProfile() {
        UUID userId = UUID.randomUUID();
        DriverProfile request = profile(UUID.randomUUID());
        request.setAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE);
        when(drivers.existsByUserId(userId)).thenReturn(false);
        when(drivers.save(any(DriverProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverProfile result = controller.createMe(userId, "DRIVER", request);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getFullName()).isEqualTo("Ivan Driver");
        assertThat(result.getAvailabilityStatus()).isEqualTo(DriverAvailabilityStatus.UNAVAILABLE);
        assertThat(result.isActive()).isTrue();
        ArgumentCaptor<DriverProfile> captor = ArgumentCaptor.forClass(DriverProfile.class);
        verify(drivers).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void currentDriverCreateRejectsDuplicateProfile() {
        UUID userId = UUID.randomUUID();
        DriverProfile request = profile(userId);
        when(drivers.existsByUserId(userId)).thenReturn(true);

        assertThatThrownBy(() -> controller.createMe(userId, "DRIVER", request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).isEqualTo("Driver profile already exists for user");
                });

        verify(drivers, never()).save(any(DriverProfile.class));
    }

    @Test
    void driverRoleIsRequiredForCurrentDriverCreate() {
        DriverProfile request = profile(UUID.randomUUID());

        assertThatThrownBy(() -> controller.createMe(UUID.randomUUID(), "PASSENGER", request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getReason()).isEqualTo("DRIVER role required");
                });

        verify(drivers, never()).save(any(DriverProfile.class));
    }

    @Test
    void adminCreatesDriverProfile() {
        UUID userId = UUID.randomUUID();
        DriverProfile request = profile(userId);
        when(drivers.existsByUserId(userId)).thenReturn(false);
        when(drivers.save(any(DriverProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverProfile result = controller.create("ADMIN", request);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getAvailabilityStatus()).isEqualTo(DriverAvailabilityStatus.UNAVAILABLE);
        assertThat(result.isActive()).isTrue();
        verify(drivers).save(request);
    }

    @Test
    void adminCreateRejectsDuplicateUserId() {
        DriverProfile request = profile(UUID.randomUUID());
        when(drivers.existsByUserId(request.getUserId())).thenReturn(true);

        assertThatThrownBy(() -> controller.create("ADMIN", request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).isEqualTo("Driver profile already exists for user");
                });

        verify(drivers, never()).save(any(DriverProfile.class));
    }

    @Test
    void adminRoleIsRequiredForCreate() {
        DriverProfile request = profile(UUID.randomUUID());

        assertThatThrownBy(() -> controller.create("PASSENGER", request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getReason()).isEqualTo("ADMIN role required");
                });

        verify(drivers, never()).save(any(DriverProfile.class));
    }

    @Test
    void adminListsAndGetsDriverProfiles() {
        DriverProfile profile = profile(UUID.randomUUID());
        when(drivers.findAll()).thenReturn(List.of(profile));
        when(drivers.findById(profile.getId())).thenReturn(Optional.of(profile));

        assertThat(controller.all("ADMIN")).containsExactly(profile);
        assertThat(controller.byId("ADMIN", profile.getId())).isSameAs(profile);
    }

    @Test
    void adminUpdatesDriverProfileIncludingActiveFlag() {
        DriverProfile profile = profile(UUID.randomUUID());
        DriverProfile request = new DriverProfile();
        request.setFullName("Updated Driver");
        request.setAvailabilityStatus(DriverAvailabilityStatus.SUSPENDED);
        request.setActive(false);
        when(drivers.findById(profile.getId())).thenReturn(Optional.of(profile));
        when(drivers.save(any(DriverProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverProfile result = controller.update("ADMIN", profile.getId(), request);

        assertThat(result.getFullName()).isEqualTo("Updated Driver");
        assertThat(result.getAvailabilityStatus()).isEqualTo(DriverAvailabilityStatus.SUSPENDED);
        assertThat(result.isActive()).isFalse();
        verify(drivers).save(profile);
    }

    @Test
    void availableReturnsActiveAvailableDrivers() {
        DriverProfile profile = profile(UUID.randomUUID());
        profile.setAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE);
        when(drivers.findByActiveTrueAndAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE)).thenReturn(List.of(profile));

        List<DriverProfile> result = controller.available();

        assertThat(result).containsExactly(profile);
    }

    @Test
    void currentDriverManagesAvailabilitySlots() {
        DriverProfile profile = profile(UUID.randomUUID());
        DriverAvailabilitySlot request = slot(profile.getId());
        when(drivers.findByUserId(profile.getUserId())).thenReturn(Optional.of(profile));
        when(availabilitySlots.findByDriverProfileIdOrderByStartAtAsc(profile.getId())).thenReturn(List.of(request));
        when(availabilitySlots.save(any(DriverAvailabilitySlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverAvailabilitySlot created = controller.createAvailabilitySlot(profile.getUserId(), request);
        List<DriverAvailabilitySlot> result = controller.myAvailability(profile.getUserId());

        assertThat(created.getDriverProfileId()).isEqualTo(profile.getId());
        assertThat(result).containsExactly(request);
        verify(availabilitySlots).save(request);
    }

    @Test
    void currentDriverRejectsOverlappingAvailabilitySlot() {
        DriverProfile profile = profile(UUID.randomUUID());
        DriverAvailabilitySlot existing = slot(profile.getId());
        DriverAvailabilitySlot request = slot(profile.getId());
        when(drivers.findByUserId(profile.getUserId())).thenReturn(Optional.of(profile));
        when(availabilitySlots.findOverlappingSlots(profile.getId(), request.getStartAt(), request.getEndAt(), null))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> controller.createAvailabilitySlot(profile.getUserId(), request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).isEqualTo("Driver availability overlaps existing slot");
                });

        verify(availabilitySlots, never()).save(any(DriverAvailabilitySlot.class));
    }

    @Test
    void currentDriverUpdatesAndDeletesOwnAvailabilitySlot() {
        DriverProfile profile = profile(UUID.randomUUID());
        DriverAvailabilitySlot existing = slot(profile.getId());
        DriverAvailabilitySlot request = new DriverAvailabilitySlot();
        request.setStartAt(existing.getStartAt().plusSeconds(3600));
        request.setEndAt(existing.getEndAt().plusSeconds(3600));
        request.setNote("Updated");
        when(drivers.findByUserId(profile.getUserId())).thenReturn(Optional.of(profile));
        when(availabilitySlots.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(availabilitySlots.save(any(DriverAvailabilitySlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverAvailabilitySlot updated = controller.updateAvailabilitySlot(profile.getUserId(), existing.getId(), request);
        controller.deleteAvailabilitySlot(profile.getUserId(), existing.getId());

        assertThat(updated.getNote()).isEqualTo("Updated");
        verify(availabilitySlots).delete(existing);
    }

    @Test
    void byIdFailsForMissingDriverProfile() {
        UUID id = UUID.randomUUID();
        when(drivers.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.byId("ADMIN", id))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(exception.getReason()).isEqualTo("Driver profile not found");
                });
    }

    private static DriverProfile profile(UUID userId) {
        DriverProfile profile = new DriverProfile();
        profile.setUserId(userId);
        profile.setFullName("Ivan Driver");
        profile.setPhone("+79000000000");
        profile.setLicenseNumber("DRV-123456");
        profile.setLicenseCategory("B");
        profile.setLicenseExpiresAt(LocalDate.of(2030, 1, 1));
        return profile;
    }

    private static DriverAvailabilitySlot slot(UUID driverProfileId) {
        DriverAvailabilitySlot slot = new DriverAvailabilitySlot();
        slot.setDriverProfileId(driverProfileId);
        slot.setStartAt(java.time.Instant.parse("2026-06-01T08:00:00Z"));
        slot.setEndAt(java.time.Instant.parse("2026-06-01T18:00:00Z"));
        slot.setNote("Day shift");
        return slot;
    }
}
