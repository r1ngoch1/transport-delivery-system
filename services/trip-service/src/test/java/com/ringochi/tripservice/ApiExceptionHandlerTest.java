package com.ringochi.tripservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @ParameterizedTest
    @ValueSource(ints = {400, 401, 403, 404, 409})
    void responseStatusExceptionUsesUnifiedErrorFormat(int statusCode) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");
        HttpStatus status = HttpStatus.valueOf(statusCode);

        var response = handler.handle(new ResponseStatusException(status, "Request failed"), request);

        assertThat(response.getStatusCode()).isEqualTo(status);
        assertThat(response.getBody())
                .isNotNull()
                .satisfies(error -> {
                    assertThat(error.timestamp()).isNotNull();
                    assertThat(error.status()).isEqualTo(statusCode);
                    assertThat(error.error()).isEqualTo(status.getReasonPhrase());
                    assertThat(error.message()).isEqualTo("Request failed");
                    assertThat(error.path()).isEqualTo("/api/test");
                });
    }

    @Test
    void responseStatusExceptionFallsBackToDefaultMessage() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");

        var response = handler.handle(new ResponseStatusException(HttpStatus.BAD_REQUEST), request);

        assertThat(response.getBody())
                .isNotNull()
                .extracting(ApiExceptionHandler.ErrorResponse::message)
                .isEqualTo("Request failed");
    }

    @Test
    void validationExceptionUsesUnifiedErrorFormat() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
        var bindingResult = new BeanPropertyBindingResult(new ValidationTarget(null), "target");
        bindingResult.addError(new FieldError("target", "name", "must not be blank"));

        var response = handler.handle(validationException(bindingResult), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody())
                .isNotNull()
                .satisfies(error -> {
                    assertThat(error.status()).isEqualTo(400);
                    assertThat(error.error()).isEqualTo("Bad Request");
                    assertThat(error.message()).isEqualTo("name: must not be blank");
                    assertThat(error.path()).isEqualTo("/api/test");
                });
    }

    private static MethodArgumentNotValidException validationException(BeanPropertyBindingResult bindingResult) throws Exception {
        Method method = ApiExceptionHandlerTest.class.getDeclaredMethod("validate", ValidationTarget.class);
        return new MethodArgumentNotValidException(new MethodParameter(method, 0), bindingResult);
    }

    @SuppressWarnings("unused")
    private static void validate(ValidationTarget target) {
    }

    private record ValidationTarget(String name) {
    }
}
