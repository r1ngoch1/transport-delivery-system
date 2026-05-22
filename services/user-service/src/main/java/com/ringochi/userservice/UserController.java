package com.ringochi.userservice;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserController(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        if (users.existsByEmail(request.email()) || users.existsByPhone(request.phone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.getRoles().add(request.role() == null ? Role.PASSENGER : request.role());
        users.save(user);
        return new AuthResponse(jwtService.issue(user), toDto(user));
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        User user = users.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials");
        }
        return new AuthResponse(jwtService.issue(user), toDto(user));
    }

    @GetMapping("/users/me")
    public UserDto me(@RequestHeader("X-User-Id") UUID userId) {
        return users.findById(userId).map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PatchMapping("/users/me")
    public UserDto updateMe(@RequestHeader("X-User-Id") UUID userId, @RequestBody UpdateUserRequest request) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        Instant updatedAt = Instant.now();
        if (!updatedAt.isAfter(user.getCreatedAt())) {
            updatedAt = user.getCreatedAt().plusNanos(1);
        }
        user.setUpdatedAt(updatedAt);
        return toDto(users.save(user));
    }

    @GetMapping("/users")
    public List<UserDto> all(@RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        return users.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/users/{id}")
    public UserDto byId(@PathVariable UUID id) {
        return users.findById(id).map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getPhone(), user.getFullName(), user.isEnabled(),
                user.getRoles(), user.getCreatedAt(), user.getUpdatedAt());
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    public record RegisterRequest(String email, String phone, String password, String fullName, Role role) {}
    public record LoginRequest(String email, String password) {}
    public record UpdateUserRequest(String phone, String fullName) {}
    public record AuthResponse(String accessToken, UserDto user) {}
    public record UserDto(UUID id, String email, String phone, String fullName, boolean enabled, Set<Role> roles,
                          Instant createdAt, Instant updatedAt) {}
}
