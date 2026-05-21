package com.ringochi.cargoservice;

import java.util.List;

public enum CargoStatus {
    PENDING_PAYMENT,
    PAID,
    CANCELLED;

    public static List<CargoStatus> activeStatuses() {
        return List.of(PENDING_PAYMENT, PAID);
    }
}
