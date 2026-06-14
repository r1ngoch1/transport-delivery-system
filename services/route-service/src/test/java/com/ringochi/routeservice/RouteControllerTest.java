package com.ringochi.routeservice;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RouteControllerTest {
    @Mock
    private CityRepository cities;
    @Mock
    private RouteRepository routes;

    private RouteController controller;

    @BeforeEach
    void setUp() {
        controller = new RouteController(cities, routes);
    }

    @Test
    void deletesCityWhenItIsNotUsedByRoutes() {
        UUID cityId = UUID.randomUUID();
        City city = new City();
        when(cities.findById(cityId)).thenReturn(Optional.of(city));
        when(routes.existsByFromCityIdOrToCityId(cityId, cityId)).thenReturn(false);

        controller.deleteCity("ADMIN", cityId);

        verify(cities).delete(city);
    }

    @Test
    void rejectsCityDeleteWhenCityIsUsedByRoute() {
        UUID cityId = UUID.randomUUID();
        City city = new City();
        when(cities.findById(cityId)).thenReturn(Optional.of(city));
        when(routes.existsByFromCityIdOrToCityId(cityId, cityId)).thenReturn(true);

        assertThatThrownBy(() -> controller.deleteCity("ADMIN", cityId))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(cities, never()).delete(city);
    }

    @Test
    void deletesRoute() {
        UUID routeId = UUID.randomUUID();
        Route route = new Route();
        when(routes.findById(routeId)).thenReturn(Optional.of(route));

        controller.deleteRoute("ADMIN", routeId);

        verify(routes).delete(route);
    }
}
