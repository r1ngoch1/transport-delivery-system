package com.ringochi.routeservice;

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
@RequestMapping("/api")
public class RouteController {
    private final CityRepository cities;
    private final RouteRepository routes;

    public RouteController(CityRepository cities, RouteRepository routes) {
        this.cities = cities;
        this.routes = routes;
    }

    @GetMapping("/cities")
    public List<City> cities() {
        return cities.findAll();
    }

    @GetMapping("/cities/{id}")
    public City city(@PathVariable UUID id) {
        return cities.findById(id).orElseThrow(() -> notFound("City not found"));
    }

    @PostMapping("/cities")
    @ResponseStatus(HttpStatus.CREATED)
    public City createCity(@RequestHeader(value = "X-User-Roles", required = false) String roles, @RequestBody City city) {
        requireAdmin(roles);
        return cities.save(city);
    }

    @PatchMapping("/cities/{id}")
    public City updateCity(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id,
                           @RequestBody City request) {
        requireAdmin(roles);
        City city = city(id);
        if (request.getName() != null) city.setName(request.getName());
        if (request.getRegion() != null) city.setRegion(request.getRegion());
        if (request.getCountry() != null) city.setCountry(request.getCountry());
        city.setActive(request.isActive());
        return cities.save(city);
    }

    @GetMapping("/routes")
    public List<Route> routes() {
        return routes.findAll();
    }

    @GetMapping("/routes/{id}")
    public Route route(@PathVariable UUID id) {
        return routes.findById(id).orElseThrow(() -> notFound("Route not found"));
    }

    @GetMapping("/routes/search")
    public List<Route> search(UUID fromCityId, UUID toCityId) {
        return routes.findByFromCityIdAndToCityId(fromCityId, toCityId);
    }

    @PostMapping("/routes")
    @ResponseStatus(HttpStatus.CREATED)
    public Route createRoute(@RequestHeader(value = "X-User-Roles", required = false) String roles, @RequestBody Route route) {
        requireAdmin(roles);
        city(route.getFromCityId());
        city(route.getToCityId());
        return routes.save(route);
    }

    @PatchMapping("/routes/{id}")
    public Route updateRoute(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id,
                             @RequestBody Route request) {
        requireAdmin(roles);
        Route route = route(id);
        if (request.getFromCityId() != null) route.setFromCityId(request.getFromCityId());
        if (request.getToCityId() != null) route.setToCityId(request.getToCityId());
        if (request.getDistanceKm() > 0) route.setDistanceKm(request.getDistanceKm());
        if (request.getEstimatedDurationMinutes() > 0) route.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        route.setActive(request.isActive());
        return routes.save(route);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }
}
