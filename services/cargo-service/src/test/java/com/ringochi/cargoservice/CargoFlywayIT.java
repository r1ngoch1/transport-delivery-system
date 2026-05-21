package com.ringochi.cargoservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@ActiveProfiles("test")
@SpringBootTest
class CargoFlywayIT {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private CargoOrderRepository cargoOrders;

    @Test
    void flywayCreatesCargoOrdersTableOnPostgres() {
        UUID userId = UUID.randomUUID();
        UUID tripId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        CargoOrder order = new CargoOrder();
        order.setUserId(userId);
        order.setTripId(tripId);
        order.setDescription("Demo cargo");
        order.setWeightKg(new BigDecimal("12.50"));
        order.setLengthCm(new BigDecimal("100.00"));
        order.setWidthCm(new BigDecimal("50.00"));
        order.setHeightCm(new BigDecimal("40.00"));
        order.setVolumeM3(new BigDecimal("0.2000"));
        order.setPrice(new BigDecimal("810.00"));
        order.setCurrency("RUB");
        order.setPaymentId(paymentId);
        order.setStatus(CargoStatus.PAID);

        cargoOrders.save(order);

        assertThat(cargoOrders.findByUserId(userId))
                .singleElement()
                .satisfies(saved -> {
                    assertThat(saved.getTripId()).isEqualTo(tripId);
                    assertThat(saved.getDescription()).isEqualTo("Demo cargo");
                    assertThat(saved.getWeightKg()).isEqualByComparingTo("12.50");
                    assertThat(saved.getVolumeM3()).isEqualByComparingTo("0.2000");
                    assertThat(saved.getPrice()).isEqualByComparingTo("810.00");
                    assertThat(saved.getPaymentId()).isEqualTo(paymentId);
                    assertThat(saved.getStatus()).isEqualTo(CargoStatus.PAID);
                    assertThat(saved.getCreatedAt()).isNotNull();
                    assertThat(saved.getUpdatedAt()).isNotNull();
                });
    }
}
