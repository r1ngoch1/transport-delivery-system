package com.ringochi.userservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {
    @Mock
    private UserRepository users;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController(users, passwordEncoder, jwtService);
    }

    @Test
    void registerCreatesPassengerByDefaultAndReturnsToken() {
        UserController.RegisterRequest request = new UserController.RegisterRequest(
                "passenger@example.com", "+10000000001", "secret", "Passenger One", null);
        when(users.existsByEmail(request.email())).thenReturn(false);
        when(users.existsByPhone(request.phone())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-secret");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.issue(any(User.class))).thenReturn("jwt-token");

        UserController.AuthResponse response = controller.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(users).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo(request.email());
        assertThat(savedUser.getPhone()).isEqualTo(request.phone());
        assertThat(savedUser.getFullName()).isEqualTo(request.fullName());
        assertThat(savedUser.getPasswordHash()).isEqualTo("encoded-secret");
        assertThat(savedUser.getRoles()).containsExactly(Role.PASSENGER);
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo(request.email());
    }

    @Test
    void registerRejectsDuplicateEmailOrPhone() {
        UserController.RegisterRequest request = new UserController.RegisterRequest(
                "passenger@example.com", "+10000000001", "secret", "Passenger One", Role.DRIVER);
        when(users.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> controller.register(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(users, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void registerRejectsDuplicatePhone() {
        UserController.RegisterRequest request = new UserController.RegisterRequest(
                "passenger@example.com", "+10000000001", "secret", "Passenger One", Role.DRIVER);
        when(users.existsByEmail(request.email())).thenReturn(false);
        when(users.existsByPhone(request.phone())).thenReturn(true);

        assertThatThrownBy(() -> controller.register(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(users, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void loginReturnsTokenWhenPasswordMatches() {
        User user = user("passenger@example.com", "+10000000001", "Passenger One", Role.PASSENGER);
        user.setPasswordHash("encoded-secret");
        UserController.LoginRequest request = new UserController.LoginRequest(user.getEmail(), "secret");
        when(users.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
        when(jwtService.issue(user)).thenReturn("jwt-token");

        UserController.AuthResponse response = controller.login(request);

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.user().id()).isEqualTo(user.getId());
        assertThat(response.user().roles()).containsExactly(Role.PASSENGER);
    }

    @Test
    void loginRejectsBadCredentials() {
        User user = user("passenger@example.com", "+10000000001", "Passenger One", Role.PASSENGER);
        user.setPasswordHash("encoded-secret");
        UserController.LoginRequest request = new UserController.LoginRequest(user.getEmail(), "wrong");
        when(users.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> controller.login(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));

        verify(jwtService, never()).issue(any(User.class));
    }

    @Test
    void meReturnsCurrentUser() {
        User user = user("passenger@example.com", "+10000000001", "Passenger One", Role.PASSENGER);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));

        UserController.UserDto response = controller.me(user.getId());

        assertThat(response.id()).isEqualTo(user.getId());
        assertThat(response.email()).isEqualTo(user.getEmail());
        assertThat(response.roles()).containsExactly(Role.PASSENGER);
    }

    @Test
    void updateMeChangesProvidedFields() {
        User user = user("passenger@example.com", "+10000000001", "Passenger One", Role.PASSENGER);
        UserController.UpdateUserRequest request = new UserController.UpdateUserRequest("+10000000002", "Passenger Two");
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);

        UserController.UserDto response = controller.updateMe(user.getId(), request);

        assertThat(response.phone()).isEqualTo(request.phone());
        assertThat(response.fullName()).isEqualTo(request.fullName());
        assertThat(user.getUpdatedAt()).isAfter(user.getCreatedAt());
        verify(users).save(user);
    }

    private static User user(String email, String phone, String fullName, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPhone(phone);
        user.setFullName(fullName);
        user.getRoles().add(role);
        return user;
    }
}
