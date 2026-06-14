package com.ringochi.cargoservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CargoControllerTest {
    @Mock
    private CargoOrderRepository cargoOrders;

    @Mock
    private PaymentClient paymentClient;

    private CargoController controller;

    @BeforeEach
    void setUp() {
        CargoProperties properties = new CargoProperties(
                new BigDecimal("1000.00"),
                new BigDecimal("20.0000"),
                new BigDecimal("500.00"),
                new BigDecimal("20.00"),
                new BigDecimal("300.00"));
        controller = new CargoController(cargoOrders, paymentClient, properties);
    }

    @Test
    void createComputesVolumeReservesCapacityAndCreatesSuccessfulPayment() {
        UUID userId = UUID.randomUUID();
        UUID tripId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        CargoOrder request = request(tripId, "Boxes", "10.00", "100.00", "50.00", "40.00");
        when(cargoOrders.findByTripIdAndStatusIn(tripId, CargoStatus.activeStatuses())).thenReturn(List.of());
        when(cargoOrders.save(any(CargoOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentClient.create(any(String.class), any(PaymentClient.CreatePaymentRequest.class)))
                .thenReturn(new PaymentClient.PaymentDto(paymentId, "CARGO_ORDER", UUID.randomUUID(), userId,
                        new BigDecimal("760.00"), "RUB", "SUCCESS"));

        CargoOrder result = controller.create(userId, request);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getTripId()).isEqualTo(tripId);
        assertThat(result.getPickupCity()).isEqualTo("Yekaterinburg");
        assertThat(result.getPickupAddress()).isEqualTo("Lenina 1");
        assertThat(result.getDropoffCity()).isEqualTo("Tyumen");
        assertThat(result.getDropoffAddress()).isEqualTo("Respubliki 2");
        assertThat(result.getDeclaredValue()).isEqualByComparingTo("2500.00");
        assertThat(result.getSenderName()).isEqualTo("Sender One");
        assertThat(result.getSenderPhone()).isEqualTo("+79990000001");
        assertThat(result.getRecipientName()).isEqualTo("Recipient One");
        assertThat(result.getRecipientPhone()).isEqualTo("+79990000002");
        assertThat(result.getVolumeM3()).isEqualByComparingTo("0.2000");
        assertThat(result.getPrice()).isEqualByComparingTo("760.00");
        assertThat(result.getCurrency()).isEqualTo("RUB");
        assertThat(result.getPaymentId()).isEqualTo(paymentId);
        assertThat(result.getStatus()).isEqualTo(CargoStatus.PAID);

        ArgumentCaptor<String> idempotencyKey = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<PaymentClient.CreatePaymentRequest> payment = ArgumentCaptor.forClass(PaymentClient.CreatePaymentRequest.class);
        verify(paymentClient).create(idempotencyKey.capture(), payment.capture());
        assertThat(idempotencyKey.getValue()).isEqualTo("cargo-order-" + result.getId());
        assertThat(payment.getValue().targetType()).isEqualTo("CARGO_ORDER");
        assertThat(payment.getValue().targetId()).isEqualTo(result.getId());
        assertThat(payment.getValue().userId()).isEqualTo(userId);
        assertThat(payment.getValue().amount()).isEqualByComparingTo("760.00");
    }

    @Test
    void createRejectsNonPositiveDimensions() {
        CargoOrder request = request(UUID.randomUUID(), "Boxes", "0.00", "100.00", "50.00", "40.00");

        assertThatThrownBy(() -> controller.create(UUID.randomUUID(), request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(exception.getReason()).isEqualTo("Cargo dimensions and weight must be positive");
                });

        verify(cargoOrders, never()).save(any(CargoOrder.class));
        verify(paymentClient, never()).create(any(String.class), any(PaymentClient.CreatePaymentRequest.class));
    }

    @Test
    void createRejectsCapacityOverflow() {
        UUID tripId = UUID.randomUUID();
        CargoOrder existing = request(tripId, "Existing", "995.00", "100.00", "100.00", "100.00");
        existing.setStatus(CargoStatus.PAID);
        existing.setVolumeM3(new BigDecimal("1.0000"));
        when(cargoOrders.findByTripIdAndStatusIn(tripId, CargoStatus.activeStatuses())).thenReturn(List.of(existing));

        CargoOrder request = request(tripId, "Too heavy", "10.00", "100.00", "50.00", "40.00");

        assertThatThrownBy(() -> controller.create(UUID.randomUUID(), request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).isEqualTo("Cargo capacity exceeded for trip");
                });

        verify(cargoOrders, never()).save(any(CargoOrder.class));
    }

    @Test
    void createCancelsOrderWhenPaymentFails() {
        UUID userId = UUID.randomUUID();
        UUID tripId = UUID.randomUUID();
        CargoOrder request = request(tripId, "Boxes", "10.00", "100.00", "50.00", "40.00");
        when(cargoOrders.findByTripIdAndStatusIn(tripId, CargoStatus.activeStatuses())).thenReturn(List.of());
        when(cargoOrders.save(any(CargoOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentClient.create(any(String.class), any(PaymentClient.CreatePaymentRequest.class)))
                .thenThrow(new IllegalStateException("payment down"));

        assertThatThrownBy(() -> controller.create(userId, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("payment down");

        assertThat(request.getStatus()).isEqualTo(CargoStatus.CANCELLED);
        verify(cargoOrders).save(request);
    }

    @Test
    void myReturnsCurrentUserCargoOrders() {
        UUID userId = UUID.randomUUID();
        CargoOrder order = request(UUID.randomUUID(), "Boxes", "10.00", "100.00", "50.00", "40.00");
        when(cargoOrders.findByUserId(userId)).thenReturn(List.of(order));

        assertThat(controller.my(userId)).containsExactly(order);
    }

    @Test
    void byIdForbidsAnotherUsersOrder() {
        UUID userId = UUID.randomUUID();
        CargoOrder order = request(UUID.randomUUID(), "Boxes", "10.00", "100.00", "50.00", "40.00");
        order.setUserId(UUID.randomUUID());
        when(cargoOrders.findById(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> controller.byId(userId, order.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getReason()).isEqualTo("Cannot access another user's cargo order");
                });
    }

    @Test
    void cancelMarksOwnCargoOrderCancelled() {
        UUID userId = UUID.randomUUID();
        CargoOrder order = request(UUID.randomUUID(), "Boxes", "10.00", "100.00", "50.00", "40.00");
        order.setUserId(userId);
        order.setStatus(CargoStatus.PAID);
        when(cargoOrders.findById(order.getId())).thenReturn(Optional.of(order));
        when(cargoOrders.save(any(CargoOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CargoOrder result = controller.cancel(userId, order.getId());

        assertThat(result.getStatus()).isEqualTo(CargoStatus.CANCELLED);
        verify(cargoOrders).save(order);
    }

    @Test
    void adminListsOrdersAndCapacity() {
        UUID tripId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        CargoOrder order = request(tripId, "Boxes", "10.00", "100.00", "50.00", "40.00");
        order.setUserId(userId);
        order.setPaymentId(paymentId);
        order.setStatus(CargoStatus.PAID);
        order.setVolumeM3(new BigDecimal("0.2000"));
        when(cargoOrders.findAll(anyCargoSpec(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(order)));
        when(cargoOrders.findByTripIdAndStatusIn(tripId, CargoStatus.activeStatuses())).thenReturn(List.of(order));

        assertThat(controller.all("ADMIN", CargoStatus.PAID, tripId, userId, paymentId, 1, 10)).containsExactly(order);
        verify(cargoOrders).findAll(anyCargoSpec(), any(Pageable.class));

        CargoController.CargoCapacity capacity = controller.capacity("ROLE_ADMIN", tripId);
        assertThat(capacity.reservedWeightKg()).isEqualByComparingTo("10.00");
        assertThat(capacity.availableWeightKg()).isEqualByComparingTo("990.00");
        assertThat(capacity.reservedVolumeM3()).isEqualByComparingTo("0.2000");
        assertThat(capacity.availableVolumeM3()).isEqualByComparingTo("19.8000");
    }

    @Test
    void adminByIdReturnsAnyCargoOrder() {
        CargoOrder order = request(UUID.randomUUID(), "Boxes", "10.00", "100.00", "50.00", "40.00");
        when(cargoOrders.findById(order.getId())).thenReturn(Optional.of(order));

        CargoOrder result = controller.adminById("ADMIN", order.getId());

        assertThat(result).isEqualTo(order);
    }

    @Test
    void adminRoleIsRequiredForList() {
        assertThatThrownBy(() -> controller.all("PASSENGER", null, null, null, null, 0, 50))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getReason()).isEqualTo("ADMIN role required");
                });
    }

    @Test
    void adminCancelMarksCargoOrderCancelled() {
        CargoOrder order = request(UUID.randomUUID(), "Boxes", "10.00", "100.00", "50.00", "40.00");
        order.setStatus(CargoStatus.PAID);
        when(cargoOrders.findById(order.getId())).thenReturn(Optional.of(order));
        when(cargoOrders.save(any(CargoOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CargoOrder result = controller.adminCancel("ADMIN", order.getId());

        assertThat(result.getStatus()).isEqualTo(CargoStatus.CANCELLED);
        verify(cargoOrders).save(order);
    }

    private static CargoOrder request(UUID tripId, String description, String weightKg, String lengthCm, String widthCm,
                                      String heightCm) {
        CargoOrder order = new CargoOrder();
        order.setTripId(tripId);
        order.setDescription(description);
        order.setPickupCity("Yekaterinburg");
        order.setPickupAddress("Lenina 1");
        order.setDropoffCity("Tyumen");
        order.setDropoffAddress("Respubliki 2");
        order.setDeclaredValue(new BigDecimal("2500.00"));
        order.setSenderName("Sender One");
        order.setSenderPhone("+79990000001");
        order.setRecipientName("Recipient One");
        order.setRecipientPhone("+79990000002");
        order.setWeightKg(new BigDecimal(weightKg));
        order.setLengthCm(new BigDecimal(lengthCm));
        order.setWidthCm(new BigDecimal(widthCm));
        order.setHeightCm(new BigDecimal(heightCm));
        return order;
    }

    @SuppressWarnings("unchecked")
    private static Specification<CargoOrder> anyCargoSpec() {
        return any(Specification.class);
    }
}
