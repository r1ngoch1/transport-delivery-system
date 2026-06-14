package com.ringochi.apigateway;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

class JwtAuthenticationFilterTest {
    private static final String SECRET = "01234567890123456789012345678901";

    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(SECRET);

    @Test
    void addsUserHeadersForProtectedCityCreateRequest() {
        ServerWebExchange forwarded = filter(MockServerHttpRequest.post("/api/cities")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("user-1", "ADMIN"))
                .build());

        assertThat(forwarded.getRequest().getHeaders().getFirst("X-User-Id")).isEqualTo("user-1");
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-User-Roles")).contains("ADMIN");
    }

    @Test
    void allowsPublicCityReadRequestWithoutToken() {
        ServerWebExchange forwarded = filter(MockServerHttpRequest.get("/api/cities").build());

        assertThat(forwarded).isNotNull();
    }

    @Test
    void rejectsCityCreateRequestWithoutToken() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/api/cities").build());
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = nextExchange -> {
            forwarded.set(nextExchange);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded).hasValue(null);
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private ServerWebExchange filter(MockServerHttpRequest request) {
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = nextExchange -> {
            forwarded.set(nextExchange);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        return forwarded.get();
    }

    private String token(String subject, String role) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(subject)
                .claim("roles", List.of(role))
                .signWith(key)
                .compact();
    }
}
