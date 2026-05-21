package com.ringochi.driverservice;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ErrorResponse> handle(ResponseStatusException ex, HttpServletRequest request) {
        int status = ex.getStatusCode().value();
        String message = ex.getReason() == null ? "Request failed" : ex.getReason();
        return ResponseEntity.status(status).body(error(status, message, request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handle(MethodArgumentNotValidException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST.value(), validationMessage(ex), request.getRequestURI()));
    }

    private ErrorResponse error(int status, String message, String path) {
        HttpStatus httpStatus = HttpStatus.resolve(status);
        String error = httpStatus == null ? "HTTP " + status : httpStatus.getReasonPhrase();
        return new ErrorResponse(Instant.now(), status, error, message, path);
    }

    private String validationMessage(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return message.isBlank() ? "Validation failed" : message;
    }

    record ErrorResponse(Instant timestamp, int status, String error, String message, String path) {
    }
}
