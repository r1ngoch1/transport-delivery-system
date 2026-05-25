package com.ringochi.cargoservice;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CargoOrderRepository extends JpaRepository<CargoOrder, UUID>, JpaSpecificationExecutor<CargoOrder> {
    List<CargoOrder> findByUserId(UUID userId);

    List<CargoOrder> findByTripIdAndStatusIn(UUID tripId, Collection<CargoStatus> statuses);
}
