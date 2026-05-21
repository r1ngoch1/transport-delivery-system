package com.ringochi.cargoservice;

import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cargo")
public record CargoProperties(
        BigDecimal maxWeightKg,
        BigDecimal maxVolumeM3,
        BigDecimal basePrice,
        BigDecimal pricePerKg,
        BigDecimal pricePerM3) {
}
